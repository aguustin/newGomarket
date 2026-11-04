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

//Cada 5 minutos: pagos cobrados cuyas entradas no se pudieron entregar (ej: fallo el mail) se reintentan
cron.schedule('*/5 * * * *', async () => {
    try {
        const { reintentarPagosPendientes } = await import('../controllers/eventController.js');
        const pendientes = await reintentarPagosPendientes();
        if (pendientes > 0) console.log(`Pagos con entrega pendiente reintentados: ${pendientes}`);
    } catch (err) {
        console.error("Error reintentando entregas pendientes:", err);
    }
});

//Cada 10 minutos: pagos aprobados en Mercado Pago de los que no llego ningun aviso se procesan igual
cron.schedule('*/10 * * * *', async () => {
    try {
        const { conciliarPagosAprobados } = await import('../controllers/eventController.js');
        const recuperados = await conciliarPagosAprobados();
        if (recuperados > 0) console.warn(`Conciliacion: ${recuperados} pago(s) aprobados sin aviso fueron procesados`);
    } catch (err) {
        console.error("Error en la conciliacion de pagos:", err?.message ?? err);
    }
});

//Cada 10 minutos: reembolsos de eventos cancelados que fallaron se reintentan (hasta 5 veces)
cron.schedule('*/10 * * * *', async () => {
    try {
        const { procesarReembolsosPendientes } = await import('./reembolsos.js');
        const { ok, fallidos } = await procesarReembolsosPendientes();
        if (ok || fallidos) console.log(`Reembolsos reintentados: ${ok} ok, ${fallidos} fallidos`);
    } catch (err) {
        console.error("Error reintentando reembolsos:", err?.message ?? err);
    }
});

//Cada 5 minutos: invitaciones por Excel y avisos a RRPP que quedaron pendientes o fallaron (hasta 5 intentos)
cron.schedule('*/5 * * * *', async () => {
    try {
        const { procesarEnviosPendientes } = await import('./invitaciones.js');
        const { invitaciones, avisosRRPP } = await procesarEnviosPendientes();
        if (invitaciones || avisosRRPP) console.log(`Envios reintentados: ${invitaciones} invitaciones, ${avisosRRPP} avisos a RRPP`);
    } catch (err) {
        console.error("Error reintentando invitaciones:", err?.message ?? err);
    }
});
