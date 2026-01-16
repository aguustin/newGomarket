import mongoose from "mongoose";

const rrppExcelSchema = mongoose.Schema({
    prodId:{type:String},
    userId:{type:String},
    eventName:{type:String},
    excelName:{type:String},
    fechaCreacion:{type:String},
    rrppList:[{
        nombreRRPP:{type: String},
        email: {type:String},
    }],
    RRPPCount:{type:Number},
}, { strict: true })

const rrppExcelModel = mongoose.model("rrppExcelModel", rrppExcelSchema)

export default rrppExcelModel