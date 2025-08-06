import { Router } from "express";
import { chargeExcelController, getAllExcelsInfoController, getProdCortesiesController } from "../controllers/cortesieController.js";
import multer from "multer"

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router()

router.get('/get_event_database/:prodId/:userId', getAllExcelsInfoController)

router.get('/get_cortesie/:cortesieId', getProdCortesiesController)

router.post('/charge_excel', upload.single('excel'), chargeExcelController)

export default router