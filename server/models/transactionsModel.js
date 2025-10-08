import mongoose from "mongoose";

const transactionModel = mongoose.Schema({
    prodId:{type:String},
    compradores:[{
        nombre:{type: String},
        apellido:{type: String},
        email:{type: String},
        montoPagado:{type: Number},
        transaccionId:{type: String, required: true},
        reembolsado: { type: Boolean, default: false },
        fecha: { type: Date, default: Date.now }
    }]
})

export default mongoose.model("transaccionModel", transactionModel)