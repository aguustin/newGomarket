/*import express, { json, urlencoded } from "express"
import morgan from "morgan"
import { port } from "./config.js"
import { connecDb } from "./connection.js"
import userRoutes from "./routes/userRoutes.js"
import ticketRoutes from "./routes/ticketRoutes.js"
import cors from "cors"
import dotenv from "dotenv"
import './lib/cron.js'
import path from 'path';  //agregado el 29/07
import { fileURLToPath } from 'url';  //agregado el 29/07
// Necesario para obtener el __dirname en ES Module

dotenv.config()
const app = express()
connecDb()

//setting
const __filename = fileURLToPath(import.meta.url);  //agregado el 29/07
const __dirname = path.dirname(__filename);  //agregado el 29/07

//middleware
app.use(express.text())
app.use(express.json())
app.use(urlencoded({extended:true}))
app.use(morgan("tiny"))
app.use(cors())
//routes
// Rutas de tu API
app.use(userRoutes)
app.use(ticketRoutes)

app.use(express.static(path.resolve(__dirname, 'client', 'dist')));

// Catch-all: devolver index.html para rutas del frontend (React SPA)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
});
//listeng
app.listen(port)*/
import express, { json, urlencoded } from "express"
import morgan from "morgan"
import { port } from "./config.js"
import { connecDb } from "./connection.js"
import userRoutes from "./routes/userRoutes.js"
import ticketRoutes from "./routes/ticketRoutes.js"
import cors from "cors"
import dotenv from "dotenv"
import './lib/cron.js'

dotenv.config()
const app = express()
connecDb()

//setting

//middleware
const corsOptions = {
  origin: "https://goticket-wsy0.onrender.com", //https://goticket-wsy0.onrender.com",
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

//listeng
app.listen(port)