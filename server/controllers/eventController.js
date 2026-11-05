import mongoose, { isValidObjectId } from "mongoose";
import cloudinary from "../middleware/cloudinary.js";
import ticketModel from "../models/ticketsModel.js";
import mercadopago from "../lib/mercadopago.js";
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import { urlFront, urlBack, mpAccessToken, webhookFirma, webhookSecret } from "../config.js";
import { verificarFirmaMP } from "../lib/firmaMP.js";
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid'
import userModel from "../models/userModel.js";
import crypto from "crypto"
import tokenModel from "../models/tokenModel.js";
import transactionModel from "../models/transactionsModel.js";
import { formatDateB } from "../lib/dates.js";
import ExcelJS from 'exceljs';
import axios from "axios";
import { resend } from "../lib/resendDomain.js";
import purchaseModel from "../models/purchaseModel.js";
import discountModel from "../models/discountModel.js";
import { calcularCompra } from "../lib/pricing.js";
import orderModel from "../models/orderModel.js";
import { validarCantidades, asignarCortesiasARRPP, consumirCupoRRPP, devolverCupoRRPP, mailRRPPGuardado } from "../lib/cortesias.js";
import { leerEntrada, marcarUsada } from "../lib/entradas.js";
import { anularEntradasDelEvento, marcarParaReembolso, reembolsarPago, procesarReembolsosPendientes, comprasReembolsadas } from "../lib/reembolsos.js";
import { esDueno, esRRPP } from "../lib/permisos.js";
import { alertarAdmin } from "../lib/alertas.js";
import { RESERVA_MINUTOS, fechaMP, reservarStock, devolverStock, liberarOrden, confirmarOrdenPagada } from "../lib/stock.js";

dotenv.config();

import { jwtSecret as JWT_SECRET, secretMailKey as SECRET_MAIL_KEY } from "../lib/secretos.js";
const IV_LENGTH = 16

//Las rutas publicas (inicio, compra, eventos relacionados) no devuelven datos del staff ni de ventas:
//mails, CBU, alias y telefono de los RRPP, el mail del productor, ventas y montos
export const CAMPOS_PRIVADOS_EVENTO = {
  rrpp: 0, prodMail: 0, categorias: 0, montoVentas: 0, totalVentas: 0, totalDevoluciones: 0, totalCortesias: 0,
  totalMontoVendido: 0, totalMontoDescuento: 0, montoTotal: 0, porcentajeRRPP: 0, 'cortesiaRRPP.email': 0
}

export const getAllEventsController = async (req, res) => {  //OBTENER TODOS LOS EVENTOS
    //Los eventos terminados dejan de listarse en el momento (el cron solo los marca inactivos una vez por semana).
    //Un evento sin fechaFin se sigue listando como antes
    const getEvents = await ticketModel.find({
      active: true,
      $or: [{ fechaFin: { $gte: new Date() } }, { fechaFin: null }]
    }, CAMPOS_PRIVADOS_EVENTO)
    res.send(getEvents)
}

export const createEventController = async (req, res) => {
  const {
    codigoPais, codigoCiudad, paisDestino, tipoEvento,
    eventoEdad, nombreEvento, descripcionEvento, aviso, categoriasEventos,
    artistas, montoVentas, porcentajeRRPP, fechaInicio, fechaFin, provincia, localidad,
    tipoMoneda, direccion, lugarEvento, linkVideo
  } = req.body;

  const eventoEdadPush = (eventoEdad !== undefined && eventoEdad !== null && eventoEdad !== '' &&
    eventoEdad !== 'null' && eventoEdad !== 'undefined' && !isNaN(Number(eventoEdad)))
    ? Number(eventoEdad)
    : undefined;

  //El dueño, su mail y la comision salen de la sesion (antes los mandaba el navegador, incluida la comision)
  const userId = String(req.user._id);
  const prodMail = req.user.mail;
  const comisionServicio = req.user.comisionServicio ?? 15;

  let parsedCategorias = [];
  try { parsedCategorias = JSON.parse(categoriasEventos ?? '[]'); } catch { return res.status(400).json({ error: 'Categorías inválidas' }); }
  const encryptedMail = encrypt(prodMail);

  const defaultImage = 'https://res.cloudinary.com/drmcrdf4r/image/upload/v1767393484/eventsGoTicket/tdbkxf15dsmhwrxxyigl.png';

  const files = req.files || {};

  const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'eventsGoTicket' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          resolve(result.secure_url);
        }
      ).end(file.buffer);
    });
  };

  try {
    // Subir imágenes si existen, sino usar por defecto
    const imgEventoFile = files?.imgEvento?.[0];
    const bannerEventoFile = files?.bannerEvento?.[0];
    const imagenDescriptivaFile = files?.imagenDescriptiva?.[0];

    const [imgEventoUrl, bannerEventoUrl, imagenDescriptivaUrl] = await Promise.all([
      imgEventoFile && uploadToCloudinary(imgEventoFile),
      bannerEventoFile && uploadToCloudinary(bannerEventoFile),
      imagenDescriptivaFile && uploadToCloudinary(imagenDescriptivaFile),
    ]);

    const createdEvent = await ticketModel.create({
      userId,
      prodMail: encryptedMail,
      codigoPais,
      codigoCiudad,
      paisDestino,
      tipoEvento,
      eventoEdad: eventoEdadPush,
      nombreEvento,
      descripcionEvento,
      aviso,
      categoriasEventos: parsedCategorias,
      artistas,
      montoVentas,
      porcentajeRRPP,
      fechaInicio,
      fechaFin,
      provincia,
      localidad,
      direccion,
      tipoMoneda,
      lugarEvento,
      linkVideo,
      comisionServicio,
      imgEvento: imgEventoUrl ?? defaultImage,
      bannerEvento: bannerEventoUrl,
      imagenDescriptiva: imagenDescriptivaUrl,
      totalVentas: 0,
      totalDevoluciones: 0,
      totalMontoVendido: 0,
      totalMontoDevoluciones: 0,
      totalMontoDescuento: 0,
      montoTotal: 0
    });

    return res.status(200).json({
      estado: 1,
      eventId: createdEvent._id,
      urls: {
        imgEvento: imgEventoUrl,
        bannerEvento: bannerEventoUrl,
        imagenDescriptiva: imagenDescriptivaUrl
      }
    });

  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Error al crear el evento.' });
  }
};


export const createEventTicketsController = async (req, res) => {  //CREA TICKETS DEL EVENTO
  const {prodId, nombreTicket, descripcionTicket, precio, cantidad, fechaDeCierre, visibilidad, estado, distribution, limit} = req.body
  const defaultImage = 'https://res.cloudinary.com/drmcrdf4r/image/upload/v1767393484/eventsGoTicket/tdbkxf15dsmhwrxxyigl.png';
  let estadoToInt = Number(estado)
  let distributionToInt = Number(distribution)
  let limitToInt = Number(limit)
  
  
  const buildPayload = (imgUrl) => {
    if (estadoToInt !== 3) {  // SI EL ESTADO ES DIFERENTE DE 3 (DE CORTESIA) SE LE AGREGA EL ESTADO PARA DIFERENCIAR LOS TICKETS NORMALES A LOS DE CORTESIA
      return {
        tickets: {
          nombreTicket,
          descripcionTicket,
          precio,
          cantidad,
          fechaDeCierre: fechaDeCierre,
          visibilidad,
          estado: estadoToInt,
          imgTicket: imgUrl,
          limit: limitToInt || 30
        }
      };
    } else {  
      return {  //SE CREA EL TICKET DE CORTESIA (SIN PRECIO)
        cortesiaRRPP: {
          nombreTicket,
          descripcionTicket,
          cantidadDeCortesias: cantidad,
          entregados: 0,
          fechaDeCierre: fechaDeCierre,
          imgTicket: imgUrl,
          estado: estadoToInt,
          distribution: distributionToInt,
          limit: limitToInt || 30
        }
      };
    }
  };
  // Si no hay archivo, usamos la imagen por defecto
  if (!req.file) {
    const updatePayload = buildPayload(defaultImage);
    
    await ticketModel.updateOne(
      { _id: prodId },
      { $addToSet: updatePayload }
    );
    
    return res.status(200).json({ url: defaultImage, estado: 1 });
  }

  
  // Si hay archivo, subimos a Cloudinary
  cloudinary.uploader.upload_stream(
    { resource_type: 'image', folder: 'GoTicketsT' },
    async (error, result) => {
      if (error) {
        console.log(error);
        return res.status(204).json({ error: 'Error uploading to Cloudinary' });
      }
      
      const updatePayload = buildPayload(result.secure_url);
      
      console.log(updatePayload)
      await ticketModel.updateOne(
        { _id: prodId },
        { $addToSet: updatePayload }
      );

      return res.status(200).json({ url: result.secure_url, estado: 1 });
    }
  ).end(req.file.buffer);
}; 



export const getMyProdsController = async (req, res) => {  //OBTENER MIS PRODUCCIONES CREADAS
    const {userId} = req.params
    const findProds = await ticketModel.find({userId: userId})
    res.status(200).json(findProds)
}

export const getOneProdController = async (req, res) => {  //TRAE TODA LA INFO DE UNA SOLA PRODUCCION
    const {prodId, userId} = req.params
    if (!isValidObjectId(prodId)) return res.send({tickets: [], prodDiscount: []})
    const getProd = await ticketModel.find({_id: prodId, userId: userId})
    //Los codigos de descuento solo para el dueño (antes se devolvian aunque el evento fuera de otro)
    const getProdDiscount = getProd.length > 0 ? await discountModel.find({prodId: prodId}) : []
    res.send({tickets:getProd, prodDiscount: getProdDiscount})
    /*const {prodId, userId} = req.params
    console.log(prodId, ' ', userId)
    const getProd = await ticketModel.find({_id: prodId, userId: userId})
    
    res.send(getProd)*/
}


export const updateEventController = async (req, res) => {
  const {
    eventId,
    nombreEvento,
    descripcionEvento,
    aviso,
    eventoEdad,
    artistas,
    montoVentas,
    fechaInicio,
    fechaFin,
    provincia,
    tipoEvento,
    localidad,
    direccion,
    lugarEvento
  } = req.body;

  // Campos siempre actualizables
  const updateFields = {
    nombreEvento,
    descripcionEvento,
    aviso,
    eventoEdad,
    artistas,
    montoVentas,
    fechaInicio,
    fechaFin,
    provincia,
    tipoEvento,
    localidad,
    direccion,
    lugarEvento
  };
  
  if (!isNaN(Number(eventoEdad))) {
  updateFields.eventoEdad = Number(eventoEdad);
}

if (!isNaN(Number(tipoEvento))) {
  console.log('tipo evento', tipoEvento)
  updateFields.tipoEvento = Number(tipoEvento);
}

  const files = req.files || {};
  console.log(req.files)
  // Función para subir a Cloudinary
  const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'eventsGoTicket' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          resolve(result.secure_url);
        }
      ).end(file.buffer);
    });
  };

  try {
    // Subir imágenes si existen
    if (files?.imgEvento?.[0]) {
      console.log(updateFields.imgEvento)
      updateFields.imgEvento = await uploadToCloudinary(files.imgEvento[0]);
    }

    if (files?.bannerEvento?.[0]) {
      console.log('banner: ', updateFields.bannerEvento)
      updateFields.bannerEvento = await uploadToCloudinary(files.bannerEvento[0]);
    }

    if (files?.imagenDescriptiva?.[0]) {
      updateFields.imagenDescriptiva = await uploadToCloudinary(files.imagenDescriptiva[0]);
    }

    // Ejecutar la actualización
    const updateResult = await ticketModel.updateOne(
      { _id: eventId },
      { $set: updateFields }
    );

    if (updateResult.modifiedCount > 0) {
      return res.status(200).json({
        state: 1,
        updated: true,
        updatedFields: Object.keys(updateFields)
      });
    } else {
      return res.status(200).json({
        state: 2,
        updated: false,
        message: 'No se modificó ningún campo'
      });
    }
  } catch (err) {
    console.error('Error al actualizar el evento:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateEventTicketsController = async (req, res) => {   //SE ACTUALIZAN LOS TICKETS DEL EVENTO
  const {
    ticketId,
    nombreTicket,
    descripcionTicket,
    precio,
    cantidad,
    fechaDeCierre,
    visibilidad,
    estado,
    limit
  } = req.body;
  
 let estadoInt = Number(estado)     
  console.log('estadoint: ', estadoInt)
// Construye campos comunes para actualización
 const buildUpdateFields = (imgUrl = null) => {
  const commonFields = {
    nombreTicket,
    descripcionTicket,
    //cantidad,
    fechaDeCierre,
    visibilidad,
    estado:estadoInt,
    limit
  };

  if (imgUrl) {
    commonFields.imgTicket = imgUrl;
  }

  if (estadoInt !== 3) {  
    commonFields.precio = precio;
  }else{
    commonFields.precio = '0';
  }

  return commonFields;
};

// Actualiza el ticket correspondiente
const updateTicket = async (imgUrl = null) => {
  const updateFields = buildUpdateFields(imgUrl);
  const pathPrefix = estadoInt === 3 ? "cortesiaRRPP" : "tickets";
  //const cantidadField = estadoInt === 3 ? "cantidadDeCortesias" : "cantidad";
  
  const updateSet = Object.fromEntries(
    Object.entries(updateFields).map(([key, value]) => [
      `${pathPrefix}.$.${key}`,
      value
    ])
  );

  if (estadoInt === 3) {
    updateSet[`${pathPrefix}.$.cantidadDeCortesias`] = cantidad;
  } else {
    updateSet[`${pathPrefix}.$.cantidad`] = cantidad;
  }

  const updateResult = await ticketModel.updateOne(
    { [`${pathPrefix}._id`]: ticketId },
    { $set: updateSet }
  );

  return updateResult;
 };

  // Si hay imagen, sube a Cloudinary
  if (req.file) {
    cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'GoTicketsT' },
      async (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: 'Error uploading to Cloudinary' });
        }

        const updateResult = await updateTicket(result.secure_url);
        return res.status(200).json({
          url: result.secure_url,
          updated: updateResult.modifiedCount > 0,
          estado: 1
        });
      }
    ).end(req.file.buffer);
  } else {
    // Sin imagen
    const updateResult = await updateTicket();
    return res.status(200).json({
      updated: updateResult.modifiedCount > 0,
      estado: 1
    });
  }
}

export const getEventToBuyController = async (req, res) => {
    const {prodId} = req.params
    if (!isValidObjectId(prodId)) return res.send([])
    const getProd = await ticketModel.find({_id: prodId}, CAMPOS_PRIVADOS_EVENTO)
    
    res.send(getProd)
}

const obtenerRRPPDesdeHash = (event, emailHash) => {
  let rrppMatch = null;
  let decryptedMail = null;

  rrppMatch = event.rrpp?.find(r => r.mailHash === emailHash);
  if (rrppMatch) {
    decryptedMail = decrypt(rrppMatch.mailEncriptado);
    return { rrppMatch, decryptedMail };
  }

  if (event.prodMail === emailHash) {
    decryptedMail = decrypt(event.prodMail);
    return { rrppMatch: null, decryptedMail };
  }

  return { rrppMatch: null, decryptedMail: null };
};

//descontarStock=false cuando el stock ya se reservo al crear la orden (lib/stock.js)
const procesarVentaGeneral = async (prodId, quantities, total, { descontarStock = true } = {}) => {
  console.log('ENTRO A PROCESAR VENTA GENERAL: ', prodId, ' ', quantities, ' ', total)
  const bulkOps = Object.entries(quantities).map(([ticketId, quantityObj]) => {
    const { amount, free } = quantityObj;
    return {
      updateOne: {
        filter: { "tickets._id": new mongoose.Types.ObjectId(ticketId) },
        update: {
          $inc: {
            "tickets.$.ventas": amount,
            "tickets.$.cantidad": free || !descontarStock ? 0 : -amount,
          },
        },
      },
    };
  });

  const ventasTotales = Object.values(quantities).reduce((sum, quantityObj) => sum + quantityObj.amount, 0);
  console.log('VENTAS GENERALES: ', ventasTotales)

  await Promise.all([
    ticketModel.updateOne(
      { _id: prodId },
      {
        $inc: {
          totalVentas: ventasTotales,
          totalMontoVendido: total,
        },
      }
    ),
    ticketModel.bulkWrite(bulkOps),
  ]);
};


const procesarVentaRRPP = async (event, quantities, decryptedMail) => {
  const prodId = event._id;
  const rrpp = event.rrpp.find(r => r.mail === decryptedMail);
  if (!rrpp) return;

  console.log('SE ENCONTRO EL RRPP');

  const existingTicketIds = rrpp.ventasRRPP.map(v => v.ticketId.toString());
  const ticketIds = Object.keys(quantities).map(id => new mongoose.Types.ObjectId(id));

  // Filtramos solo tickets pagos
  const tickets = event.tickets.filter(t => ticketIds.some(id => id.equals(t._id)));

  const bulkOpsRRPP = [];
  let sumaTotal = 0;

  for (const ticket of tickets) {
    const ticketId = ticket._id.toString();
    const quantityObj = quantities[ticketId];

    if (!quantityObj || quantityObj.free) continue; // ignorar cortesías

    const vendidos = quantityObj.amount;
    if (vendidos <= 0) continue;

    const total = vendidos * ticket.precio;
    sumaTotal += total;

    const nombreCategoria = ticket.nombreTicket;
    const alreadyExists = existingTicketIds.includes(ticketId);

    console.log('TICKETID:', ticketId, 'VENDIDOS:', vendidos, 'TOTAL:', total, 'NOMBRE CATEGORIA:', nombreCategoria);

    if (alreadyExists) {
      bulkOpsRRPP.push({
        updateOne: {
          filter: { _id: prodId },
          update: {
            $inc: {
              "rrpp.$[rrppElem].ventasRRPP.$[ventaElem].vendidos": vendidos,
              "rrpp.$[rrppElem].ventasRRPP.$[ventaElem].total": total,
            },
          },
          arrayFilters: [
            { "rrppElem.mail": decryptedMail },
            { "ventaElem.ticketId": ticketId },
          ],
        },
      });
    } else {
      bulkOpsRRPP.push({
        updateOne: {
          filter: { _id: prodId },
          update: {
            $push: {
              "rrpp.$[rrppElem].ventasRRPP": {
                ticketId,
                nombreCategoria,
                vendidos,
                total,
              },
            },
          },
          arrayFilters: [{ "rrppElem.mail": decryptedMail }],
        },
      });
    }
  }

  // Calcular porcentaje RRPP
  const porcentajeRRPP = event.porcentajeRRPP || 0;
  const porcentajeTotal = (sumaTotal * porcentajeRRPP) / 100;

  bulkOpsRRPP.push({
    updateOne: {
      filter: { _id: prodId },
      update: {
        $inc: {
          "rrpp.$[rrppElem].montoCorrespondienteRRPP": porcentajeTotal,
          "rrpp.$[rrppElem].montoTotalVendidoRRPP": sumaTotal,
        },
      },
      arrayFilters: [{ "rrppElem.mail": decryptedMail }],
    },
  });

  if (bulkOpsRRPP.length > 0) {
    await ticketModel.bulkWrite(bulkOpsRRPP);
    console.log('RRPP actualizado correctamente.');
  }
};



//--- Procesamiento de un pago aprobado, por pasos (etapa 9) ---
//Cada paso queda registrado en la transaccion (models/transactionsModel.js) y se "toma" de forma atomica,
//asi el webhook, la pagina de resultado y el reintento automatico pueden correr a la vez sin duplicar nada:
//  1. transaccion (indice unico de paymentId)   2. orden y stock (idempotente)
//  3. venta: stock, ventas, RRPP, comprador, descuento (una sola vez; si falla queda errorVenta para revisar)
//  4. entrega del mail con los QR (se reintenta hasta MAX_INTENTOS_ENTREGA veces)
const MAX_INTENTOS_ENTREGA = 5
const ENTREGA_EN_CURSO_MS = 2 * 60 * 1000

//Lo reembolsable: entradas sin el cargo por servicio y con el descuento. Lo calcula /buy (metadata monto_entradas);
//las preferencias anteriores a ese cambio no lo traen y se deduce del total
const montoReembolsable = (total, comisionServicio, montoEntradas) => {
  if (typeof montoEntradas === 'number') return montoEntradas
  const comision = Number(comisionServicio ?? 15)
  return Math.round(total / (1 + comision / 100))
}

const registrarTransaccion = async (datos) => {
  try {
    return (await transactionModel.create({ ...datos, transaccionId: datos.paymentId, fecha: new Date(), ventaRegistrada: false, entregado: false })).toObject()
  } catch (error) {
    if (error.code === 11000) return transactionModel.findOne({ paymentId: datos.paymentId }).lean()  //ya estaba
    throw error
  }
}

//Devuelve true si en esta llamada se registro la venta (el pago era nuevo)
const procesarPagoAprobado = async (paymentId, payment, origen) => {
  const metadata = payment.metadata || {}
  const {
    prod_id, quantities, mail, state, total, email_hash, nombre_completo, dni, telefono,
    discount_code = null, monto_entradas, order_id
  } = metadata

  if (!quantities || !mail || !prod_id || !total) {
    console.error(`Metadata incompleta en el pago ${paymentId} (${origen}):`, Object.keys(metadata))
    return false
  }
  const event = await ticketModel.findById(prod_id).lean()
  if (!event) {
    console.error(`ALERTA: el pago aprobado ${paymentId} es de un evento que no existe (${prod_id})`)
    await alertarAdmin('eventoInexistente', paymentId, `El pago ${paymentId} se aprobo para el evento ${prod_id}, que no existe. No se entregaron entradas.`)
    return false
  }

  const tx = await registrarTransaccion({
    prodId: prod_id, paymentId, nombre: nombre_completo, email: mail,
    montoPagado: montoReembolsable(total, event.comisionServicio, monto_entradas),
    montoCobrado: payment.transaction_amount
  })

  //Mercado Pago tiene que haber cobrado lo que calculo el servidor, en pesos
  const cobrado = Number(payment.transaction_amount)
  const montoOk = (!payment.currency_id || payment.currency_id === 'ARS') && Number.isFinite(cobrado) && Math.abs(cobrado - Number(total)) <= 1
  if (!montoOk || tx.alertaMonto) {
    if (!tx.alertaMonto) {
      await transactionModel.updateOne({ paymentId }, { $set: { alertaMonto: true } })
      console.error(`ALERTA: el pago ${paymentId} cobró ${cobrado} ${payment.currency_id} y se esperaba ${total} ARS. No se entregan entradas (revisar)`)
      await alertarAdmin('monto', paymentId, `El pago ${paymentId} (evento ${event.nombreEvento}, comprador ${mail}) cobro ${cobrado} ${payment.currency_id} y se esperaban ${total} ARS. No se entregaron entradas.`)
    }
    return false
  }
  //Evento cancelado (por ejemplo, el comprador estaba en el checkout cuando el dueño cancelo): no se entregan
  //entradas y el pago se reembolsa
  if (event.cancelado) {
    if (!tx.reembolsado && !['pendiente', 'ok', 'revision'].includes(tx.reembolsoEstado)) {
      await transactionModel.updateOne({ paymentId }, { $set: { reembolsoEstado: 'pendiente', reembolsoIntentos: 0 } })
      console.warn(`Pago ${paymentId} aprobado para un evento cancelado (${prod_id}): se reembolsa`)
    }
    reembolsarPago(paymentId).catch((err) => console.error(`Reembolso del pago ${paymentId}:`, err?.message ?? err))
    return false
  }

  //Completa, o anterior a la etapa 9 (sin estos campos)
  if (tx.ventaRegistrada !== false && tx.entregado !== false) return false

  //2. Orden y stock (idempotente). Sin orden (preferencias viejas) el stock se descuenta en la venta
  const orderId = order_id ?? payment.external_reference
  const { stockYaDescontado } = isValidObjectId(orderId) ? await confirmarOrdenPagada(orderId, paymentId) : { stockYaDescontado: false }

  //3. Venta: la toma un solo proceso
  let ventaNueva = false
  if (await transactionModel.findOneAndUpdate({ paymentId, ventaRegistrada: false }, { $set: { ventaRegistrada: true } })) {
    try {
      await procesarVentaGeneral(prod_id, quantities, total, { descontarStock: !stockYaDescontado })
      const { rrppMatch, decryptedMail } = obtenerRRPPDesdeHash(event, email_hash)
      if (rrppMatch && decryptedMail) await procesarVentaRRPP(event, quantities, decryptedMail)
      await purchaseModel.create({ prodId: prod_id, nombreCompleto: nombre_completo, email: mail, dni, telefono: parseInt(telefono) })
      await consumirDescuento(discount_code, prod_id, `pago ${paymentId}`)
      ventaNueva = true
      console.log(`Pago ${paymentId}: venta registrada (${origen}).`)
    } catch (err) {
      //No se reintenta automaticamente para no contar la venta dos veces: queda para revision
      await transactionModel.updateOne({ paymentId }, { $set: { errorVenta: String(err?.message ?? err).slice(0, 300) } })
      console.error(`ALERTA: el pago ${paymentId} se cobro pero fallo el registro de la venta (${origen}):`, err?.message ?? err)
      await alertarAdmin('errorVenta', paymentId, `El pago ${paymentId} (evento ${event.nombreEvento}, comprador ${mail}) se cobro pero fallo el registro de la venta: ${err?.message ?? err}`)
    }
  }

  //4. Entrega del mail con los QR: la toma un solo proceso; si falla, se reintenta despues
  const ahora = new Date()
  const enCurso = await transactionModel.findOneAndUpdate(
    { paymentId, entregado: false, intentosEntrega: { $lt: MAX_INTENTOS_ENTREGA },
      $or: [{ entregandoDesde: null }, { entregandoDesde: { $lt: new Date(ahora.getTime() - ENTREGA_EN_CURSO_MS) } }] },
    { $set: { entregandoDesde: ahora } }
  )
  if (enCurso) {
    const enviado = await qrGeneratorController(prod_id, quantities, mail, state, nombre_completo, dni, paymentId)
    if (enviado) {
      await transactionModel.updateOne({ paymentId }, { $set: { entregado: true, entregadoEn: new Date(), entregandoDesde: null, ultimoErrorEntrega: null } })
    } else {
      const fallida = await transactionModel.findOneAndUpdate(
        { paymentId },
        { $inc: { intentosEntrega: 1 }, $set: { entregandoDesde: null, ultimoErrorEntrega: 'No se pudo enviar el mail con las entradas' } },
        { new: true }
      ).lean()
      const agotado = fallida.intentosEntrega >= MAX_INTENTOS_ENTREGA
      console.error(`${agotado ? 'ALERTA' : 'Aviso'}: no se pudieron entregar las entradas del pago ${paymentId} (intento ${fallida.intentosEntrega}/${MAX_INTENTOS_ENTREGA}, ${origen})${agotado ? '. Sin mas reintentos: revisar' : '. Se reintenta'}`)
      if (agotado) await alertarAdmin('entregaAgotada', paymentId, `No se pudo mandar el mail con las entradas del pago ${paymentId} (evento ${event.nombreEvento}, comprador ${mail}) despues de ${MAX_INTENTOS_ENTREGA} intentos.`)
    }
  }
  return ventaNueva
}

//Conciliacion (cron cada 10 minutos): pagos APROBADOS en Mercado Pago de las ultimas 48 h que Ipass nunca
//registro porque no llego ningun aviso (webhook caido, URL vieja, servidor apagado) ni el comprador volvio a la
//pagina de resultado. Solo toma pagos de Ipass (metadata con evento y orden) y usa el mismo procesamiento por pasos
export const conciliarPagosAprobados = async () => {
  const res = await mercadopago.payment.search({ qs: {
    sort: 'date_created', criteria: 'desc', range: 'date_created', begin_date: 'NOW-2DAYS', end_date: 'NOW', status: 'approved', limit: 100
  } })
  const deIpass = (res.body?.results ?? []).filter((p) => p.metadata?.prod_id && p.metadata?.quantities)
  if (deIpass.length === 0) return 0
  const ids = deIpass.map((p) => String(p.id))
  const registrados = new Set((await transactionModel.find({ paymentId: { $in: ids } }, { paymentId: 1 }).lean()).map((t) => t.paymentId))
  let recuperados = 0
  for (const id of ids.filter((i) => !registrados.has(i))) {
    try {
      const { procesado } = await procesarPagoMP(id, 'conciliacion')
      if (procesado) {
        recuperados++
        console.warn(`Pago ${id} recuperado por conciliacion: Mercado Pago lo aprobo pero no habia llegado ningun aviso`)
      }
    } catch (err) {
      console.error(`Conciliacion del pago ${id} fallo:`, err?.message ?? err)
    }
  }
  return recuperados
}

//Reintento automatico (cron cada 5 minutos): pagos cobrados con la entrega pendiente
export const reintentarPagosPendientes = async (now = new Date()) => {
  const pendientes = await transactionModel.find({
    entregado: false, intentosEntrega: { $lt: MAX_INTENTOS_ENTREGA }, alertaMonto: { $ne: true },
    fecha: { $lt: new Date(now.getTime() - 60 * 1000) }
  }, { paymentId: 1 }).limit(50).lean()
  for (const { paymentId } of pendientes) {
    try {
      await procesarPagoMP(paymentId, 'reintento')
    } catch (err) {
      console.error(`Reintento del pago ${paymentId} fallo:`, err?.message ?? err)
    }
  }
  return pendientes.length
}

//Descuento valido: mismo evento y con usos disponibles. No consume el uso (eso pasa al aprobarse el pago)
const buscarDescuento = async (discountCode, prodId) => {
  if (typeof discountCode !== 'string' || discountCode.trim() === '') return null
  return discountModel.findOne({ idDescuento: discountCode.trim(), prodId: String(prodId), cantidadDescuentos: { $gt: 0 } }).lean()
}

//Consume un uso de forma atomica. Si el cupo se agoto entre la compra y el pago, el comprador ya pago
//con descuento: se registra y no se le cobra la diferencia
const consumirDescuento = async (discountCode, prodId, origen) => {
  if (!discountCode) return
  const consumido = await discountModel.findOneAndUpdate(
    { idDescuento: discountCode, prodId: String(prodId), cantidadDescuentos: { $gt: 0 } },
    { $inc: { cantidadDescuentos: -1 } },
    { new: true }
  )
  if (!consumido) console.warn(`Descuento ${discountCode} sin cupo al confirmar (${origen}): se respeta el precio pagado`)
}

const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

//El precio, el descuento y la disponibilidad se calculan aca con los datos de la base (lib/pricing.js).
//Del navegador solo se usan las cantidades elegidas, los datos del comprador y el total que mostro la
//pagina, que tiene que coincidir con el calculado: si no, 409 con el total correcto y no se cobra nada.
export const buyEventTicketsController = async (req, res) => {
  const { prodId, quantities, mail, total: totalMostrado, emailHash, nombreCompleto, dni, telefono, discountCode } = req.body ?? {};

  if (!isValidObjectId(prodId)) return res.status(400).json({ code: 'EVENTO_INEXISTENTE', error: 'Evento inválido' })
  if (typeof mail !== 'string' || !MAIL_RE.test(mail.trim())) return res.status(400).json({ code: 'DATOS_COMPRADOR', error: 'Email inválido' })
  if (typeof nombreCompleto !== 'string' || nombreCompleto.trim() === '' || !dni || !telefono) {
    return res.status(400).json({ code: 'DATOS_COMPRADOR', error: 'Completá nombre, DNI y teléfono' })
  }

  let orden = null
  try {
    const event = await ticketModel.findById(prodId).lean()

    let descuento = null
    if (discountCode) {
      descuento = await buscarDescuento(discountCode, prodId)
      if (!descuento) return res.status(409).json({ code: 'DESCUENTO_INVALIDO', error: 'El código de descuento no es válido para este evento o ya no tiene usos' })
    }

    const compra = calcularCompra(event, quantities, { descuento })
    if (!compra.ok) return res.status(compra.status).json({ code: compra.code, error: compra.error })

    if (typeof totalMostrado !== 'number' || Math.abs(totalMostrado - compra.total) > 1) {
      return res.status(409).json({ code: 'TOTAL_DISTINTO', error: 'El total cambió. Revisá tu compra antes de pagar', total: compra.total })
    }

    const comprador = { mail: mail.trim(), nombreCompleto: nombreCompleto.trim(), dni, telefono: String(telefono) }

    //Reserva atomica: si otra compra se llevo las ultimas entradas, no se cobra nada
    if (!(await reservarStock(prodId, compra.quantities))) {
      return res.status(409).json({ code: 'SIN_STOCK', error: 'No quedan suficientes entradas. Revisá la disponibilidad' })
    }

    //Gratis solo si lo calcula el servidor (entradas de precio 0 o 100% de descuento): se emite sin pasar por MP
    if (compra.total === 0) {
      const enviados = await qrGeneratorController(prodId, compra.quantities, comprador.mail, 1, comprador.nombreCompleto, dni)
      if (!enviados) {
        await devolverStock(prodId, compra.quantities)
        return res.status(502).json({ code: 'ENTRADAS_NO_ENVIADAS', error: 'No pudimos enviar tus entradas. Intentá de nuevo' })
      }
      await procesarVentaGeneral(prodId, compra.quantities, 0, { descontarStock: false })
      await purchaseModel.create({ prodId, nombreCompleto: comprador.nombreCompleto, email: comprador.mail, dni, telefono: parseInt(comprador.telefono) })
      await consumirDescuento(descuento?.idDescuento, prodId, 'compra gratuita')
      return res.status(200).json(3)
    }

    const ahora = new Date()
    const expiraEn = new Date(ahora.getTime() + RESERVA_MINUTOS * 60 * 1000)
    try {
      orden = await orderModel.create({
        prodId: String(prodId), quantities: compra.quantities, total: compra.total, montoEntradas: compra.montoEntradas,
        discountCode: descuento?.idDescuento ?? null, expiraEn
      })
    } catch (err) {
      await devolverStock(prodId, compra.quantities)
      throw err
    }

    const preference = {
      items: [
        {
          title: `Ticket para ${event.nombreEvento}`,
          quantity: 1,
          unit_price: compra.total,
          currency_id: 'ARS',
        },
      ],
      payer: {
        name: comprador.nombreCompleto,
        surname: comprador.nombreCompleto,
        email: comprador.mail,
      },
      back_urls: {  //MP exige https con auto_return: vuelve al backend y este redirige al frontend (paymentReturnController)
        success: `${urlBack}/payment_return`,
        failure: `${urlBack}/payment_return`,
        pending: `${urlBack}/payment_return`,
      },
      external_reference: orden._id.toString(),
      auto_return: 'approved',
      //MP no acepta el pago despues de vencida la reserva
      expires: true,
      expiration_date_from: fechaMP(ahora),
      expiration_date_to: fechaMP(expiraEn),
      //Sin medios en efectivo (Rapipago/Pago Facil): se aprueban horas despues, incompatibles con la reserva
      payment_methods: { excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }] },
      notification_url: `${urlBack}/webhook/mercadopago`,
      metadata: {
        prod_id: String(prodId),
        nombre_evento: event.nombreEvento,
        quantities: compra.quantities,
        mail: comprador.mail,
        state: 1,
        total: compra.total,
        monto_entradas: compra.montoEntradas,  //reembolsable (sin cargo por servicio, con descuento)
        email_hash: emailHash ?? null,
        nombre_completo: comprador.nombreCompleto,
        dni,
        telefono: comprador.telefono,
        discount_code: descuento?.idDescuento ?? null,
        order_id: orden._id.toString()
      },
    };

    const response = await mercadopago.preferences.create(preference);

    if (response.body && response.body.init_point) {
      return res.status(200).json({ init_point: response.body.init_point, total: compra.total });
    }
    console.error('Mercado Pago no devolvio init_point');
    await liberarOrden(orden._id, 'fallida');
    return res.status(502).json({ message: 'Error creando la preferencia' });
  } catch (error) {
    console.error('Error al crear preferencia:', error?.message ?? error);
    if (orden) await liberarOrden(orden._id, 'fallida').catch(() => {});
    return res.status(500).json({ message: 'Error creando la preferencia' });
  }
};

//Procesa un pago consultandolo a MP: si esta aprobado y no se proceso antes, guarda la transaccion,
//genera los QR, registra la venta y el comprador. Lo usan el webhook y la confirmacion desde la
//pagina de resultado; el indice unico de paymentId garantiza que solo uno de los dos lo procese.
//Devuelve { payment, procesado }. Lanza si MP no responde o no encuentra el pago.
const procesarPagoMP = async (paymentId, origen) => {
  paymentId = String(paymentId);
  const payment = (await mercadopago.payment.findById(paymentId)).body;

  if (payment?.status !== 'approved') {
    console.log(`Pago ${paymentId} no aprobado aún (${origen}).`);
    return { payment, procesado: false };
  }

  try {
    const procesado = await procesarPagoAprobado(paymentId, payment, origen);
    return { payment, procesado };
  } catch (err) {
    console.error(`Error procesando el pago ${paymentId} (${origen}):`, err);
    return { payment, procesado: false };
  }
};

//Compras del evento cuyo mail con las entradas NUNCA se pudo enviar (solo el dueño, ver rutas)
export const entregasPendientesController = async (req, res) => {
  const pendientes = await transactionModel.find(
    { prodId: String(req.evento._id), entregado: false, alertaMonto: { $ne: true }, reembolsado: { $ne: true } },
    { paymentId: 1, nombre: 1, email: 1, intentosEntrega: 1, ultimoErrorEntrega: 1, fecha: 1 }
  ).sort({ fecha: -1 }).limit(200).lean()
  return res.status(200).json({ pendientes: pendientes.map(({ _id, ...p }) => p) })
}

//Reenvia el mail con las entradas SOLO si nunca se envio (decision de negocio: si el comprador escribio mal
//su mail, no se reenvia a otro). Vuelve a habilitar los reintentos y lo intenta en el momento, al mismo mail
export const reenviarEntradasController = async (req, res) => {
  const paymentId = String(req.body?.paymentId ?? '')
  const tx = await transactionModel.findOne({ paymentId, prodId: String(req.evento._id) }, { entregado: 1, alertaMonto: 1, reembolsado: 1 }).lean()
  if (!tx) return res.status(404).json({ code: 'COMPRA_INEXISTENTE', error: 'No existe esa compra en este evento' })
  if (tx.entregado !== false) return res.status(409).json({ code: 'YA_ENVIADO', error: 'Las entradas de esta compra ya se enviaron' })
  if (tx.alertaMonto || tx.reembolsado) return res.status(409).json({ code: 'NO_REENVIABLE', error: 'Esta compra está en revisión o fue reembolsada' })

  await transactionModel.updateOne({ paymentId, entregado: false }, { $set: { intentosEntrega: 0, entregandoDesde: null } })
  await procesarPagoMP(paymentId, 'reenvio')
  const despues = await transactionModel.findOne({ paymentId }, { entregado: 1, ultimoErrorEntrega: 1 }).lean()
  return despues?.entregado
    ? res.status(200).json({ enviado: true })
    : res.status(502).json({ code: 'NO_ENVIADO', error: 'No se pudo enviar el mail. Se va a reintentar automáticamente' })
}

export const mercadoPagoWebhookController = async (req, res) => {

  const paymentId = req.query.id || req.query['data.id'];
  const topic = req.query.topic || req.query.type;

  // Siempre responder si no es payment
  if (!paymentId || topic !== 'payment') {
    return res.sendStatus(200);
  }

  //Firma de Mercado Pago (lib/firmaMP.js). En "registrar" solo se deja constancia: el pago se confirma
  //igual contra la API de MP, asi que un aviso falso no puede crear ventas.
  //En "estricto" un aviso sin firma valida se IGNORA con 200 (no 401): MP manda por cada pago un aviso firmado
  //(WebHook v1.0) y otro en formato viejo sin firma valida (Feed v2.0); rechazarlo haria que MP lo reintente
  //durante horas. El pago lo procesa el aviso firmado, la pagina de resultado o la conciliacion
  if (webhookFirma !== 'off') {
    const { valida, motivo } = verificarFirmaMP(req, webhookSecret);
    if (!valida) {
      console.warn(`Webhook de MP sin firma valida (${motivo}) para el pago ${paymentId}${webhookFirma === 'estricto' ? ': ignorado' : ''}`);
      if (webhookFirma === 'estricto') return res.sendStatus(200);
    } else {
      console.log(`Webhook de MP con firma valida para el pago ${paymentId}`);
    }
  }

  // RESPONDEMOS INMEDIATAMENTE
  res.sendStatus(200);

  try {
    await procesarPagoMP(paymentId, 'webhook');
  } catch (err) {
    console.error("Error procesando webhook:", err);
  }
};



export const qrGeneratorController = async (prodId, quantities, mail, state, nombreCompleto, dni, paymentId = null) => {
  
  try {
    
    if(state === 3){                                                        //si estado = 3 resta la cantidad de cortesias que puede enviar el rrpp
        const bulkOps = Object.entries(quantities).filter(([_, quantityObj]) => quantityObj.amount > 0).map(([ticketId, quantityObj]) => ({
          updateOne: {
            filter: {
              "rrpp.mail": mail,
              "rrpp.ticketsCortesias.ticketIdCortesia": ticketId
            },
            update: {
              $inc: {
                "rrpp.$[rrppElem].ticketsCortesias.$[ticketElem].cantidadDeCortesias": -quantityObj.amount,
                "rrpp.$[rrppElem].freeEntregados": quantityObj.amount
              }
            },
            arrayFilters: [
              { "rrppElem.mail": mail },
              { "ticketElem.ticketIdCortesia": ticketId }
            ]
          }
        }));
        await ticketModel.bulkWrite(bulkOps);
    }
  const ticketIds = Object.keys(quantities).map(id => new mongoose.Types.ObjectId(id));
  const event = await ticketModel.findById(prodId);

  if (!event) {
    console.log("Evento no encontrado.");
    return;
  }

  // Combinamos los dos tipos de tickets: pagos y cortesías
  const filteredTickets = [
    ...event.tickets
      .filter(ticket => ticketIds.some(id => id.equals(ticket._id)))
      .map(ticket => ({ ...ticket.toObject(), tipo: 'ticket' })),
    ...event.cortesiaRRPP
      .filter(cortesia => ticketIds.some(id => id.equals(cortesia._id)))
      .map(cortesia => ({ ...cortesia.toObject(), tipo: 'cortesia' }))
  ];

  const ticketDataArray = [];

for (const ticket of filteredTickets) {
  const quantityObj = quantities[ticket._id.toString()];

  if (!quantityObj) continue;
  const { amount, free } = quantityObj;
  
  if(free && amount > 0){ 
    await userModel.updateOne(
      { mail: mail, "cortesias.cortesiaId": ticket._id },
      { $inc: { "cortesias.$.qty": amount } }
    )
    .then(res => {
      if (res.matchedCount === 0) {
        return userModel.updateOne(
          { mail: mail },
          { $push: { cortesias: { cortesiaId: ticket._id, qty: amount } } }
        );
      }
    });
  }
  for (let i = 0; i < amount; i++) {
    const payload = {
      nombreCompleto,
      dni,
      eventId: event._id,
      ticketId: ticket._id,
      iat: Math.floor(Date.now() / 1000),
      jti: uuidv4()
    };    

    const token = jwt.sign(payload, JWT_SECRET);
    const saveToken = new tokenModel({ token, eventId: String(event._id), paymentId: paymentId ? String(paymentId) : null });
    await saveToken.save();

    const qrUrl = `${urlFront}/ticket/validate/${token}`;
    const ticketDate = formatDateB(ticket.fechaDeCierre);
    const eventDate = formatDateB(event.fechaInicio);
    
    const qrImage = await QRCode.toBuffer(qrUrl);

    
    /*const qrBase64 = qrImage.split(',')[1]; solo es para usarlo con toDataURL()
    const qrImage = Buffer.from(qrBase64, 'base64'); solo es para usarlo con toDataURL()*/ 

    ticketDataArray.push({
      qrImage,
      nombreTicket: ticket.nombreTicket,
      ticketPrecio: ticket.precio,
      ticketFechaCierre: ticketDate,
      tipo: ticket.tipo
    });
  }
}

// 👉 Enviamos todos los tickets en un solo mail
await sendQrEmail(
  mail,
  ticketDataArray,
  event.nombreEvento,
  formatDateB(event.fechaInicio),
  event.direccion,
  event.imgEvento,
  state,
  nombreCompleto
);

console.log("QRs generados y enviados.");

  return true
} catch (err) {
  console.error("❌ Error generando QRs:", err);
  return false
}
};


async function sendColabMail(rrppMail, nombreEvento, eventImg) {
  
  return resend.emails.send({
    from: '"Ipass" <no-reply@ipassi.com>',
    to: [rrppMail],
    subject: `Ya eres colaborador en: ${nombreEvento}`,
    html: `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins&display=swap');
          </style>
        </head>
        <body style="font-family: 'Poppins', sans-serif; padding:10px; text-align:center;">
          <div style="display:flex; height:90px; background-color:oklch(79.5% 0.184 86.047); justify-content:center; align-items:center;">
            <h1 style="font-size:30px; color:#111827; margin:auto;">Ipass</h1>
          </div>

          <div style="text-align:center; padding:20px 15px; background-color:oklch(21% 0.034 264.665); color:oklch(87.2% 0.01 258.338);">
            <h3 style="font-size:30px; margin:auto;">Ya eres parte del staff del evento ${nombreEvento}</h3>
            <p style="margin-top:20px;">Ya puedes generar tu link de cobranza del evento. Ingresa a este link 
              <a href="${urlFront}/get_my_rrpp_events/${rrppMail}">
                aquí
              </a> y créalo!
            </p>
            <p>Evento: ${nombreEvento}</p>

            <img src="${eventImg}" alt="${nombreEvento}" style="width:230px; height:230px;"/>
          </div>

          <footer style="display:flex; height:90px; background-color:oklch(79.5% 0.184 86.047); justify-content:center; align-items:center;">
            <h2 style="font-size:27px; color:#111827; margin:auto;">Ipass</h2>
          </footer>
        </body>
      </html>
    `
  });
}


export const addRRPPController = async (req, res) => {
  try {
    const { prodId, rrppMail, nombreEvento, eventImg } = req.body;

    // 1. Verificar si el RRPP ya existe dentro del evento
    const rrppExist = await ticketModel.findOne({
      _id: prodId,
      'rrpp.mail': rrppMail
    });
    console.log(rrppExist)
    // 2. Si ya existe → enviar email y cortar
    if (rrppExist) {
      await sendColabMail(rrppMail, nombreEvento, eventImg);
      return res.status(200).json({ msg: 2 });
    }

    // 3. Obtener datos del colaborador
    const colabData = await userModel.findOne({ mail: String(rrppMail ?? '').trim().toLowerCase() }).collation({ locale: 'en', strength: 2 });  //sin distinguir mayusculas
    if (!colabData) {
      return res.status(200).json({ msg: 3 });
    }

    // 4. Agregar datos como RRPP al evento
    await ticketModel.updateOne(
      {
        _id: prodId,
        'rrpp.mail': { $ne: rrppMail }
      },
      {
        $addToSet: {
          rrpp: {
            mail: rrppMail,
            cbu: colabData.cbu || '',
            alias: colabData.alias || '',
            telefono: colabData.telefono || ''
          }
        }
      }
    );

    // 5. Enviar correo
    await sendColabMail(rrppMail, nombreEvento, eventImg);

    return res.status(200).json({ msg: 2 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};




//El dueño asigna cortesias a un RRPP (pantalla Staff). quantities = { idCortesia: cantidad }.
//La asignacion es atomica (lib/cortesias.js): solo si el cupo total alcanza para todo lo pedido.
//Respuesta: { state: 1 } asignado | { state: 2 } no alcanzan las cortesias | 400 datos invalidos
export const sendQrStaffQrController = async (req, res) => {
  const { prodId, quantities, mail } = req.body;

  if (typeof mail !== 'string' || !MAIL_RE.test(mail.trim())) {
    return res.status(400).json({ state: 0, error: 'Email del colaborador inválido' });
  }
  const evento = await ticketModel.findById(prodId, { cortesiaRRPP: 1, rrpp: 1, nombreEvento: 1, imgEvento: 1, fechaInicio: 1, fechaFin: 1, direccion: 1 }).lean();
  const errorCantidades = validarCantidades(evento, quantities);
  if (errorCantidades) return res.status(400).json({ state: 0, error: errorCantidades });

  //Si el RRPP ya era colaborador se usa su mail tal como esta guardado
  const mailRRPP = mailRRPPGuardado(evento, mail) ?? mail.trim();
  if (!(await asignarCortesiasARRPP(prodId, mailRRPP, quantities))) {
    return res.status(200).json({ state: 2 }); // No hay suficientes cortesías
  }
  const findRrPp = evento;

  // Enviar correo

  try {
    
    const inf = await resend.emails.send({
      from: '"Ipass" <no-reply@ipassi.com>',
      to: [mail],
      subject: `Se te enviaron invitaciones de ${findRrPp?.nombreEvento || ''}`,
      html: `
        <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Poppins&display=swap');
            </style>
          </head>
          <body style="font-family: 'Poppins', sans-serif; padding:50px; text-align:center;">
            <div style="display:flex; height:90px; background-color:oklch(79.5% 0.184 86.047); justify-content:center; align-items:center;">
              <h1 style="font-size:30px; color:#111827">Ipass</h1>
            </div>
            <div style="padding:20px; background-color:oklch(21% 0.034 264.665); color:oklch(87.2% 0.01 258.338);">
              <h3>${mail}, ¡Ingresa al link que esta debajo para crear tu link de pago!</h3>
              ${findRrPp ? `
                <div style="height:60px;">
                  <a style="padding:10px; background-color: orange; color:#111827; text-decoration:none;" href="${urlFront}/get_my_rrpp_events/${mail}">Crear mi link de pago</a>
                </div>
                <img src="${findRrPp.imgEvento || ''}" alt="" style="width:230px; height:230px;"/>
                <div>
                  <h2 style="font-size:30px;">${findRrPp.nombreEvento}</h2>
                  <p>Fecha del evento: ${findRrPp.fechaInicio}</p>
                  <p>Entrada válida hasta: ${findRrPp.fechaFin}</p>
                  <p>${findRrPp.direccion}</p>
                </div>
              ` : ''}
            </div>
            <footer style="display:flex; height:90px; background-color:oklch(79.5% 0.184 86.047); justify-content:center; align-items:center;">
              <h2 style="font-size:27px; color:#111827;">Ipass</h2>
            </footer>
          </body>
        </html>
      `
    });
    return res.status(200).json({ state: 1 }); // Éxito
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    return res.status(500).json({ state: 0, error: "Error al enviar el correo" });
  }
};


//Eventos donde el usuario es RRPP. Cada RRPP ve solo SU registro: antes recibia el evento completo,
//con mails, CBU y alias de los demas RRPP y el mail (cifrado) del productor
//Cortesias que el RRPP puede enviar en un evento (pantalla "Enviar cortesías")
export const rrppCortesiasController = async (req, res) => {
  const evento = await ticketModel.findById(req.params.prodId, {
    nombreEvento: 1, imgEvento: 1, fechaInicio: 1, fechaFin: 1, direccion: 1, provincia: 1, localidad: 1, eventoEdad: 1, active: 1, cortesiaRRPP: 1, rrpp: 1
  }).lean();
  const mailRRPP = mailRRPPGuardado(evento, req.user.mail);
  const cupos = evento.rrpp.find((r) => r.mail === mailRRPP)?.ticketsCortesias ?? [];
  const ahora = new Date();
  const eventoCerrado = evento.active === false || Boolean(evento.fechaFin && new Date(evento.fechaFin) < ahora);

  const cortesias = (evento.cortesiaRRPP ?? [])
    .map((c) => ({
      ticketId: String(c._id),
      nombreTicket: c.nombreTicket,
      descripcionTicket: c.descripcionTicket,
      imgTicket: c.imgTicket,
      fechaDeCierre: c.fechaDeCierre,
      limit: c.limit || 30,
      disponibles: cupos.filter((t) => t.ticketIdCortesia === String(c._id)).reduce((acc, t) => acc + (t.cantidadDeCortesias || 0), 0),
      cerrada: eventoCerrado || Boolean(c.fechaDeCierre && new Date(c.fechaDeCierre) < ahora)
    }))
    .filter((c) => cupos.some((t) => t.ticketIdCortesia === c.ticketId));

  const { rrpp, cortesiaRRPP, ...datosEvento } = evento;
  return res.status(200).json({ evento: datosEvento, cortesias });
};

//El RRPP envia cortesias de su cupo a un cliente: el cupo se descuenta de forma atomica y, si el mail
//con los QR no sale, se devuelve. Body: { prodId, ticketId, cantidad, mail, nombreCompleto, dni? }
export const rrppEnviarCortesiasController = async (req, res) => {
  const { prodId, ticketId, cantidad, mail, nombreCompleto, dni } = req.body ?? {};

  if (typeof mail !== 'string' || !MAIL_RE.test(mail.trim())) return res.status(400).json({ code: 'DATOS_CLIENTE', error: 'Email inválido' });
  if (typeof nombreCompleto !== 'string' || nombreCompleto.trim() === '') return res.status(400).json({ code: 'DATOS_CLIENTE', error: 'Completá el nombre de quien recibe la cortesía' });

  const evento = await ticketModel.findById(prodId, { active: 1, fechaFin: 1, cortesiaRRPP: 1, rrpp: 1 }).lean();
  const cortesia = evento.cortesiaRRPP?.find((c) => String(c._id) === String(ticketId));
  if (!cortesia) return res.status(400).json({ code: 'CORTESIA_INEXISTENTE', error: 'Esa cortesía no pertenece a este evento' });

  const limite = cortesia.limit || 30;
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > limite) {
    return res.status(400).json({ code: 'CANTIDAD_INVALIDA', error: `Podés enviar entre 1 y ${limite} cortesías por vez` });
  }
  const ahora = new Date();
  if (evento.active === false || (evento.fechaFin && new Date(evento.fechaFin) < ahora) || (cortesia.fechaDeCierre && new Date(cortesia.fechaDeCierre) < ahora)) {
    return res.status(409).json({ code: 'CORTESIA_CERRADA', error: 'Esta cortesía ya no se puede enviar' });
  }

  const mailRRPP = mailRRPPGuardado(evento, req.user.mail);
  if (!(await consumirCupoRRPP(prodId, mailRRPP, ticketId, cantidad))) {
    return res.status(409).json({ code: 'SIN_CUPO', error: 'No te quedan suficientes cortesías de este tipo' });
  }

  const enviadas = await qrGeneratorController(prodId, { [String(ticketId)]: { amount: cantidad, free: true } }, mail.trim(), 1, nombreCompleto.trim(), dni ?? null);
  if (!enviadas) {
    await devolverCupoRRPP(prodId, mailRRPP, ticketId, cantidad);
    return res.status(502).json({ code: 'CORTESIAS_NO_ENVIADAS', error: 'No pudimos enviar las cortesías. Tu cupo no se descontó, intentá de nuevo' });
  }
  return res.status(200).json({ enviadas: cantidad });
};

export const getRRPPInfoController = async (req,res) => {
    const {mail} = req.params
    const mailLower = String(mail).trim().toLowerCase()
    const rrppData = await ticketModel.find(
      {"rrpp.mail": mail},
      { prodMail: 0, cortesiaRRPP: 0, montoVentas: 0, totalMontoVendido: 0, totalMontoDescuento: 0, montoTotal: 0, categorias: 0 }
    ).lean()
    res.send(rrppData.map((ev) => ({ ...ev, rrpp: (ev.rrpp ?? []).filter((r) => String(r.mail).trim().toLowerCase() === mailLower) })))
}

export const getEventsFreesController = async (req, res) => { //a chequear
   const {prodId, mail} = req.params

   if(prodId.length > 0 && mail.length > 0){
     const result = await ticketModel.findOne(
        { _id: prodId, "rrpp.mail": mail },
        { "rrpp.$": 1 }
      );
      return res.send(result)
   }
    res.status(200).json({message: "Necesitas loguearte"})
}

const sendQrEmail = async (
  email,
  tickets,
  nombreEvento,
  eventoFechaInicio,
  direccionEvento,
  imagenEvento,
  state,
  nombreCompleto
) => {

  try {
    const ticketsHTML = tickets.map((ticket, index) => {
      const qrCid = `qrcodeimg${index}`;
      return `
        <div style="margin-bottom:30px; border:1px solid #ccc; padding:20px; border-radius:8px;">
          <h3 style="font-size:20px">Entrada ${index + 1}</h3>
          <p style="font-size:18px">Escaneá este QR en la entrada:</p>
           <img src="cid:${qrCid}" alt="QR para ${ticket.nombreTicket}" style="width:230px; height:230px;" />
          <div>
            <h2 style="font-size:20px">${nombreEvento}</h2>
            <p style="font-size:18px">${ticket.nombreTicket} - $ ${ticket.ticketPrecio}</p>
            <p style="font-size:18px">Fecha del evento: ${eventoFechaInicio}</p>
            <p style="font-size:18px">Entrada válida hasta: ${ticket.ticketFechaCierre}</p>
            <p style="font-size:18px">${direccionEvento}</p>
          </div>
        </div>
      `;
    }).join("");
    const html = `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins&display=swap');
          </style>
        </head>
        <body style="font-family: 'Poppins', sans-serif; padding:50px; text-align:center;">
          <div style="display:flex; height:90px; background-color:oklch(79.5% 0.184 86.047); justify-content:center; align-items:center; text-align:center">
            <h1 style="font-size:30px; color:#111827; margin:auto;">Ipass</h1>
          </div>
          <div style="background-color:oklch(21% 0.034 264.665)">
            <div style="text-align:center; padding:40px; background-color:oklch(21% 0.034 264.665); color:oklch(87.2% 0.01 258.338);">
              <h3 style="font-size:20px; margin-top:30px; margin-bottom:20px;">${nombreCompleto}, aquí tienes tus tickets!</h3>
              <img src="${imagenEvento}" alt="Imagen del evento" style="width:100%; max-width:500px; margin-bottom:20px;" />
              ${ticketsHTML}
            </div>
          </div>
          <div style="background-color:oklch(21% 0.034 264.665); color:oklch(87.2% 0.01 258.338); padding:20px; text-align:center">
            <h3 style="text-decoration: underline; font-size:25px;">Algunos consejos:</h3>
            <p style="font-size:16px">- Presenta tu eTicket en el acceso del evento con tu teléfono.</p>
            <p style="font-size:16px">- También puedes acceder a tus compras desde nuestra web.</p>
            <p style="font-size:16px">- Lleva tus eTickets abiertos en tu celular.</p>
          </div>
          <footer style="display:flex; height:90px; background-color:oklch(79.5% 0.184 86.047); justify-content:center; align-items:center;">
            <h2 style="font-size:27px; color:#111827; margin:auto;">Ipass</h2>
          </footer>
        </body>
      </html>
    `;
    
    
    const attachments = tickets.map((ticket, index) => ({
       filename: `qrcode-${index + 1}.png`,
        content: ticket.qrImage,       // Buffer o base64
        contentType: 'image/png',
        contentId: `qrcodeimg${index}`, // Content-ID para imagen embebida
        disposition: "inline"   // Indica que se debe mostrar inline
    }))
    
    const info = await resend.emails.send({
      from: '"Ipass" <no-reply@ipassi.com>',
      to: [email],
      subject: `Tus entradas para ${nombreEvento}`,
      html,
      attachments,
    });
    //Resend no lanza: devuelve { error }. Sin esto, un envio rechazado se tomaba como exitoso
    if (info?.error) throw new Error(`El proveedor de mail rechazo el envio: ${info.error.message ?? info.error.name}`);
  } catch (err) {
    console.error('❌ Error al enviar el email:', err);
    throw err;
  }
};


const datosEntrada = (lectura) => ({
  tipo: lectura.tipo,
  estado: lectura.estado,                       //'vigente' | 'usada' | 'vencida'
  usadaEn: lectura.tokenDoc.usedAt ?? null,
  nombreCompleto: lectura.payload.nombreCompleto ?? null,
  nombreEvento: lectura.evento.nombreEvento,
  nombreTicket: lectura.entrada.nombreTicket,
  direccion: lectura.evento.direccion,
  localidad: lectura.evento.localidad,
  eventoEdad: lectura.evento.eventoEdad,
  fechaInicioEvento: lectura.evento.fechaInicio,
  fechaCierreEvento: lectura.evento.fechaFin,
  fechaDeCierreTicket: lectura.venceEn,
  imgEvento: lectura.evento.imgEvento,
})

//Abrir el QR: SOLO muestra la entrada, nunca la marca como usada (antes la quemaba cualquiera que la abriera,
//incluido el propio comprador). Si quien la abre es el dueño o un RRPP del evento, puedeValidar = true
export const getInfoQrController = async (req, res) => {
  try {
    const lectura = await leerEntrada(req.params.token);
    if (!lectura.ok) return res.status(lectura.status).json({ error: 1 });
    const puedeValidar = Boolean(req.user) && (esDueno(lectura.evento, req.user) || esRRPP(lectura.evento, req.user));
    return res.status(200).json({ ...datosEntrada(lectura), puedeValidar });
  } catch (err) {
    console.error('Error leyendo la entrada:', err?.message ?? err);
    return res.status(500).json({ error: 1 });
  }
};

//Validar el ingreso en la puerta: solo el dueño o un RRPP del evento, con sesion.
//Primero se revisa el vencimiento y despues se marca de forma atomica (dos celulares no validan la misma entrada)
export const validarEntradaController = async (req, res) => {
  try {
    const lectura = await leerEntrada(req.params.token);
    if (!lectura.ok) return res.status(lectura.status).json({ code: 'ENTRADA_INEXISTENTE', error: 'La entrada no existe' });

    if (!esDueno(lectura.evento, req.user) && !esRRPP(lectura.evento, req.user)) {
      return res.status(403).json({ code: 'NO_PUEDE_VALIDAR', error: 'Solo el organizador o un RRPP del evento puede validar entradas' });
    }
    if (lectura.estado === 'usada') {
      return res.status(409).json({ code: 'YA_USADA', error: 'Esta entrada ya fue usada', ...datosEntrada(lectura) });
    }
    if (lectura.estado === 'anulada') {
      return res.status(409).json({ code: 'ANULADA', error: 'Esta entrada está anulada: el evento fue cancelado', ...datosEntrada(lectura) });
    }
    if (lectura.estado === 'vencida') {
      return res.status(409).json({ code: 'VENCIDA', error: 'Esta entrada está vencida', ...datosEntrada(lectura) });
    }

    const marcada = await marcarUsada(req.params.token, req.user);
    if (!marcada) {
      //Otro celular la valido entre la lectura y este momento
      const actual = await leerEntrada(req.params.token);
      return res.status(409).json({ code: 'YA_USADA', error: 'Esta entrada ya fue usada', ...(actual.ok ? datosEntrada(actual) : {}) });
    }
    return res.status(200).json({ validada: true, ...datosEntrada({ ...lectura, estado: 'usada', tokenDoc: marcada }) });
  } catch (err) {
    console.error('Error validando la entrada:', err?.message ?? err);
    return res.status(500).json({ code: 'ERROR', error: 'No se pudo validar la entrada. Intentá de nuevo' });
  }
};

export function encrypt(rrppMail) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash('sha256').update(SECRET_MAIL_KEY).digest(); // 🔐 32-byte key

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(rrppMail, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedMail) {
  const [ivHex, encrypted] = encryptedMail.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.createHash('sha256').update(SECRET_MAIL_KEY).digest(); // same 32-byte key
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export const hashForSearch = (encryptedMail) => {
  return crypto.createHash('sha256').update(encryptedMail).digest('hex');
}

export const generateMyRRPPLinkController = async (req, res) => {  //guardar en la bd mailEncriptado y mailHash (mailHash para buscarlo)
  const {prodId, rrppMail} = req.body
  const encryptedMail = encrypt(rrppMail)
  const emailHash = hashForSearch(rrppMail);
  console.log(encryptedMail, emailHash)

  const response = await ticketModel.findOne({_id: prodId, "rrpp.mailHash": emailHash})

  if(!response){
    await ticketModel.updateOne(
      {_id: prodId, "rrpp.mail": rrppMail},
      {
        $set:{
          'rrpp.$.mailEncriptado': encryptedMail,
          'rrpp.$.mailHash': emailHash,
          'rrpp.$.linkDePago': `${urlFront}/buy_tickets/${prodId}/${emailHash}`
        }
      }
    )
   return res.json({message: `${urlFront}/buy_tickets/${prodId}/${emailHash}`}).status(200)
  }
  return res.json({message: 'Ya tienes tu link de pago'})
}

export const paymentSuccessController = async (req, res) => {
  const paymentId = req.query.payment_id;

  try {
    const payment = await mercadopago.payment.findById(paymentId);

    if (payment.body.status === 'approved') {
      res.send('Pago aprobado con éxito');
    } else {
      res.send('Pago no aprobado');
    }
  } catch (error) {
    console.error('Error al verificar pago:', error);
    res.status(500).send('Error interno');
  }
};

//Vuelta desde MP: redirige a la pagina de resultado del frontend con los mismos parametros.
//El destino es siempre urlFront (no se puede usar para redirigir a otro sitio)
export const paymentReturnController = (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  return res.redirect(`${urlFront}/payment_result${query ? `?${query}` : ''}`);
};

const paymentSummary = ({ status, status_detail, metadata }) => ({
  status,
  statusDetail: status_detail,
  nombreEvento: metadata?.nombre_evento ?? null,
  prodId: metadata?.prod_id ?? null
});

const respondMpError = (res, error, accion) => {
  const notFound = error?.status === 404;
  console.error(`Error ${accion}:`, error?.status, error?.message);
  return res.status(notFound ? 404 : 502).json({ status: notFound ? 'not_found' : 'unavailable' });
};

const isPaymentId = (id) => /^\d+$/.test(String(id));

//Estado real de un pago consultado a MP. No confia en el status que trae la URL de retorno de MP.
//Solo lectura: no procesa el pago.
export const paymentStatusController = async (req, res) => {
  const { paymentId } = req.params;
  if (!isPaymentId(paymentId)) return res.status(400).json({ status: 'invalid' });

  try {
    const payment = await mercadopago.payment.findById(paymentId);
    return res.status(200).json(paymentSummary(payment.body));
  } catch (error) {
    return respondMpError(res, error, 'consultando el estado del pago');
  }
};

//La pagina /payment_result lo llama al volver de MP: si el pago esta aprobado y el webhook
//todavia no lo proceso (o nunca llego), lo procesa aca. Mismo procesamiento e idempotencia que el webhook.
export const paymentConfirmController = async (req, res) => {
  const { paymentId } = req.params;
  if (!isPaymentId(paymentId)) return res.status(400).json({ status: 'invalid' });

  try {
    const { payment, procesado } = await procesarPagoMP(paymentId, 'pagina de resultado');
    return res.status(200).json({ ...paymentSummary(payment), procesado });
  } catch (error) {
    return respondMpError(res, error, 'confirmando el pago');
  }
};


export const descargarCompradoresController = async (req, res) => {
  const {prodId} = req.body

  const event = await ticketModel.findOne({_id: prodId})

   if(!event){
    return res.status(404).send("No se encontro ningun evento")
  }

  //Orden de compra (sin sort, Mongo no garantiza ningun orden)
  const transactions = await transactionModel.find({prodId: prodId}, {nombre: 1, email: 1}).sort({fecha: 1, _id: 1}).lean()

  if (!transactions.length) {
    return res.status(404).send("No se encontraron transacciones");
  }


  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Compradores')

  worksheet.columns = [
    {header: 'Nombre completo', key: 'nombre', width:30},
    {header: 'Email', key: 'email', width: 30}
  ]

  transactions.forEach(tx => {
    worksheet.addRow({
      nombre: tx.nombre,
      email: tx.email
    })
  })

   const nombreLimpio = event.nombreEvento.replace(/[^a-zA-Z0-9]/g, '_');
   const nombreArchivo = `compradores_${nombreLimpio}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);

    
  await workbook.xlsx.write(res);
  res.end()
}

//Reembolsa las compras de un evento (lo usa el worker de la cola, hoy sin uso). Ver lib/reembolsos.js
export const refundsFunc = async ({ prodId }) => {
  await marcarParaReembolso(prodId);
  const { ok, fallidos } = await procesarReembolsosPendientes(prodId);
  return { success: true, ok, fallidos };
};

export const relateEventsController = async (req, res) => {
  const {prodId, otherId} = req.body

  const findCoincidence = await ticketModel.findOne({_id: prodId, 'eventosRelacionados.idEvento': otherId})

  if(findCoincidence){
    await ticketModel.updateOne(
    { _id: prodId },
    {
      $pull: {
        eventosRelacionados: { idEvento: otherId }
      }
    }
  );

  await ticketModel.updateOne(
    { _id: otherId },
    {
      $pull: {
        eventosRelacionados: { idEvento: prodId }
      }
    }
  );
    return res.status(200).json({msg: 1})
  }

  await ticketModel.updateOne(
    {_id: prodId},
    {
      $addToSet:{
        eventosRelacionados:{idEvento: otherId}
      }
    }
  )

  await ticketModel.updateOne(
    {_id: otherId},
    {
      $addToSet:{
        eventosRelacionados:{idEvento: prodId}
      }
    }
  )

  return res.status(200).json({msg: 2})
}

export const getRelateEventsController = async (req, res) => {
  const { prodId } = req.params;

  try {
   
    const eventoPrincipal = await ticketModel.findById(prodId);

    if (!eventoPrincipal) {
      return res.status(404).json({ msg: 'Evento no encontrado' });
    }

   
    const idsRelacionados = eventoPrincipal.eventosRelacionados.map(
      (rel) => rel.idEvento
    );

    if (idsRelacionados.length === 0) {
      return res.status(200).json({ relacionados: [] }); 
    }

    
    const eventosRelacionados = await ticketModel.find({
      _id: { $in: idsRelacionados },
    }, CAMPOS_PRIVADOS_EVENTO);

    return res.status(200).json({ relacionados: eventosRelacionados });

  } catch (error) {
    console.error('Error al obtener eventos relacionados:', error);
    return res.status(500).json({ msg: 'Error del servidor' });
  }
};

//Cancelar un evento (solo el dueño, ver lib/permisos.js):
//  1. queda cancelado e inactivo   2. se anulan todos sus QR   3. se liberan las reservas pendientes
//  4. cada compra queda con el reembolso pendiente: se procesan en segundo plano y el cron reintenta las fallidas
//Cancelar dos veces no reembolsa dos veces (clave de idempotencia fija por pago)
export const cancelarEventoController = async (req, res) => {
  const prodId = String(req.evento._id);
  try {
    await ticketModel.updateOne({ _id: prodId }, { $set: { active: false, cancelado: true, canceladoEn: new Date() } });
    const entradasAnuladas = await anularEntradasDelEvento(prodId);
    for (const { _id } of await orderModel.find({ prodId, estado: 'pendiente' }, { _id: 1 }).lean()) {
      await liberarOrden(_id, 'cancelada');
    }
    const reembolsosEnCurso = await marcarParaReembolso(prodId);
    await purchaseModel.updateMany({ prodId }, { $set: { reembolsado: true } });

    //En segundo plano: la respuesta no espera a Mercado Pago
    setImmediate(() => procesarReembolsosPendientes(prodId).catch((err) => console.error('Reembolsos del evento', prodId, err?.message ?? err)));

    return res.status(200).json({ message: 'Evento cancelado', entradasAnuladas, reembolsosEnCurso });
  } catch (err) {
    console.error('Error cancelando el evento', prodId, err?.message ?? err);
    return res.status(500).json({ message: 'No se pudo cancelar el evento. Intentá de nuevo' });
  }
};

//Reactivar: si el evento se habia cancelado, pide confirmacion explicita (confirmar: true), porque las compras
//ya se reembolsaron y sus QR siguen anulados (no vuelven a valer)
export const reactivarEventoController = async (req, res) => {
  const prodId = String(req.evento._id);
  const evento = await ticketModel.findById(prodId, { cancelado: 1 }).lean();
  if (evento?.cancelado && req.body?.confirmar !== true) {
    const reembolsadas = await comprasReembolsadas(prodId);
    return res.status(409).json({
      code: 'CONFIRMAR_REACTIVACION', reembolsadas,
      error: `Este evento se canceló${reembolsadas ? ` y ${reembolsadas} compra(s) se reembolsaron` : ''}. Si lo reactivás, esas entradas siguen anuladas y los compradores tendrían que volver a comprar.`
    });
  }
  await ticketModel.updateOne({ _id: prodId }, { $set: { active: true, cancelado: false } });
  return res.status(200).json({ message: 'Evento reactivado' });
};

export const soldOutEventController = async (req, res) => {
  const {prodId, isSoldOut} = req.body

  await ticketModel.updateOne(
    {_id: prodId},
    {
        $set:{
          soldOut: isSoldOut
        }
    }
  )

  return res.status(200).json({ok: 1})

}

export const getBuyersController = async (req, res) => {
  const {prodId} = req.params
  console.log(prodId)
  const findEvent = await purchaseModel.find({prodId: prodId})

  res.status(200).json(findEvent)
}

export const createDiscountController = async (req, res) => {
  const {prodId, idDiscount, cantidadDescuentos, numeroDescuento} = req.body

  await discountModel.create({
    prodId:prodId,
    idDescuento:idDiscount,
    cantidadDescuentos:cantidadDescuentos,
    numeroDescuento:numeroDescuento
  })
 
  return res.status(200).json({message: 'El descuento fue creado con exito' })
}


export const findDiscountController = async (req, res) => {
  const {discountCode} = req.params
  const {prodId} = req.query

  //Con prodId (pagina de compra actual) solo vale un descuento de ese evento
  const discount = prodId
    ? await buscarDescuento(discountCode, prodId)
    : await discountModel.findOne({ idDescuento: discountCode, cantidadDescuentos: { $gt: 0 } });

    if(!discount){
      return res.status(200).json({message: 'No hay mas descuentos disponibles' })
    }

    return res.status(200).json({message:'Se aplico el descuento correctamente', discount: discount})
}