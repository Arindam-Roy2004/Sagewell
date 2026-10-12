import { Router } from "express";
import { isLoggedIn, isAdmin } from "../middlewares/auth.middlewares.js";
import { validate } from "../middlewares/validate.middlewares.js";
import GrantCreditsDto from "../dto/admin/grant-credits.dto.js";
import { getOverview, listUsers, getUser, listSignIns, addCredits } from "../controllers/admin.controllers.js";

const router = Router();

// Admins only (role "admin" or ADMIN_EMAIL).
router.use(isLoggedIn, isAdmin);

router.get("/overview", getOverview);
router.get("/users", listUsers);
router.get("/users/:userId", getUser);
router.post("/users/:userId/credits", validate(GrantCreditsDto), addCredits);
router.get("/sign-ins", listSignIns);

export default router;
