import mongoose from "mongoose";

const rrppExcelSchema = mongoose.Schema({
    userId:{type:String},
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