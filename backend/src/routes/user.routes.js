import {Router } from 'express';
import { isLoggedIn } from '../middlewares/auth.middlewares.js';
import { authLimiter } from '../middlewares/rateLimit.middlewares.js';
import { validate } from '../middlewares/validate.middlewares.js';
import { googleSchema } from '../validators/auth.validators.js';
import { getMe, logout, refreshAccessToken, googleLogin } from '../controllers/user.controllers.js';

const router = Router();

// Sign-in is Google only.
router.post("/google", authLimiter, validate(googleSchema), googleLogin)
router.post("/refresh", refreshAccessToken)
router.get("/logout", logout)

router.get("/me" , isLoggedIn, getMe)



export default router;