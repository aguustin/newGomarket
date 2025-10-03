import Queue from 'bull'
import dotenv from "dotenv"
dotenv.config()

const redisOptions = {
  redis: {
    host: process.env.REDIS_HOST,
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    tls: {} // para que funcione con Upstash
  }
};

export const paymentQueue = new Queue('ejecutar-pago', redisOptions)

export const refundQueue = new Queue('reembolsar-pago', redisOptions)