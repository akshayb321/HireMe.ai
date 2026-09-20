import Resume from "../models/Resume.js";
import ATSAnalysis from "../models/ATSAnalysis.js";
import model from "../config/gemini.js";
import extractPdfText from "../utils/pdfParser.js";
import buildATSAnalysisPrompt from "../utils/prompts.js";

export const analyzeResume = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    const userId = req.user.id;

    const { jobRole } = req.body;

    if (!jobRole) {
      return res.status(400).json({
        success: false,
        message: "Job role is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume PDF is required",
      });
    }

    // Extract text from uploaded PDF
    const extractedText = await extractPdfText(req.file.buffer);

    if (!extractedText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from the resume",
      });
    }

    // Build Gemini prompt
    const prompt = buildATSAnalysisPrompt(extractedText, jobRole);

    // Send resume to Gemini
    const result = await model.generateContent(prompt);

    const responseText = result.response.text();

    // Convert Gemini response into JSON
    const atsData = JSON.parse(responseText);

    // Save / update current resume
    await Resume.findOneAndUpdate(
      { userId },
      {
        userId,
        fileName: req.file.originalname,
        extractedText,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    // Save / replace current ATS analysis
    const analysis = await ATSAnalysis.findOneAndUpdate(
      { userId },
      {
        userId,
        resumeName: req.file.originalname,
        jobRole,
        overallScore: atsData.overallScore,
        breakdown: atsData.breakdown,
        matchedKeywords: atsData.matchedKeywords,
        missingKeywords: atsData.missingKeywords,
        suggestions: atsData.suggestions,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Resume analyzed successfully",
      data: {
        resumeName: analysis.resumeName,
        jobRole: analysis.jobRole,
        overallScore: analysis.overallScore,
        breakdown: analysis.breakdown,
        matchedKeywords: analysis.matchedKeywords,
        missingKeywords: analysis.missingKeywords,
        suggestions: analysis.suggestions,
      },
    });
  } catch (error) {
    console.error("ATS analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze resume",
    });
  }
};

export const getCurrentAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;

    const analysis = await ATSAnalysis.findOne({ userId }).lean();

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "No ATS analysis found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Current ATS analysis fetched successfully",
      data: {
        resumeName: analysis.resumeName,
        jobRole: analysis.jobRole,
        overallScore: analysis.overallScore,
        breakdown: analysis.breakdown,
        matchedKeywords: analysis.matchedKeywords,
        missingKeywords: analysis.missingKeywords,
        suggestions: analysis.suggestions,
      },
    });
  } catch (error) {
    console.error("Get current ATS analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch current ATS analysis",
    });
  }
};
