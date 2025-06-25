import mongoose from "mongoose";
import cloudinary from "../middleware/cloudinary.js";
import ticketModel from "../models/ticketsModel.js";
import mercadopago from "../lib/mercadopago.js";
import QRCode from 'qrcode';
import nodemailer from 'nodemailer'; 
import dotenv from 'dotenv';
import { user_mail, pass } from "../config.js";
import jwt from 'jsonwebtoken';
import userModel from "../models/userModel.js";
import crypto from "crypto"

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'kidjaskdhajsdbjadlfgkjmlkjbnsdlfgnsñlknamnczmjcf'
const SECRET_MAIL_KEY = process.env.SECRET_MAIL_KEY || 'mjac32nk12n3123ja7das2'
const IV_LENGTH = 16

export const getAllEventsController = async (req, res) => {  //OBTENER TODOS LOS EVENTOS
    const getEvents = await ticketModel.find({})
    res.send(getEvents)
}

export const createEventController = async (req, res) => {  //CREATE EVENTO
    const {userId, paisDestino, tipoEvento, eventoEdad, nombreEvento, descripcionEvento, categorias, artistas, montoVentas, fechaInicio, fechaFin, provincia, localidad, direccion, lugarEvento, linkEvento} = req.body
      console.log(req.body)
    if(!req.file){   //CREA EL EVENTO CON UNA IMAGEN POR DEFECTO SI NO HAY UNA IMAGEN SUBIDA
            const createdEvent = await ticketModel.create({
                    userId: userId,
                    paisDestino: paisDestino,
                    tipoEvento: tipoEvento,
                    eventoEdad: eventoEdad,
                    nombreEvento: nombreEvento,
                    descripcionEvento: descripcionEvento,
                    categorias: categorias,
                    artistas: artistas,
                    montoVentas: montoVentas,
                    fechaInicio: new Date(), //fechaInicio
                    fechaFin: new Date(), //fechaFin
                    provincia: provincia,
                    localidad: localidad,
                    direccion: direccion,
                    lugarEvento: lugarEvento,
                    linkEvento: linkEvento,
                    imgEvento: 'https://res.cloudinary.com/drmcrdf4r/image/upload/v1747162121/eventsGoTicket/test_cf2nd9.jpg',
                    totalVentas: 0,
                    totalDevoluciones:0,
                    totalMontoVendido: 0,
                    totalMontoDevoluciones:0,
                    totalMontoDescuento:0,
                    montoTotal: 0
                })
            return res.status(200).json({ url: 'https://res.cloudinary.com/drmcrdf4r/image/upload/v1747162121/eventsGoTicket/test_cf2nd9.jpg', estado: 1, eventId: createdEvent._id  });
    }

    cloudinary.uploader.upload_stream({ resource_type: 'auto', folder:'eventsGoTicket' }, async (error, result) => {
        if (error) {
            console.log(error);
            return res.status(204).json({ error: 'Error uploading to Cloudinary' });
        }
           const createdEvent = await ticketModel.create({   //SE CREA EL EVENTO SI HAY UNA IMAGEN SUBIDA
                userId: userId,
                paisDestino: paisDestino,
                tipoEvento: tipoEvento,
                eventoEdad: eventoEdad,
                nombreEvento: nombreEvento,
                descripcionEvento: descripcionEvento,
                categorias: categorias,
                artistas: artistas,
                montoVentas: montoVentas,
                fechaInicio: new Date(), //fechaInicio
                fechaFin: new Date(), //fechaFin
                provincia: provincia,
                localidad: localidad,
                direccion: direccion,
                lugarEvento: lugarEvento,
                linkEvento: linkEvento,
                imgEvento:  result.secure_url,
                totalVentas: 0,
                totalDevoluciones:0,
                totalMontoVendido: 0,
                totalMontoDevoluciones:0,
                totalMontoDescuento:0,
                montoTotal: 0
            })
        return res.status(200).json({ url: result.secure_url, estado: 1, eventId: createdEvent._id  });
    }).end(req.file.buffer); 
   
};

export const createEventTicketsController = async (req, res) => {  //CREA TICKETS DEL EVENTO
  const {prodId, nombreTicket, descripcionTicket, precio, cantidad, fechaDeCierre, visibilidad, estado} = req.body
  const defaultImage = 'https://res.cloudinary.com/drmcrdf4r/image/upload/v1747162121/eventsGoTicket/test_cf2nd9.jpg';
  let fechaParsed = new Date(fechaDeCierre);
  let estadoToInt = Number(estado)
  const buildPayload = (imgUrl) => {
    if (estadoToInt !== 3) {  // SI EL ESTADO ES DIFERENTE DE 3 (DE CORTESIA) SE LE AGREGA EL ESTADO PARA DIFERENCIAR LOS TICKETS NORMALES A LOS DE CORTESIA
      return {
        tickets: {
          nombreTicket,
          descripcionTicket,
          precio,
          cantidad,
          fechaDeCierre: fechaParsed,
          visibilidad,
          estadoToInt,
          imgTicket: imgUrl
        }
      };
    } else {  
      return {  //SE CREA EL TICKET DE CORTESIA (SIN PRECIO)
        cortesiaRRPP: {
          nombreTicket,
          descripcionTicket,
          cantidadDeCortesias: cantidad,
          entregados: 0,
          fechaDeCierre: fechaParsed,
          imgTicket: imgUrl
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
    
    console.log(updatePayload)
    return res.status(200).json({ url: defaultImage, estado: 1 });
  }

  
  // Si hay archivo, subimos a Cloudinary
  cloudinary.uploader.upload_stream(
    { resource_type: 'auto', folder: 'GoTicketsT' },
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
    const {prodId} = req.params
    const getProd = await ticketModel.find({_id: prodId})
    
    res.send(getProd)
}


export const updateEventController = async (req, res) => {  //ACTUALIZA LA INFO DEL EVENTO
    const { eventId, nombreEvento, descripcionEvento, eventoEdad, categorias, artistas, montoVentas, fechaInicio, fechaFin, provincia, localidad, direccion, lugarEvento} = req.body;

    // Construir los campos que siempre se actualizan
    const updateFields = { nombreEvento, descripcionEvento, eventoEdad, categorias, artistas, montoVentas, fechaInicio, fechaFin, provincia, localidad, direccion, lugarEvento};

    if (req.file) {      //SE ACTUALIZAN LOS DATOS CON UNA IMAGEN NUEVA
    cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'eventsGoTicket' },
        async (error, result) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error uploading to Cloudinary' });
        }

        // Agregar la URL de la imagen subida
        updateFields.imgEvento = result.secure_url;

        const updateResult = await ticketModel.updateOne(
            { _id: eventId },
            { $set: updateFields }
        );

        return res.status(200).json({ url: result.secure_url, updated: updateResult.modifiedCount > 0 });
        }
    ).end(req.file.buffer);
    } else {  //SE ACTUALIZA LA INFO SIN IMAGEN NUEVA
        const updateResult = await ticketModel.updateOne(
            { _id: eventId },
            { $set: updateFields }
        );

        if (updateResult.modifiedCount > 0) {
            return res.status(200).json(1);
        } else {
            return res.status(204).json(2); // No se modificó ningún documento
        }
    }
}

export const updateEventTicketsController = async (req, res) => {   //SE ACTUALIZAN LOS TICKETS DEL EVENTO
  const {
    ticketId,
    nombreTicket,
    descripcionTicket,
    precio,
    cantidad,
    fechaDeCierre,
    visibilidad,
    estado
  } = req.body;
  
let estadoInt = Number(estado)     
const parseId = new mongoose.Types.ObjectId(ticketId);

// Construye campos comunes para actualización
const buildUpdateFields = (imgUrl = null) => {
  const commonFields = {
    nombreTicket,
    descripcionTicket,
    fechaDeCierre,
    visibilidad,
  };

  if (imgUrl) {
    commonFields.imgTicket = imgUrl;
  }

  if (estadoInt !== 3) {  
    commonFields.precio = precio;
  }

  return commonFields;
};

// Actualiza el ticket correspondiente
const updateTicket = async (imgUrl = null) => {
  const updateFields = buildUpdateFields(imgUrl);
  const pathPrefix = estadoInt === 3 ? "cortesiaRRPP" : "tickets";
  const cantidadField = estadoInt === 3 ? "cantidadDeCortesias" : "cantidad";

  const updateResult = await ticketModel.updateOne(
    { [`${pathPrefix}._id`]: parseId },
    {
      $set: Object.fromEntries(
        Object.entries(updateFields).map(([key, value]) => [
          `${pathPrefix}.$.${key}`,
          value
        ])
      ),
      $set: { [`${pathPrefix}.$.${cantidadField}`]: cantidad }
    }
  );

  return updateResult;
};

// Si hay imagen, sube a Cloudinary
if (req.file) {
  cloudinary.uploader.upload_stream(
    { resource_type: 'auto', folder: 'GoTicketsT' },
    async (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error uploading to Cloudinary' });
      }

      const updateResult = await updateTicket(result.secure_url);
      return res.status(200).json({
        url: result.secure_url,
        updated: updateResult.modifiedCount > 0
      });
    }
  ).end(req.file.buffer);
} else {
  // Sin imagen
  const updateResult = await updateTicket();
  return res.status(200).json({
    updated: updateResult.modifiedCount > 0
  });
}
}

export const getEventToBuyController = async (req, res) => {
    const {prodId} = req.params
    console.log(prodId)
    const getProd = await ticketModel.find({_id: prodId})
    
    res.send(getProd)
}

export const handleSuccessfulPayment = async ({ prodId, nombreEvento, quantities, mail, state, total, emailHash }) => {
  //await qrGeneratorController(prodId, quantities, mail, state);

const updateRRPP = await ticketModel.find({ _id: prodId, 'rrpp.linkHash': emailHash });
const rrppMatch = updateRRPP[0]?.rrpp.find(r => r.linkHash === emailHash);
if (!rrppMatch) throw new Error("RRPP no encontrado");

const getDecryptedMail = decrypt(rrppMatch.linkDePago);

const doc = await ticketModel.findOne({ "rrpp.mail": getDecryptedMail });
if (!doc) throw new Error("Documento no encontrado");

const rrpp = doc.rrpp.find(r => r.mail === getDecryptedMail);
const existingTicketIds = rrpp?.ventasRRPP.map(v => v.ticketId) || [];

const ticketIds = Object.keys(quantities).map(id => new mongoose.Types.ObjectId(id));
const tickets = doc.tickets.filter(t => ticketIds.some(id => id.equals(t._id)));

const ventasTotales = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
const sumaTotal = tickets.reduce((acc, ticket) => {
  const ticketId = ticket._id.toString();
  const vendidos = quantities[ticketId];
  return acc + vendidos * ticket.precio;
}, 0);

// Actualiza tickets
const bulkOps = Object.entries(quantities).map(([id, quantity]) => ({
  updateOne: {
    filter: { "tickets._id": new mongoose.Types.ObjectId(id) },
    update: {
      $inc: {
        "tickets.$.ventas": quantity,
        "tickets.$.cantidad": -quantity,
      },
    },
  },
}));

// Actualiza RRPP
const bulkOpsRRPP = tickets.map(ticket => {
  const ticketId = ticket._id.toString();
  const vendidos = quantities[ticketId];
  const total = vendidos * ticket.precio;
  const nombreCategoria = ticket.nombreTicket;
  const alreadyExists = existingTicketIds.includes(ticketId);

  if (alreadyExists) {
    return {
      updateOne: {
        filter: {
          "rrpp.mail": getDecryptedMail,
          "rrpp.ventasRRPP.ticketId": ticketId,
        },
        update: {
          $inc: {
            "rrpp.$[rrppElem].ventasRRPP.$[ventaElem].vendidos": vendidos,
            "rrpp.$[rrppElem].ventasRRPP.$[ventaElem].total": total
          },
        },
        arrayFilters: [
          { "rrppElem.mail": getDecryptedMail },
          { "ventaElem.ticketId": ticketId },
        ],
      }
    };
  } else {
    return {
      updateOne: {
        filter: { "rrpp.mail": getDecryptedMail },
        update: {
          $push: {
            "rrpp.$[rrppElem].ventasRRPP": {
              ticketId,
              nombreCategoria,
              vendidos,
              total
            }
          }
        },
        arrayFilters: [
          { "rrppElem.mail": getDecryptedMail },
        ],
      }
    };
  }
});

// Sumar montoTotalVendidoRRPP
bulkOpsRRPP.push({
  updateOne: {
    filter: { "rrpp.mail": getDecryptedMail },
    update: {
      $inc: {
        "rrpp.$[rrppElem].montoTotalVendidoRRPP": sumaTotal
      }
    },
    arrayFilters: [
      { "rrppElem.mail": getDecryptedMail }
    ]
  }
});

// Ejecutar operaciones
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
  ticketModel.bulkWrite([...bulkOps, ...bulkOpsRRPP])
]);
};

export const buyEventTicketsController = async (req, res) => {
  const { prodId, nombreEvento, quantities, mail, state, total, emailHash } = req.body;  //guardar el mail del rrpp tambien encriptandolo con un jwt
 // qrGeneratorController(quantities, mail) //esto va en el webhook creo

  if(state === 3){
      qrGeneratorController(prodId, quantities, mail, state)
      return res.status(200).json({msg: "entro aca en 3"})
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
        email: mail,
      },
      back_urls: {
        success: 'https://d775-200-32-101-183.ngrok-free.app/payment-success',
        failure: 'https://d775-200-32-101-183.ngrok-free.app/payment-failure',
        pending: 'https://d775-200-32-101-183.ngrok-free.app/payment-pending',
      },
      auto_return: 'approved',
      //notification_url: 'https://d775-200-32-101-183.ngrok-free.app/webhook/mercadopago',  esto descomentarlo 
      metadata: {
            prodId,
            nombreEvento,
            quantities,
            mail,
            state,
            total
      },
    };
    const response = await mercadopago.preferences.create(preference);

    if(response.body && response.body.init_point){
      
      await handleSuccessfulPayment({ prodId, nombreEvento, quantities, mail, state, total, emailHash }) //esto luego hay que quitarlo
        res.json({
            id: response.body.id,
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
    const paymentId = req.body?.data?.id;

    if (!paymentId) {
      console.error("❌ No payment ID found");
      return res.sendStatus(400);
    }

    const payment = await mercadopago.payment.findById(paymentId);
    const status = payment.body?.status;

    if (status === 'approved') {
      const { prodId, nombreEvento, quantities, mail, state, total } = payment.body.metadata;

      if (!quantities || !mail || !prodId || !total) {
        console.error("❌ Metadata incompleta:", payment.body.metadata);
        return res.sendStatus(500);
      }

      await handleSuccessfulPayment({ prodId, nombreEvento, quantities, mail, state, total });
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error en webhook:', error.message);
    return res.sendStatus(400);
  }
};

export const qrGeneratorController = async (prodId, quantities, mail, state) => {
  if(state === 3){                                                        //si estado = 3 resta la cantidad de cortesias que puede enviar el rrpp
    const bulkOps = Object.entries(quantities).filter(([_, quantity]) => quantity > 0).map(([ticketId, quantity]) => ({
      updateOne: {
        filter: {
          "rrpp.mail": mail,
          "rrpp.ticketsCortesias.ticketIdCortesia": ticketId
        },
        update: {
          $inc: {
            "rrpp.$[rrppElem].ticketsCortesias.$[ticketElem].cantidadDeCortesias": -quantity
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
   
    const eventCourtesy = await ticketModel.find({
      "cortesiaRRPP._id": { $in: ticketIds }
    });
    
    if (!event || !eventCourtesy) return console.log("Evento no encontrado.");

    const filteredTickets = event.tickets.filter(ticket =>
    ticketIds.some(id => id.equals(ticket._id))
    );

  const qrTasks = [];

    for (const ticket of filteredTickets) {
      const quantity = quantities[ticket._id.toString()];
      for (let i = 0; i < quantity; i++) {
        const payload = {
          eventId: event._id,
          ticketId: ticket._id,
          iat: Math.floor(Date.now() / 1000),
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        const qrUrl = `http://localhost:5173/ticket/validate?token=${token}`;

        // ⏱️ Agregamos la tarea (no await todavía)
        qrTasks.push(
          QRCode.toDataURL(qrUrl)
            .then(qrImage => {
              const qrBase64 = qrImage.split(',')[1];
              const qrBuffer = Buffer.from(qrBase64, 'base64');
              return sendQrEmail(mail, qrBuffer, ticket.nombreTicket, event.nombreEvento, state);
            })
        );
      }
    }

// ⚡ Esperá todas las tareas en paralelo
await Promise.all(qrTasks);
    console.log("QRs generados y enviados.");
  } catch (err) {
    console.error("Error generando QRs: ", err);
  }
};

export const sendQrStaffQrController = async (req, res) => {
  /*await ticketModel.updateMany(
  {},                      // sin filtro: aplica a todos los documentos
  { $set: { rrpp: [] } }   // limpia el array
);*/
  const {prodId, quantities, mail} = req.body
  console.log(prodId, quantities, mail)
  const ticketIds = Object.keys(quantities);
  const findRrPp = await ticketModel.findOne({_id: prodId, "rrpp.mail": mail})
  let i = 0
    for (const id of ticketIds) {
        const verifyQuantity = await ticketModel.find({_id: prodId, "cortesiaRRPP._id": id })
        
        if(verifyQuantity[0]?.cortesiaRRPP[i]?.cantidadDeCortesias > 0){
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
          }
          i++
    }

    if (findRrPp) {
  // RRPP exists
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

    // Si no se actualizó (porque el ticket no existía), lo insertamos
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
  // RRPP no existe - lo creamos
  await ticketModel.updateOne(
    {
      _id: prodId,
      'rrpp.mail': { $ne: mail }
    },
    {
      $addToSet: {
        rrpp: {
          nombre: "aguss",
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

const sendQrEmail = async (email, qrBuffer, nombreTicket, nombreEvento, state) => {
  
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: user_mail,
      pass: pass
    }
  });
    await transporter.sendMail({
    from: '"GoTickets" <no-reply@gotickets.com>',
    to: email,
    subject: `Tu entrada para ${nombreEvento} - ${nombreTicket}`,
    html: `
        <h3>Gracias por tu compra</h3>
        <p>Entrada: <strong>${nombreTicket}</strong> ${state === 3 ? 'Cortesia' : ''} </p>
        <p>Escaneá este QR en la entrada:</p>
        <img src="cid:qrcodeimg" alt="QR para ${nombreTicket}" style="width:200px;height:200px;"/>
    `,
    attachments: [
        {
        filename: 'qrcode.png',
        content: qrBuffer,         
        cid: 'qrcodeimg'      
        }
    ]
    });
};

export const getInfoQrController = async (req, res) => {
    const { token } = req.query;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { eventId, ticketId } = decoded;

    const event = await ticketModel.findOne(
      { _id: eventId, 'tickets._id': ticketId },
      { 'tickets.$': 1, nombreEvento: 1, fechaInicio: 1, fechaFin: 1, imgEvento: 1 }
    );

    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });

    const ticket = event.tickets[0];

    if (!ticket || !ticket.isActive || new Date() > ticket.fechaDeCierre) {
      return res.status(400).json({ message: 'Ticket caducado o inactivo' });
    }

    return res.json({
      nombreEvento: event.nombreEvento,
      nombreTicket: ticket.nombreTicket,
      fechaInicioEvento: event.fechaInicio,
      fechaCierreEvento: event.fechaFin,
      fechaDeCierreTicket: ticket.fechaDeCierre,
      imgEvento: event.imgEvento,
    });
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

export function encrypt(rrppMail) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash('sha256').update(process.env.SECRET_MAIL_KEY).digest(); // 🔐 32-byte key

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(rrppMail, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedMail) {
 const [ivHex, encrypted] = encryptedMail.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.createHash('sha256').update(process.env.SECRET_MAIL_KEY).digest(); // same 32-byte key

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export const hashForSearch = (encryptedMail) => {
  return crypto.createHash('sha256').update(encryptedMail).digest('hex');
}

export const generateMyRRPPLinkController = async (req, res) => {  //guardar en la bd linkDePago y linkHash (linkHash para buscarlo)
  const {prodId, rrppMail} = req.body
  const encryptedMail = encrypt(rrppMail)
  const emailHash = hashForSearch(rrppMail);
  console.log(encryptedMail, emailHash)

  const response = await ticketModel.findOne({_id: prodId, "rrpp.linkHash": emailHash})
  console.log(response)
  if(!response){
    await ticketModel.updateOne(
      {_id: prodId, "rrpp.mail": rrppMail},
      {
        $set:{
          'rrpp.$.linkDePago': encryptedMail,
          'rrpp.$.linkHash': emailHash
        }
      }
    )
   return res.json({message: `http://localhost:5173/buy_tickets/${prodId}/${emailHash}`}).status(200)
  }
  return res.json({message: 'Ya tienes tu link de pago'})
}

export const paymentSuccessController = async (req, res) => {
  /*const paymentId = req.query.payment_id;

  try {
    const payment = await mercadopago.payment.findById(paymentId);

    if (payment.body.status === 'approved') {
      // ✅ Confirmar pedido, mostrar gracias, etc.
      res.send('Pago aprobado con éxito');
    } else {
      res.send('Pago no aprobado');
    }
  } catch (error) {
    console.error('Error al verificar pago:', error);
    res.status(500).send('Error interno');
  }*/
};