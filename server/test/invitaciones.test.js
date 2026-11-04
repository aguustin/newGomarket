import { test, before, after, beforeEach, mock } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb, resetDb, crearSesion } from "./helpers.js"

//Etapa 13: invitaciones por Excel y avisos a RRPP, por Resend, con seguimiento por persona
const ADMIN = 'admin-invitaciones@ipass-test.local'
process.env.ADMIN_MAIL = ADMIN
let app, ticketModel, cortesieModel, rrppExcelModel, tokenModel, inv, resend
before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  ticketModel = (await import('../models/ticketsModel.js')).default
  cortesieModel = (await import('../models/cortesiesModel.js')).default
  rrppExcelModel = (await import('../models/rrppExcelModel.js')).default
  tokenModel = (await import('../models/tokenModel.js')).default
  inv = await import('../lib/invitaciones.js')
  inv.config.pausaMs = 0
  ;({ resend } = await import('../lib/resendDomain.js'))
})
after(closeDb)
beforeEach(resetDb)

const enUnMes = () => new Date(Date.now() + 30 * 24 * 3600 * 1000)
const bandeja = async (to) => (await request(app).get('/dev/mails.json').query({ to })).body
const esperar = async (cond, ms = 10000) => {
  const fin = Date.now() + ms
  while (Date.now() < fin) { if (await cond()) return; await new Promise((r) => setTimeout(r, 100)) }
  throw new Error('timeout')
}
const escenario = async (extra = {}) => {
  const dueno = await crearSesion()
  const ev = await ticketModel.create({ userId: dueno.id, nombreEvento: 'Fiesta <b>', active: true, fechaInicio: enUnMes(), fechaFin: enUnMes(), ...extra })
  const excel = await cortesieModel.create({ prodId: String(ev._id), userId: dueno.id, eventName: 'Fiesta', excelName: 'Invitados',
    people: [{ clientName: 'Ana', email: 'ana@x.com' }, { clientName: 'Beto', email: 'beto@x.com' }], courtesy: 2 })
  return { dueno, ev, excel }
}
const enviar = (e) => request(app).post('/send_cortesies').set(e.dueno.auth).send({ prodId: String(e.ev._id), cortesieId: String(e.excel._id) })
const personas = async (e) => (await cortesieModel.findById(e.excel._id).lean()).people

test('CRITICO: enviar manda una invitacion a cada uno por Resend; volver a enviar no duplica', async () => {
  const e = await escenario()
  const res = await enviar(e)
  assert.equal(res.status, 200)
  assert.deepEqual([res.body.aEnviar, res.body.yaEnviadas], [2, 0])
  await esperar(async () => (await personas(e)).every((p) => p.estado === 'enviado'))

  const [mAna] = await bandeja('ana@x.com')
  assert.equal(mAna.provider, 'resend', 'ya no sale por Gmail')
  assert.match(mAna.subject, /Tu invitación a Fiesta/)
  assert.ok(mAna.html.includes('Fiesta &lt;b&gt;'), 'el nombre del evento se escapa')
  assert.equal(mAna.attachments[0].contentId, 'qrcodeimg')
  assert.equal(await tokenModel.countDocuments({ eventId: String(e.ev._id) }), 2)

  const otra = await enviar(e)
  assert.deepEqual([otra.body.aEnviar, otra.body.yaEnviadas], [0, 2])
  await new Promise((r) => setTimeout(r, 300))
  assert.equal((await bandeja('ana@x.com')).length, 1, 'no se manda dos veces')
  assert.equal(await tokenModel.countDocuments({ eventId: String(e.ev._id) }), 2, 'no se crean QR nuevos')

  const lista = (await request(app).get(`/get_event_cortesies/${e.dueno.id}/${e.ev._id}`).set(e.dueno.auth)).body
  assert.deepEqual(lista[0].envio, { total: 2, enviadas: 2, pendientes: 0, conError: 0, sinEnviar: 0 })
  assert.equal(lista[0].people[0].token, undefined, 'la lista no expone los QR')
})

test('CRITICO: si un mail falla, se reintenta con el MISMO QR solo a quien fallo; a los 5 intentos avisa al admin', async () => {
  const e = await escenario()
  const original = resend.emails.send
  mock.method(resend.emails, 'send', async (msg) => msg.to[0] === 'beto@x.com' ? { data: null, error: { message: 'rate_limit_exceeded' } } : original(msg))
  try {
    await enviar(e)
    await esperar(async () => (await personas(e)).every((p) => ['enviado', 'error'].includes(p.estado)))
    const [ana, beto] = await personas(e)
    assert.equal(ana.estado, 'enviado')
    assert.equal(beto.estado, 'error')
    assert.match(beto.ultimoError, /rate_limit_exceeded/)
    const tokenBeto = beto.token
    assert.ok(tokenBeto)

    for (let i = 0; i < 6; i++) await inv.procesarEnviosPendientes()  //cron
    const betoFinal = (await personas(e))[1]
    assert.equal(betoFinal.intentos, 5)
    assert.equal(betoFinal.token, tokenBeto, 'siempre el mismo QR')
    assert.equal((await bandeja('ana@x.com')).length, 1, 'a Ana no se le reenvia')
    const [alerta] = await bandeja(ADMIN)
    assert.match(alerta.subject, /Invitaciones sin enviar/)
  } finally {
    mock.restoreAll()
  }
  //Al volver a tocar "Enviar" se reintenta a Beto (y le llega el mismo QR)
  await enviar(e)
  await esperar(async () => (await personas(e))[1].estado === 'enviado')
  assert.equal((await personas(e))[1].token, (await personas(e))[1].token)
  assert.equal(await tokenModel.countDocuments({ eventId: String(e.ev._id) }), 2)
})

test('evento cancelado: no se envia nada', async () => {
  const e = await escenario({ cancelado: true })
  assert.equal((await enviar(e)).status, 409)
  await inv.encolarInvitaciones(e.excel._id)
  await inv.procesarInvitaciones(e.excel._id)
  assert.ok((await personas(e)).every((p) => p.estado === 'cancelada'))
  assert.equal((await bandeja('ana@x.com')).length, 0)
})

test('avisos a RRPP: los agrega sin duplicar, les avisa una vez y reporta cuantos', async () => {
  const e = await escenario({ rrpp: [{ mail: 'ya@x.com' }] })
  const lista = await rrppExcelModel.create({ prodId: String(e.ev._id), userId: e.dueno.id, eventName: 'Fiesta', excelName: 'Staff',
    rrppList: [{ nombreRRPP: 'Ya', email: 'YA@x.com' }, { nombreRRPP: 'Nuevo', email: 'nuevo@x.com' }], RRPPCount: 2 })
  const pedir = () => request(app).post('/send_rrpp_cortesies').set(e.dueno.auth).send({ prodId: String(e.ev._id), rrppListId: String(lista._id) })
  const r1 = await pedir()
  assert.equal(r1.status, 200)
  assert.equal(r1.body.rrppAgregados, 1)
  await esperar(async () => (await rrppExcelModel.findById(lista._id).lean()).rrppList.every((p) => p.estado === 'enviado'))
  const r2 = await pedir()
  assert.deepEqual([r2.body.aEnviar, r2.body.rrppAgregados], [0, 0])
  assert.equal((await ticketModel.findById(e.ev._id).lean()).rrpp.length, 2)
  assert.equal((await bandeja('nuevo@x.com')).length, 1)
})
