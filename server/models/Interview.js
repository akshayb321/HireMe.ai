import mongoose from "mongoose";

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      default: "",
      trim: true,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    feedback: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    resume: {
      fileName: {
        type: String,
        trim: true,
        default: "",
      },

      extractedText: {
        type: String,
        default: "",
      },
    },

    manualProfile: {
      name: {
        type: String,
        trim: true,
        default: "",
      },

      experience: {
        type: String,
        trim: true,
        default: "",
      },

      skills: {
        type: String,
        trim: true,
        default: "",
      },

      about: {
        type: String,
        trim: true,
        default: "",
      },
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    interviewType: {
      type: String,
      enum: ["technical", "behavioral", "mixed"],
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },

    questionCount: {
      type: Number,
      enum: [5, 10, 15],
      required: true,
    },

    questions: {
      type: [interviewQuestionSchema],
      default: [],
    },

    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    technicalScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    communicationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    problemSolvingScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    summary: {
      type: String,
      default: "",
      trim: true,
    },

    strengths: {
      type: [String],
      default: [],
    },

    improvements: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
  },
  {
    timestamps: true,
  },
);

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;
