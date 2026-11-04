import mongoose from "mongoose";

//Token de cada QR emitido (entradas y cortesias). Se valida en la puerta (lib/entradas.js)
const tokenModel = mongoose.Schema({
    token: {type: String, required: true, index: true},
    used: {type: Boolean, default: false},
    usedAt: {type: Date, default: null},    //cuando se valido el ingreso
    usedBy: {type: String, default: null},  //quien lo valido (dueño o RRPP del evento)
    eventId: {type: String, default: null, index: true},  //evento de la entrada (QR emitidos desde la etapa 10)
    paymentId: {type: String, default: null},              //pago que la origino (null en cortesias)
    anulada: {type: Boolean, default: false},              //el evento se cancelo: no vale en la puerta
    motivoAnulacion: {type: String, default: null}
})

export default mongoose.model('tokenSchema', tokenModel)
