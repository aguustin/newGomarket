import { Router } from "express";
import devMailModel from "../models/devMailModel.js";

//Bandeja de mails de desarrollo. app.js solo monta este router en development/test.
const router = Router()

//Solo pedidos hechos desde esta maquina: lo que entra por ngrok trae X-Forwarded-For y queda afuera
//(los mails tienen links con tokens de acceso)
const soloLocal = (req, res, next) => {
  const ip = req.socket.remoteAddress || ''
  const local = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
  if (!local || req.headers['x-forwarded-for']) {
    return res.status(403).send('La bandeja de mails solo se puede abrir desde esta computadora')
  }
  next()
}

const escapeHtml = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

router.use('/dev/mails', soloLocal)

//JSON para tests: ?to=mail filtra por destinatario
router.get('/dev/mails.json', soloLocal, async (req, res) => {
  const filter = req.query.to ? { to: String(req.query.to) } : {}
  const mails = await devMailModel.find(filter).sort({ createdAt: -1 }).limit(100).lean()
  res.json(mails.map(({ _id, provider, from, to, subject, html, text, createdAt, attachments }) => ({
    id: _id.toString(), provider, from, to, subject, html, text, createdAt,
    attachments: attachments.map(({ filename, contentType, contentId }) => ({ filename, contentType, contentId }))
  })))
})

router.get('/dev/mails', async (req, res) => {
  const mails = await devMailModel.find({}, { subject: 1, to: 1, provider: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(200).lean()
  const rows = mails.map((m) => `
    <tr>
      <td>${new Date(m.createdAt).toLocaleString('es-AR')}</td>
      <td>${escapeHtml(m.to.join(', '))}</td>
      <td><a href="/dev/mails/${m._id}">${escapeHtml(m.subject)}</a></td>
      <td>${escapeHtml(m.provider)}</td>
    </tr>`).join('')
  res.send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Bandeja de mails (dev)</title>
    <style>body{font-family:system-ui,sans-serif;margin:24px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}</style>
    </head><body><h1>Bandeja de mails (desarrollo)</h1>
    <p>Ningún mail se envió de verdad. Se borran solos a los 7 días.</p>
    <table><tr><th>Fecha</th><th>Para</th><th>Asunto</th><th>Proveedor</th></tr>${rows || '<tr><td colspan="4">Vacía</td></tr>'}</table>
    </body></html>`)
})

router.get('/dev/mails/:id', async (req, res) => {
  const mail = await devMailModel.findById(req.params.id).lean().catch(() => null)
  if (!mail) return res.status(404).send('No existe ese mail')
  //Las imagenes embebidas (cid:) se reemplazan por su contenido para verlas en el navegador
  let html = mail.html || `<pre>${escapeHtml(mail.text || '')}</pre>`
  for (const a of mail.attachments) {
    if (a.contentId) html = html.split(`cid:${a.contentId}`).join(`data:${a.contentType || 'image/png'};base64,${a.content}`)
  }
  res.send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(mail.subject)}</title></head><body style="margin:0">
    <div style="font-family:system-ui,sans-serif;padding:12px 24px;background:#f3f4f6;border-bottom:1px solid #ddd">
      <a href="/dev/mails">← Bandeja</a> · <b>Para:</b> ${escapeHtml(mail.to.join(', '))} · <b>De:</b> ${escapeHtml(mail.from)} · <b>Asunto:</b> ${escapeHtml(mail.subject)}
    </div>${html}</body></html>`)
})

export default router
