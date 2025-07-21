import mongoose from "mongoose";

const tokenModel = mongoose.Schema({
    token: {type: String, required: true},
    used: {type: Boolean, default: false}
})

export default mongoose.model('tokenSchema', tokenModel)