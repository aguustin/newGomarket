import mongoose from "mongoose";

//Token de cada QR emitido (entradas y cortesias). Se valida en la puerta (lib/entradas.js)
const tokenModel = mongoose.Schema({
    token: {type: String, required: true, index: true},
    used: {type: Boolean, default: false},
    usedAt: {type: Date, default: null},    //cuando se valido el ingreso
    usedBy: {type: String, default: null}   //quien lo valido (dueño o RRPP del evento)
})

export default mongoose.model('tokenSchema', tokenModel)
