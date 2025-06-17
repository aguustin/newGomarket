import { Router } from "express";
import { buyEventTicketsController, createEventController, createEventTicketsController, getAllEventsController, getEventsFreesController, getEventToBuyController, getInfoQrController, getMyProdsController, getOneProdController, getRRPPInfoController, mercadoPagoWebhookController, paymentSuccessController, sendQrStaffQrController, updateEventController, updateEventTicketsController } from "../controllers/eventController.js";
import multer from "multer"
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router()

router.get('/getAllEvents', getAllEventsController)

router.post('/createEvent', upload.single('imgEvento'), createEventController)

router.post('/createEventTickets', upload.single('imgTicket'), createEventTicketsController)

router.post('/updateEvent', upload.single('imgEvento'),  updateEventController)

router.post('/updateTickets', upload.single('imgTicket'), updateEventTicketsController)

router.get('/my_productions/:userId', getMyProdsController)

router.get('/get_prod/:prodId', getOneProdController)

router.get('/buy_tickets/:prodId', getEventToBuyController)

router.post('/buy', buyEventTicketsController)

router.get('/ticket/validate', getInfoQrController);

router.post('/sendQrStaff', sendQrStaffQrController)

router.post('/webhook/mercadopago', mercadoPagoWebhookController);

router.get('/payment-success', paymentSuccessController);

router.get('/get_my_rrpp_events/:mail', getRRPPInfoController)

router.get('/rrpp_get_event_free/:prodId/:mail', getEventsFreesController)

export default router