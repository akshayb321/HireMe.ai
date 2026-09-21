import Interview from "../models/Interview.js";
import Resume from "../models/Resume.js";
import model from "../config/groq.js";

import extractPdfText from "../utils/pdfParser.js";

import {
  buildNextInterviewQuestionPrompt,
  buildAnswerEvaluationPrompt,
  buildFinalReportPrompt,
} from "../utils/prompts.js";

/* =========================================================
   PARSE AI JSON
========================================================= */

const parseAIJson = (responseText) => {
  const cleanedText = responseText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleanedText);
};

/* =========================================================
   START INTERVIEW
========================================================= */

export const startInterview = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      role,
      interviewType,
      difficulty,
      questionCount,
      manualMode,
      manualDetails,
      useExistingResume,
    } = req.body;

    /* -------------------------------------------------------
       BASIC VALIDATION
    ------------------------------------------------------- */

    if (!role || !interviewType || !difficulty || !questionCount) {
      return res.status(400).json({
        success: false,
        message: "Interview configuration is incomplete",
      });
    }

    if (![5, 10, 15].includes(Number(questionCount))) {
      return res.status(400).json({
        success: false,
        message: "Question count must be 5, 10, or 15",
      });
    }

    if (!["technical", "behavioral", "mixed"].includes(interviewType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview type",
      });
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty",
      });
    }

    /* -------------------------------------------------------
       PARSE MANUAL DETAILS
    ------------------------------------------------------- */

    let parsedManualDetails = manualDetails;

    if (typeof manualDetails === "string") {
      try {
        parsedManualDetails = JSON.parse(manualDetails);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid manual profile data",
        });
      }
    }

    /* -------------------------------------------------------
       DEFAULT DATA
    ------------------------------------------------------- */

    let resumeData = {
      fileName: "",
      extractedText: "",
    };

    let manualProfile = {
      name: "",
      experience: "",
      skills: "",
      about: "",
    };

    /* =======================================================
       OPTION 1: MANUAL PROFILE
    ======================================================= */

    if (manualMode === true || manualMode === "true") {
      if (!parsedManualDetails?.name?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name is required for manual profile",
        });
      }

      manualProfile = {
        name: parsedManualDetails.name.trim(),
        experience: parsedManualDetails.experience?.trim() || "",
        skills: parsedManualDetails.skills?.trim() || "",
        about: parsedManualDetails.about?.trim() || "",
      };
    } else if (req.file) {
      /* =======================================================
         OPTION 2: NEW PDF UPLOAD
      ======================================================= */

      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({
          success: false,
          message: "Only PDF files are allowed",
        });
      }

      const extractedText = await extractPdfText(req.file.buffer);

      if (!extractedText.trim()) {
        return res.status(400).json({
          success: false,
          message: "Could not extract text from the resume",
        });
      }

      resumeData = {
        fileName: req.file.originalname,
        extractedText,
      };

      /* -------------------------------------------------------
         SAVE / UPDATE CURRENT RESUME
      ------------------------------------------------------- */

      await Resume.findOneAndUpdate(
        { userId },
        {
          userId,
          fileName: req.file.originalname,
          extractedText,
        },
        {
          returnDocument: "after",
          upsert: true,
          runValidators: true,
        },
      );
    } else if (useExistingResume === true || useExistingResume === "true") {
      /* =======================================================
         OPTION 3: EXISTING RESUME
      ======================================================= */

      const existingResume = await Resume.findOne({
        userId,
      }).lean();

      if (!existingResume) {
        return res.status(404).json({
          success: false,
          message: "No existing resume found",
        });
      }

      if (!existingResume.extractedText?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Existing resume has no extracted text",
        });
      }

      resumeData = {
        fileName: existingResume.fileName,
        extractedText: existingResume.extractedText,
      };
    } else {
      /* =======================================================
         NO PROFILE / RESUME PROVIDED
      ======================================================= */

      return res.status(400).json({
        success: false,
        message:
          "Please provide a manual profile, upload a new resume, or select an existing resume",
      });
    }

    /* =======================================================
       CREATE INTERVIEW
    ======================================================= */

    const interview = await Interview.create({
      userId,

      resume: resumeData,

      manualProfile,

      role,

      interviewType,

      difficulty,

      questionCount: Number(questionCount),

      questions: [],

      status: "in-progress",
    });

    /* =======================================================
       GENERATE FIRST QUESTION
    ======================================================= */

    const prompt = buildNextInterviewQuestionPrompt(
      resumeData.extractedText,
      manualProfile,
      role,
      interviewType,
      difficulty,
      Number(questionCount),
      1,
      [],
    );

    const result = await model.generateContent(prompt);

    const responseText = result.response.text();

    const questionData = parseAIJson(responseText);

    if (!questionData.question) {
      return res.status(500).json({
        success: false,
        message: "AI failed to generate the first interview question",
      });
    }

    /* -------------------------------------------------------
       SAVE FIRST QUESTION
    ------------------------------------------------------- */

    interview.questions.push({
      question: questionData.question,
    });

    await interview.save();

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    return res.status(201).json({
      success: true,
      message: "Interview started successfully",
      data: {
        interviewId: interview._id,
        questionNumber: 1,
        totalQuestions: interview.questionCount,
        question: questionData.question,
      },
    });
  } catch (error) {
    console.error("Start interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start interview",
    });
  }
};

/* =========================================================
   SUBMIT ANSWER
========================================================= */

export const submitAnswer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { answer } = req.body;

    /* -------------------------------------------------------
       BASIC VALIDATION
    ------------------------------------------------------- */

    if (!answer || !answer.trim()) {
      return res.status(400).json({
        success: false,
        message: "Answer is required",
      });
    }

    /* -------------------------------------------------------
       FIND INTERVIEW
    ------------------------------------------------------- */

    const interview = await Interview.findOne({
      _id: id,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    /* -------------------------------------------------------
       CHECK INTERVIEW STATUS
    ------------------------------------------------------- */

    if (interview.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Interview is already completed",
      });
    }

    /* -------------------------------------------------------
       GET CURRENT QUESTION
    ------------------------------------------------------- */

    const currentQuestionIndex = interview.questions.length - 1;

    const currentQuestion = interview.questions[currentQuestionIndex];

    if (!currentQuestion) {
      return res.status(400).json({
        success: false,
        message: "No active interview question found",
      });
    }

    /* -------------------------------------------------------
       PREVENT DUPLICATE ANSWER
    ------------------------------------------------------- */

    if (currentQuestion.answer) {
      return res.status(400).json({
        success: false,
        message: "Answer for this question has already been submitted",
      });
    }

    /* =======================================================
       DETERMINE QUESTION NUMBER
    ======================================================= */

    const currentQuestionNumber = interview.questions.length;

    const totalQuestions = interview.questionCount;

    const isFinalQuestion = currentQuestionNumber >= totalQuestions;

    /* =======================================================
       EVALUATE CURRENT ANSWER
    ======================================================= */

    const evaluationPrompt = buildAnswerEvaluationPrompt(
      interview.role,
      interview.interviewType,
      interview.difficulty,
      currentQuestion.question,
      answer.trim(),
      interview.resume.extractedText,
      interview.questions,
      isFinalQuestion,
    );

    const evaluationResult = await model.generateContent(evaluationPrompt);

    const evaluationText = evaluationResult.response.text();

    const evaluationData = parseAIJson(evaluationText);

    /* -------------------------------------------------------
       VALIDATE AI EVALUATION
    ------------------------------------------------------- */

    if (
      typeof evaluationData.score !== "number" ||
      !evaluationData.feedback ||
      !evaluationData.transition
    ) {
      return res.status(500).json({
        success: false,
        message: "AI failed to properly evaluate the answer",
      });
    }

    /* =======================================================
       SAVE ANSWER + EVALUATION
    ======================================================= */

    currentQuestion.answer = answer.trim();

    currentQuestion.score = evaluationData.score;

    currentQuestion.feedback = evaluationData.feedback;

    currentQuestion.transition = evaluationData.transition;

    /* =======================================================
       FINAL QUESTION
    ======================================================= */

    if (isFinalQuestion) {
      /* -----------------------------------------------------
         GENERATE FINAL REPORT
      ----------------------------------------------------- */

      const finalReportPrompt = buildFinalReportPrompt(
        interview.role,
        interview.interviewType,
        interview.difficulty,
        interview.questions,
      );

      const finalReportResult = await model.generateContent(finalReportPrompt);

      const finalReportText = finalReportResult.response.text();

      const finalReportData = parseAIJson(finalReportText);

      /* -----------------------------------------------------
         VALIDATE FINAL REPORT
      ----------------------------------------------------- */

      if (
        typeof finalReportData.overallScore !== "number" ||
        typeof finalReportData.technicalScore !== "number" ||
        typeof finalReportData.communicationScore !== "number" ||
        typeof finalReportData.problemSolvingScore !== "number"
      ) {
        return res.status(500).json({
          success: false,
          message: "AI failed to generate the final interview report",
        });
      }

      /* -----------------------------------------------------
         SAVE FINAL REPORT
      ----------------------------------------------------- */

      interview.overallScore = finalReportData.overallScore;

      interview.technicalScore = finalReportData.technicalScore;

      interview.communicationScore = finalReportData.communicationScore;

      interview.problemSolvingScore = finalReportData.problemSolvingScore;

      interview.summary = finalReportData.summary || "";

      interview.strengths = finalReportData.strengths || [];

      interview.improvements = finalReportData.improvements || [];

      interview.status = "completed";

      await interview.save();

      /* -----------------------------------------------------
         FINAL RESPONSE
         IMPORTANT:
         NO nextQuestion here
      ----------------------------------------------------- */

      return res.status(200).json({
        success: true,
        message: "Interview completed successfully",
        data: {
          interviewId: interview._id,
          questionNumber: currentQuestionNumber,
          totalQuestions,
          isCompleted: true,
          score: evaluationData.score,
          feedback: evaluationData.feedback,
          transition: evaluationData.transition,
        },
      });
    }

    /* =======================================================
       GENERATE NEXT DYNAMIC QUESTION
    ======================================================= */

    const nextQuestionNumber = currentQuestionNumber + 1;

    const nextQuestionPrompt = buildNextInterviewQuestionPrompt(
      interview.resume.extractedText,
      interview.manualProfile,
      interview.role,
      interview.interviewType,
      interview.difficulty,
      totalQuestions,
      nextQuestionNumber,
      interview.questions,
    );

    const nextQuestionResult = await model.generateContent(nextQuestionPrompt);

    const nextQuestionText = nextQuestionResult.response.text();

    const nextQuestionData = parseAIJson(nextQuestionText);

    /* -------------------------------------------------------
       VALIDATE NEXT QUESTION
    ------------------------------------------------------- */

    if (!nextQuestionData.question) {
      return res.status(500).json({
        success: false,
        message: "AI failed to generate the next question",
      });
    }

    /* -------------------------------------------------------
       SAVE NEXT QUESTION
    ------------------------------------------------------- */

    interview.questions.push({
      question: nextQuestionData.question,
    });

    await interview.save();

    /* -------------------------------------------------------
       NORMAL RESPONSE
    ------------------------------------------------------- */

    return res.status(200).json({
      success: true,
      message: "Answer evaluated successfully",
      data: {
        interviewId: interview._id,
        questionNumber: nextQuestionNumber,
        totalQuestions,
        isCompleted: false,
        score: evaluationData.score,
        feedback: evaluationData.feedback,
        transition: evaluationData.transition,
        nextQuestion: nextQuestionData.question,
      },
    });
  } catch (error) {
    console.error("Submit answer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process interview answer",
    });
  }
};

/* =========================================================
   COMPLETE INTERVIEW
========================================================= */

export const completeInterview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const interview = await Interview.findOne({
      _id: id,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    /* -------------------------------------------------------
       ALREADY COMPLETED
    ------------------------------------------------------- */

    if (interview.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Interview is already completed",
        data: {
          interviewId: interview._id,
          overallScore: interview.overallScore,
        },
      });
    }

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (interview.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Interview has no questions",
      });
    }

    /* -------------------------------------------------------
       GENERATE FINAL REPORT
    ------------------------------------------------------- */

    const finalReportPrompt = buildFinalReportPrompt(
      interview.role,
      interview.interviewType,
      interview.difficulty,
      interview.questions,
    );

    const result = await model.generateContent(finalReportPrompt);

    const responseText = result.response.text();

    const reportData = parseAIJson(responseText);

    /* -------------------------------------------------------
       SAVE REPORT
    ------------------------------------------------------- */

    interview.overallScore = reportData.overallScore;

    interview.technicalScore = reportData.technicalScore;

    interview.communicationScore = reportData.communicationScore;

    interview.problemSolvingScore = reportData.problemSolvingScore;

    interview.summary = reportData.summary || "";

    interview.strengths = reportData.strengths || [];

    interview.improvements = reportData.improvements || [];

    interview.status = "completed";

    await interview.save();

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    return res.status(200).json({
      success: true,
      message: "Interview completed successfully",
      data: {
        interviewId: interview._id,
        overallScore: interview.overallScore,
      },
    });
  } catch (error) {
    console.error("Complete interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete interview",
    });
  }
};

/* =========================================================
   END INTERVIEW
========================================================= */
export const endInterview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const interview = await Interview.findOne({
      _id: id,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Interview is already completed",
      });
    }

    interview.status = "completed";
    interview.completedAt = new Date();

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Interview ended successfully",
      data: {
        interviewId: interview._id,
        status: interview.status,
      },
    });
  } catch (error) {
    console.error("End interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to end interview",
    });
  }
};
/* =========================================================
   GET SINGLE INTERVIEW REPORT
========================================================= */

export const getInterviewReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const interview = await Interview.findOne({
      _id: id,
      userId,
    }).lean();

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview report fetched successfully",
      data: interview,
    });
  } catch (error) {
    console.error("Get interview report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch interview report",
    });
  }
};

/* =========================================================
   GET PAST INTERVIEWS
========================================================= */

export const getPastInterviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const interviews = await Interview.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .select(
        "role interviewType difficulty questionCount overallScore status createdAt updatedAt",
      )
      .lean();

    return res.status(200).json({
      success: true,
      message: "Past interviews fetched successfully",
      data: interviews,
    });
  } catch (error) {
    console.error("Get past interviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch past interviews",
    });
  }
};
