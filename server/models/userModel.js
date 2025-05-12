import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    nombreCompleto: {type: String},
    mail: {type: String},
    celular: {type: Number},
    pais: {type: String},
    contrasenia: {type: String},
    misTickets:[{
        categoriaId: {type: String}
    }]
})

const userModel = mongoose.model('userModel', userSchema) 

export default userModel