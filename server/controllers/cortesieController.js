import { formatDateB } from "../lib/dates.js";
import { isValidObjectId } from "mongoose";
import XLSX from 'xlsx';
import { MAX_FILAS_EXCEL } from "../lib/subidas.js";

import ticketModel from "../models/ticketsModel.js";
import cortesieModel from "../models/cortesiesModel.js"
import rrppExcelModel from "../models/rrppExcelModel.js";
import { encolarInvitaciones, procesarInvitaciones, encolarAvisosRRPP, procesarAvisosRRPP, resumenEnvio } from "../lib/invitaciones.js";

//Listas del evento con el resumen de envios (sin los QR de las invitaciones)
export const getAllExcelsInfoController = async (req, res) => {
    const {userId, prodId} = req.params
    const findExcels = await cortesieModel.find({prodId: prodId, userId: userId}, { 'people.token': 0 }).lean()
    res.send(findExcels.map((d) => ({ ...d, envio: resumenEnvio(d.people) })))
}

export const getAllRRPPExcelsController = async (req, res) => {
    const {userId, prodId} = req.params
    const findExcels = await rrppExcelModel.find({prodId: prodId, userId: userId}).lean()
    res.send(findExcels.map((d) => ({ ...d, envio: resumenEnvio(d.rrppList) })))
}

export const getProdCortesiesController = async (req, res) => {
  const {cortesieId} = req.params
  const findExcels = await cortesieModel.find({_id: cortesieId})
  res.send(findExcels)
}

//Borra el registro de un Excel cargado (no toca mails ya enviados ni RRPP ya agregados al evento).
//Se filtra tambien por userId para no borrar Excels de otro usuario.
export const deleteCortesiesController = async (req, res) => {
  const {cortesieId, userId} = req.params
  if (!isValidObjectId(cortesieId)) return res.status(400).json({ deleted: 0 })
  const result = await cortesieModel.deleteOne({_id: cortesieId, userId: userId})
  res.status(200).json({ deleted: result.deletedCount })
}

export const deleteRRPPExcelController = async (req, res) => {
  const {rrppListId, userId} = req.params
  if (!isValidObjectId(rrppListId)) return res.status(400).json({ deleted: 0 })
  const result = await rrppExcelModel.deleteOne({_id: rrppListId, userId: userId})
  res.status(200).json({ deleted: result.deletedCount })
}

export const editCortesiesController = async (req, res) => {
  res.sendStatus(200)
}

export const chargeExcelController = async (req, res) => {
  const {userId, prodId, eventName, excelName, fechaCreacion} = req.body

  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  try {
    const formatedDate = formatDateB(Date.now())
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawPeople = XLSX.utils.sheet_to_json(worksheet, {
      header: ['clientName', 'email'],
      range: 1
    });
    if (rawPeople.length > MAX_FILAS_EXCEL) {
      return res.status(400).json({ code: 'EXCEL_DEMASIADO_GRANDE', message: `El Excel puede tener hasta ${MAX_FILAS_EXCEL} filas` });
    }

    const courtesyCount = rawPeople.length;

    // Agregamos el campo courtesy a cada persona
    const peopleWithCourtesy = rawPeople.map(person => ({
      ...person
    }));

   const newCourtesyDoc = await cortesieModel.create({
      prodId,
      userId,
      eventName: eventName,
      excelName,
      fechaCreacion: formatedDate,
      people: peopleWithCourtesy,
      courtesy: courtesyCount
    });

    res.json({ success: true, data: newCourtesyDoc });
  } catch (error) { 
    console.error('Error al procesar el Excel:', error);
    res.status(500).json({ error: 'Error al leer el archivo Excel' });
  }
}

//Envia las invitaciones del Excel en segundo plano (lib/invitaciones.js). Responde enseguida con cuantas
//se van a enviar. Volver a tocar "Enviar" solo manda a quienes todavia no la recibieron (mismo QR)
export const sendCortesiesController = async (req, res) => {
  const { cortesieId } = req.body;
  if (req.evento?.cancelado) return res.status(409).json({ code: 'EVENTO_CANCELADO', error: 'El evento fue cancelado' })
  const { aEnviar, yaEnviadas } = await encolarInvitaciones(cortesieId)
  setImmediate(() => procesarInvitaciones(cortesieId).catch((err) => console.error('Envio de invitaciones:', err?.message ?? err)))
  return res.status(200).json({ success: true, aEnviar, yaEnviadas })
};


export const chargeRRPPExcelController = async (req, res) => {
  const {userId, prodId, eventName, excelName} = req.body

  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  try {
    const formatedDate = formatDateB(Date.now())
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawPeople = XLSX.utils.sheet_to_json(worksheet, {
      header: ['nombreRRPP', 'email'],
      range: 1
    });
    if (rawPeople.length > MAX_FILAS_EXCEL) {
      return res.status(400).json({ code: 'EXCEL_DEMASIADO_GRANDE', message: `El Excel puede tener hasta ${MAX_FILAS_EXCEL} filas` });
    }

    const rrppCount = rawPeople.length;

    // Agregamos el campo courtesy a cada persona
    const rrppPeople = rawPeople.map(person => ({
      ...person
    }));

   const newRRPPDoc = await rrppExcelModel.create({
      prodId,
      userId,
      eventName,
      excelName,
      fechaCreacion: formatedDate,
      rrppList: rrppPeople,
      RRPPCount: rrppCount
    });


    res.json({ success: true, data: newRRPPDoc });
  } catch (error) { 
    console.error('Error al procesar el Excel:', error);
    res.status(500).json({ error: 'Error al leer el archivo Excel' });
  }
}

//Agrega los colaboradores del Excel como RRPP del evento y les avisa por mail en segundo plano.
//Volver a tocar "Enviar" solo avisa a quienes todavia no recibieron el mail
export const sendRRPPColabsListController = async (req, res) => {
  const { prodId, rrppListId } = req.body;
  if (req.evento?.cancelado) return res.status(409).json({ code: 'EVENTO_CANCELADO', error: 'El evento fue cancelado' })
  const rrppListDoc = await rrppExcelModel.findById(rrppListId).lean();
  if (!rrppListDoc) return res.status(404).json({ error: 'Lista RRPP no encontrada' });

  //Solo los que todavia no son RRPP del evento (antes $addToSet podia duplicarlos)
  const evento = await ticketModel.findById(prodId, { 'rrpp.mail': 1 }).lean();
  const yaEstan = new Set((evento?.rrpp ?? []).map((r) => String(r.mail ?? '').toLowerCase()))
  const nuevos = rrppListDoc.rrppList.filter((r) => r.email && !yaEstan.has(String(r.email).toLowerCase()))
  if (nuevos.length) {
    await ticketModel.updateOne({ _id: prodId }, { $push: { rrpp: { $each: nuevos.map((r) => ({
      nombre: r.nombreRRPP, mail: r.email, freeEntregados: 0, montoCorrespondienteRRPP: 0, montoTotalVendidoRRPP: 0,
      ventasRRPP: [], ticketsCortesias: [], onList: true
    })) } } });
  }

  const { aEnviar, yaEnviadas } = await encolarAvisosRRPP(rrppListId)
  setImmediate(() => procesarAvisosRRPP(rrppListId).catch((err) => console.error('Avisos a RRPP:', err?.message ?? err)))
  return res.status(200).json({ success: true, aEnviar, yaEnviadas, rrppAgregados: nuevos.length });
};
