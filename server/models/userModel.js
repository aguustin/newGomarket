import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    imagenProductora: {type: String},
    nombreCompleto: {type: String},
    dni: {type: Number},
    domicilio:{type: String},
    cuit:{type: Number},
    mail: {type: String},
    telefono:{type: String},
    pais: {type: String},
    cbu:{type: String},
    alias: {type: String},
    nombreTitular:{type: String},
    nombreProductora: {type: String},
    dniRepresentante:{type: Number},
    domicilioProductora:{type: String},
    mailProductora:{type: String},
    cuitProductora:{type: Number},
    telefonoProductora:{type: String},
    paisProductora:{type:String},
    cbuProductora:{type: String},
    aliasProductora: {type: String},
    nombreTitularProductora:{type: String},
    razonSocial: {type: String},
    numeroCuenta:{type: String},
    nombreBanco:{type: String},
    contrasenia: {type: String},
    codigoInternacional:{type: String},
    rol: {type: Number},
    descuento:{type: Number},
    comisionServicio:{type:Number},
    cortesias:[{
        cortesiaId:{type:String},
        qty:{type:Number}
    }],
    redes:[{
        instagram:{type: String},
        facebook:{type: String},
        whatsapp:{type: String}
    }],
    favorites:[{
        eventId:{type: String}
    }]
})

//Indices para las consultas frecuentes (etapa 13)
userSchema.index({ mail: 1 }, { unique: true, collation: { locale: 'en', strength: 2 }, partialFilterExpression: { mail: { $type: 'string' } } })

const userModel = mongoose.model('userModel', userSchema) 

export default userModel