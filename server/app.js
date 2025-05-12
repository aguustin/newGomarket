import express, { json, urlencoded } from "express"
import morgan from "morgan"
import { port } from "./config.js"
import { connecDb } from "./connection.js"
import userRoutes from "./routes/userRoutes.js"
import ticketRoutes from "./routes/ticketRoutes.js"

const app = express()
connecDb()

//setting


//middleware
app.use(express.text())
app.use(express.json())
app.use(urlencoded({extended:true}))
app.use(morgan("tiny"))

//routes
app.use(userRoutes)
app.use(ticketRoutes)

//listeng
app.listen(port)