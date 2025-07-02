import cron from 'node-cron';
import ticketModel from '../models/ticketsModel.js';

cron.schedule('0 * * * *', async () => {
    const now = new Date();

    try {
        const events = await ticketModel.find({});

        for (const event of events) {
            let updated = false;

            // Log para depuración: fechas del evento
            console.log(`\n---\nRevisando evento ${event._id}`);
            console.log(`Now (UTC):       ${now.toISOString()}`);
            console.log(`Fecha de cierre: ${new Date(event.fechaFin).toISOString()}`);

            // Verifica si el evento ya caducó
            if (now > new Date(event.fechaFin)) {
                console.log(`Evento ${event._id} eliminado por caducidad`);
                await ticketModel.findByIdAndDelete(event._id);
                continue;
            }

            // Desactivar tickets caducados
            event.tickets.forEach(ticket => {
                if (ticket.isActive && now > new Date(ticket.fechaDeCierre)) {
                    ticket.isActive = false;
                    updated = true;
                }
            });

            if (updated) {
                await event.save();
                console.log(`Evento ${event._id}: tickets caducados desactivados`);
            }
        }
    } catch (err) {
        console.error('Error en cron de tickets:', err);
    }
});
