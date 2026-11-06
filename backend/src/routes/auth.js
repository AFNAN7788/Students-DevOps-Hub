import { Router } from "express";
import { validate, schemas } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import * as authController from "../controllers/authController.js";

const router = Router();

// Public auth routes
router.post("/signup", validate(schemas.signup), authController.signupHandler);
router.post("/login", validate(schemas.login), authController.loginHandler);
router.post("/refresh", validate(schemas.refresh), authController.refreshHandler);
router.post(
  "/forgot-password",
  validate(schemas.forgotPassword),
  authController.forgotPasswordHandler
);
router.post(
  "/reset-password",
  validate(schemas.resetPassword),
  authController.resetPasswordHandler
);
router.post(
  "/resend-verification",
  validate(schemas.resendVerification),
  authController.resendVerificationHandler
);

// Protected auth routes
router.use(authenticate);
router.post("/logout", authController.logoutHandler);
router.post(
  "/change-password",
  validate(schemas.changePassword),
  authController.changePasswordHandler
);

export default router;
