import mongoose from "mongoose";
import cloudinary from "../middleware/cloudinary.js";
import ticketModel from "../models/ticketsModel.js";
import mercadopago from "../lib/mercadopago.js";
import QRCode from 'qrcode';
import nodemailer from 'nodemailer'; 
import dotenv from 'dotenv';
import { user_mail, pass } from "../config.js";
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid'
import userModel from "../models/userModel.js";
import crypto from "crypto"
import tokenModel from "../models/tokenModel.js";
import transactionModel from "../models/transactionsModel.js";
import { formatDateB } from "../lib/dates.js";
import ExcelJS from 'exceljs';
import axios from "axios";
import { paymentQueue, refundQueue } from "../queues/paymentQueue.js";
//import { redisClient } from "../lib/redisClient.js"; //DESCOMENTAR PARA PRODUCCION
import { resend } from "../lib/resendDomain.js";
import purchaseModel from "../models/purchaseModel.js";
import discountModel from "../models/discountModel.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'kidjaskdhajsdbjadlfgkjmlkjbnsdlfgnsñlknamnczmjcf'
const SECRET_MAIL_KEY = process.env.SECRET_MAIL_KEY || 'mjac32nk12n3123ja7das2'
const IV_LENGTH = 16

export const getAllEventsController = async (req, res) => {  //OBTENER TODOS LOS EVENTOS
    const getEvents = await ticketModel.find({active: true})
    res.send(getEvents)
}

export const createEventController = async (req, res) => {
  const {
    userId, prodMail, codigoPais, codigoCiudad, paisDestino, tipoEvento,
    eventoEdad, nombreEvento, descripcionEvento, aviso, categoriasEventos,
    artistas, montoVentas, porcentajeRRPP, fechaInicio, fechaFin, provincia, localidad,
    tipoMoneda, direccion, lugarEvento, linkVideo, comisionServicio
  } = req.body;

  const eventoEdadPush = (eventoEdad !== undefined && eventoEdad !== null && eventoEdad !== '' &&
    eventoEdad !== 'null' && eventoEdad !== 'undefined' && !isNaN(Number(eventoEdad)))
    ? Number(eventoEdad)
    : undefined;

  const parsedCategorias = JSON.parse(categoriasEventos);
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
    console.log(prodId, ' ', userId)
    const getProd = await ticketModel.find({_id: prodId, userId: userId})
    const getProdDiscount = await discountModel.find({prodId: prodId})
    console.log(getProdDiscount)
    res.send({tickets:getProd, prodDiscount: getProdDiscount})
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
    const getProd = await ticketModel.find({_id: prodId})
    
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

const procesarVentaGeneral = async (event, quantities, total) => {
  const prodId = event._id;

  const bulkOps = Object.entries(quantities).map(([ticketId, quantityObj]) => {
    const { amount, free } = quantityObj;
    return {
      updateOne: {
        filter: { "tickets._id": new mongoose.Types.ObjectId(ticketId) },
        update: {
          $inc: {
            "tickets.$.ventas": amount,
            "tickets.$.cantidad": free ? 0 : -amount, // solo decrementa si no es free
          },
        },
      },
    };
  });

  const ventasTotales = Object.values(quantities).reduce((sum, quantityObj) => sum + quantityObj.amount, 0);

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



const guardarTransaccionExitosa = async ( prodId, nombreCompleto, mail, total, paymentId) => {
  const totalPagoEntradas = Math.round(total / 1.10);

  const result = await transactionModel.updateOne(
    {
      prodId,
      'compradores.transaccionId': { $ne: paymentId }
    },
    {
      $push: {
        compradores: {
          transaccionId: paymentId,
          nombre: nombreCompleto,
          email: mail,
          montoPagado: totalPagoEntradas,
          fecha: new Date(),
        }
      }
    }
  );

  if (result.modifiedCount === 0) {
    return false;
  }

  return true;
};



export const handleSuccessfulPayment = async (data) => { //ESTE HANDLESUCCESFULPAYMENT ES EL DE PRODUCCION Y EL ACTUAL QUE TOMA EL PAYMENT ID Y TRANSACCIONES DE MERCADOPAGO
  const {
    prodId,
    quantities,
    mail,
    state,
    total,
    emailHash,
    nombreCompleto,
    dni,
    paymentId
  } = data;

  const cacheKey = `payment_processed:${paymentId}`;

  try {
    // Revisar si ya se procesó el pago (cache Redis)
    // const cached = await redisClient.get(cacheKey); //expira en 24 horas DESCOMENTAR LUEGO QUE ES PARA QUE CONECTE A REDIS
    /*if (cached) { // DESCOMENTAR LUEGO QUE ES PARA QUE CONECTE A REDIS Y PARA QUE FUNCIONE TODO BIEN
      console.log(`Pago ${paymentId} ya procesado (cache).`);
      return;
    }*/

    // Si no está en cache, validar en DB (tu función actual)
    const event = await ticketModel.findOne({ _id: prodId }).lean();
    if (!event) {
      console.error("Evento no encontrado:", prodId);
      return;
    }

    const { rrppMatch, decryptedMail } = obtenerRRPPDesdeHash(event, emailHash);

    // Guardamos la transacción (validación real en BD)
    const guardado = await guardarTransaccionExitosa(
      prodId,
      nombreCompleto,
      mail,
      total,
      paymentId
    );

    if (!guardado) {
       console.log(`Transacción ya procesada para paymentId: ${paymentId}`);
      // Marcar en cache para acelerar futuros chequeos
      // await redisClient.set(cacheKey, "true", { EX: 60 * 60 * 24 }); // expira en 24 horas DESCOMENTAR LUEGO QUE ES PARA QUE CONECTE A REDIS
      return;
    }

    // Nuevo pago, generamos QRs y procesamos venta
    const tasks = [
      qrGeneratorController(prodId, quantities, mail, state, nombreCompleto, dni),
      procesarVentaGeneral(event, quantities, total)
    ];

    if (rrppMatch && decryptedMail) {
      console.log('SI EJECUTA LA FUNCION PARA PROCESAR LA VENTA: ', rrppMatch, ' ', decryptedMail)
      tasks.push(procesarVentaRRPP(event, quantities, decryptedMail));
    }
    await Promise.all(tasks);

    // Marcar como procesado en cache
    //await redisClient.set(cacheKey, "true", { EX: 60 * 60 * 24 }); // expira en 24 horas DESCOMENTAR LUEGO QUE ES PARA QUE CONECTE A REDIS

    return 1
  } catch (error) {
    console.error("Error en handleSuccessfulPayment:", error);
    throw error;
  }
};

export const buyEventTicketsController = async (req, res) => {
  const { prodId, nombreEvento, quantities, mail, state, total, emailHash, nombreCompleto, dni, telefono } = req.body;  //guardar el mail del rrpp tambien encriptandolo con un jwt
  
  if(total <= 0){
    qrGeneratorController(prodId, quantities, mail, state, nombreCompleto, dni)
    return res.status(200).json(3)
  }
 
  try {
      const preference = {
        items: [
          {
            title: `Ticket para ${nombreEvento}`,
            quantity: 1,
            unit_price: 1, // aca va "total"
            currency_id: 'ARS',
          },
        ],
        payer: {
          name: nombreCompleto,
          surname: nombreCompleto,
          email: mail,
        },
        back_urls: {
          success: `${process.env.URL_BACK}/payment-success`,
          failure: `${process.env.URL_BACK}/payment-failure`,
          pending: `${process.env.URL_BACK}/payment-pending`,
        },
        external_reference: "164382724",
        auto_return: 'approved',
        notification_url: `${process.env.URL_BACK}/webhook/mercadopago`,  //esto va descomentado para ejecutar "handleSuccesfulPayment" en producción
        metadata: {
              prodId,
              nombreEvento,
              quantities,
              mail,
              state,
              total,
              emailHash,
              nombreCompleto,
              dni,
              telefono:telefono.toString()
        },
    };

    const response = await mercadopago.preferences.create(preference);

    if(response.body && response.body.init_point){
     // await handleSuccessfulPayment({ prodId, nombreEvento, quantities, mail, state, total, emailHash, nombreCompleto, dni });//esta va en "desarrollo - dev" y lo reemplazo con el paymentQueue para probar si funciona mas rapido
      
      /*await paymentQueue.add('ejecutar-pago', 
        {prodId, nombreEvento, quantities, mail, state, total, emailHash, nombreCompleto, dni},
        {
          attempts: 3, // Reintentar 3 veces si falla
          backoff: {
            type: 'exponential', // o 'fixed'
            delay: 5000 // 5 segundos de espera antes de reintentar
          },
          removeOnComplete: true, // limpia el job si se completó
          removeOnFail: false // puedes dejarlo en false para revisar errores
        }
      )*/
      
      return res.status(200).json({
        init_point: response.body.init_point,
      });
    }
  } catch (error) {
    console.error('Error al crear preferencia:', error);
    res.status(500).json({ message: 'Error creando la preferencia' });
  }
};

export const mercadoPagoWebhookController = async (req, res) => {
  try {
    const paymentId = req.query.id || req.query['data.id'];
    const topic = req.query.topic || req.query.type;
    
    if (!paymentId || topic !== 'payment') {
      console.error("No payment ID or topic !== 'payment'");
      return res.sendStatus(200);
    }
    
    try {
      const payment = await mercadopago.payment.findById(paymentId);
      const status = payment.body?.status;

      if (status !== 'approved') return;

      // Chequeo de idempotencia
      const processed = await guardarTransaccionExitosa(
        prod_id,
        nombre_completo,
        mail,
        total,
        paymentId
      );

      if (!processed) {
        console.log(`Pago ${paymentId} ya procesado — omitido`);
        return res.sendStatus(200);
      }

      // Extraer metadata
      const {
        prod_id,
        nombre_evento,
        quantities,
        mail,
        state,
        total,
        email_hash,
        nombre_completo,
        dni,
        telefono
      } = payment.body.metadata;

      console.log("Metadata del pago:", payment.body.metadata);

      if (!quantities || !mail || !prod_id || !total) {
        console.error("Metadata incompleta:", payment.body.metadata);
        return;
      }
      console.log("quantities: " , quantities)
      // Procesamos el pago exitoso

      const resHandle = await handleSuccessfulPayment({ //COMENTADO PORQUE SE REPITE PAYMENTID PORQUE MP LO MANDA VARIAS VECES Y SE INTENTA DUPLICAR EN LA BASE (PERO FUNCIONA IGUAL)
        prodId: prod_id,
        nombreEvento: nombre_evento,
        quantities,
        mail,
        state,
        total,
        emailHash: email_hash,
        nombreCompleto: nombre_completo,
        dni,
        paymentId
      }); //comentado el 29/12/2025

      /*await guardarTransaccionExitosa( //agregado el 29/12/2025
        prod_id,
        nombre_completo,
        mail,
        total,
        paymentId
      );

       //PAYMENTQUEUE HACE EL PAGO BIEN SIN DUPLICAR EL PAYMENTID PERO SOLO LO VOY A USAR EN PRODUCCION CUANDO ESTE TODO ANDANDO BIEN
      await paymentQueue.add('generar-qr-y-mail', { prodId: prod_id, quantities, mail, state, total, emailHash: email_hash, nombreCompleto: nombre_completo, dni, paymentId}, //agregado el 29/12/2025
        {
          jobId: paymentId.toString(),
          attempts: 3, // Reintentar 3 veces si falla
          backoff: {
            type: 'exponential', // o 'fixed'
            delay: 5000 // 5 segundos de espera antes de reintentar
          },
          removeOnComplete: true, // limpia el job si se completó
          removeOnFail: false // puedes dejarlo en false para revisar errores
      })*/

      if(resHandle === 1){
       

        await purchaseModel.create({
          prodId: prod_id,
          nombreCompleto: nombre_completo,
          email: mail,
          dni:dni,
          telefono: parseInt(telefono)
        })
      }
      return res.sendStatus(200)
    } catch (err) {
      console.error("Error procesando pago en background:", err);
      return res.sendStatus(500)
    }

  } catch (error) {
    console.error('Error en webhook:', error.message, error.stack);
    return res.sendStatus(500);
  }
};


export const qrGeneratorController = async (prodId, quantities, mail, state, nombreCompleto, dni) => {
  
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

  try {
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
    const saveToken = new tokenModel({ token });
    await saveToken.save();

    const qrUrl = `${process.env.URL_FRONT}/ticket/validate/${token}`;
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
              <a href="${process.env.URL_FRONT}/get_my_rrpp_events/${rrppMail}">
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

    // 2. Si ya existe → enviar email y cortar
    if (rrppExist) {
      await sendColabMail(rrppMail, nombreEvento, eventImg);
      return res.status(200).json({ msg: 'El colaborador ya existe en este evento' });
    }

    // 3. Obtener datos del colaborador
    const colabData = await userModel.findOne({ mail: rrppMail });
    if (!colabData) {
      return res.status(404).json({ msg: 'El usuario no existe en la base de datos' });
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

    return res.status(200).json({ msg: 1 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};




export const sendQrStaffQrController = async (req, res) => {
  const { prodId, quantities, mail } = req.body;
  const ticketIds = Object.keys(quantities);

  // Buscar si el RRPP ya existe
  const findRrPp = await ticketModel.findOne({ _id: prodId, "rrpp.mail": mail });

  let i = 0;
  for (const id of ticketIds) {
    const verifyQuantity = await ticketModel.find({ _id: prodId, "cortesiaRRPP._id": id });

    if (verifyQuantity[0]?.cortesiaRRPP[i]?.cantidadDeCortesias > 0) {
      const quantityToAdd = quantities[id];

      await ticketModel.updateOne(
        {
          _id: prodId,
          "cortesiaRRPP._id": id,
        },
        {
          $inc: {
            "cortesiaRRPP.$.cantidadDeCortesias": -quantityToAdd,
            "cortesiaRRPP.$.entregados": quantityToAdd,
          }
        }
      );
    } else {
      return res.status(200).json({ state: 2 }); // No hay suficientes cortesías
    }
    i++;
  }

  // Si existe RRPP, actualizamos su listado
  if (findRrPp) {
    for (const id of ticketIds) {
      const quantityToAdd = quantities[id];

      const updateResult = await ticketModel.updateOne(
        { _id: prodId },
        {
          $inc: {
            "rrpp.$[rrppElem].ticketsCortesias.$[ticketElem].cantidadDeCortesias": quantityToAdd
          }
        },
        {
          arrayFilters: [
            { "rrppElem.mail": mail },
            { "ticketElem.ticketIdCortesia": id }
          ]
        }
      );

      if (updateResult.modifiedCount === 0) {
        await ticketModel.updateOne(
          { _id: prodId },
          {
            $push: {
              "rrpp.$[rrppElem].ticketsCortesias": {
                ticketIdCortesia: id,
                cantidadDeCortesias: quantityToAdd
              }
            }
          },
          {
            arrayFilters: [
              { "rrppElem.mail": mail }
            ]
          }
        );
      }
    }
  } else {
    // Si no existe, lo agregamos
    await ticketModel.updateOne(
      {
        _id: prodId,
        'rrpp.mail': { $ne: mail }
      },
      {
        $addToSet: {
          rrpp: {
            nombre: "",
            mail: mail,
            ticketsCortesias: ticketIds.map(id => ({
              ticketIdCortesia: id,
              cantidadDeCortesias: quantities[id]
            }))
          }
        }
      }
    );
  }

  // Enviar correo
  /*const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user_mail,
      pass: pass
    }
  });*/

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
                  <a style="padding:10px; background-color: orange; color:#111827; text-decoration:none;" href="${process.env.URL_FRONT}/get_my_rrpp_events/${mail}">Crear mi link de pago</a>
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


export const getRRPPInfoController = async (req,res) => {
    const {mail} = req.params
    const rrppData = await ticketModel.find({"rrpp.mail": mail})
    res.send(rrppData)
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
  } catch (err) {
    console.error('❌ Error al enviar el email:', err);
    throw err;
  }
};


export const getInfoQrController = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { eventId, ticketId } = decoded;

    const event = await ticketModel.findById(eventId, {
      tickets: 1,
      cortesiaRRPP: 1,
      nombreEvento: 1,
      fechaInicio: 1,
      fechaFin: 1,
      imgEvento: 1,
      localidad: 1,
      direccion: 1,
      eventoEdad: 1
    });

    if (!event) return res.status(404).json({ error: 1 });

    const ticketbyId = event.tickets.find(t => t._id.equals(ticketId));
    const cortesia = event.cortesiaRRPP.find(c => c._id.equals(ticketId));

    // Validar existencia
    const entrada = ticketbyId || cortesia;
    const tipo = ticketbyId ? 'Ticket' : cortesia ? 'Cortesia' : null;

    if (!entrada) return res.status(404).json({ error: 1 });

    const tokenValidation = await tokenModel.findOne({ token });
    console.log('token Validation: ', tokenValidation)

    if (!tokenValidation) return res.json({ error: 1 });
    console.log(event)
    if (tokenValidation.used) {
       return res.status(200).json({ error: 1 });
    }else{
      tokenValidation.used = true;
      await tokenValidation.save();
  
      // Validación de fecha de cierre
      if (!entrada.fechaDeCierre || new Date() > entrada.fechaDeCierre) {
        return res.status(400).json({ error: 1 });
      }
  
      return res.status(200).json({
        tipo,
        nombreEvento: event.nombreEvento,
        nombreTicket: entrada.nombreTicket,
        direccion: event.direccion,
        localidad: event.localidad,
        eventoEdad: event.eventoEdad,
        fechaInicioEvento: event.fechaInicio,
        fechaCierreEvento: event.fechaFin,
        fechaDeCierreTicket: entrada.fechaDeCierre,
        imgEvento: event.imgEvento,
      });
    }
    

  } catch (err) {
    console.error('❌ Error en getInfoQrController:', err);
    return res.status(401).json({ error: 1 });
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
          'rrpp.$.linkDePago': `${process.env.URL_FRONT}/buy_tickets/${prodId}/${emailHash}`
        }
      }
    )
   return res.json({message: `${process.env.URL_FRONT}/buy_tickets/${prodId}/${emailHash}`}).status(200)
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

export const verTokensController = async (req , res) => {
  const response = await tokenModel.find()
  res.send(response)
}

export const descargarCompradoresController = async (req, res) => {
  const {prodId} = req.body

  const event = await ticketModel.findOne({_id: prodId})

   if(!event){
    return res.status(404).send("No se encontro ningun evento")
  }

  const transaction = await transactionModel.findOne({prodId: prodId})

  if(!transaction){
    return res.status(404).send("No se encontro ninguna transacción")
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Compradores')

  worksheet.columns = [
    {header: 'Nombre completo', key: 'nombre', width:30},
    {header: 'Email', key: 'email', width: 30}
  ]

  transaction.compradores.forEach(comprador => {
    worksheet.addRow({
      nombre:comprador.nombre,
      email:comprador.email
    })
  })

   const nombreLimpio = event.nombreEvento.replace(/[^a-zA-Z0-9]/g, '_');
   const nombreArchivo = `compradores_${nombreLimpio}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);

    
  await workbook.xlsx.write(res);
  res.end()
}

export const refundsFunc = async ({prodId}) => {
  
try{
  await ticketModel.updateOne(
    {_id: prodId},
    {
      $set:{
        active: false
      }
    }
  )
  const getPaymentsIds = await transactionModel.findOne({prodId: prodId})
  if (!getPaymentsIds) {
    return { success: true, fallidos: [] }; 
  }
  const refundPromises = getPaymentsIds.compradores?.map((pays) => {
      const idempotencyKey = `refund-${uuidv4()}`;
      return axios.post(`https://api.mercadopago.com/v1/payments/${pays.transaccionId}/refunds`, 
        {"amount": pays.montoPagado},
        {
          headers:{
            Authorization:`Bearer ${process.env.MP_ACCESS_TOKEN_PROD}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey
          }
        }
      )
    }
  )
  const results = await Promise.allSettled(refundPromises);

  results.forEach((r, i) => {
    getPaymentsIds.compradores[i].reembolsado = r.status === 'fulfilled';
  });

  await getPaymentsIds.save();

  // Ver resultados
  const fallidos = results.filter(r => r.status === 'rejected');
  if (fallidos.length > 0) {
    console.warn('Algunos reembolsos fallaron:', fallidos);
  }
  //await transactionModel.deleteOne({prodId: prodId})
  return { success: true, fallidos };
}catch(err){
  console.log(err)
  return { success: false, fallidos: [] };
}
}

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
    });

    return res.status(200).json({ relacionados: eventosRelacionados });

  } catch (error) {
    console.error('Error al obtener eventos relacionados:', error);
    return res.status(500).json({ msg: 'Error del servidor' });
  }
};

export const cancelarEventoController = async (req, res) => {
  const {prodId} = req.body;
   const { success, fallidos } = await refundsFunc({prodId})
  /*const result = await refundQueue.add('reembolsar-pago', 
    {prodId},
    {
    attempts: 3, // Reintentar 3 veces si falla
    backoff: {
      type: 'exponential', // o 'fixed'
      delay: 5000 // 5 segundos de espera antes de reintentar
    },
      removeOnComplete: true, // limpia el job si se completó
      removeOnFail: false // puedes dejarlo en false para revisar errores
    }
  )*/

  if (success) {
    return res.status(200).json({
      message: 'Reembolsos procesados',
      fallidos: fallidos.length,
      detalles: fallidos.map(f => f.reason?.response?.data || f.reason), // opcional
    });
  }

  return res.status(500).json({
    message: 'Fallo el reembolso',
    fallidos: fallidos.length,
  });
}

export const reactivarEventoController = async (req, res) => {
  const {prodId} = req.body;
  await ticketModel.updateOne(
    {_id: prodId},
    {
      $set:{
        active: true
      }
    }
  )

  return res.status(200).json({message: 'Evento reactivado'})
}

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

export const activeDiscountController = async (req, res) => {
  const {prodId, discountCode} = req.body
 
    const discount = await discountModel.findOneAndUpdate(
      {
        discountCode,
        cantidadDescuentos: { $gt: 0 }
      },
      {
        $inc: { cantidadDescuentos: -1 }
      },
      {
        new: true
      }
    );

    if(!discount){
      return res.status(200).json({message: 'No hay mas descuentos disponibles' })
    }

    if(discount.cantidadDescuentos <= 0){
      await discountModel.deleteOne({discountCode: discount.discountCode})
    }

    return res.status(200).json({message:'Se aplico el descuento correctamente', discount})
}