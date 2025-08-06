import mongoose from "mongoose";

const cortesieSchema = mongoose.Schema({
    eventId:{type:String},
    userId:{type:String},
    excelName:{type:String},
    dateT:{type:Date},
    fechaCierre:{type:Date},
    people:[{
        clientName:{type: String},
        email: {type:String},
    }],
    courtesy:{type:Number},
})

const cortesieModel = mongoose.model("cortesieModel", cortesieSchema)

export default cortesieModel