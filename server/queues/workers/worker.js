import { connecDb } from "../../connection.js";
import { refundsFunc } from "../../controllers/eventController.js";
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

  console.log(`🛠 Procesando generación de QR para pago ${paymentId}`);

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