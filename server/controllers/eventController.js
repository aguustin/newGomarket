import mongoose from "mongoose";
import cloudinary from "../middleware/cloudinary.js";
import ticketModel from "../models/ticketsModel.js";
import mercadopago from "../lib/mercadopago.js";
import QRCode from 'qrcode';
import nodemailer from 'nodemailer'; 
import dotenv from 'dotenv';
import { user_mail, pass } from "../config.js";
dotenv.config();

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
    const {prodId, nombreTicket, descripcionTicket, precio, cantidad, fechaDeCierre, visibilidad} = req.body

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
    const {ticketId, nombreTicket, descripcionTicket, precio, fechaDeCierre, visibilidad} = req.body

    console.log(ticketId)

    const updateFields = { 
        nombreTicket, 
        descripcionTicket, 
        precio,
        fechaDeCierre,
        visibilidad
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
  console.log(quantities)
  //qrGeneratorController(quantities, mail) esto va en el webhook creo
  try {
    const preference = {
      items: [
        {
          title: `Ticket para ${nombreEvento}`,
          quantity: 1,
          unit_price: 1/*total*/,
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

      //notification_url: 'https://d775-200-32-101-183.ngrok-free.app/webhook/mercadopago',anterior funciona sin los parametros.
    };

    const response = await mercadopago.preferences.create(preference);

    if(response.body && response.body.init_point){
        qrGeneratorController(quantities, mail)
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
  const { quantities, mail } = req.params;

  try {
    const paymentId = req.query['data.id'];

    if (!paymentId) {
      return res.sendStatus(400);
    }

    const payment = await mercadopago.payment.findById(paymentId);

    console.log('Estado del pago:', payment.body.status);

    if (payment.body.status === 'approved') {
        qrGeneratorController(quantities, mail)
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error en webhook:', error);
    res.sendStatus(500);
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

    // Generar un QR por cada unidad de cada ticket comprado
    for (const ticket of filteredTickets) {
      const quantity = quantities[ticket._id.toString()];
      for (let i = 0; i < quantity; i++) {
        const qrUrl = `http://localhost:5173/ticket/${event._id}/${ticket._id}`;
        const qrImage = await QRCode.toDataURL(qrUrl);
        const qrBase64 = qrImage.split(',')[1];
        const qrBuffer = Buffer.from(qrBase64, 'base64');
        // Aquí puedes enviar por email el QR con `qrImage`
        await sendQrEmail(mail, qrBuffer, ticket.nombreTicket, event.nombreEvento);
      }
    }
    console.log("QRs generados y enviados.");
  } catch (err) {
    console.error("Error generando QRs: ", err);
  }
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
    const { eventId, ticketId } = req.params;
    
    const event = await ticketModel.findOne(
      { _id: eventId, 'tickets._id': ticketId },
      { 'tickets.$': 1, nombreEvento: 1, imgEvento: 1 }
    );
    
    if (!event) return res.status(404).json({ message: 'No encontrado' });
    
    const ticket = event.tickets[0];
    
    res.status(200).json({
      nombreEvento: event.nombreEvento,
      imgEvento: event.imgEvento,
      nombreTicket: ticket.nombreTicket,
    });

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