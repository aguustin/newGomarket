import mongoose from "mongoose";

//Orden de compra: se crea al iniciar el pago en /buy, con el stock ya reservado.
//  pendiente -> pagada   (pago aprobado)
//  pendiente -> expirada (vencio la reserva sin pago: el stock se devuelve)
//  pendiente -> fallida  (no se pudo crear el pago en Mercado Pago: el stock se devuelve)
//  pendiente -> cancelada (el dueño cancelo el evento)
//Su _id viaja a Mercado Pago como external_reference y en la metadata (order_id).
const orderSchema = new mongoose.Schema({
    prodId: { type: String, required: true },
    estado: { type: String, enum: ['pendiente', 'pagada', 'expirada', 'fallida', 'cancelada'], default: 'pendiente' },
    quantities: { type: Object, required: true },   // { ticketId: { amount, free: false } }, validadas por pricing.js
    total: { type: Number },
    montoEntradas: { type: Number },
    discountCode: { type: String, default: null },
    expiraEn: { type: Date, required: true },
    paymentId: { type: String, default: null },
    //true si el pago llego despues de vencida la reserva y ya no habia stock: se emitio igual (decision de negocio)
    sobreventa: { type: Boolean, default: false }
}, { timestamps: true, minimize: false })

orderSchema.index({ estado: 1, expiraEn: 1 })

//Indices para las consultas frecuentes (etapa 13)
orderSchema.index({ prodId: 1, estado: 1 })

export default mongoose.model('orderModel', orderSchema)
