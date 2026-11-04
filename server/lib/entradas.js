import { verificarTokenQR } from "./secretos.js";
import { isValidObjectId } from "mongoose";
import ticketModel from "../models/ticketsModel.js";
import tokenModel from "../models/tokenModel.js";

//Lectura de una entrada (QR) para mostrarla o validarla en la puerta.
//Hay dos formatos de token:
//  - entradas pagas y cortesias de RRPP: { eventId, ticketId, nombreCompleto, dni, jti }
//  - cortesias por Excel:                 { prodId, nombreCompleto, jti }  -> "Invitación", valida hasta el fin del evento

//Devuelve { ok:false, status } o { ok:true, evento, entrada, tipo, tokenDoc, venceEn, estado, payload }
//estado: 'vigente' | 'usada' | 'vencida' | 'anulada' (el evento se cancelo)
export const leerEntrada = async (token, now = new Date()) => {
  let payload
  try {
    payload = verificarTokenQR(token)  //clave actual o, durante una rotacion, la anterior
  } catch {
    return { ok: false, status: 404 }
  }
  if (payload.typ === 'sesion') return { ok: false, status: 404 } //un token de sesion no es una entrada

  const eventId = payload.eventId ?? payload.prodId
  if (!isValidObjectId(eventId)) return { ok: false, status: 404 }

  const [evento, tokenDoc] = await Promise.all([
    ticketModel.findById(eventId, {
      userId: 1, cancelado: 1, 'rrpp.mail': 1, tickets: 1, cortesiaRRPP: 1, nombreEvento: 1, fechaInicio: 1, fechaFin: 1,
      imgEvento: 1, localidad: 1, direccion: 1, eventoEdad: 1
    }).lean(),
    tokenModel.findOne({ token }).lean()
  ])
  //Solo valen los QR que emitio Ipass (guardados en la base)
  if (!evento || !tokenDoc) return { ok: false, status: 404 }

  let entrada, tipo, venceEn
  if (payload.ticketId) {
    const ticket = evento.tickets?.find((t) => String(t._id) === String(payload.ticketId))
    const cortesia = evento.cortesiaRRPP?.find((c) => String(c._id) === String(payload.ticketId))
    entrada = ticket || cortesia
    if (!entrada) return { ok: false, status: 404 }
    tipo = ticket ? 'Ticket' : 'Cortesia'
    venceEn = entrada.fechaDeCierre ?? null
  } else {
    //Cortesia por Excel: no esta atada a un tipo de entrada
    entrada = { nombreTicket: 'Invitación' }
    tipo = 'Invitación'
    venceEn = evento.fechaFin ?? null
  }

  const estado = (tokenDoc.anulada || evento.cancelado) ? 'anulada'
    : tokenDoc.used ? 'usada'
    : (!venceEn || now > new Date(venceEn)) ? 'vencida'
    : 'vigente'
  return { ok: true, evento, entrada, tipo, tokenDoc, venceEn, estado, payload }
}

//Marca la entrada como usada si todavia no lo estaba. Atomico: si dos celulares validan a la vez, solo uno gana.
//Devuelve el documento actualizado o null si ya estaba usada
export const marcarUsada = (token, usuario, now = new Date()) =>
  tokenModel.findOneAndUpdate(
    { token, used: { $ne: true } },
    { $set: { used: true, usedAt: now, usedBy: String(usuario._id) } },
    { new: true }
  ).lean()
