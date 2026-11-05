import { Router } from "express";
import { sinOperadoresMongo } from "../lib/sanitizar.js";
import { requireAuth, authOpcional, mismoUserId, mismoMail } from "../lib/auth.js";
import { duenoDelEvento, duenoDelTicket, rrppDelEvento } from "../lib/permisos.js";
import { entregasPendientesController, reenviarEntradasController, validarEntradaController, rrppCortesiasController, rrppEnviarCortesiasController, addRRPPController, buyEventTicketsController, cancelarEventoController, createDiscountController, createEventController, createEventTicketsController, descargarCompradoresController, findDiscountController, generateMyRRPPLinkController, getAllEventsController, getBuyersController, getEventsFreesController, getEventToBuyController, getInfoQrController, getMyProdsController, getOneProdController, getRelateEventsController, getRRPPInfoController, mercadoPagoWebhookController, paymentConfirmController, paymentReturnController, paymentStatusController, paymentSuccessController, qrGeneratorController, reactivarEventoController, relateEventsController, sendQrStaffQrController, soldOutEventController, updateEventController, updateEventTicketsController } from "../controllers/eventController.js";
import { limites } from "../lib/limites.js";
import { subirImagen, subirImagenes } from "../lib/subidas.js"
const CAMPOS_IMAGENES_EVENTO = [{ name: 'imgEvento', maxCount: 1 }, { name: 'bannerEvento', maxCount: 1 }, { name: 'imagenDescriptiva', maxCount: 1 }]

const router = Router()

router.get('/getAllEvents', getAllEventsController)

router.post('/createEvent', requireAuth, subirImagenes(CAMPOS_IMAGENES_EVENTO), sinOperadoresMongo, createEventController)

router.post('/createEventTickets', requireAuth, subirImagen('imgTicket'), sinOperadoresMongo, duenoDelEvento((req) => req.body.prodId), createEventTicketsController)

router.post('/updateEvent', requireAuth, subirImagenes(CAMPOS_IMAGENES_EVENTO), sinOperadoresMongo,  duenoDelEvento((req) => req.body.eventId), updateEventController)

router.post('/updateTickets', requireAuth, subirImagen('imgTicket'), sinOperadoresMongo, duenoDelTicket((req) => req.body.ticketId), updateEventTicketsController)

router.get('/my_productions/:userId', requireAuth, mismoUserId((req) => req.params.userId), getMyProdsController)

router.get('/get_prod/:prodId/:userId', requireAuth, mismoUserId((req) => req.params.userId), getOneProdController)

router.get('/buy_tickets/:prodId', getEventToBuyController)

router.post('/buy', limites.compra, buyEventTicketsController)

router.post('/addRRPP', requireAuth, duenoDelEvento((req) => req.body.prodId), addRRPPController)

//Mostrar la entrada (publico; con sesion indica si puede validar) y validar el ingreso (dueño o RRPP)
router.get('/ticket/validate/:token', authOpcional, getInfoQrController);

router.post('/ticket/validate/:token', requireAuth, validarEntradaController);

router.post('/sendQrStaff', requireAuth, duenoDelEvento((req) => req.body.prodId), sendQrStaffQrController)

router.post('/webhook/mercadopago', mercadoPagoWebhookController);

router.get('/payment-success', paymentSuccessController);  //back_url de preferencias viejas

router.get('/payment_return', paymentReturnController);

router.get('/payment_status/:paymentId', paymentStatusController);

router.post('/payment_confirm/:paymentId', paymentConfirmController);

router.get('/get_my_rrpp_events/:mail', requireAuth, mismoMail((req) => req.params.mail), getRRPPInfoController)

router.get('/rrpp_get_event_free/:prodId/:mail', requireAuth, mismoMail((req) => req.params.mail), getEventsFreesController)

//Cortesias del RRPP para sus clientes (etapa 7b)
router.get('/rrpp_cortesias/:prodId', requireAuth, rrppDelEvento((req) => req.params.prodId), rrppCortesiasController)

router.post('/rrpp_enviar_cortesias', requireAuth, rrppDelEvento((req) => req.body.prodId), rrppEnviarCortesiasController)

router.post('/generate_rrpp_url', requireAuth, mismoMail((req) => req.body.rrppMail), rrppDelEvento((req) => req.body.prodId), generateMyRRPPLinkController)


router.post('/descargar_compradores', requireAuth, duenoDelEvento((req) => req.body.prodId), descargarCompradoresController)

router.post('/relacionar_eventos', requireAuth, duenoDelEvento((req) => req.body.prodId), duenoDelEvento((req) => req.body.otherId), relateEventsController)

router.get('/obtener_eventos_relacionados/:prodId', getRelateEventsController)

router.post('/cancelar_evento', requireAuth, duenoDelEvento((req) => req.body.prodId), cancelarEventoController)

router.post('/reactivar_evento', requireAuth, duenoDelEvento((req) => req.body.prodId), reactivarEventoController)

router.post('/sold_out', requireAuth, duenoDelEvento((req) => req.body.prodId), soldOutEventController)

router.get('/get_buyers/:prodId', requireAuth, duenoDelEvento((req) => req.params.prodId), getBuyersController)
//Entradas cuyo mail nunca se pudo enviar, y reenviarlas (solo el dueño)
router.get('/entregas_pendientes/:prodId', requireAuth, duenoDelEvento((req) => req.params.prodId), entregasPendientesController)
router.post('/reenviar_entradas', requireAuth, duenoDelEvento((req) => req.body.prodId), reenviarEntradasController)

router.post('/create_discount', requireAuth, duenoDelEvento((req) => req.body.prodId), createDiscountController)


router.get('/find_discount/:discountCode', limites.descuento, findDiscountController)

export default router