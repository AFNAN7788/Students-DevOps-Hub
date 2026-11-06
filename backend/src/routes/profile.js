import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validate.js";
import {
  getProfileHandler,
  updateProfileHandler,
} from "../controllers/profileController.js";

const router = Router();

router.use(authenticate);

router.get("/", getProfileHandler);
router.patch("/", validate(schemas.updateProfile), updateProfileHandler);

export default router;
