import { handleSuccessfulPayment } from "../../controllers/eventController.js";
import { paymentQueue } from "../paymentQueue.js";

paymentQueue.process('ejecutar-pago', async (job) => {
  console.log(`🔁 Procesando job ID: ${job.id}`);
  console.log('📥 Payload recibido:', job.data);

  try {
    await handleSuccessfulPayment(job.data);
    console.log(`✅ Job ${job.id} procesado con éxito.`);
  } catch (err) {
    console.error(`❌ Job ${job.id} falló:`, err);
    throw err; // esto marca el job como failed
  }
})