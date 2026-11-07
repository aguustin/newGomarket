import cortesiaPublicaModel from "../models/cortesiaPublicaModel.js";

//Cortesias para el publico (estado 5): entradas gratis que cualquiera pide desde la pagina del evento,
//con un maximo por email (el "limit" de la entrada). El cupo total es la "cantidad" de la entrada (lib/stock.js).
export const ESTADO_CORTESIA_PUBLICA = 5

const normalizarMail = (mail) => String(mail).trim().toLowerCase()

//Suma n al contador de ese email solo si no se pasa del limite. Es UNA operacion atomica:
//  - si el email ya tiene un registro y le alcanza, se incrementa
//  - si no tiene registro, el upsert lo crea
//  - si tiene registro y NO le alcanza, el filtro no coincide, el upsert intenta crear otro y el indice
//    unico lo rechaza (E11000): dos pedidos simultaneos del mismo email nunca superan el limite
const sumar = async (prodId, ticketId, email, n, limite) => {
  try {
    await cortesiaPublicaModel.updateOne(
      { prodId: String(prodId), ticketId: String(ticketId), email, cantidad: { $lte: limite - n } },
      { $inc: { cantidad: n } },
      { upsert: true }
    )
    return true
  } catch (err) {
    if (err?.code === 11000) return false
    throw err
  }
}

const restar = (prodId, ticketId, email, n) =>
  cortesiaPublicaModel.updateOne({ prodId: String(prodId), ticketId: String(ticketId), email }, { $inc: { cantidad: -n } })

//items: [{ ticketId, nombreTicket, amount, limite }]. Todo o nada: si un tipo no alcanza, se deshacen los anteriores.
//Devuelve null si reservo, o el item que supero el limite
export const reservarPorEmail = async (prodId, items, mail) => {
  const email = normalizarMail(mail)
  const hechos = []
  try {
    for (const item of items) {
      if (!(await sumar(prodId, item.ticketId, email, item.amount, item.limite))) {
        for (const h of hechos) await restar(prodId, h.ticketId, email, h.amount)
        return item
      }
      hechos.push(item)
    }
  } catch (err) {
    for (const h of hechos) await restar(prodId, h.ticketId, email, h.amount).catch(() => {})
    throw err
  }
  return null
}

export const devolverPorEmail = async (prodId, items, mail) => {
  const email = normalizarMail(mail)
  for (const item of items) await restar(prodId, item.ticketId, email, item.amount)
}
