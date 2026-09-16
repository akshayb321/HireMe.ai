import express from "express";

import {
  sendSignupOtp,
  verifySignupOtp,
  completeSignup,
  login,
  sendResetOtp,
  verifyResetOtp,
  resetPassword,
} from "../controllers/authController.js";

import {
  signupValidation,
  completeSignupValidation,
  loginValidation,
  passwordValidation,
  emailValidation,
} from "../middlewares/authValidation.js";

const router = express.Router();

/* =========================
   SIGNUP ROUTES
========================= */

router.post("/signup/send-otp", signupValidation, sendSignupOtp);

router.post("/signup/verify-otp", verifySignupOtp);

router.post("/signup/complete", completeSignupValidation, completeSignup);

/* =========================
   LOGIN ROUTE
========================= */

router.post("/login", loginValidation, login);

/* =========================
   FORGOT PASSWORD ROUTES
========================= */

router.post("/forgot-password/send-otp", emailValidation, sendResetOtp);

router.post("/forgot-password/verify-otp", verifyResetOtp);

router.post("/forgot-password/reset", passwordValidation, resetPassword);

export default router;
