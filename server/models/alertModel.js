import mongoose from "mongoose";

//Avisos al administrador (lib/alertas.js). La clave evita mandar dos veces el aviso del mismo caso
const alertSchema = new mongoose.Schema({
  clave: { type: String, required: true, unique: true },   //ej. "monto:186648481511"
  tipo: { type: String, required: true },
  asunto: { type: String },
  detalle: { type: String },
  enviado: { type: Boolean, default: false },
  error: { type: String, default: null }
}, { timestamps: true })

const alertModel = mongoose.model('alertModel', alertSchema)
export default alertModel
