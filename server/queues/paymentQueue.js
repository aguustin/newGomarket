// paymentQueue.js
import Queue from 'bull';
import dotenv from 'dotenv';
dotenv.config();
import { URL } from 'url';

// Parseamos la URL de Upstash (rediss://...)
const redisUrl = new URL(process.env.REDIS_URL);

const redisConfig = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port),
  password: redisUrl.password,
  tls: redisUrl.protocol === 'rediss:' ? {} : undefined
};

// Creamos la cola con esa configuración
export const paymentQueue = new Queue('generar-qr-y-mail', { redis: redisConfig });
export const refundQueue = new Queue('reembolsar-pago', { redis: redisConfig });