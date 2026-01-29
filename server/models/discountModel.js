import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
    prodId:{type:String},
    idDescuento:{type: String},
    cantidadDescuentos:{type:Number},
    numeroDescuento:{type:Number}
})

const discountModel = mongoose.model("discountModel", discountSchema)

export default discountModel