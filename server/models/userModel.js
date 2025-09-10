import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    imagenProductora: {type: String},
    nombreCompleto: {type: String},
    mail: {type: String},
    dni: {type: Number},
    pais: {type: String},
    contrasenia: {type: String},
    rol: {type: Number},
    misTickets:[{
        categoriaId: {type: String}
    }],
    cortesias:[{
        cortesiaId:{type:String},
        limit:{type:Number}
    }],
    redes:[{
        instagram:{type: String},
        facebook:{type: String},
        whatsapp:{type: Number}
    }],
    favorites:[{
        eventId:{type: String}
    }]
})

const userModel = mongoose.model('userModel', userSchema) 

export default userModel