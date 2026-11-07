import mongoose from "mongoose";

//Cortesias para el publico (entradas con estado 5): cuantas pidio cada email de cada tipo.
//El indice unico (evento + tipo + email) es lo que hace atomico el limite por email (ver lib/cortesiaPublica.js)
const cortesiaPublicaSchema = new mongoose.Schema({
    prodId: { type: String, required: true },
    ticketId: { type: String, required: true },
    email: { type: String, required: true },   //en minusculas
    cantidad: { type: Number, default: 0 }
}, { timestamps: true })

cortesiaPublicaSchema.index({ prodId: 1, ticketId: 1, email: 1 }, { unique: true })

const cortesiaPublicaModel = mongoose.model('cortesiaPublicaModel', cortesiaPublicaSchema)

export default cortesiaPublicaModel
