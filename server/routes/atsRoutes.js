import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

import {
  analyzeResume,
  getCurrentAnalysis,
} from "../controllers/atsController.js";

const atsRouter = express.Router();

atsRouter.post(
  "/analyze",
  authMiddleware,
  upload.single("resume"),
  analyzeResume,
);

atsRouter.get("/current", authMiddleware, getCurrentAnalysis);

export default atsRouter;
