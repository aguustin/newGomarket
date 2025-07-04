import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    imagenProductora: {type: String},
    nombreCompleto: {type: String},
    mail: {type: String},
    celular: {type: Number},
    pais: {type: String},
    contrasenia: {type: String},
    misTickets:[{
        categoriaId: {type: String}
    }],
    redes:[{
        instagram:{type: String},
        facebook:{type: String},
        whatsapp:{type: Number}
    }]
})

const userModel = mongoose.model('userModel', userSchema) 

export default userModel