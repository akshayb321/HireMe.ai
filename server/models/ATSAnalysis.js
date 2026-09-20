import mongoose from "mongoose";

const atsAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    resumeName: {
      type: String,
      required: true,
      trim: true,
    },

    jobRole: {
      type: String,
      required: true,
      trim: true,
    },

    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    breakdown: {
      keywords: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },

      formatting: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },

      skills: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },

      experience: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },

      education: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
    },

    matchedKeywords: {
      type: [String],
      default: [],
    },

    missingKeywords: {
      type: [String],
      default: [],
    },

    suggestions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const ATSAnalysis = mongoose.model("ATSAnalysis", atsAnalysisSchema);

export default ATSAnalysis;
