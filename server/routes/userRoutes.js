import { Router } from "express";
import { contactController, getAllUsersController, getMySavedEventsController, loginController, newPasswordController, recoverPassController, registerController, saveEventsController } from "../controllers/userController.js";

const router = Router()

router.get('/getAllUsers', getAllUsersController)

router.post('/register', registerController)

router.post('/login', loginController)

router.post('/recover_password', recoverPassController)

router.post('/new_password', newPasswordController)

router.post('/contactar', contactController)

router.post('/save_event', saveEventsController)

router.post('/obtain_saved_event', getMySavedEventsController)

export default router