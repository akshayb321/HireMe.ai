import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

import {
  startInterview,
  submitAnswer,
  completeInterview,
  getInterviewReport,
  getPastInterviews,
} from "../controllers/interviewController.js";

const interviewRouter = express.Router();

/* =========================================================
   START INTERVIEW
   Manual / Existing Resume / New PDF
========================================================= */

interviewRouter.post(
  "/start",
  authMiddleware,
  upload.single("resume"),
  startInterview,
);

/* =========================================================
   SUBMIT ANSWER
========================================================= */

interviewRouter.post("/:id/answer", authMiddleware, submitAnswer);

/* =========================================================
   COMPLETE INTERVIEW
========================================================= */

interviewRouter.post("/:id/complete", authMiddleware, completeInterview);
/* =========================================================
   GET PAST INTERVIEWS
========================================================= */

interviewRouter.get("/past", authMiddleware, getPastInterviews);

/* =========================================================
   GET SINGLE INTERVIEW REPORT
========================================================= */

interviewRouter.get("/:id", authMiddleware, getInterviewReport);

export default interviewRouter;
