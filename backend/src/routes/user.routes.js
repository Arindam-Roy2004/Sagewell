import {Router } from 'express';
import { isLoggedIn } from '../middlewares/auth.middlewares.js';
import { authLimiter } from '../middlewares/rateLimit.middlewares.js';
import { validate } from '../middlewares/validate.middlewares.js';
import { registerSchema, loginSchema, googleSchema } from '../validators/auth.validators.js';
import {getMe, login, logout, register, refreshAccessToken, googleLogin } from '../controllers/user.controllers.js';

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register)
router.post("/login", authLimiter, validate(loginSchema), login)
router.post("/google", authLimiter, validate(googleSchema), googleLogin)
router.post("/refresh", refreshAccessToken)
router.get("/logout", logout)

router.get("/me" , isLoggedIn, getMe)



export default router;