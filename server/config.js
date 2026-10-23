import dotenv from "dotenv"
dotenv.config()

export const port =  process.env.PORT
export const mongoUri = process.env.MONGO_URI
export const user_mail = process.env.USER_MAIL
export const pass = process.env.PASS

//APP_ENV=development usa sandbox de MP y las URLs _DEV. Sin definir = produccion
export const isDev = process.env.APP_ENV === 'development'
export const urlFront = isDev ? process.env.URL_FRONT_DEV : process.env.URL_FRONT
export const urlBack = isDev ? process.env.URL_BACK_DEV : process.env.URL_BACK
export const mpAccessToken = isDev ? process.env.MP_ACCESS_TOKEN_DEV : process.env.MP_ACCESS_TOKEN_PROD

//MAIL_ENABLED=false apaga Resend y la verificacion de cuenta por mail. Sin definir = activado
export const mailEnabled = process.env.MAIL_ENABLED !== 'false'