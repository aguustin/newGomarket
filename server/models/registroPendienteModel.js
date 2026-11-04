import mongoose from "mongoose";

//Registro esperando la verificacion del mail (etapa 13). Antes viajaba todo dentro del link del mail
//(incluido el hash de la contraseña); ahora el link solo lleva un codigo al azar y los datos quedan aca.
//Mongo borra solo los vencidos (indice TTL sobre expiraEn).
const registroPendienteSchema = new mongoose.Schema({
  mail: { type: String, required: true, unique: true },      //en minusculas
  codigoHash: { type: String, required: true, unique: true }, //sha256 del codigo del link (el codigo no se guarda)
  nombreCompleto: { type: String },
  dni: { type: mongoose.Schema.Types.Mixed },
  pais: { type: String },
  contrasenia: { type: String, required: true },              //hash bcrypt
  expiraEn: { type: Date, required: true }
}, { timestamps: true })
registroPendienteSchema.index({ expiraEn: 1 }, { expireAfterSeconds: 0 })

const registroPendienteModel = mongoose.model('registroPendienteModel', registroPendienteSchema)
export default registroPendienteModel
