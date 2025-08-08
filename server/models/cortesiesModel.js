import mongoose from "mongoose";

const cortesieSchema = mongoose.Schema({
    prodId:{type:String},
    userId:{type:String},
    eventName:{type:String},
    excelName:{type:String},
    fechaCreacion:{type:String},
    people:[{
        clientName:{type: String},
        email: {type:String},
    }],
    courtesy:{type:Number},
}, { strict: true })

const cortesieModel = mongoose.model("cortesieModel", cortesieSchema)

export default cortesieModel