import mongoose from "mongoose";
import { type } from "os";

const userSchema = new mongoose.Schema({
    imagenProductora: {type: String},
    nombreProductora: {type: String},
    nombreCompleto: {type: String},
    mail: {type: String},
    mailProductora:{type: String},
    telefono:{type: Number},
    telefonoProductora:{type: Number},
    dni: {type: Number},
    cuit:{type: Number},
    domicilio:{type: Number},
    pais: {type: String},
    paisProductora:{type:String},
    contrasenia: {type: String},
    rol: {type: Number},
    razonSocial: {type: String},
    cuitProductora:{type: Number},
    domicilioProductora:{type: String},
    dniRepresentante:{type: Number},
    nombreBanco:{type: String},
    numeroCuenta:{type: Number},
    cbu:{type: Number},
    cbuProductora:{type: Number},
    alias: {type: String},
    aliasProductora: {type: String},
    codigoInternacional:{type: String},
    nombreTitular:{type: String},
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