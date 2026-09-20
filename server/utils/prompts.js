const buildATSAnalysisPrompt = (resumeText, jobRole) => {
  return `
You are an AI-powered ATS resume analyzer.

Analyze the following resume for the selected job role.

JOB ROLE:
${jobRole}

RESUME:
${resumeText}

Evaluate the resume based on these five categories:

1. Keywords
2. Formatting
3. Skills
4. Experience
5. Education

For each category, provide a score from 0 to 100.

Also provide:
- Overall ATS score from 0 to 100
- Matched keywords relevant to the selected job role
- Missing or recommended keywords relevant to the selected job role
- Practical suggestions to improve the resume

The overall ATS score should represent the resume's overall suitability
for the selected job role and should be consistent with the five category scores.

Return ONLY valid JSON in exactly this structure:

{
  "overallScore": 0,
  "breakdown": {
    "keywords": 0,
    "formatting": 0,
    "skills": 0,
    "experience": 0,
    "education": 0
  },
  "matchedKeywords": [],
  "missingKeywords": [],
  "suggestions": []
}

Rules:
- All scores must be numbers between 0 and 100.
- Do not include explanations outside the JSON.
- Do not use markdown code fences.
- Do not invent experience, education, skills, or keywords that are not supported by the resume.
- Judge the resume specifically for the selected job role.
`;
};

export default buildATSAnalysisPrompt;
