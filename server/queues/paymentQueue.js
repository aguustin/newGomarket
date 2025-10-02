import Queue from 'bull'
import dotenv from "dotenv"
dotenv.config()

const redisOptions = {
  redis: {
    host: 'adapting-pipefish-16442.upstash.io',
    port: 6379,
    password: 'AUA6AAIncDIwZTY1NDg1NTA3NGY0ZjZjOTRjMDAwMTFlYTA4YWY1OHAyMTY0NDI',
    tls: {} // para que funcione con Upstash
  }
};

export const paymentQueue = new Queue('procesar-pago', redisOptions)

export const refundQueue = new Queue('reembolsar-pago', redisOptions)