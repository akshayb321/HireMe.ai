import Groq from "groq-sdk";

import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const model = {
  async generateContent(prompt) {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.7,

      response_format: {
        type: "json_object",
      },
    });

    const responseText = completion.choices?.[0]?.message?.content || "";

    return {
      response: {
        text: () => responseText,
      },
    };
  },
};

export default model;
