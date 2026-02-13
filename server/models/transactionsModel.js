import mongoose from "mongoose";

const transactionModel = mongoose.Schema({
    prodId:{type:String},
    paymentId: { type: String, required: true, unique: true },
    transaccionId:{type: String, required: true},
    nombre:{type: String},
    apellido:{type: String},
    email:{type: String},
    montoPagado:{type: Number},
    reembolsado: { type: Boolean, default: false },
    fecha: { type: Date, default: Date.now }
})

export default mongoose.model("transaccionModel", transactionModel)