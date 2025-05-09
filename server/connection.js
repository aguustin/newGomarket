import mongoose from "mongoose"
import { mongoUri } from "./config.js"

export const connecDb = async () => {
    try{
       await mongoose.connect(mongoUri)
       console.log("Database connected")
    }catch(err){
        console.log(err)
    }

}
