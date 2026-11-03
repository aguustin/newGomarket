import { Router } from "express";
import { requireAuth, mismoUserId, mismoMail } from "../lib/auth.js";
import { activeDiscount, addRRPPController, buyEventTicketsController, cancelarEventoController, createDiscountController, createEventController, createEventTicketsController, descargarCompradoresController, findDiscountController, generateMyRRPPLinkController, getAllEventsController, getBuyersController, getEventsFreesController, getEventToBuyController, getInfoQrController, getMyProdsController, getOneProdController, getRelateEventsController, getRRPPInfoController, mercadoPagoWebhookController, paymentConfirmController, paymentReturnController, paymentStatusController, paymentSuccessController, qrGeneratorController, reactivarEventoController, relateEventsController, sendQrStaffQrController, soldOutEventController, updateEventController, updateEventTicketsController, verTokensController } from "../controllers/eventController.js";
import multer from "multer"
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router()

router.get('/getAllEvents', getAllEventsController)

router.post('/createEvent', requireAuth, upload.fields([{name:'imgEvento', maxCount: 1}, {name:'bannerEvento', maxCount: 1}, {name:'imagenDescriptiva', maxCount: 1}]), createEventController)

router.post('/createEventTickets', requireAuth, upload.single('imgTicket'), createEventTicketsController)

router.post('/updateEvent', requireAuth, upload.fields([{name:'imgEvento'}, {name: 'bannerEvento', maxCount: 1}, {name: 'imagenDescriptiva', maxCount: 1}]),  updateEventController)

router.post('/updateTickets', requireAuth, upload.single('imgTicket'), updateEventTicketsController)

router.get('/my_productions/:userId', requireAuth, mismoUserId((req) => req.params.userId), getMyProdsController)

router.get('/get_prod/:prodId/:userId', requireAuth, mismoUserId((req) => req.params.userId), getOneProdController)

router.get('/buy_tickets/:prodId', getEventToBuyController)

router.post('/buy', buyEventTicketsController)

router.post('/addRRPP', requireAuth, addRRPPController)

router.get('/ticket/validate/:token', getInfoQrController);

router.post('/sendQrStaff', requireAuth, sendQrStaffQrController)

router.post('/webhook/mercadopago', mercadoPagoWebhookController);

router.get('/payment-success', paymentSuccessController);  //back_url de preferencias viejas

router.get('/payment_return', paymentReturnController);

router.get('/payment_status/:paymentId', paymentStatusController);

router.post('/payment_confirm/:paymentId', paymentConfirmController);

router.get('/get_my_rrpp_events/:mail', requireAuth, mismoMail((req) => req.params.mail), getRRPPInfoController)

router.get('/rrpp_get_event_free/:prodId/:mail', requireAuth, mismoMail((req) => req.params.mail), getEventsFreesController)

router.post('/generate_rrpp_url', requireAuth, mismoMail((req) => req.body.rrppMail), generateMyRRPPLinkController)

router.get('/tokens', verTokensController)

router.post('/descargar_compradores', requireAuth, descargarCompradoresController)

router.post('/relacionar_eventos', requireAuth, relateEventsController)

router.get('/obtener_eventos_relacionados/:prodId', getRelateEventsController)

router.post('/cancelar_evento', requireAuth, cancelarEventoController)

router.post('/reactivar_evento', requireAuth, reactivarEventoController)

router.post('/sold_out', requireAuth, soldOutEventController)

router.get('/get_buyers/:prodId', requireAuth, getBuyersController)

router.post('/create_discount', requireAuth, createDiscountController)

router.post('/active_discount', activeDiscount)

router.get('/find_discount/:discountCode', findDiscountController)

export default router