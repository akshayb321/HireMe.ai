import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const sendEmail = async (to, subject, html) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: process.env.MAIL_FROM_NAME || "HireMe.ai",
          email: process.env.MAIL_FROM_EMAIL,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
        timeout: 15000,
      },
    );

    console.log("Email sent successfully");

    return response.data;
  } catch (error) {
    console.error("Brevo Email Error:", error.response?.data || error.message);

    throw error;
  }
};

export default sendEmail;
