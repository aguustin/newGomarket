import mongoose from "mongoose";

const rrppExcelSchema = mongoose.Schema({
    prodId:{type:String},
    userId:{type:String},
    eventName:{type:String},
    excelName:{type:String},
    fechaCreacion:{type:String},
    rrppList:[{
        nombreRRPP:{type: String},
        email: {type:String},
        //Seguimiento del envio (etapa 13). Sin estado = nunca se intento enviar
        estado: {type: String, enum: [null, 'pendiente', 'enviado', 'error', 'cancelada'], default: null},
        intentos: {type: Number, default: 0},
        ultimoError: {type: String, default: null},
        enviandoDesde: {type: Date, default: null},
        enviadoEn: {type: Date, default: null},
    }],
    RRPPCount:{type:Number},
}, { strict: true })

//Indices para las consultas frecuentes (etapa 13)
rrppExcelSchema.index({ prodId: 1, userId: 1 })
rrppExcelSchema.index({ 'rrppList.estado': 1 })

const rrppExcelModel = mongoose.model("rrppExcelModel", rrppExcelSchema)

export default rrppExcelModel