import express, { json, urlencoded } from "express"
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
import apiRoutes from './routes/api.js';  // Asegúrate de usar .js si tu archivo es un módulo ES //agregado el 29/07
app.use('/api', apiRoutes);  //agregado el 29/07

// Servir archivos estáticos de Vite
app.use(express.static(path.resolve(__dirname, 'client', 'dist')));  //agregado el 29/07

// Ruta catch-all para manejar rutas del frontend (React)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));  //agregado el 29/07
});
app.use(userRoutes)
app.use(ticketRoutes)

//listeng
app.listen(port)