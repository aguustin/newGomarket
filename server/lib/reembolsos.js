import axios from "axios";
import tokenModel from "../models/tokenModel.js";
import transactionModel from "../models/transactionsModel.js";
import { mpAccessToken } from "../config.js";
import { verificarTokenQR } from "./secretos.js";

//Cancelacion de eventos y reembolsos (etapa 10).
//Los reembolsos se procesan en segundo plano y se reintentan (cron) hasta MAX_INTENTOS_REEMBOLSO.
//La clave de idempotencia es FIJA por pago (refund-<paymentId>): aunque se reintente o se cancele dos veces,
//Mercado Pago hace un solo reembolso. Se devuelve el monto de las entradas (montoPagado), sin el cargo por servicio.
export const MAX_INTENTOS_REEMBOLSO = 5
const EN_CURSO_MS = 2 * 60 * 1000

//Llamada a Mercado Pago (aparte para poder simularla en los tests)
export const mpReembolsos = {
  reembolsar: async (paymentId, monto) => {
    const res = await axios.post(
      `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`,
      { amount: Math.round(monto * 100) / 100 },
      { headers: { Authorization: `Bearer ${mpAccessToken}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': `refund-${paymentId}` }, timeout: 30000 }
    )
    return res.data
  }
}

//Anula todos los QR del evento (entradas, cortesias e invitaciones). Los QR emitidos desde la etapa 10 tienen
//eventId; los anteriores se identifican leyendo su token (y se les completa el eventId)
export const anularEntradasDelEvento = async (eventId, motivo = 'El evento fue cancelado') => {
  const id = String(eventId)
  let anuladas = (await tokenModel.updateMany({ eventId: id, anulada: { $ne: true } }, { $set: { anulada: true, motivoAnulacion: motivo } })).modifiedCount

  const viejos = []
  for await (const doc of tokenModel.find({ eventId: null }, { token: 1 }).lean().cursor()) {
    try {
      const p = verificarTokenQR(doc.token)
      if (String(p.eventId ?? p.prodId) === id) viejos.push(doc._id)
    } catch {
      //token invalido: no es de ningun evento
    }
  }
  if (viejos.length) {
    anuladas += (await tokenModel.updateMany({ _id: { $in: viejos } }, { $set: { eventId: id, anulada: true, motivoAnulacion: motivo } })).modifiedCount
  }
  return anuladas
}

//Deja en "pendiente" el reembolso de todas las compras del evento que no se reembolsaron. Devuelve cuantas
export const marcarParaReembolso = async (prodId) =>
  (await transactionModel.updateMany(
    { prodId: String(prodId), reembolsado: { $ne: true }, reembolsoEstado: { $nin: ['pendiente', 'ok', 'revision'] } },
    { $set: { reembolsoEstado: 'pendiente', reembolsoIntentos: 0, reembolsoError: null } }
  )).modifiedCount

//Un rechazo 4xx de Mercado Pago es definitivo (credenciales, permisos, pago ya reembolsado, datos invalidos), salvo
//408 (timeout), 409 (operacion en curso) y 429 (demasiados pedidos). Sin respuesta (red, timeout) o 5xx: se reintenta
const REINTENTABLES_4XX = [408, 409, 429]
export const esErrorPermanente = (err) => {
  const status = err?.response?.status
  return Number.isInteger(status) && status >= 400 && status < 500 && !REINTENTABLES_4XX.includes(status)
}

//Reembolsa un pago si esta pendiente o fallido. Lo toma un solo proceso a la vez.
//Devuelve 'ok' | 'fallido' (se reintenta) | 'revision' (rechazo definitivo, no se reintenta) | null (no habia nada que hacer)
export const reembolsarPago = async (paymentId) => {
  const ahora = new Date()
  const tx = await transactionModel.findOneAndUpdate(
    { paymentId: String(paymentId), reembolsado: { $ne: true }, reembolsoEstado: { $in: ['pendiente', 'fallido'] }, reembolsoIntentos: { $lt: MAX_INTENTOS_REEMBOLSO },
      $or: [{ reembolsoEnCursoDesde: null }, { reembolsoEnCursoDesde: { $lt: new Date(ahora.getTime() - EN_CURSO_MS) } }] },
    { $set: { reembolsoEnCursoDesde: ahora } },
    { new: true }
  ).lean()
  if (!tx) return null

  try {
    const reembolso = await mpReembolsos.reembolsar(tx.paymentId, tx.montoPagado)
    await transactionModel.updateOne({ _id: tx._id }, { $set: {
      reembolsado: true, reembolsoEstado: 'ok', reembolsoId: reembolso?.id != null ? String(reembolso.id) : null,
      reembolsadoEn: new Date(), reembolsoError: null, reembolsoEnCursoDesde: null
    } })
    console.log(`Reembolso del pago ${tx.paymentId}: ${tx.montoPagado} ARS devueltos`)
    return 'ok'
  } catch (err) {
    const detalle = err?.response?.data?.message ?? err?.message ?? String(err)
    if (esErrorPermanente(err)) {
      //Reintentar no lo arregla (credenciales, pago ya reembolsado, monto invalido...): queda para revision manual
      await transactionModel.updateOne({ _id: tx._id }, {
        $inc: { reembolsoIntentos: 1 },
        $set: { reembolsoEstado: 'revision', reembolsoError: String(detalle).slice(0, 300), reembolsoEnCursoDesde: null }
      })
      console.error(`ALERTA: Mercado Pago rechazo el reembolso del pago ${tx.paymentId} (HTTP ${err.response.status}): ${detalle}. No se reintenta: revisar a mano`)
      return 'revision'
    }
    const fallida = await transactionModel.findOneAndUpdate(
      { _id: tx._id },
      { $inc: { reembolsoIntentos: 1 }, $set: { reembolsoEstado: 'fallido', reembolsoError: String(detalle).slice(0, 300), reembolsoEnCursoDesde: null } },
      { new: true }
    ).lean()
    const agotado = fallida.reembolsoIntentos >= MAX_INTENTOS_REEMBOLSO
    console.error(`${agotado ? 'ALERTA' : 'Aviso'}: fallo el reembolso del pago ${tx.paymentId} (intento ${fallida.reembolsoIntentos}/${MAX_INTENTOS_REEMBOLSO}): ${detalle}${agotado ? '. Sin mas reintentos: revisar' : '. Se reintenta'}`)
    return 'fallido'
  }
}

//Procesa los reembolsos pendientes o fallidos (de un evento, o de todos). Lo usan la cancelacion y el cron
export const procesarReembolsosPendientes = async (prodId = null) => {
  const filtro = { reembolsado: { $ne: true }, reembolsoEstado: { $in: ['pendiente', 'fallido'] }, reembolsoIntentos: { $lt: MAX_INTENTOS_REEMBOLSO } }
  if (prodId) filtro.prodId = String(prodId)
  const pendientes = await transactionModel.find(filtro, { paymentId: 1 }).limit(200).lean()
  const resultado = { ok: 0, fallidos: 0, revision: 0 }
  for (const { paymentId } of pendientes) {
    const r = await reembolsarPago(paymentId)
    if (r === 'ok') resultado.ok++
    if (r === 'fallido') resultado.fallidos++
    if (r === 'revision') resultado.revision++
  }
  return resultado
}

//Cuantas compras del evento se reembolsaron o estan en camino (para avisar al reactivar)
export const comprasReembolsadas = (prodId) =>
  transactionModel.countDocuments({ prodId: String(prodId), $or: [{ reembolsado: true }, { reembolsoEstado: { $in: ['pendiente', 'fallido', 'ok', 'revision'] } }] })
