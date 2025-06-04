// cron/cleanup.js
import cron from 'node-cron';
import ticketModel from '../models/ticketsModel.js';

cron.schedule('0 * * * *', async () => {
    const now = new Date();

    const events = await ticketModel.find({});

    for (const event of events) {
        let updated = false;

        // Desactivar tickets caducados
        event.tickets.forEach(ticket => {
            if (ticket.isActive && now > ticket.fechaDeCierre) {
                ticket.isActive = false;
                updated = true;
            }
        });

        // Eliminar eventos caducados
        if (now > event.fechaFin) {
            await Ticket.findByIdAndDelete(event._id);
            console.log(`Evento ${event._id} eliminado por caducidad`);
            continue;
        }

        if (updated) {
            await event.save();
            console.log(`Evento ${event._id}: tickets caducados desactivados`);
        }
    }
});
