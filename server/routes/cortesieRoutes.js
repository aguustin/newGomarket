import { Router } from "express";
import { chargeExcelController, chargeRRPPExcelController, deleteCortesiesController, deleteRRPPExcelController, getAllExcelsInfoController, getAllRRPPExcelsController, getProdCortesiesController, sendCortesiesController, sendRRPPColabsListController } from "../controllers/cortesieController.js";
import multer from "multer"

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router()

router.get('/get_event_cortesies/:userId/:prodId', getAllExcelsInfoController)

router.get('/get_rrpp_event_excels/:userId/:prodId', getAllRRPPExcelsController)

router.get('/get_cortesie/:cortesieId', getProdCortesiesController)

router.post('/charge_excel', upload.single('excelFile'), chargeExcelController)

router.post('/charge_rrpp_excel', upload.single('excelFile'), chargeRRPPExcelController)

router.post('/send_cortesies', sendCortesiesController)

router.post('/send_rrpp_cortesies', sendRRPPColabsListController)

router.delete('/delete_cortesie/:userId/:cortesieId', deleteCortesiesController)

router.delete('/delete_rrpp_excel/:userId/:rrppListId', deleteRRPPExcelController)

export default router