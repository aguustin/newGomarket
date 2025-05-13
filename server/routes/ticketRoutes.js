import { Router } from "express";
import { createEventController, getAllEventsController, updateEventTicketsController } from "../controllers/eventController.js";
import multer from "multer"
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router()

router.get('/getAllEvents', getAllEventsController)

router.post('/createEvent', upload.single('imgEvento'), createEventController)

router.post('/updateEventTickets', upload.single('imgTicket'), updateEventTicketsController)

export default router