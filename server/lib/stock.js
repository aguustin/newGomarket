import mongoose from "mongoose";
import ticketModel from "../models/ticketsModel.js";
import orderModel from "../models/orderModel.js";
import { alertarAdmin } from "./alertas.js";

//Stock de entradas. Todos los tickets de un evento viven en el mismo documento, asi que cada operacion
//es UNA actualizacion atomica de ese documento: dos compras simultaneas nunca se llevan la misma entrada.

export const RESERVA_MINUTOS = 15

//Mercado Pago exige las fechas de vencimiento con la zona horaria explicita (yyyy-MM-ddTHH:mm:ss.SSS-03:00);
//rechaza el formato ...Z de toISOString. Se usa la hora de Argentina (UTC-3, sin horario de verano)
export const fechaMP = (date) => new Date(date.getTime() - 3 * 3600 * 1000).toISOString().replace('Z', '-03:00')

const entradas = (quantities) => Object.entries(quantities ?? {}).filter(([, q]) => q?.amount > 0)
const oid = (id) => new mongoose.Types.ObjectId(String(id))

//Una regla de arrayFilters por ticket (t0, t1, ...) para tocar varios tickets en la misma operacion
const incrementos = (quantities, signo) => {
  const inc = {}
  const arrayFilters = []
  entradas(quantities).forEach(([ticketId, { amount }], i) => {
    inc[`tickets.$[t${i}].cantidad`] = signo * amount
    arrayFilters.push({ [`t${i}._id`]: oid(ticketId) })
  })
  return { inc, arrayFilters }
}

//Descuenta todas las cantidades solo si TODAS alcanzan (todo o nada). Devuelve true si reservo.
export const reservarStock = async (prodId, quantities) => {
  const items = entradas(quantities)
  if (items.length === 0) return false
  const { inc, arrayFilters } = incrementos(quantities, -1)
  const res = await ticketModel.updateOne(
    { _id: prodId, tickets: { $all: items.map(([ticketId, { amount }]) => ({ $elemMatch: { _id: oid(ticketId), cantidad: { $gte: amount } } })) } },
    { $inc: inc },
    { arrayFilters }
  )
  return res.modifiedCount === 1
}

//Descuenta aunque no alcance (pago aprobado tarde sin stock: se emite igual, decision de negocio)
export const descontarStockSinControl = async (prodId, quantities) => {
  const { inc, arrayFilters } = incrementos(quantities, -1)
  if (arrayFilters.length === 0) return
  await ticketModel.updateOne({ _id: prodId }, { $inc: inc }, { arrayFilters })
}

export const devolverStock = async (prodId, quantities) => {
  const { inc, arrayFilters } = incrementos(quantities, 1)
  if (arrayFilters.length === 0) return
  await ticketModel.updateOne({ _id: prodId }, { $inc: inc }, { arrayFilters })
}

//Cierra una orden pendiente y devuelve su stock. El cambio de estado es atomico: si dos procesos
//intentan cerrarla a la vez (vencimiento y pago), solo uno lo logra y el stock se devuelve una sola vez.
export const liberarOrden = async (orderId, estado) => {
  const orden = await orderModel.findOneAndUpdate({ _id: orderId, estado: 'pendiente' }, { $set: { estado } }, { new: true }).lean()
  if (orden) await devolverStock(orden.prodId, orden.quantities)
  return Boolean(orden)
}

//Vence las reservas cuyo plazo paso. Lo corre el cron cada minuto
export const expirarOrdenesVencidas = async (now = new Date()) => {
  const vencidas = await orderModel.find({ estado: 'pendiente', expiraEn: { $lt: now } }, { _id: 1 }).lean()
  let liberadas = 0
  for (const { _id } of vencidas) {
    if (await liberarOrden(_id, 'expirada')) liberadas++
  }
  return liberadas
}

//Al aprobarse un pago: marca la orden como pagada.
//  - Si estaba pendiente, el stock ya estaba reservado: no se descuenta de nuevo.
//  - Si ya habia vencido (stock devuelto), se intenta reservar otra vez; si no alcanza, se emite igual (sobreventa).
//Devuelve { stockYaDescontado: true } salvo para ordenes inexistentes (preferencias anteriores a las ordenes).
export const confirmarOrdenPagada = async (orderId, paymentId) => {
  const pendiente = await orderModel.findOneAndUpdate(
    { _id: orderId, estado: 'pendiente' },
    { $set: { estado: 'pagada', paymentId } },
    { new: true }
  ).lean()
  if (pendiente) return { stockYaDescontado: true }

  const orden = await orderModel.findById(orderId).lean()
  if (!orden) return { stockYaDescontado: false }
  if (orden.estado === 'pagada') return { stockYaDescontado: true }

  //Vencida o fallida: el stock se habia devuelto
  const tomada = await orderModel.findOneAndUpdate(
    { _id: orderId, estado: { $in: ['expirada', 'fallida'] } },
    { $set: { estado: 'pagada', paymentId } },
    { new: true }
  ).lean()
  if (!tomada) return { stockYaDescontado: true }  //otro proceso la confirmo recien

  if (!(await reservarStock(orden.prodId, orden.quantities))) {
    await descontarStockSinControl(orden.prodId, orden.quantities)
    await orderModel.updateOne({ _id: orderId }, { $set: { sobreventa: true } })
    console.warn(`SOBREVENTA: el pago ${paymentId} llego con la reserva vencida y sin stock (orden ${orderId}). Se emitieron las entradas igual`)
    await alertarAdmin('sobreventa', paymentId, `El pago ${paymentId} llego con la reserva vencida y ya no habia stock (evento ${orden.prodId}, orden ${orderId}). Las entradas se emitieron igual: el evento quedo sobrevendido.`)
  }
  return { stockYaDescontado: true }
}
