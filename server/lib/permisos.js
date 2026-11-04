import { isValidObjectId } from "mongoose";
import ticketModel from "../models/ticketsModel.js";
import cortesieModel from "../models/cortesiesModel.js";
import rrppExcelModel from "../models/rrppExcelModel.js";

//Permisos por evento. Se usan DESPUES de requireAuth (necesitan req.user) y de multer en las rutas con archivos.
//  - Dueño: el usuario que creo el evento (event.userId). Puede todo sobre su evento.
//  - RRPP: un colaborador del evento (event.rrpp[].mail). Solo opera sobre lo suyo.
//Respuestas: 400 id invalido, 404 el evento no existe, 403 no tiene permiso.

const mismoMail = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase()

const invalido = (res) => res.status(400).json({ code: 'ID_INVALIDO', error: 'Evento inválido' })
const inexistente = (res) => res.status(404).json({ code: 'EVENTO_INEXISTENTE', error: 'El evento no existe' })
const noEsDueno = (res) => res.status(403).json({ code: 'NO_ES_DUENO', error: 'Solo el dueño del evento puede hacer esto' })
const noEsRRPP = (res) => res.status(403).json({ code: 'NO_ES_RRPP', error: 'No sos colaborador de este evento' })

export const esDueno = (evento, user) => Boolean(evento && user && String(evento.userId) === String(user._id))
export const esRRPP = (evento, user) => Boolean(evento?.rrpp?.some((r) => mismoMail(r.mail, user?.mail)))

//Exige que el usuario sea dueño del evento cuyo id devuelve `obtenerId(req)`. Deja el evento en req.evento
export const duenoDelEvento = (obtenerId) => async (req, res, next) => {
  try {
    const id = obtenerId(req)
    if (!isValidObjectId(id)) return invalido(res)
    const evento = await ticketModel.findById(id, { userId: 1, nombreEvento: 1, cancelado: 1 }).lean()
    if (!evento) return inexistente(res)
    if (!esDueno(evento, req.user)) return noEsDueno(res)
    req.evento = evento
    return next()
  } catch (err) {
    return next(err)
  }
}

//Para rutas que reciben el id de un ticket o cortesia (updateTickets): el evento es el que lo contiene
export const duenoDelTicket = (obtenerTicketId) => async (req, res, next) => {
  try {
    const id = obtenerTicketId(req)
    if (!isValidObjectId(id)) return invalido(res)
    const evento = await ticketModel.findOne({ $or: [{ 'tickets._id': id }, { 'cortesiaRRPP._id': id }] }, { userId: 1 }).lean()
    if (!evento) return inexistente(res)
    if (!esDueno(evento, req.user)) return noEsDueno(res)
    req.evento = evento
    return next()
  } catch (err) {
    return next(err)
  }
}

//Exige que el usuario sea RRPP del evento
export const rrppDelEvento = (obtenerId) => async (req, res, next) => {
  try {
    const id = obtenerId(req)
    if (!isValidObjectId(id)) return invalido(res)
    const evento = await ticketModel.findById(id, { userId: 1, 'rrpp.mail': 1 }).lean()
    if (!evento) return inexistente(res)
    if (!esRRPP(evento, req.user)) return noEsRRPP(res)
    req.evento = evento
    return next()
  } catch (err) {
    return next(err)
  }
}

//Un Excel cargado (cortesias o lista de RRPP) solo se usa si es del usuario y, si se indica, del mismo evento
const excelPropio = (modelo, obtenerExcelId, obtenerProdId) => async (req, res, next) => {
  try {
    const id = obtenerExcelId(req)
    if (!isValidObjectId(id)) return res.status(400).json({ code: 'ID_INVALIDO', error: 'Excel inválido' })
    const doc = await modelo.findById(id, { userId: 1, prodId: 1 }).lean()
    if (!doc) return res.status(404).json({ code: 'EXCEL_INEXISTENTE', error: 'El Excel no existe' })
    const prodId = obtenerProdId ? obtenerProdId(req) : null
    if (String(doc.userId) !== String(req.user._id) || (prodId && String(doc.prodId) !== String(prodId))) {
      return res.status(403).json({ code: 'EXCEL_AJENO', error: 'Este Excel no es tuyo o no es de este evento' })
    }
    return next()
  } catch (err) {
    return next(err)
  }
}

export const excelDeCortesiasPropio = (obtenerExcelId, obtenerProdId) => excelPropio(cortesieModel, obtenerExcelId, obtenerProdId)
export const listaRRPPPropia = (obtenerExcelId, obtenerProdId) => excelPropio(rrppExcelModel, obtenerExcelId, obtenerProdId)
