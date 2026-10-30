import './lib/checkConfig.js' //primero: valida la configuracion antes de cargar el resto
import express, { json, urlencoded } from "express"
import morgan from "morgan"
import { port, isDev, appEnv } from "./config.js"
import { connecDb } from "./connection.js"
import userRoutes from "./routes/userRoutes.js"
import ticketRoutes from "./routes/ticketRoutes.js"
import cortesieRoutes from "./routes/cortesieRoutes.js"
import devMailRoutes from "./routes/devMailRoutes.js"
import cors from "cors"
import dotenv from "dotenv"
import './lib/cron.js'
import responseTime from 'response-time'

dotenv.config()
const app = express()
await connecDb() //no aceptar pedidos sin base de datos

//setting

//middleware
app.use(responseTime())
const corsOptions = {
  origin: "*", //https://goticket-wsy0.onrender.com",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
}
app.use(cors(corsOptions))
app.use(express.text())
app.use(express.json())
app.use(urlencoded({extended:true}))
if (appEnv !== 'test') app.use(morgan("tiny"))
//routes
app.use(userRoutes)
app.use(ticketRoutes)
app.use(cortesieRoutes)
if (isDev) app.use(devMailRoutes) //bandeja de mails: solo development/test
//listeng
if (appEnv !== 'test') app.listen(port) //los tests usan la app sin abrir el puerto

export default app
