import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
    prodId: {type: String},
    nombreCompleto: {type: String},
    email: {type: String},
    dni:{type: Number},
    telefono: {type: Number},
    fechaCompra: {type: Date, default: Date.now()},
    reembolsado: {type: Boolean, default: false}   //el evento se cancelo y se devolvio el pago
})

const purchaseModel = mongoose.model('purchaseModel', purchaseSchema)

export default purchaseModel