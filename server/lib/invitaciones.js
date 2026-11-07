import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import cortesieModel from "../models/cortesiesModel.js";
import rrppExcelModel from "../models/rrppExcelModel.js";
import ticketModel from "../models/ticketsModel.js";
import tokenModel from "../models/tokenModel.js";
import { resend } from "./resendDomain.js";
import { jwtSecret } from "./secretos.js";
import { urlFront } from "../config.js";
import { alertarAdmin } from "./alertas.js";

//Envio de invitaciones por Excel y de los avisos a colaboradores RRPP (etapa 13).
//  - Salen por Resend, en segundo plano y de a una (Resend limita los envios por segundo).
//  - Cada persona tiene su estado: un reintento NUNCA vuelve a mandar a quien ya la recibio.
//  - La invitacion tiene UN solo QR: se crea la primera vez y los reintentos mandan el mismo.
//  - El cron reintenta las fallidas hasta MAX_INTENTOS_INVITACION y despues avisa al administrador.
export const MAX_INTENTOS_INVITACION = 5
const EN_CURSO_MS = 2 * 60 * 1000
export const config = { pausaMs: 500 }  //entre envios; los tests la bajan a 0

const pausa = () => new Promise((r) => setTimeout(r, config.pausaMs))
const escapar = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const fecha = (d) => (d ? new Date(d).toLocaleDateString('es-AR') : '')
const ENVIABLE = { $in: ['pendiente', 'error'] }

//Toma una persona de la lista para enviarle (atomico: si el cron y el pedido corren a la vez, solo uno la toma)
const tomar = (Model, campo, docId, personaId) => {
  const ahora = new Date()
  return Model.updateOne(
    { _id: docId, [campo]: { $elemMatch: { _id: personaId, estado: ENVIABLE, intentos: { $lt: MAX_INTENTOS_INVITACION },
      $or: [{ enviandoDesde: null }, { enviandoDesde: { $lt: new Date(ahora.getTime() - EN_CURSO_MS) } }] } } },
    { $set: { [`${campo}.$.enviandoDesde`]: ahora } }
  ).then((r) => r.modifiedCount === 1)
}
const marcar = (Model, campo, docId, personaId, cambios, inc) => Model.updateOne(
  { _id: docId, [`${campo}._id`]: personaId },
  { $set: Object.fromEntries(Object.entries(cambios).map(([k, v]) => [`${campo}.$.${k}`, v])), ...(inc ? { $inc: { [`${campo}.$.intentos`]: 1 } } : {}) }
)

//Deja para enviar a todos los que todavia no la recibieron (y reinicia los intentos de los que fallaron).
//Devuelve cuantos quedan para enviar y cuantos ya la tenian
const encolar = async (Model, campo, docId) => {
  const doc = await Model.findById(docId, { [campo]: 1 }).lean()
  const personas = doc?.[campo] ?? []
  const aEnviar = personas.filter((p) => p.estado !== 'enviado')
  await Model.updateOne({ _id: docId }, { $set: {
    [`${campo}.$[p].estado`]: 'pendiente', [`${campo}.$[p].intentos`]: 0, [`${campo}.$[p].ultimoError`]: null
  } }, { arrayFilters: [{ 'p.estado': { $ne: 'enviado' } }] })
  return { aEnviar: aEnviar.length, yaEnviadas: personas.length - aEnviar.length }
}

//Resumen para la pantalla
export const resumenEnvio = (personas = []) => {
  const r = { total: personas.length, enviadas: 0, pendientes: 0, conError: 0, sinEnviar: 0 }
  for (const p of personas) {
    if (p.estado === 'enviado') r.enviadas++
    else if (p.estado === 'pendiente') r.pendientes++
    else if (p.estado === 'error' || p.estado === 'cancelada') r.conError++
    else r.sinEnviar++
  }
  return r
}

// ---------- Invitaciones (cortesias por Excel) ----------

const htmlInvitacion = (persona, evento) => `
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; padding:3px; text-align:center; margin:0;">
  <div style="height:90px; line-height:90px; background-color:#f5b400;"><h1 style="font-size:30px; color:#111827; margin:0;">Ipass</h1></div>
  <div style="text-align:center; padding:20px 15px 40px 15px; background-color:#111827; color:#d1d5db;">
    <h3 style="font-size:20px">${escapar(persona.clientName)}, ¡tenés una invitación!</h3>
    <p style="font-size:18px">Escaneá este QR para acceder:</p>
    ${evento.imgEvento ? `<img src="${escapar(evento.imgEvento)}" alt="" style="width:230px; margin:20px 0;">` : ''}
    <img src="cid:qrcodeimg" alt="QR de la invitación" style="width:230px; height:230px; margin:20px 0;"/>
    <h2 style="font-size:20px">${escapar(evento.nombreEvento)}</h2>
    <p style="font-size:18px">Fecha del evento: ${fecha(evento.fechaInicio)}</p>
    <p style="font-size:18px">Invitación válida hasta: ${fecha(evento.fechaFin)}</p>
    <p style="font-size:18px">${escapar(evento.direccion ?? '')}</p>
  </div>
  <div style="background-color:#111827; color:#d1d5db; padding:20px;">
    <p style="font-size:16px">Presentá este QR en el acceso desde tu celular, sin necesidad de imprimirlo.</p>
  </div>
</body></html>`

//Crea el QR de la invitacion una sola vez (y lo guarda en la persona antes de enviar)
const tokenDeInvitacion = async (doc, persona, evento) => {
  if (persona.token) return persona.token
  const token = jwt.sign({ nombreCompleto: persona.clientName, prodId: evento._id, iat: Math.floor(Date.now() / 1000), jti: uuidv4() }, jwtSecret)
  await tokenModel.create({ token, eventId: String(evento._id) })
  await marcar(cortesieModel, 'people', doc._id, persona._id, { token })
  return token
}

const enviarInvitacion = async (doc, persona, evento) => {
  const token = await tokenDeInvitacion(doc, persona, evento)
  const qr = await QRCode.toBuffer(`${urlFront}/ticket/validate/${token}`)
  const { error } = await resend.emails.send({
    from: 'Ipass <no-reply@ipassi.com>',
    to: [persona.email],
    subject: `Tu invitación a ${evento.nombreEvento}`,
    html: htmlInvitacion(persona, evento),
    attachments: [{ filename: 'qrcode.png', content: qr, contentType: 'image/png', contentId: 'qrcodeimg', disposition: 'inline' }]
  })
  if (error) throw new Error(`El proveedor de mail rechazo el envio: ${error.message ?? error.name ?? error}`)
}

//Si el evento no admite mas envios devuelve el motivo
const eventoNoEnviable = (evento, now = new Date()) => {
  if (!evento) return 'El evento no existe'
  if (evento.cancelado) return 'El evento fue cancelado'
  if (evento.fechaFin && new Date(evento.fechaFin) < now) return 'El evento ya terminó'
  return null
}

//Envia las invitaciones pendientes de un Excel. Devuelve { enviadas, fallidas }
export const procesarInvitaciones = async (cortesieId) => {
  const doc = await cortesieModel.findById(cortesieId).lean()
  if (!doc) return { enviadas: 0, fallidas: 0 }
  const evento = await ticketModel.findById(doc.prodId, { nombreEvento: 1, imgEvento: 1, fechaInicio: 1, fechaFin: 1, direccion: 1, cancelado: 1 }).lean()
  const motivo = eventoNoEnviable(evento)
  if (motivo) {
    await cortesieModel.updateOne({ _id: doc._id }, { $set: { 'people.$[p].estado': 'cancelada', 'people.$[p].ultimoError': motivo } },
      { arrayFilters: [{ 'p.estado': ENVIABLE }] })
    return { enviadas: 0, fallidas: 0 }
  }

  const r = { enviadas: 0, fallidas: 0 }
  for (const persona of doc.people) {
    if (!['pendiente', 'error'].includes(persona.estado)) continue
    if (!(await tomar(cortesieModel, 'people', doc._id, persona._id))) continue
    try {
      await enviarInvitacion(doc, persona, evento)
      await marcar(cortesieModel, 'people', doc._id, persona._id, { estado: 'enviado', enviadoEn: new Date(), enviandoDesde: null, ultimoError: null })
      r.enviadas++
    } catch (err) {
      const msg = String(err?.message ?? err).slice(0, 300)
      await marcar(cortesieModel, 'people', doc._id, persona._id, { estado: 'error', ultimoError: msg, enviandoDesde: null }, true)
      r.fallidas++
      console.error(`Aviso: no se pudo enviar la invitacion a ${persona.email} (Excel ${doc._id}): ${msg}`)
    }
    await pausa()
  }
  await avisarSiQuedanAgotadas(cortesieModel, 'people', doc, 'invitaciones')
  return r
}

// ---------- Avisos a colaboradores RRPP ----------

const enviarAvisoRRPP = async (colaborador, evento) => {
  const { error } = await resend.emails.send({
    from: 'Ipass <no-reply@ipassi.com>',
    to: [colaborador.email],
    subject: `Ya sos colaborador en: ${evento.nombreEvento}`,
    html: `<html><body style="font-family:Arial, sans-serif; text-align:center;">
      <h2>Ya sos parte del staff del evento ${escapar(evento.nombreEvento)}</h2>
      <p>Generá tu link de cobranza <a href="${urlFront}/get_my_rrpp_events/${encodeURIComponent(colaborador.email)}">acá</a></p>
      ${evento.imgEvento ? `<img src="${escapar(evento.imgEvento)}" width="230"/>` : ''}
    </body></html>`
  })
  if (error) throw new Error(`El proveedor de mail rechazo el envio: ${error.message ?? error.name ?? error}`)
}

export const procesarAvisosRRPP = async (rrppListId) => {
  const doc = await rrppExcelModel.findById(rrppListId).lean()
  if (!doc) return { enviadas: 0, fallidas: 0 }
  const evento = await ticketModel.findById(doc.prodId, { nombreEvento: 1, imgEvento: 1, fechaFin: 1, cancelado: 1 }).lean()
  const motivo = eventoNoEnviable(evento)
  if (motivo) {
    await rrppExcelModel.updateOne({ _id: doc._id }, { $set: { 'rrppList.$[p].estado': 'cancelada', 'rrppList.$[p].ultimoError': motivo } },
      { arrayFilters: [{ 'p.estado': ENVIABLE }] })
    return { enviadas: 0, fallidas: 0 }
  }
  const r = { enviadas: 0, fallidas: 0 }
  for (const c of doc.rrppList) {
    if (!['pendiente', 'error'].includes(c.estado)) continue
    if (!(await tomar(rrppExcelModel, 'rrppList', doc._id, c._id))) continue
    try {
      await enviarAvisoRRPP(c, evento)
      await marcar(rrppExcelModel, 'rrppList', doc._id, c._id, { estado: 'enviado', enviadoEn: new Date(), enviandoDesde: null, ultimoError: null })
      r.enviadas++
    } catch (err) {
      const msg = String(err?.message ?? err).slice(0, 300)
      await marcar(rrppExcelModel, 'rrppList', doc._id, c._id, { estado: 'error', ultimoError: msg, enviandoDesde: null }, true)
      r.fallidas++
      console.error(`Aviso: no se pudo enviar el aviso al RRPP ${c.email} (lista ${doc._id}): ${msg}`)
    }
    await pausa()
  }
  await avisarSiQuedanAgotadas(rrppExcelModel, 'rrppList', doc, 'avisos a RRPP')
  return r
}

// ---------- Comun ----------

//Un aviso al administrador por lista cuando hay personas que ya no se van a reintentar
const avisarSiQuedanAgotadas = async (Model, campo, doc, que) => {
  const actual = await Model.findById(doc._id, { [campo]: 1, excelName: 1, eventName: 1 }).lean()
  const agotadas = (actual?.[campo] ?? []).filter((p) => p.estado === 'error' && p.intentos >= MAX_INTENTOS_INVITACION)
  if (agotadas.length) {
    await alertarAdmin('invitacionesAgotadas', String(doc._id),
      `${agotadas.length} ${que} de la lista "${actual.excelName}" (evento ${actual.eventName}) no se pudieron enviar despues de ${MAX_INTENTOS_INVITACION} intentos. Ejemplo: ${agotadas[0].email}: ${agotadas[0].ultimoError}`)
  }
}

export const encolarInvitaciones = (cortesieId) => encolar(cortesieModel, 'people', cortesieId)
export const encolarAvisosRRPP = (rrppListId) => encolar(rrppExcelModel, 'rrppList', rrppListId)

//Cron: listas con envios pendientes o fallidos que todavia se pueden reintentar
export const procesarEnviosPendientes = async () => {
  const filtro = (campo) => ({ [campo]: { $elemMatch: { estado: ENVIABLE, intentos: { $lt: MAX_INTENTOS_INVITACION } } } })
  const r = { invitaciones: 0, avisosRRPP: 0 }
  for (const { _id } of await cortesieModel.find(filtro('people'), { _id: 1 }).limit(20).lean()) r.invitaciones += (await procesarInvitaciones(_id)).enviadas
  for (const { _id } of await rrppExcelModel.find(filtro('rrppList'), { _id: 1 }).limit(20).lean()) r.avisosRRPP += (await procesarAvisosRRPP(_id)).enviadas
  return r
}
