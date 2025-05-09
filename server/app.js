import express, { json, urlencoded } from "express"
import morgan from "morgan"
import { port } from "./config.js"
import { connecDb } from "./connection.js"

const app = express()
connecDb()

//setting


//middleware
app.use(express.text())
app.use(express.json())
app.use(urlencoded({extended:false}))
app.use(morgan("tiny"))

//routes


//listeng
app.listen(port)