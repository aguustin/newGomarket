import { pathToFileURL } from "node:url"
import './lib/checkConfig.js' //primero: valida la configuracion antes de cargar el resto
import express, { json, urlencoded } from "express"
import morgan from "morgan"
import { port, isDev, appEnv, urlFront } from "./config.js"
import { connecDb } from "./connection.js"
import userRoutes from "./routes/userRoutes.js"
import ticketRoutes from "./routes/ticketRoutes.js"
import cortesieRoutes from "./routes/cortesieRoutes.js"
import devMailRoutes from "./routes/devMailRoutes.js"
import cors from "cors"
import dotenv from "dotenv"
import './lib/cron.js'
import responseTime from 'response-time'
import { limites } from "./lib/limites.js"
import { sinOperadoresMongo } from "./lib/sanitizar.js"

dotenv.config()
const app = express()
//Render (y ngrok en dev) pasan el pedido por un proxy: sin esto todos los usuarios tendrian la IP del proxy
//y el limite de pedidos los frenaria a todos juntos. TRUST_PROXY = cantidad de proxies delante (por defecto 1)
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1))
await connecDb() //no aceptar pedidos sin base de datos

//setting

//middleware
app.use(responseTime())
//Solo el frontend de Ipass puede llamar a la API desde un navegador (en dev, ademas, cualquier localhost).
//Los pedidos sin Origin (webhooks de Mercado Pago, servidores) no los afecta CORS
const origenesPermitidos = [urlFront, process.env.URL_FRONT].filter(Boolean).map((u) => u.replace(/\/+$/, ''))
  .flatMap((u) => [u, u.includes('://www.') ? u.replace('://www.', '://') : u.replace('://', '://www.')]) //con y sin www
const corsOptions = {
  origin: (origin, cb) => cb(null, !origin || origenesPermitidos.includes(origin) || (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))),
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
}
app.use(cors(corsOptions))
app.use(limites.general)
app.use(express.text())
app.use(express.json())
app.use(urlencoded({extended:true}))
app.use(sinOperadoresMongo) //sin operadores de MongoDB en los datos que llegan (lib/sanitizar.js)
if (appEnv !== 'test') app.use(morgan("tiny"))
//routes
app.use(userRoutes)
app.use(ticketRoutes)
app.use(cortesieRoutes)
if (isDev) app.use(devMailRoutes) //bandeja de mails: solo development/test
//listeng
//Escucha solo si se ejecuta directamente (node app.js); los tests de integracion la importan sin abrir el puerto
const runDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (runDirectly) app.listen(port)

export default app
