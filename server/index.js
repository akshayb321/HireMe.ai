import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import atsRouter from "./routes/atsRoutes.js";
import interviewRouter from "./routes/interviewRoutes.js";

dotenv.config();
connectDB();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use("/api/auth", authRouter);
app.use("/api/ats", atsRouter);
app.use("/api/interviews", interviewRouter);
