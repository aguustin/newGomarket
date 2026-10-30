import mongoose from "mongoose"
import { mongoUri, mongoDbName } from "./config.js"

export const connecDb = async () => {
    try{
       await mongoose.connect(mongoUri, mongoDbName ? { dbName: mongoDbName } : {})
       console.log("Database connected")
    }catch(err){
        console.log(err)
        throw err
    }

}
