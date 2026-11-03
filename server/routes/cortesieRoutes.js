import { Router } from "express";
import { requireAuth, mismoUserId } from "../lib/auth.js";
import { chargeExcelController, chargeRRPPExcelController, deleteCortesiesController, deleteRRPPExcelController, getAllExcelsInfoController, getAllRRPPExcelsController, getProdCortesiesController, sendCortesiesController, sendRRPPColabsListController } from "../controllers/cortesieController.js";
import multer from "multer"

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router()

router.get('/get_event_cortesies/:userId/:prodId', requireAuth, mismoUserId((req) => req.params.userId), getAllExcelsInfoController)

router.get('/get_rrpp_event_excels/:userId/:prodId', requireAuth, mismoUserId((req) => req.params.userId), getAllRRPPExcelsController)

router.get('/get_cortesie/:cortesieId', requireAuth, getProdCortesiesController)

router.post('/charge_excel', requireAuth, upload.single('excelFile'), mismoUserId((req) => req.body.userId), chargeExcelController)

router.post('/charge_rrpp_excel', requireAuth, upload.single('excelFile'), mismoUserId((req) => req.body.userId), chargeRRPPExcelController)

router.post('/send_cortesies', requireAuth, sendCortesiesController)

router.post('/send_rrpp_cortesies', requireAuth, sendRRPPColabsListController)

router.delete('/delete_cortesie/:userId/:cortesieId', requireAuth, mismoUserId((req) => req.params.userId), deleteCortesiesController)

router.delete('/delete_rrpp_excel/:userId/:rrppListId', requireAuth, mismoUserId((req) => req.params.userId), deleteRRPPExcelController)

export default router