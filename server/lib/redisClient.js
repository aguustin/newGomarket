/*import { createClient } from "redis";  DESCOMENTAR PARA UTILIZAR REDIS Y USAR EN PRODUCCION
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL;  //si no conecta sacarle una 's' a "rediss" en REDIS_URL del archivo .env
export const redisClient = createClient({ url: redisUrl });

redisClient.on("error", (err) => console.error("Redis Client Error", err));

await redisClient.connect();
await redisClient.set('foo','bar');

console.log("Redis connected successfully!");*/
