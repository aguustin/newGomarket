import mongoose from "mongoose";
import ticketModel from "../models/ticketsModel.js";

//Cupos de cortesias. Igual que el stock (lib/stock.js), cada operacion es UNA actualizacion atomica del
//documento del evento: dos asignaciones o dos envios simultaneos nunca se pasan del cupo.
//  cortesiaRRPP[].cantidadDeCortesias   cupo total del tipo de cortesia que todavia no se asigno a nadie
//  cortesiaRRPP[].entregados            cuantas se asignaron a RRPP
//  rrpp[].ticketsCortesias[]            cupo de cada RRPP por tipo (ticketIdCortesia, cantidadDeCortesias)
//  rrpp[].freeEntregados                cuantas envio ese RRPP a sus clientes

const oid = (id) => new mongoose.Types.ObjectId(String(id))
const entradas = (cantidades) => Object.entries(cantidades ?? {}).filter(([, n]) => Number.isInteger(n) && n > 0)

//Valida { idCortesia: cantidad } contra los tipos de cortesia del evento
export const validarCantidades = (evento, cantidades) => {
  if (!cantidades || typeof cantidades !== 'object' || Array.isArray(cantidades)) return 'No se eligieron cortesías'
  for (const [id, n] of Object.entries(cantidades)) {
    if (!Number.isInteger(n) || n < 0) return 'Cantidad de cortesías inválida'
    if (n > 0 && !evento.cortesiaRRPP?.some((c) => String(c._id) === id)) return 'Una de las cortesías no pertenece a este evento'
  }
  if (entradas(cantidades).length === 0) return 'Elegí al menos una cortesía'
  return null
}

//El dueño asigna cortesias a un RRPP. Todo o nada: solo si el cupo total alcanza para todos los tipos.
//Devuelve false si no alcanza (no se toca nada).
export const asignarCortesiasARRPP = async (prodId, mailRRPP, cantidades) => {
  const items = entradas(cantidades)
  const inc = {}
  const arrayFilters = []
  items.forEach(([id, n], i) => {
    inc[`cortesiaRRPP.$[c${i}].cantidadDeCortesias`] = -n
    inc[`cortesiaRRPP.$[c${i}].entregados`] = n
    arrayFilters.push({ [`c${i}._id`]: oid(id) })
  })
  const res = await ticketModel.updateOne(
    { _id: prodId, cortesiaRRPP: { $all: items.map(([id, n]) => ({ $elemMatch: { _id: oid(id), cantidadDeCortesias: { $gte: n } } })) } },
    { $inc: inc },
    { arrayFilters }
  )
  if (res.modifiedCount !== 1) return false

  try {
    //Si el RRPP no existia en el evento, se lo agrega (sin pisarlo si otro proceso lo agrego recien)
    await ticketModel.updateOne(
      { _id: prodId, 'rrpp.mail': { $ne: mailRRPP } },
      { $push: { rrpp: { nombre: '', mail: mailRRPP, ticketsCortesias: [], ventasRRPP: [], freeEntregados: 0 } } }
    )
    for (const [id, n] of items) {
      //1) Crear el registro del tipo de cortesia en el RRPP solo si no existe. La condicion va en el filtro
      //   (atomica): dos asignaciones simultaneas no pueden crearlo dos veces
      await ticketModel.updateOne(
        { _id: prodId, rrpp: { $elemMatch: { mail: mailRRPP, 'ticketsCortesias.ticketIdCortesia': { $ne: id } } } },
        { $push: { 'rrpp.$.ticketsCortesias': { ticketIdCortesia: id, cantidadDeCortesias: 0 } } }
      )
      //2) Sumar al registro (ya existe seguro)
      await ticketModel.updateOne(
        { _id: prodId },
        { $inc: { 'rrpp.$[r].ticketsCortesias.$[t].cantidadDeCortesias': n } },
        { arrayFilters: [{ 'r.mail': mailRRPP }, { 't.ticketIdCortesia': id }] }
      )
    }
  } catch (err) {
    //No se pudo sumar al RRPP: el cupo total vuelve
    const devolver = {}
    items.forEach((_, i) => { devolver[`cortesiaRRPP.$[c${i}].cantidadDeCortesias`] = -inc[`cortesiaRRPP.$[c${i}].cantidadDeCortesias`]; devolver[`cortesiaRRPP.$[c${i}].entregados`] = -inc[`cortesiaRRPP.$[c${i}].entregados`] })
    await ticketModel.updateOne({ _id: prodId }, { $inc: devolver }, { arrayFilters })
    throw err
  }
  return true
}

//El RRPP usa n cortesias de su cupo. Devuelve false si no le alcanzan (no se toca nada)
export const consumirCupoRRPP = async (prodId, mailRRPP, idCortesia, n) => {
  const res = await ticketModel.updateOne(
    { _id: prodId, rrpp: { $elemMatch: { mail: mailRRPP, ticketsCortesias: { $elemMatch: { ticketIdCortesia: String(idCortesia), cantidadDeCortesias: { $gte: n } } } } } },
    { $inc: { 'rrpp.$[r].ticketsCortesias.$[t].cantidadDeCortesias': -n, 'rrpp.$[r].freeEntregados': n } },
    { arrayFilters: [{ 'r.mail': mailRRPP }, { 't.ticketIdCortesia': String(idCortesia) }] }
  )
  return res.modifiedCount === 1
}

//Si el envio fallo, el cupo vuelve al RRPP
export const devolverCupoRRPP = async (prodId, mailRRPP, idCortesia, n) => {
  await ticketModel.updateOne(
    { _id: prodId },
    { $inc: { 'rrpp.$[r].ticketsCortesias.$[t].cantidadDeCortesias': n, 'rrpp.$[r].freeEntregados': -n } },
    { arrayFilters: [{ 'r.mail': mailRRPP }, { 't.ticketIdCortesia': String(idCortesia) }] }
  )
}

//El mail del RRPP tal como esta guardado en el evento (la sesion puede tener otras mayusculas)
export const mailRRPPGuardado = (evento, mail) =>
  evento.rrpp?.find((r) => String(r.mail).trim().toLowerCase() === String(mail ?? '').trim().toLowerCase())?.mail ?? null
