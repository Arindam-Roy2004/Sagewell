import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middlewares.js";
import { validate } from "../middlewares/validate.middlewares.js";
import AddTextDto from "../dto/source/add-text.dto.js";
import AddWebDto from "../dto/source/add-web.dto.js";
import PresignUploadDto from "../dto/source/presign-upload.dto.js";
import ConfirmUploadDto from "../dto/source/confirm-upload.dto.js";
import RenameSourceDto from "../dto/source/rename-source.dto.js";
import {
  confirmUpload,
  deleteSource,
  renameSource,
  getPresign,
  getSources,
  getStatus,
  getViewUrl,
  text2,
  web2,
} from "../controllers/source.controllers.js";

const router = Router();

router.post("/text", isLoggedIn, validate(AddTextDto), text2);
router.post("/presign", isLoggedIn, validate(PresignUploadDto), getPresign);
router.post("/confirm-upload", isLoggedIn, validate(ConfirmUploadDto), confirmUpload);
router.post("/web", isLoggedIn, validate(AddWebDto), web2);
router.get("/", isLoggedIn, getSources);
router.get("/:sourceId/status", isLoggedIn, getStatus);
router.get("/:sourceId/view-url", isLoggedIn, getViewUrl);
router.patch("/:sourceId", isLoggedIn, validate(RenameSourceDto), renameSource);
router.delete("/:sourceId", isLoggedIn, deleteSource);

export default router;
