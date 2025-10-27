import { Router } from "express";
import { contactController, getAllUsersController, getMySavedEventsController, loginController, newPasswordController, recoverPassController, registerController, saveEventsController, createSellerController, getUserProfileController, verifyAccountController } from "../controllers/userController.js";
import multer from "multer"
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router()

router.post('/get_profile', getUserProfileController)

router.get('/getAllUsers', getAllUsersController)

router.post('/register', registerController)

router.post('/login', loginController)

router.post('/recover_password', recoverPassController)

router.post('/new_password', newPasswordController)

router.post('/contactar', contactController)

router.post('/save_event', saveEventsController)

router.post('/obtain_saved_event', getMySavedEventsController)

router.get('/verify_account/:token', verifyAccountController)

router.post('/create_seller_profile', upload.single('productoraImg'), createSellerController)

export default router