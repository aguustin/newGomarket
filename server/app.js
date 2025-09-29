import express, { json, urlencoded } from "express"
import morgan from "morgan"
import { port } from "./config.js"
import { connecDb } from "./connection.js"
import userRoutes from "./routes/userRoutes.js"
import ticketRoutes from "./routes/ticketRoutes.js"
import cortesieRoutes from "./routes/cortesieRoutes.js"
import cors from "cors"
import dotenv from "dotenv"
import './lib/cron.js'
import responseTime from 'response-time'

dotenv.config()
const app = express()
connecDb()

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
app.use(morgan("tiny"))
//routes
app.use(userRoutes)
app.use(ticketRoutes)
app.use(cortesieRoutes)
//listeng
app.listen(port)