import { Router } from "express";
import { contactController, getAllUsersController, loginController, recoverPassController, registerController } from "../controllers/userController.js";

const router = Router()

router.get('/getAllUsers', getAllUsersController)

router.post('/register', registerController)

router.post('/login', loginController)

router.post('/recover_password', recoverPassController)

router.post('/contactar', contactController)

export default router