import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
    eventId: {type: String},
    nombreCompleto: {type: String},
    email: {type: String},
    dni:{type: Number},
    telefono: {type: Number},
    cantidadEntradas:{type: Number},
    fechaCompra: {type: Date, default: Date.now()}
})

const purchaseModel = mongoose.model('purchaseModel', purchaseSchema)

export default purchaseModel