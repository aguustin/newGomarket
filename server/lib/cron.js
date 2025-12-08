import cron from 'node-cron';
import ticketModel from '../models/ticketsModel.js';

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

        // 🔥 Desactivar tickets caducados dentro de eventos
        const ticketsCaducados = await ticketModel.updateMany(
            { "tickets.fechaDeCierre": { $lt: now } },
            {
                $set: {
                    "tickets.$[t].isActive": false
                }
            },
            {
                arrayFilters: [{ "t.fechaDeCierre": { $lt: now } }]
            }
        );

        console.log(`Tickets desactivados: ${ticketsCaducados.modifiedCount}`);

    } catch (err) {
        console.error("Error en cron:", err);
    }
});

