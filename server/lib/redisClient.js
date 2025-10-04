import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

export const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("connect", () => console.log("Redis connected successfully!"));
redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Opcional: probar que funciona
redisClient.set('foo', 'bar').catch(console.error);