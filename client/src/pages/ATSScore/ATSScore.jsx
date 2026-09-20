import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../config/api.js";
import "./ATSScore.css";

const roleOptions = [
  "Full Stack MERN Developer",
  "Frontend Developer",
  "Backend Developer",
  "React Developer",
  "Node.js Developer",
  "Software Developer",
  "JavaScript Developer",
  "Other",
];

const breakdownConfig = [
  {
    key: "keywords",
    label: "Keywords",
    icon: "fa-solid fa-key",
  },
  {
    key: "formatting",
    label: "Formatting",
    icon: "fa-solid fa-file-lines",
  },
  {
    key: "skills",
    label: "Skills",
    icon: "fa-solid fa-code",
  },
  {
    key: "experience",
    label: "Experience",
    icon: "fa-solid fa-briefcase",
  },
  {
    key: "education",
    label: "Education",
    icon: "fa-solid fa-graduation-cap",
  },
];

const ATSScore = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState("");

  const [jobRole, setJobRole] = useState("");
  const [customRole, setCustomRole] = useState("");

  const [atsData, setAtsData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const selectedRole = jobRole === "Other" ? customRole.trim() : jobRole;

  // Load the user's current ATS analysis from the backend.
  // This restores the result when the user returns to this page
  // or refreshes the browser.
  const loadCurrentAnalysis = async () => {
    try {
      setPageLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setPageLoading(false);
        return;
      }

      const response = await api.get("/ats/current", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;

        setAtsData(data);
        setResumeName(data.resumeName || "");

        // Restore the saved role in the same select/custom-input
        // structure used by the ATS page.
        if (roleOptions.includes(data.jobRole)) {
          setJobRole(data.jobRole);
          setCustomRole("");
        } else {
          setJobRole("Other");
          setCustomRole(data.jobRole || "");
        }
      }
    } catch (error) {
      // 404 simply means the user has not analyzed a resume yet.
      // In that case the initial ATS state should remain visible.
      if (error.response?.status !== 404) {
        toast.error(
          error.response?.data?.message || "Failed to load your ATS analysis",
        );
      }
    } finally {
      setPageLoading(false);
    }
  };

  // Load the latest saved ATS analysis when the page opens.
  useEffect(() => {
    loadCurrentAnalysis();
  }, []);

  const handleResumeUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setResumeFile(null);
      setResumeName("");
      setAtsData(null);

      toast.error("Please upload a PDF resume only.");
      return;
    }

    setResumeFile(file);
    setResumeName(file.name);

    // A newly selected resume has not been analyzed yet,
    // so hide the previously displayed analysis.
    setAtsData(null);
  };

  const handleJobRoleChange = (event) => {
    const value = event.target.value;

    setJobRole(value);

    if (value !== "Other") {
      setCustomRole("");
    }

    // If the selected role is different from the saved analysis,
    // the current analysis should not be shown as the new result.
    if (value !== atsData?.jobRole) {
      setAtsData(null);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeFile) {
      toast.error("Please upload your resume PDF first.");
      return;
    }

    if (!selectedRole) {
      toast.error("Please select or enter your target job role.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }

      const formData = new FormData();

      formData.append("resume", resumeFile);
      formData.append("jobRole", selectedRole);

      const response = await api.post("/ats/analyze", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;

        // The backend replaces the user's previous analysis,
        // so this becomes the latest/current result.
        setAtsData(data);
        setResumeName(data.resumeName || resumeFile.name);

        if (roleOptions.includes(data.jobRole)) {
          setJobRole(data.jobRole);
          setCustomRole("");
        } else {
          setJobRole("Other");
          setCustomRole(data.jobRole || "");
        }

        toast.success(response.data.message || "Resume analyzed successfully");
      }
    } catch (error) {
      console.error("ATS analysis error:", error);

      toast.error(
        error.response?.data?.message ||
          "Something went wrong while analyzing your resume.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getScoreTitle = (score) => {
    if (score >= 80) return "Excellent Resume Match";
    if (score >= 65) return "Good Resume Match";
    if (score >= 50) return "Average Resume Match";
    return "Resume Needs Improvement";
  };

  const getScoreDescription = (score) => {
    if (score >= 80) {
      return "Your resume is strongly optimized for the selected role, with only a few areas that may need improvement.";
    }

    if (score >= 65) {
      return "Your resume has a good match for the selected role, but there are a few areas you can improve.";
    }

    if (score >= 50) {
      return "Your resume has a moderate match for the selected role. Improving the highlighted areas can make it stronger.";
    }

    return "Your resume currently has several areas that could be improved for the selected role.";
  };

  const breakdown = atsData
    ? breakdownConfig.map((item) => ({
        ...item,
        score: atsData.breakdown?.[item.key] ?? 0,
      }))
    : [];

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

        {/* Resume Upload + Job Role */}
        <section className="ats-upload-card">
          <div className="ats-upload-left">
            <div className="ats-upload-icon">
              <i className="fa-regular fa-file-lines"></i>
            </div>

            <div>
              <p className="ats-card-label">Current Resume</p>

              <h2>{resumeName || "No resume selected"}</h2>

              <span>
                {resumeName
                  ? "PDF • Ready for analysis"
                  : "PDF only • Upload your resume"}
              </span>
            </div>
          </div>

          <div className="ats-role-wrapper">
            <label htmlFor="job-role" className="ats-role-label">
              Target Job Role
            </label>

            <select
              id="job-role"
              className="ats-role-select"
              value={jobRole}
              onChange={handleJobRoleChange}
            >
              <option value="">Select a job role</option>

              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {jobRole === "Other" && (
              <input
                type="text"
                className="ats-custom-role"
                value={customRole}
                onChange={(event) => {
                  setCustomRole(event.target.value);

                  // A changed custom role means the old analysis
                  // no longer represents the selected role.
                  setAtsData(null);
                }}
                placeholder="Enter your target job role"
                maxLength={100}
              />
            )}

            <div className="ats-upload-actions">
              <label htmlFor="resume-upload" className="ats-upload-btn">
                <i className="fa-solid fa-arrow-up-from-bracket"></i>
                Upload New Resume
              </label>

              <input
                id="resume-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleResumeUpload}
                hidden
              />

              <button
                type="button"
                className="ats-analyze-btn"
                onClick={handleAnalyze}
                disabled={!resumeFile || !selectedRole || loading}
              >
                <i
                  className={
                    loading
                      ? "fa-solid fa-spinner fa-spin"
                      : "fa-solid fa-wand-magic-sparkles"
                  }
                ></i>

                {loading ? "Analyzing..." : "Analyze Resume"}
              </button>
            </div>
          </div>
        </section>

        {/* Initial State */}
        {!pageLoading && !atsData && (
          <section className="ats-ready-card">
            <div className="ats-ready-icon">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>

            <div>
              <h3>Ready to Analyze</h3>

              <p>
                Upload your PDF resume and select your target job role to
                generate your ATS analysis.
              </p>
            </div>
          </section>
        )}

        {/* Score Overview */}
        {atsData && (
          <>
            <section className="ats-analysis-context">
              <i className="fa-solid fa-bullseye"></i>

              <span>
                Analyzed for: <strong>{atsData.jobRole}</strong>
              </span>
            </section>

            <section className="ats-overview">
              <div className="ats-main-score-card">
                <div
                  className="ats-score-circle"
                  style={{
                    "--score": atsData.overallScore,
                  }}
                >
                  <div className="ats-score-circle-inner">
                    <strong>{atsData.overallScore}</strong>
                    <span>/ 100</span>
                  </div>
                </div>

                <div className="ats-main-score-content">
                  <p className="ats-card-label">Overall ATS Score</p>

                  <h2>{getScoreTitle(atsData.overallScore)}</h2>

                  <p>{getScoreDescription(atsData.overallScore)}</p>
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
                    skills, and job-specific information. A higher score
                    indicates better optimization.
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
                {breakdown.map((item) => (
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
                      {atsData.matchedKeywords?.length || 0}
                    </span>
                  </div>

                  <div className="ats-keywords">
                    {atsData.matchedKeywords?.map((keyword) => (
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
                      {atsData.missingKeywords?.length || 0}
                    </span>
                  </div>

                  <div className="ats-keywords">
                    {atsData.missingKeywords?.map((keyword) => (
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
                {atsData.suggestions?.map((suggestion, index) => (
                  <div className="ats-suggestion" key={suggestion}>
                    <div className="ats-suggestion-number">{index + 1}</div>

                    <p>{suggestion}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ATSScore;
