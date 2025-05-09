import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    nombreCompleto: {String},
    mail: {String},
    celular: {Number},
    país: {String},
    contrasenia: {String},
    misTickets:[{
        categoriaId: {String}
    }]
})

export default mongoose.model('userModel', userSchema)