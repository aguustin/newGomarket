import { Router } from "express";
import { addRRPPController, buyEventTicketsController, cancelarEventoController, createEventController, createEventTicketsController, descargarCompradoresController, generateMyRRPPLinkController, getAllEventsController, getEventsFreesController, getEventToBuyController, getInfoQrController, getMyProdsController, getOneProdController, getRelateEventsController, getRRPPInfoController, mercadoPagoWebhookController, paymentSuccessController, qrGeneratorController, relateEventsController, sendQrStaffQrController, updateEventController, updateEventTicketsController, verTokensController } from "../controllers/eventController.js";
import multer from "multer"
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router()

router.get('/getAllEvents', getAllEventsController)

router.post('/createEvent', upload.fields([{name:'imgEvento', maxCount: 1}, {name:'bannerEvento', maxCount: 1}, {name:'imagenDescriptiva', maxCount: 1}]), createEventController)

router.post('/createEventTickets', upload.single('imgTicket'), createEventTicketsController)

router.post('/updateEvent', upload.fields([{name:'imgEvento'}, {name: 'bannerEvento', maxCount: 1}, {name: 'imagenDescriptiva', maxCount: 1}]),  updateEventController)

router.post('/updateTickets', upload.single('imgTicket'), updateEventTicketsController)

router.get('/my_productions/:userId', getMyProdsController)

router.get('/get_prod/:prodId/:userId', getOneProdController)

router.get('/buy_tickets/:prodId', getEventToBuyController)

router.post('/buy', buyEventTicketsController)

router.post('/addRRPP', addRRPPController)

router.get('/ticket/validate/:token', getInfoQrController);

router.post('/sendQrStaff', sendQrStaffQrController)

router.post('/webhook/mercadopago', mercadoPagoWebhookController);

router.get('/payment-success', paymentSuccessController);

router.get('/get_my_rrpp_events/:mail', getRRPPInfoController)

router.get('/rrpp_get_event_free/:prodId/:mail', getEventsFreesController)

router.post('/generate_rrpp_url', generateMyRRPPLinkController)

router.get('/tokens', verTokensController)

router.post('/descargar_compradores', descargarCompradoresController)

router.post('/relacionar_eventos', relateEventsController)

router.get('/obtener_eventos_relacionados/:prodId', getRelateEventsController)

router.post('/cancelar_evento', cancelarEventoController)

export default router