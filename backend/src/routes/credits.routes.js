import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middlewares.js";
import { getCredits } from "../controllers/credits.controllers.js";

const router = Router();

router.get("/", isLoggedIn, getCredits);

export default router;
