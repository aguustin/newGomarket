import { connecDb } from "../../connection.js";
import { handleSuccessfulPayment, refundsFunc } from "../../controllers/eventController.js";
import { paymentQueue, refundQueue } from "../paymentQueue.js";
import dotenv from 'dotenv';
dotenv.config();
await connecDb();

paymentQueue.process('ejecutar-pago', async (job) => {
  console.log(`Procesando job ID: ${job.id}`);
  console.log('Payload recibido:', job);

  try {
    await handleSuccessfulPayment(job);
    console.log(`Job ${job.id} procesado con éxito.`);
  } catch (err) {
    console.error(`Job ${job.id} falló:`, err);
    throw err; // esto marca el job como failed
  }
})

refundQueue.process('reembolsar-pago', async (job) => {
    try {
      await refundsFunc(job)
    } catch (error) {
      console.log('error en el worker de reembolso', error)
    }
})