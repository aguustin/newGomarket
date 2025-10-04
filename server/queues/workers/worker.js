import { connecDb } from "../../connection.js";
import { obtenerRRPPDesdeHash, procesarVentaGeneral, procesarVentaRRPP, qrGeneratorController, refundsFunc } from "../../controllers/eventController.js";
import { redisClient } from "../../lib/redisClient.js";
import ticketModel from "../../models/ticketsModel.js";
import { paymentQueue, refundQueue } from "../paymentQueue.js";
import dotenv from 'dotenv';
dotenv.config();
await connecDb();

paymentQueue.process('generar-qr-y-mail', async (job) => {
  const {
    prodIdVal,
    mail,
    total,
    paymentId,
    emailHash,
    nombreCompleto,
    dni,
    state,
    quantities
  } = job.data;

  const cacheKey = `payment_processed:${paymentId}`;
  console.log('nombre Completo: ', nombreCompleto)
  const estado = await redisClient.get(cacheKey);
  if (estado === 'true') {
    console.log(`Worker: pago ${paymentId} ya fue procesado. Abortando.`);
    return;
  }

  try {
    const event = await ticketModel.findOne({ _id: prodIdVal }).lean();
    if (!event) {
      console.error("Evento no encontrado:", prodIdVal);
      return;
    }

    const { rrppMatch, decryptedMail } = obtenerRRPPDesdeHash(event, emailHash);

    // 👉 Generamos QRs y enviamos mail
    await qrGeneratorController(prodIdVal, quantities, mail, state, nombreCompleto, dni);
    // 👉 Procesar venta general
    await procesarVentaGeneral(event, quantities, total);
    
    // 👉 Procesar venta RRPP si corresponde
    if (rrppMatch && decryptedMail) {
      await procesarVentaRRPP(event, quantities, decryptedMail);
    }
    
    await redisClient.set(cacheKey, "true", 'EX', 60 * 60 * 24);
    console.log(`✅ Pago ${paymentId} procesado por el worker.`);
  } catch (err) {
    console.error("❌ Error en worker al procesar QR y venta:", err);
    throw err; // Para que se reintente
  }
});

refundQueue.process('reembolsar-pago', async (job) => {
    try {
      await refundsFunc(job.data)
    } catch (error) {
      console.log('error en el worker de reembolso', error)
    }
})