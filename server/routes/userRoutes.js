import { Router } from "express";
import { sinOperadoresMongo } from "../lib/sanitizar.js";
import { requireAuth, mismoUserId } from "../lib/auth.js";
import { limites } from "../lib/limites.js";
import { contactController, getAllUsersController, getMySavedEventsController, loginController, newPasswordController, recoverPassController, registerController, saveEventsController, createSellerController, getUserProfileController, getFavoritesEventsController, verifyAccountController } from "../controllers/userController.js";
import multer from "multer"

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router()

router.post('/get_profile', getUserProfileController)

router.get('/getAllUsers', getAllUsersController)

router.post('/register', limites.registro, registerController)

router.post('/login', limites.login, loginController)

router.post('/recover_password', limites.recuperar, recoverPassController)

router.post('/new_password', limites.nuevaContrasenia, newPasswordController)

router.post('/contactar', limites.contacto, contactController)

router.post('/save_event', requireAuth, mismoUserId((req) => req.body.userId), saveEventsController)

router.post('/obtain_saved_event', requireAuth, mismoUserId((req) => req.body.userId), getMySavedEventsController)

router.get('/verify_account/:token', verifyAccountController)

router.post('/create_seller_profile', requireAuth, upload.single('productoraImg'), sinOperadoresMongo, mismoUserId((req) => req.body.userId), createSellerController)

router.post('/get_favorites', requireAuth, mismoUserId((req) => req.body.userId), getFavoritesEventsController)

export default router