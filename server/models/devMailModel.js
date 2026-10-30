import mongoose from "mongoose";

//Bandeja de mails de desarrollo (MAIL_MODE=bandeja). Nunca se usa en produccion.
//Se borran solos a los 7 dias.
const devMailSchema = new mongoose.Schema({
    provider: {type: String},   // resend | gmail: por donde habria salido
    from: {type: String},
    to: [String],
    subject: {type: String},
    html: {type: String},
    text: {type: String},
    attachments: [{
        filename: {type: String},
        contentType: {type: String},
        contentId: {type: String},
        content: {type: String}   // base64
    }],
    createdAt: {type: Date, default: Date.now, expires: 60 * 60 * 24 * 7}
})

const devMailModel = mongoose.model("devMailModel", devMailSchema)

export default devMailModel
