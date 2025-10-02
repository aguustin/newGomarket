import { connecDb } from "../../connection.js";
import { handleSuccessfulPayment, refundsFunc } from "../../controllers/eventController.js";
import { paymentQueue, refundQueue } from "../paymentQueue.js";
import dotenv from 'dotenv';
dotenv.config();
await connecDb();

paymentQueue.process('ejecutar-pago', async (job) => {
  console.log(`Procesando job ID: ${job.id}`);
  console.log('Payload recibido:', job.data);

  try {
    const res = await handleSuccessfulPayment(job.data);
    console.log(`respuesta de handle: ${res.data}`);
  } catch (err) {
    console.error(`Job ${job.id} falló:`, err);
    throw err; // esto marca el job como failed
  }
})

refundQueue.process('reembolsar-pago', async (job) => {
    try {
      await refundsFunc(job.data)
    } catch (error) {
      console.log('error en el worker de reembolso', error)
    }
})