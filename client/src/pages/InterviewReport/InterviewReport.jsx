import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../config/api.js";
import "./InterviewReport.css";

const InterviewReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================================
     LOAD INTERVIEW REPORT
  ========================================= */

  useEffect(() => {
    const loadInterviewReport = async () => {
      if (!id) {
        toast.error("Interview report not found.");
        navigate("/interviews");
        return;
      }

      try {
        setLoading(true);

        const token = localStorage.getItem("token");

        if (!token) {
          toast.error("Authentication required. Please login again.");
          navigate("/login");
          return;
        }

        const response = await api.get(`/interviews/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.data.success || !response.data.data) {
          toast.error("Interview report could not be loaded.");
          navigate("/interviews");
          return;
        }

        setInterview(response.data.data);
      } catch (error) {
        console.error("Load interview report error:", error);

        toast.error(
          error.response?.data?.message || "Failed to load interview report.",
        );

        navigate("/interviews");
      } finally {
        setLoading(false);
      }
    };

    loadInterviewReport();
  }, [id, navigate]);

  /* =========================================
     FORMAT DATE
  ========================================= */

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  /* =========================================
     FORMAT DURATION
  ========================================= */

  const formatDuration = () => {
    if (!interview) {
      return "—";
    }

    /*
      If backend already provides duration,
      use it directly.
    */

    if (interview.duration) {
      return interview.duration;
    }

    /*
      Otherwise calculate from timestamps
      if both are available.
    */

    if (interview.startedAt && interview.completedAt) {
      const start = new Date(interview.startedAt);
      const end = new Date(interview.completedAt);

      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

        return `${durationMinutes} min`;
      }
    }

    return "—";
  };

  /* =========================================
     SCORE HELPER
  ========================================= */

  const getScore = (value) => {
    if (typeof value !== "number") {
      return 0;
    }

    return Math.max(0, Math.min(100, value));
  };

  /* =========================================
     LOADING STATE
  ========================================= */

  if (loading) {
    return (
      <div className="interview-report">
        <div className="interview-report-container">
          <div
            style={{
              minHeight: "70vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <i
              className="fa-solid fa-spinner fa-spin"
              style={{ fontSize: "28px" }}
            />

            <p>Loading interview report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return null;
  }

  /* =========================================
     INTERVIEW DATA
  ========================================= */

  const questions = Array.isArray(interview.questions)
    ? interview.questions
    : [];

  const overallScore = getScore(interview.overallScore);

  const technicalScore = getScore(interview.technicalScore);

  const communicationScore = getScore(interview.communicationScore);

  const problemSolvingScore = getScore(interview.problemSolvingScore);

  const strengths = Array.isArray(interview.strengths)
    ? interview.strengths
    : [];

  const improvements = Array.isArray(interview.improvements)
    ? interview.improvements
    : [];

  const interviewRole = interview.role || "Interview";

  const interviewDate = formatDate(
    interview.completedAt || interview.createdAt || interview.startedAt,
  );

  const duration = formatDuration();

  return (
    <div className="interview-report">
      <div className="interview-report-container">
        {/* =========================================
            HEADER
        ========================================= */}

        <section className="report-header">
          <button
            type="button"
            className="report-back-btn"
            onClick={() => navigate("/interviews")}
          >
            <i className="fa-solid fa-arrow-left" />
            Back to Interviews
          </button>

          <div className="report-header-content">
            <div>
              <p className="report-eyebrow">Interview Report</p>

              <h1>{interviewRole}</h1>

              <div className="report-meta">
                <span>
                  <i className="fa-regular fa-calendar" />

                  {interviewDate}
                </span>

                <span>
                  <i className="fa-regular fa-clock" />

                  {duration}
                </span>

                <span>
                  <i className="fa-solid fa-list-check" />
                  {questions.length} Questions
                </span>
              </div>
            </div>

            <div className="report-overall-score">
              <span className="report-score-value">{overallScore}%</span>

              <span className="report-score-label">Overall Score</span>
            </div>
          </div>
        </section>

        {/* =========================================
            PERFORMANCE OVERVIEW
        ========================================= */}

        <section className="report-section">
          <div className="report-section-heading">
            <p>Performance</p>

            <h2>Performance Overview</h2>
          </div>

          <div className="report-score-grid">
            {/* Overall */}

            <div className="report-score-card">
              <div className="report-score-card-top">
                <span>Overall</span>

                <i className="fa-solid fa-chart-line" />
              </div>

              <strong>{overallScore}%</strong>

              <div className="report-progress">
                <span
                  style={{
                    width: `${overallScore}%`,
                  }}
                />
              </div>
            </div>

            {/* Technical */}

            <div className="report-score-card">
              <div className="report-score-card-top">
                <span>Technical</span>

                <i className="fa-solid fa-code" />
              </div>

              <strong>{technicalScore}%</strong>

              <div className="report-progress">
                <span
                  style={{
                    width: `${technicalScore}%`,
                  }}
                />
              </div>
            </div>

            {/* Communication */}

            <div className="report-score-card">
              <div className="report-score-card-top">
                <span>Communication</span>

                <i className="fa-solid fa-comments" />
              </div>

              <strong>{communicationScore}%</strong>

              <div className="report-progress">
                <span
                  style={{
                    width: `${communicationScore}%`,
                  }}
                />
              </div>
            </div>

            {/* Problem Solving */}

            <div className="report-score-card">
              <div className="report-score-card-top">
                <span>Problem Solving</span>

                <i className="fa-solid fa-lightbulb" />
              </div>

              <strong>{problemSolvingScore}%</strong>

              <div className="report-progress">
                <span
                  style={{
                    width: `${problemSolvingScore}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            AI SUMMARY
        ========================================= */}

        <section className="report-section">
          <div className="report-section-heading">
            <p>AI Analysis</p>

            <h2>Overall Feedback</h2>
          </div>

          <div className="report-summary-card">
            <div className="report-summary-icon">
              <i className="fa-solid fa-wand-magic-sparkles" />
            </div>

            <p>
              {interview.summary ||
                "No overall feedback is available for this interview."}
            </p>
          </div>
        </section>

        {/* =========================================
            STRENGTHS & IMPROVEMENTS
        ========================================= */}

        <section className="report-section">
          <div className="report-feedback-grid">
            {/* Strengths */}

            <div className="report-feedback-card">
              <div className="report-feedback-header">
                <div className="report-feedback-icon">
                  <i className="fa-solid fa-check" />
                </div>

                <div>
                  <p>Your Strengths</p>

                  <h2>What you did well</h2>
                </div>
              </div>

              {strengths.length > 0 ? (
                <ul>
                  {strengths.map((strength, index) => (
                    <li key={`${strength}-${index}`}>
                      <i className="fa-solid fa-check" />

                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="report-empty-text">No strengths were provided.</p>
              )}
            </div>

            {/* Improvements */}

            <div className="report-feedback-card">
              <div className="report-feedback-header">
                <div className="report-feedback-icon improvement">
                  <i className="fa-solid fa-arrow-up" />
                </div>

                <div>
                  <p>Areas to Improve</p>

                  <h2>Focus on these areas</h2>
                </div>
              </div>

              {improvements.length > 0 ? (
                <ul>
                  {improvements.map((improvement, index) => (
                    <li key={`${improvement}-${index}`}>
                      <i className="fa-solid fa-arrow-right" />

                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="report-empty-text">
                  No improvement areas were provided.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* =========================================
            QUESTION-WISE REVIEW
        ========================================= */}

        <section className="report-section report-questions-section">
          <div className="report-section-heading">
            <p>Detailed Review</p>

            <h2>Question-wise Feedback</h2>
          </div>

          {questions.length > 0 ? (
            <div className="report-questions-list">
              {questions.map((item, index) => {
                const questionScore = getScore(item.score);

                return (
                  <div className="report-question-card" key={item._id || index}>
                    <div className="report-question-header">
                      <div className="report-question-number">Q{index + 1}</div>

                      <div className="report-question-title">
                        <h3>{item.question || "Question unavailable"}</h3>
                      </div>

                      <div className="report-question-score">
                        <strong>{questionScore}%</strong>

                        <span>Score</span>
                      </div>
                    </div>

                    {/* Answer */}

                    <div className="report-answer">
                      <p className="report-answer-label">Your Answer</p>

                      <p>{item.answer || "No answer recorded."}</p>
                    </div>

                    {/* Feedback */}

                    <div className="report-question-feedback">
                      <p className="report-answer-label">AI Feedback</p>

                      <p>{item.feedback || "No feedback available."}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="report-summary-card">
              <div className="report-summary-icon">
                <i className="fa-solid fa-circle-info" />
              </div>

              <p>No question-wise data is available for this interview.</p>
            </div>
          )}
        </section>

        {/* =========================================
            BOTTOM ACTIONS
        ========================================= */}

        <section className="report-actions">
          <button
            type="button"
            className="report-secondary-btn"
            onClick={() => navigate("/interviews")}
          >
            <i className="fa-solid fa-arrow-left" />
            Back to Interviews
          </button>

          <button
            type="button"
            className="report-primary-btn"
            onClick={() => navigate("/interview-setup")}
          >
            <i className="fa-solid fa-microphone" />
            Start New Interview
          </button>
        </section>
      </div>
    </div>
  );
};

export default InterviewReport;
