import dotenv from "dotenv"
dotenv.config()

export const port =  process.env.PORT
export const mongoUri = process.env.MONGO_URI
export const user_mail = process.env.USER_MAIL
export const pass = process.env.PASS