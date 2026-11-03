import mongoose from "mongoose";

//Un pago aprobado de Mercado Pago. Desde la etapa 9 registra en que paso esta, para retomar lo que falte:
//  ventaRegistrada  ventas, stock, comprador, RRPP y descuento
//  entregado        mail con los QR enviado (hasta MAX_INTENTOS_ENTREGA intentos, ver eventController)
//Las transacciones anteriores a la etapa 9 no tienen estos campos y se consideran completas.
const transactionModel = mongoose.Schema({
    prodId:{type:String},
    paymentId: { type: String, required: true, unique: true },
    transaccionId:{type: String, required: true},
    nombre:{type: String},
    apellido:{type: String},
    email:{type: String},
    montoPagado:{type: Number},          //reembolsable: entradas sin el cargo por servicio
    montoCobrado:{type: Number},         //lo que cobro Mercado Pago
    reembolsado: { type: Boolean, default: false },
    fecha: { type: Date, default: Date.now },
    ventaRegistrada: { type: Boolean },
    errorVenta: { type: String, default: null },
    entregado: { type: Boolean },
    entregadoEn: { type: Date, default: null },
    entregandoDesde: { type: Date, default: null },   //marca de "entrega en curso" para que dos procesos no envien dos mails
    intentosEntrega: { type: Number, default: 0 },
    ultimoErrorEntrega: { type: String, default: null },
    alertaMonto: { type: Boolean, default: false }    //MP cobro un monto distinto del calculado: no se entregan entradas
})

transactionModel.index({ entregado: 1, ventaRegistrada: 1, fecha: 1 })

export default mongoose.model("transaccionModel", transactionModel)
