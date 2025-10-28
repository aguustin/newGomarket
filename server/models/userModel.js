import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    imagenProductora: {type: String},
    nombreCompleto: {type: String},
    dni: {type: Number},
    domicilio:{type: String},
    cuit:{type: Number},
    mail: {type: String},
    telefono:{type: Number},
    pais: {type: String},
    cbu:{type: Number},
    alias: {type: String},
    nombreTitular:{type: String},
    nombreProductora: {type: String},
    dniRepresentante:{type: Number},
    domicilioProductora:{type: String},
    mailProductora:{type: String},
    cuitProductora:{type: Number},
    telefonoProductora:{type: Number},
    paisProductora:{type:String},
    cbuProductora:{type: Number},
    aliasProductora: {type: String},
    nombreTitularProductora:{type: String},
    razonSocial: {type: String},
    numeroCuenta:{type: Number},
    nombreBanco:{type: String},
    contrasenia: {type: String},
    codigoInternacional:{type: String},
    rol: {type: Number},
    misTickets:[{
        categoriaId: {type: String}
    }],
    cortesias:[{
        cortesiaId:{type:String},
        qty:{type:Number}
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