import cron from 'node-cron';
import ticketModel from '../models/ticketsModel.js';
import { expirarOrdenesVencidas } from './stock.js';

cron.schedule('0 0 * * 0', async () => {
    const now = new Date();
    console.log("CRON ejecutado:", now.toISOString());

    try {
        // 🔥 Desactivar eventos caducados
        const eventosCaducados = await ticketModel.updateMany(
            { fechaFin: { $lt: now }, active: true },
            { $set: { active: false } }
        );

        console.log(`Eventos desactivados: ${eventosCaducados.modifiedCount}`);

        // Los tickets vencidos no se marcan aca: la venta se cierra en el momento comparando
        // fechaDeCierre (pagina de compra; el backend lo valida desde la etapa 4).
        // Antes se escribia "isActive", un campo que no existe en el modelo y nadie leia.

    } catch (err) {
        console.error("Error en cron:", err);
    }
});


//Cada minuto: las reservas de stock vencidas sin pago vuelven a estar disponibles
cron.schedule('* * * * *', async () => {
    try {
        const liberadas = await expirarOrdenesVencidas();
        if (liberadas > 0) console.log(`Reservas vencidas liberadas: ${liberadas}`);
    } catch (err) {
        console.error("Error liberando reservas vencidas:", err);
    }
});
