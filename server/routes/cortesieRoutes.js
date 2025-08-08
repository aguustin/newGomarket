import { Router } from "express";
import { chargeExcelController, getAllExcelsInfoController, getProdCortesiesController, sendCortesiesController } from "../controllers/cortesieController.js";
import multer from "multer"

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router()

router.get('/get_event_cortesies/:userId/:prodId', getAllExcelsInfoController)

router.get('/get_cortesie/:cortesieId', getProdCortesiesController)

router.post('/charge_excel', upload.single('excelFile'), chargeExcelController)

router.post('/send_cortesies', sendCortesiesController)

export default router