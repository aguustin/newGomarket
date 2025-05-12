import { Router } from "express";
import { getAllUsersController, loginController, registerController } from "../controllers/userController.js";

const router = Router()

router.get('/getAllUsers', getAllUsersController)

router.post('/register', registerController)

router.post('/login', loginController)

export default router