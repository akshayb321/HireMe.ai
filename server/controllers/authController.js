import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Otp from "../models/Otp.js";

import sendEmail from "../utils/email/sendEmail.js";

import {
  signupOtpEmailTemplate,
  resetOtpEmailTemplate,
  welcomeEmailTemplate,
} from "../utils/email/emailTemplates.js";

import { generateOtp, hashOtp } from "../utils/email/otp.js";

/* =========================
   SIGNUP - SEND OTP
========================= */

export const sendSignupOtp = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await Otp.deleteMany({
      email,
      purpose: "signup",
    });

    await Otp.create({
      email,
      otpHash,
      purpose: "signup",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      verified: false,
    });

    await sendEmail(email, "HireMe.ai Signup OTP", signupOtpEmailTemplate(otp));

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send Signup OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

/* =========================
   SIGNUP - VERIFY OTP
========================= */

export const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const otpRecord = await Otp.findOne({
      email,
      purpose: "signup",
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (otpRecord.verified) {
      return res.status(200).json({
        success: true,
        message: "Email already verified",
      });
    }

    if (otpRecord.attempts >= 3) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    const isOtpValid = await bcrypt.compare(otp.toString(), otpRecord.otpHash);

    if (!isOtpValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify Signup OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
};

/* =========================
   SIGNUP - COMPLETE
========================= */

export const completeSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const otpRecord = await Otp.findOne({
      email,
      purpose: "signup",
      verified: true,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message: "Email verification has expired. Please verify again.",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const jwtToken = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    await sendEmail(
      email,
      "Welcome to HireMe.ai 🎉",
      welcomeEmailTemplate(name),
    );

    await Otp.deleteOne({
      _id: otpRecord._id,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      jwtToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Complete Signup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/* =========================
   LOGIN
========================= */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({
      email,
    });

    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isPassMatch = await bcrypt.compare(password, existingUser.password);

    if (!isPassMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const jwtToken = jwt.sign(
      {
        id: existingUser._id,
        email: existingUser.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      jwtToken,
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/* =========================
   RESET PASSWORD - SEND OTP
========================= */

export const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await Otp.deleteMany({
      email,
      purpose: "reset-password",
    });

    await Otp.create({
      email,
      otpHash,
      purpose: "reset-password",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      verified: false,
    });

    await sendEmail(
      email,
      "HireMe.ai Password Reset OTP",
      resetOtpEmailTemplate(otp),
    );

    return res.status(200).json({
      success: true,
      message: "Password reset OTP sent successfully",
    });
  } catch (error) {
    console.error("Send Reset OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send password reset OTP",
    });
  }
};

/* =========================
   RESET PASSWORD - VERIFY OTP
========================= */

export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const otpRecord = await Otp.findOne({
      email,
      purpose: "reset-password",
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (otpRecord.verified) {
      return res.status(200).json({
        success: true,
        message: "Email already verified",
      });
    }

    if (otpRecord.attempts >= 3) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    const isOtpValid = await bcrypt.compare(otp.toString(), otpRecord.otpHash);

    if (!isOtpValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify Reset OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
};

/* =========================
   RESET PASSWORD - COMPLETE
========================= */

export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const otpRecord = await Otp.findOne({
      email,
      purpose: "reset-password",
      verified: true,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message: "Password reset session has expired. Please verify again.",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (!existingUser) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    existingUser.password = hashedPassword;

    await existingUser.save();

    await Otp.deleteOne({
      _id: otpRecord._id,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};
