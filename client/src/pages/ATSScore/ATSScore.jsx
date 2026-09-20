import { useState } from "react";
import "./ATSScore.css";

const ATSScore = () => {
  const [resumeName, setResumeName] = useState("Akshay_Bachhav_Resume.pdf");

  // Temporary data
  // Later API se actual ATS analysis aayega
  const atsData = {
    score: 84,

    breakdown: [
      {
        label: "Keywords",
        score: 88,
        icon: "fa-solid fa-key",
      },
      {
        label: "Formatting",
        score: 92,
        icon: "fa-solid fa-file-lines",
      },
      {
        label: "Skills",
        score: 86,
        icon: "fa-solid fa-code",
      },
      {
        label: "Experience",
        score: 76,
        icon: "fa-solid fa-briefcase",
      },
      {
        label: "Education",
        score: 90,
        icon: "fa-solid fa-graduation-cap",
      },
    ],

    matchedKeywords: [
      "React.js",
      "JavaScript",
      "Node.js",
      "MongoDB",
      "Express.js",
      "REST API",
      "Git",
      "GitHub",
    ],

    missingKeywords: ["TypeScript", "Next.js", "AWS", "Docker", "CI/CD"],

    suggestions: [
      "Add more role-specific keywords from the job description.",
      "Mention measurable results in your project descriptions.",
      "Add TypeScript if it is relevant to your target role.",
      "Keep technical skills grouped into clear categories.",
    ],
  };

  const handleResumeUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setResumeName(file.name);
  };

  return (
    <div className="ats-score">
      <div className="ats-score-container">
        {/* Header */}
        <section className="ats-header">
          <div>
            <p className="ats-eyebrow">Resume Analysis</p>

            <h1>ATS Score</h1>

            <p className="ats-subtitle">
              Check how well your resume is optimized for Applicant Tracking
              Systems and improve your chances of getting noticed.
            </p>
          </div>
        </section>

        {/* Resume Upload */}
        <section className="ats-upload-card">
          <div className="ats-upload-left">
            <div className="ats-upload-icon">
              <i className="fa-regular fa-file-lines"></i>
            </div>

            <div>
              <p className="ats-card-label">Current Resume</p>

              <h2>{resumeName}</h2>

              <span>PDF • Ready for analysis</span>
            </div>
          </div>

          <div className="ats-upload-actions">
            <label htmlFor="resume-upload" className="ats-upload-btn">
              <i className="fa-solid fa-arrow-up-from-bracket"></i>
              Upload New Resume
            </label>

            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
              hidden
            />

            <button type="button" className="ats-analyze-btn">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              Analyze Resume
            </button>
          </div>
        </section>

        {/* Score Overview */}
        <section className="ats-overview">
          <div className="ats-main-score-card">
            <div className="ats-score-circle">
              <div className="ats-score-circle-inner">
                <strong>{atsData.score}</strong>
                <span>/ 100</span>
              </div>
            </div>

            <div className="ats-main-score-content">
              <p className="ats-card-label">Overall ATS Score</p>

              <h2>Good Resume Match</h2>

              <p>
                Your resume is well optimized for ATS systems, but there are a
                few areas you can improve.
              </p>
            </div>
          </div>

          <div className="ats-score-info-card">
            <div className="ats-info-icon">
              <i className="fa-solid fa-circle-info"></i>
            </div>

            <div>
              <h3>What does this score mean?</h3>

              <p>
                ATS systems scan resumes for relevant keywords, structure,
                skills, and job-specific information. A higher score indicates
                better optimization.
              </p>
            </div>
          </div>
        </section>

        {/* Score Breakdown */}
        <section className="ats-section">
          <div className="ats-section-heading">
            <p>Analysis</p>
            <h2>Score Breakdown</h2>
          </div>

          <div className="ats-breakdown-grid">
            {atsData.breakdown.map((item) => (
              <div className="ats-breakdown-card" key={item.label}>
                <div className="ats-breakdown-top">
                  <div className="ats-breakdown-icon">
                    <i className={item.icon}></i>
                  </div>

                  <strong>{item.score}%</strong>
                </div>

                <h3>{item.label}</h3>

                <div className="ats-progress">
                  <span
                    style={{
                      width: `${item.score}%`,
                    }}
                  ></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Keywords */}
        <section className="ats-section">
          <div className="ats-section-heading">
            <p>Keywords</p>
            <h2>Keyword Analysis</h2>
          </div>

          <div className="ats-keywords-grid">
            {/* Matched */}
            <div className="ats-keyword-card">
              <div className="ats-keyword-header">
                <div>
                  <p>Matched</p>
                  <h3>Keywords Found</h3>
                </div>

                <span className="ats-keyword-count">
                  {atsData.matchedKeywords.length}
                </span>
              </div>

              <div className="ats-keywords">
                {atsData.matchedKeywords.map((keyword) => (
                  <span className="ats-keyword matched" key={keyword}>
                    <i className="fa-solid fa-check"></i>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing */}
            <div className="ats-keyword-card">
              <div className="ats-keyword-header">
                <div>
                  <p>Missing</p>
                  <h3>Recommended Keywords</h3>
                </div>

                <span className="ats-keyword-count">
                  {atsData.missingKeywords.length}
                </span>
              </div>

              <div className="ats-keywords">
                {atsData.missingKeywords.map((keyword) => (
                  <span className="ats-keyword missing" key={keyword}>
                    <i className="fa-solid fa-plus"></i>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Suggestions */}
        <section className="ats-section">
          <div className="ats-section-heading">
            <p>AI Recommendations</p>
            <h2>How to Improve Your Resume</h2>
          </div>

          <div className="ats-suggestions-card">
            {atsData.suggestions.map((suggestion, index) => (
              <div className="ats-suggestion" key={suggestion}>
                <div className="ats-suggestion-number">{index + 1}</div>

                <p>{suggestion}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ATSScore;
