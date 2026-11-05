import mongoose from "mongoose";

const cortesieSchema = mongoose.Schema({
    prodId:{type:String},
    userId:{type:String},
    eventName:{type:String},
    excelName:{type:String},
    fechaCreacion:{type:String},
    people:[{
        clientName:{type: String},
        email: {type:String},
        //Seguimiento del envio (etapa 13). Sin estado = nunca se intento enviar
        estado: {type: String, enum: [null, 'pendiente', 'enviado', 'error', 'cancelada'], default: null},
        intentos: {type: Number, default: 0},
        ultimoError: {type: String, default: null},
        enviandoDesde: {type: Date, default: null},
        enviadoEn: {type: Date, default: null},
        //El QR de la invitacion: se crea una sola vez, asi un reintento manda el mismo QR
        token: {type: String, default: null},
    }],
    courtesy:{type:Number},
}, { strict: true })

//Indices para las consultas frecuentes (etapa 13)
cortesieSchema.index({ prodId: 1, userId: 1 })
cortesieSchema.index({ 'people.estado': 1 })

const cortesieModel = mongoose.model("cortesieModel", cortesieSchema)

export default cortesieModel