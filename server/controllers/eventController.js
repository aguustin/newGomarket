import mongoose from "mongoose";
import cloudinary from "../middleware/cloudinary.js";
import ticketModel from "../models/ticketsModel.js";

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
    const {eventId, nombreTicket, descripcionTicket, precio, cantidad, fechaDeCierre} = req.body

        if(!req.file){
                await ticketModel.updateOne(
            {_id: eventId},
            {
                $addToSet:{
                    tickets:{
                        nombreTicket: nombreTicket,
                        descripcionTicket: descripcionTicket,
                        precio: precio,
                        cantidad: cantidad,
                        fechaDeCierre: fechaDeCierre,
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
            {_id: eventId},
            {
                $addToSet:{
                    tickets:{
                        nombreTicket: nombreTicket,
                        descripcionTicket: descripcionTicket,
                        precio: precio,
                        cantidad: cantidad,
                        fechaDeCierre: fechaDeCierre,
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
    const {ticketId, nombreTicket, descripcionTicket, precio, visibilidad} = req.body
    console.log(ticketId)
    const updateFields = { 
        nombreTicket, 
        descripcionTicket, 
        precio,
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
                        "tickets.$.visibilidad": updateFields.visibilidad
                } 
            }
        );
        res.send(200)
    }

}