import { Router } from "express";
import { sinOperadoresMongo } from "../lib/sanitizar.js";
import { requireAuth, mismoUserId } from "../lib/auth.js";
import { duenoDelEvento, excelDeCortesiasPropio, listaRRPPPropia } from "../lib/permisos.js";
import { chargeExcelController, chargeRRPPExcelController, deleteCortesiesController, deleteRRPPExcelController, getAllExcelsInfoController, getAllRRPPExcelsController, getProdCortesiesController, sendCortesiesController, sendRRPPColabsListController } from "../controllers/cortesieController.js";
import multer from "multer"

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router()

router.get('/get_event_cortesies/:userId/:prodId', requireAuth, mismoUserId((req) => req.params.userId), getAllExcelsInfoController)

router.get('/get_rrpp_event_excels/:userId/:prodId', requireAuth, mismoUserId((req) => req.params.userId), getAllRRPPExcelsController)

router.get('/get_cortesie/:cortesieId', requireAuth, excelDeCortesiasPropio((req) => req.params.cortesieId), getProdCortesiesController)

router.post('/charge_excel', requireAuth, upload.single('excelFile'), sinOperadoresMongo, mismoUserId((req) => req.body.userId), duenoDelEvento((req) => req.body.prodId), chargeExcelController)

router.post('/charge_rrpp_excel', requireAuth, upload.single('excelFile'), sinOperadoresMongo, mismoUserId((req) => req.body.userId), duenoDelEvento((req) => req.body.prodId), chargeRRPPExcelController)

router.post('/send_cortesies', requireAuth, duenoDelEvento((req) => req.body.prodId), excelDeCortesiasPropio((req) => req.body.cortesieId, (req) => req.body.prodId), sendCortesiesController)

router.post('/send_rrpp_cortesies', requireAuth, duenoDelEvento((req) => req.body.prodId), listaRRPPPropia((req) => req.body.rrppListId, (req) => req.body.prodId), sendRRPPColabsListController)

router.delete('/delete_cortesie/:userId/:cortesieId', requireAuth, mismoUserId((req) => req.params.userId), deleteCortesiesController)

router.delete('/delete_rrpp_excel/:userId/:rrppListId', requireAuth, mismoUserId((req) => req.params.userId), deleteRRPPExcelController)

export default router