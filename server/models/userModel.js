import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    imagenProductora: {type: String},
    nombreProductora: {type: String},
    nombreCompleto: {type: String},
    mail: {type: String},
    telefono:{type: Number},
    dni: {type: Number},
    cuit:{type: Number},
    domicilio:{type: Number},
    pais: {type: String},
    contrasenia: {type: String},
    rol: {type: Number},
    razonSocial: {type: String},
    cuitEmpresa:{type: Number},
    domicilioEmpresa:{type: String},
    nombreRepresentante:{type: String},
    dniRepresentante:{type: Number},
    nombreBanco:{type: String},
    numeroCuenta:{type: Number},
    cbu:{type: String},
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