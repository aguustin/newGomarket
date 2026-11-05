import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
    prodId:{type:String},
    idDescuento:{type: String},
    cantidadDescuentos:{type:Number},
    numeroDescuento:{type:Number}
})

//Indices para las consultas frecuentes (etapa 13)
discountSchema.index({ prodId: 1, idDescuento: 1 })
discountSchema.index({ idDescuento: 1 })

const discountModel = mongoose.model("discountModel", discountSchema)

export default discountModel