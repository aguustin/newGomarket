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
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'kidjaskdhajsdbjadlfgkjmlkjbnsdlfgnsñlknamnczmjcf'

export const getAllEventsController = async (req, res) => {
    const getEvents = await ticketModel.find({})
    res.send(getEvents)
}

export const createEventController = async (req, res) => {
    const {userId, paisDestino, tipoEvento, eventoEdad, nombreEvento, descripcionEvento, categorias, artistas, montoVentas, fechaInicio, fechaFin, provincia, localidad, direccion, lugarEvento, linkEvento} = req.body
    if(!req.file){
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
                    imgEvento: 'https://res.cloudinary.com/drmcrdf4r/image/upload/v1747162121/eventsGoTicket/test_cf2nd9.jpg'
                })
            return res.status(200).json({ url: 'https://res.cloudinary.com/drmcrdf4r/image/upload/v1747162121/eventsGoTicket/test_cf2nd9.jpg', estado: 1, eventId: createdEvent._id  });
    }

    cloudinary.uploader.upload_stream({ resource_type: 'auto', folder:'eventsGoTicket' }, async (error, result) => {
        if (error) {
            console.log(error);
            return res.status(204).json({ error: 'Error uploading to Cloudinary' });
        }
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
                imgEvento:  result.secure_url
            })
        return res.status(200).json({ url: result.secure_url, estado: 1, eventId: createdEvent._id  });
    }).end(req.file.buffer); 
   
};

export const createEventTicketsController = async (req, res) => {
    const {prodId, nombreTicket, descripcionTicket, precio, cantidad, fechaDeCierre, visibilidad, estado} = req.body

        if(!req.file){
                await ticketModel.updateOne(
            {_id: prodId},
            {
                $addToSet:{
                    tickets:{
                        nombreTicket: nombreTicket,
                        descripcionTicket: descripcionTicket,
                        precio: precio,
                        cantidad: cantidad,
                        fechaDeCierre: fechaDeCierre,
                        visibilidad: visibilidad,
                        estado: estado,
                        imgTicket: 'https://res.cloudinary.com/drmcrdf4r/image/upload/v1747162121/eventsGoTicket/test_cf2nd9.jpg'
                    }
                }
            }
        )
            return res.status(200).json({ url: 'https://res.cloudinary.com/drmcrdf4r/image/upload/v1747162121/eventsGoTicket/test_cf2nd9.jpg', estado: 1 });
    }

    cloudinary.uploader.upload_stream({ resource_type: 'auto', folder:'GoTicketsT' }, async (error, result) => {
        if (error) {
            console.log(error);
            return res.status(204).json({ error: 'Error uploading to Cloudinary' });
        }
          
        await ticketModel.updateOne(
            {_id: prodId},
            {
                $addToSet:{
                    tickets:{
                        nombreTicket: nombreTicket,
                        descripcionTicket: descripcionTicket,
                        precio: precio,
                        cantidad: cantidad,
                        fechaDeCierre: fechaDeCierre,
                        visibilidad: visibilidad,
                        estado: estado,
                        imgTicket: result.secure_url
                    }
                }
            }
        )
        return res.status(200).json({ url: result.secure_url, estado: 1});
    }).end(req.file.buffer); 
}


export const getMyProdsController = async (req, res) => {
    const {userId} = req.params
    const findProds = await ticketModel.find({userId: userId})
    res.status(200).json(findProds)
}

export const getOneProdController = async (req, res) => {
    const {prodId} = req.params

    const getProd = await ticketModel.find({_id: prodId})
    
    res.send(getProd)
}


export const updateEventController = async (req, res) => {
    const { eventId, nombreEvento, descripcionEvento, eventoEdad, categorias, artistas, montoVentas, fechaInicio, fechaFin, provincia, localidad, direccion, lugarEvento} = req.body;

    // Construir los campos que siempre se actualizan
    const updateFields = { nombreEvento, descripcionEvento, eventoEdad, categorias, artistas, montoVentas, fechaInicio, fechaFin, provincia, localidad, direccion, lugarEvento
    };

    if (req.file) {
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
    } else {
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

export const updateEventTicketsController = async (req, res) => {
    const {ticketId, nombreTicket, descripcionTicket, precio, fechaDeCierre, visibilidad, estado} = req.body

    console.log(ticketId)

    const updateFields = { 
        nombreTicket, 
        descripcionTicket, 
        precio,
        fechaDeCierre,
        visibilidad,
        estado
    }

    const parseId = new mongoose.Types.ObjectId(ticketId)

    if(req.file){
        cloudinary.uploader.upload_stream({ resource_type: 'auto', folder: 'GoTicketsT' },
            async (error, result) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ error: 'Error uploading to Cloudinary' });
                }

            // Agregar la URL de la imagen subida
            updateFields.imgTicket = result.secure_url;

            const updateResult = await ticketModel.updateOne(
                { "tickets._id": parseId },
                {  
                    $set: {
                        "tickets.$.nombreTicket": updateFields.nombreTicket,
                        "tickets.$.descripcionTicket": updateFields.descripcionTicket,
                        "tickets.$.precio": updateFields.precio,
                        "tickets.$.fechaDeCierre":updateFields.fechaDeCierre,
                        "tickets.$.visibilidad": updateFields.visibilidad,
                        "tickets.$.imgTicket": updateFields.imgTicket
                    } 
                }
            );

            return res.status(200).json({ url: result.secure_url, updated: updateResult.modifiedCount > 0 });
            }
        ).end(req.file.buffer);
    }else{
        await ticketModel.updateOne(
            { "tickets._id": parseId },
            { 
                $set: {
                        "tickets.$.nombreTicket": updateFields.nombreTicket,
                        "tickets.$.descripcionTicket": updateFields.descripcionTicket,
                        "tickets.$.precio": updateFields.precio,
                        "tickets.$.fechaDeCierre":updateFields.fechaDeCierre,
                        "tickets.$.visibilidad": updateFields.visibilidad
                } 
            }
        );
        res.send(200)
    }

}

export const getEventToBuyController = async (req, res) => {
    const {prodId} = req.params

    const getProd = await ticketModel.find({_id: prodId})
    
    res.send(getProd)
}

export const buyEventTicketsController = async (req, res) => {
  const { eventId, nombreEvento, quantities, total, totalQuantity, mail } = req.body;
  //qrGeneratorController(quantities, mail) esto va en el webhook creo
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
  notification_url: 'https://d775-200-32-101-183.ngrok-free.app/webhook/mercadopago',
  metadata: {
        quantities,
        mail,
  },
};
    const response = await mercadopago.preferences.create(preference);

    if(response.body && response.body.init_point){
        qrGeneratorController(quantities, mail) // SOLO PARA PROBAR LA GENERACION DE LOS QR SIN TENER QUE PAGAR SI O SI EN MERCADOPAGO
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
    const paymentId = req.body?.data?.id; // ✅ Correct way to get payment ID

    if (!paymentId) {
      console.error("❌ No payment ID found in webhook payload:", req.body);
      return res.sendStatus(400);
    }

    const payment = await mercadopago.payment.findById(paymentId);

    console.log('✅ Estado del pago:', payment.body.status);

    if (payment.body.status === 'approved') {
      const { quantities, mail } = payment.body.metadata;
      const ticketIds = Object.keys(quantities);

      /*for (const id of ticketIds) {
        const quantityToAdd = quantities[id];

        await ticketModel.updateOne(
          { "tickets._id": new mongoose.Types.ObjectId(id) },
          {
            $inc: {
              "tickets.$.ventas": quantityToAdd,
              "tickets.$.cantidad": -quantityToAdd
            }
          }
        );
        
      }*/
        const bulkOps = Object.entries(quantities).map(([id, quantity]) => ({
          updateOne: {
            filter: { "tickets._id": new mongoose.Types.ObjectId(id) },
            update: {
              $inc: {
                "tickets.$.ventas": quantity,
                "tickets.$.cantidad": -quantity,
              }
            }
          }
        }));

        await ticketModel.bulkWrite(bulkOps);
      

      if (!quantities || !mail) {
        console.error("❌ Metadata is missing in approved payment:", payment.body.metadata);
        return res.sendStatus(500);
      }

      console.log("🎟️ Generating QR for:", mail, "with quantities:", quantities);
      await qrGeneratorController(quantities, mail);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error en webhook:', error?.message, error?.stack);
    res.sendStatus(400);
  }
};

export const qrGeneratorController = async (quantities, mail) => {
  try {
    const ticketIds = Object.keys(quantities).map(id => new mongoose.Types.ObjectId(id));

    const event = await ticketModel.findOne({
      "tickets._id": { $in: ticketIds }
    });

    if (!event) return console.log("Evento no encontrado.");

    const filteredTickets = event.tickets.filter(ticket =>
      ticketIds.some(id => id.equals(ticket._id))
    );

    for (const ticket of filteredTickets) {
      const quantity = quantities[ticket._id.toString()];
      for (let i = 0; i < quantity; i++) {
        // 🔐 Crear token seguro con payload
        const payload = {
          eventId: event._id,
          ticketId: ticket._id,
          iat: Math.floor(Date.now() / 1000),
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }); // expira en 7 días

        // URL del QR con el token
        const qrUrl = `http://localhost:5173/ticket/validate?token=${token}`;
        const qrImage = await QRCode.toDataURL(qrUrl);
        const qrBase64 = qrImage.split(',')[1];
        const qrBuffer = Buffer.from(qrBase64, 'base64');

        await sendQrEmail(mail, qrBuffer, ticket.nombreTicket, event.nombreEvento);
      }
    }
    console.log("QRs generados y enviados.");
  } catch (err) {
    console.error("Error generando QRs: ", err);
  }
};

export const sendQrStaffQrController = async (req, res) => {
  const {prodId, quantities, mail, addState} = req.body
  const findRrPp = await ticketModel.findOne({_id: prodId, "rrpp.mail": mail})
  const ticketIds = Object.keys(quantities);

  for (const id of ticketIds) {
        const quantityToAdd = quantities[id];
        await ticketModel.updateOne(
          { "tickets._id": new mongoose.Types.ObjectId(id) },
          {
            $inc: {
              "tickets.$.ventas": quantityToAdd,
              "tickets.$.cantidad": -quantityToAdd,
              
            }
          }
        );
  }

  const addStates = Object.keys(addState);

  if (findRrPp) {
    // RRPP exists - update existing categoriaRRPP
    if(state === 3){ 
      for (const id of ticketIds){
         /*cortesiaRRPP:[{
            cantidadDeCortesias: {type: Number},
            ticketId: {type: String},
            nombreCategoria:{type: String},
            entregados: {type: Number},
        }]*/

            await ticketModel.updateOne(
              {
                _id: prodId,
                "rrpp.mail": mail,
                 "rrpp.cortesiaRRPP.ticketId": { $ne: id }
              },
              {
                $addToSet:{
                  cantidadDeCortesias: quantityToAdd,
                  ticketId: id,
                  nombreCategoria: "nombreX",
                }
              }
            )
      }

      return res.send(200).json({msg: "llego en estado 3 a cortesia"})
    }

      for (const id of ticketIds /*addStates*/) {
        const quantityToAdd = quantities[id];
        const state = addState[id];
        
        await ticketModel.updateOne(
          {
            _id: prodId,
            "rrpp.mail": mail,
            "rrpp.categoriaRRPP.ticketId": { $ne: id } // Only add if ticketId not present
          },
          { 
            $addToSet: {
              "rrpp.$.categoriaRRPP": {
                ticketId: id,
                nombreCategoria: "NombreX", // Replace with actual category if needed
                cantidadDeTickets: quantityToAdd,
                estado: state
              }
            }
          }
        );
      }
  }else {
      // RRPP doesn't exist - add new rrpp entry
      const getUser = await userModel.findOne({_id: prodId})
  
      const categoriaRRPPArray = addStates.map(id => ({
        ticketId: id,
        //nombreCategoria: getUser.nombreCompleto, // Replace with actual category if needed
        cantidadDeTickets: quantities[id],
        vendidos: quantities[id]
      }));
  
      await ticketModel.updateOne(
        { _id: prodId },
        {
          $addToSet: {
            rrpp: {
              nombre: getUser.nombreCompleto, // Provide actual name if available
              mail: mail,
              linkDePago: "link de pago",
              categoriaRRPP: categoriaRRPPArray,
            }
          }
        }
      );
  }
  res.sendStatus(200)
};

const sendQrEmail = async (email, qrBuffer, nombreTicket, nombreEvento) => {
  
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
        <p>Entrada: <strong>${nombreTicket}</strong></p>
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
    const { eventId, ticketId,  } = decoded;

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