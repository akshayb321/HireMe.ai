import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api.js";

import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userName = localStorage.getItem("username") || "User";
  const firstName = userName.split(" ")[0];

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await api.get("/interviews/past", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        /*
          Supports:
          response.data.data = [...]
          response.data.data.interviews = [...]
          response.data = [...]
        */

        const responseData = response.data?.data;

        let interviewList = [];

        if (Array.isArray(responseData)) {
          interviewList = responseData;
        } else if (Array.isArray(responseData?.interviews)) {
          interviewList = responseData.interviews;
        } else if (Array.isArray(response.data)) {
          interviewList = response.data;
        }

        setInterviews(interviewList);
      } catch (err) {
        console.error("Failed to fetch interviews:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          navigate("/auth/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load your interview history.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [navigate]);

  /* =========================================================
     DATA
  ========================================================= */

  const totalInterviews = interviews.length;

  /*
    Backend history should return latest interviews first.
    We only show the first 5.
  */
  const recentInterviews = interviews.slice(0, 5);

  const latestInterview = interviews[0];

  /*
    Score comes from finalReport.overallScore.
    Fallbacks are kept so dashboard doesn't break if the
    backend response contains the score directly.
  */
  const getScore = (interview) => {
    if (!interview) return null;

    return (
      interview.finalReport?.overallScore ??
      interview.overallScore ??
      interview.score ??
      null
    );
  };

  const latestScore = getScore(latestInterview);

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatRole = (role) => {
    if (!role) return "Interview";

    return role
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusClass = (status) => {
    const normalizedStatus = status?.toLowerCase();

    if (normalizedStatus === "completed" || normalizedStatus === "complete") {
      return "status-completed";
    }

    if (
      normalizedStatus === "in-progress" ||
      normalizedStatus === "in progress"
    ) {
      return "status-progress";
    }

    return "status-default";
  };

  const getStatusText = (status) => {
    if (!status) return "Completed";

    return status
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleStartInterview = () => {
    navigate("/interview-setup");
  };

  const handleViewReport = (id) => {
    if (!id) return;

    navigate(`/interviews/${id}`);
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </section>
    );
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <section className="dashboard-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <span className="dashboard-eyebrow">AI INTERVIEW PLATFORM</span>

          <h1>
            Welcome back, <span>{firstName}</span>
          </h1>

          <p>
            Track your interview progress and continue improving your interview
            performance.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-header-button"
          onClick={handleStartInterview}
        >
          <i className="fa-solid fa-plus"></i>
          Start Interview
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="dashboard-error">
          <div className="dashboard-error-icon">
            <i className="fa-solid fa-circle-exclamation"></i>
          </div>

          <div>
            <strong>Unable to load interviews</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="dashboard-stats">
        {/* TOTAL INTERVIEWS */}

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon purple">
              <i className="fa-solid fa-comments"></i>
            </div>

            <span className="dashboard-stat-label">All Time</span>
          </div>

          <div className="dashboard-stat-value">{totalInterviews}</div>

          <p className="dashboard-stat-title">Total Interviews</p>

          <p className="dashboard-stat-description">Interviews completed</p>
        </div>

        {/* RECENT INTERVIEW */}

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon blue">
              <i class="fa-solid fa-clock"></i>
            </div>

            <span className="dashboard-stat-label">Latest</span>
          </div>

          <div className="dashboard-stat-recent">
            {latestInterview
              ? formatRole(latestInterview.role)
              : "No interview"}
          </div>

          <p className="dashboard-stat-title">Recent Interview</p>

          <p className="dashboard-stat-description">
            {latestInterview
              ? formatDate(latestInterview.createdAt || latestInterview.date)
              : "Start your first interview"}
          </p>
        </div>

        {/* RECENT SCORE */}

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon green">
              <i className="fa-solid fa-chart-line"></i>
            </div>

            <span className="dashboard-stat-label">Latest</span>
          </div>

          <div className="dashboard-stat-score">
            {latestScore !== null ? `${latestScore}%` : "—"}
          </div>

          <p className="dashboard-stat-title">Recent Interview Score</p>

          <p className="dashboard-stat-description">Overall interview score</p>
        </div>
      </div>

      {/* =====================================================
          START INTERVIEW CTA
      ===================================================== */}

      <div className="dashboard-interview-cta">
        <div className="dashboard-cta-content">
          <div className="dashboard-cta-icon">
            <i className="fa-solid fa-microphone"></i>
          </div>

          <div className="dashboard-cta-text">
            <span className="dashboard-cta-label">
              READY FOR YOUR NEXT INTERVIEW?
            </span>

            <h2>Practice with your AI interviewer</h2>

            <p>
              Start a personalized mock interview and get detailed feedback on
              your performance.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="dashboard-cta-button"
          onClick={handleStartInterview}
        >
          Start Interview
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>

      {/* =====================================================
          RECENT INTERVIEWS
      ===================================================== */}

      <div className="dashboard-recent-section">
        <div className="dashboard-section-header">
          <div>
            <span className="dashboard-section-eyebrow">YOUR ACTIVITY</span>

            <h2>Recent Interviews</h2>

            <p>Your latest interview attempts and scores.</p>
          </div>

          {totalInterviews > 0 && (
            <button
              type="button"
              className="dashboard-view-all"
              onClick={() => navigate("/interviews")}
            >
              View All
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          )}
        </div>

        {/* EMPTY STATE */}

        {recentInterviews.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">
              <i className="fa-solid fa-microphone-lines"></i>
            </div>

            <h3>No interviews yet</h3>

            <p>
              Start your first AI interview to see your performance and score
              here.
            </p>

            <button type="button" onClick={handleStartInterview}>
              Start Your First Interview
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        ) : (
          /* =================================================
             INTERVIEW LIST
          ================================================= */

          <div className="dashboard-interview-list">
            {recentInterviews.map((interview, index) => {
              const interviewScore = getScore(interview);

              const interviewId = interview._id || interview.id;

              const interviewRole = formatRole(interview.role);

              const interviewDate = interview.createdAt || interview.date;

              const interviewStatus = interview.status || "completed";

              return (
                <div
                  className="dashboard-interview-row"
                  key={interviewId || index}
                >
                  {/* LEFT */}

                  <div className="dashboard-interview-main">
                    <div className="dashboard-interview-icon">
                      <i className="fa-solid fa-microphone"></i>
                    </div>

                    <div className="dashboard-interview-info">
                      <h3>{interviewRole}</h3>

                      <div className="dashboard-interview-meta">
                        <span>
                          <i className="fa-regular fa-calendar"></i>
                          {formatDate(interviewDate)}
                        </span>

                        <span
                          className={`dashboard-status ${getStatusClass(
                            interviewStatus,
                          )}`}
                        >
                          {getStatusText(interviewStatus)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SCORE */}

                  <div className="dashboard-interview-score">
                    <span>Score</span>

                    <strong>
                      {interviewScore !== null ? `${interviewScore}%` : "—"}
                    </strong>
                  </div>

                  {/* ACTION */}

                  <button
                    type="button"
                    className="dashboard-report-button"
                    onClick={() => handleViewReport(interviewId)}
                    disabled={!interviewId}
                  >
                    View Report
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
