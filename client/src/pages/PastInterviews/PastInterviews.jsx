import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../config/api.js";
import "./PastInterviews.css";

const PastInterviews = () => {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPastInterviews = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");

        if (!token) {
          toast.error("Authentication required. Please login again.");
          navigate("/auth/login");
          return;
        }

        const response = await api.get("/interviews/past", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.data.success) {
          toast.error(response.data.message || "Failed to load interviews.");
          return;
        }

        const interviewData = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        setInterviews(interviewData);
      } catch (error) {
        console.error("Load past interviews error:", error);

        toast.error(
          error.response?.data?.message || "Failed to load past interviews.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadPastInterviews();
  }, [navigate]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (interview) => {
    if (interview.duration) {
      return interview.duration;
    }

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

  const formatScore = (score) => {
    if (typeof score !== "number") {
      return "—";
    }

    return `${Math.round(score)}%`;
  };

  const getStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleStartInterview = () => {
    navigate("/interview-setup");
  };

  const handleViewReport = (id) => {
    navigate(`/interviews/${id}`);
  };

  return (
    <div className="past-interviews">
      <div className="past-interviews-container">
        {/* Header */}
        <section className="past-interviews-header">
          <div>
            <p className="past-interviews-eyebrow">Your Activity</p>

            <h1>Past Interviews</h1>

            <p className="past-interviews-subtitle">
              Review your previous interviews, scores, and personalized
              feedback.
            </p>
          </div>

          <button
            type="button"
            className="past-interviews-start-btn"
            onClick={handleStartInterview}
          >
            <i className="fa-solid fa-microphone"></i>
            Start Interview
          </button>
        </section>

        {/* Interview History */}
        <section className="past-interviews-list-section">
          <div className="past-interviews-list-header">
            <div>
              <p className="past-interviews-section-label">Interview History</p>

              <h2>
                {loading
                  ? "Loading..."
                  : `${interviews.length} ${
                      interviews.length === 1 ? "Interview" : "Interviews"
                    }`}
              </h2>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="past-interviews-empty">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Loading your interviews...</p>
            </div>
          ) : interviews.length === 0 ? (
            /* Empty State */
            <div className="past-interviews-empty">
              <div className="past-interviews-empty-icon">
                <i className="fa-solid fa-microphone"></i>
              </div>

              <h3>No interviews yet</h3>

              <p>
                Start your first AI interview and your interview history will
                appear here.
              </p>

              <button
                type="button"
                className="past-interviews-start-btn"
                onClick={handleStartInterview}
              >
                <i className="fa-solid fa-microphone"></i>
                Start Your First Interview
              </button>
            </div>
          ) : (
            /* Interview List */
            <div className="past-interviews-list">
              {interviews.map((interview) => (
                <article className="past-interview-card" key={interview._id}>
                  {/* Interview Info */}
                  <div className="past-interview-main">
                    <div className="past-interview-icon">
                      <i className="fa-solid fa-briefcase"></i>
                    </div>

                    <div className="past-interview-info">
                      <h3>{interview.role || "Interview"}</h3>

                      <div className="past-interview-meta">
                        <span>
                          <i className="fa-regular fa-calendar"></i>
                          {formatDate(
                            interview.completedAt ||
                              interview.createdAt ||
                              interview.startedAt,
                          )}
                        </span>

                        <span>
                          <i className="fa-regular fa-clock"></i>
                          {formatDuration(interview)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="past-interview-status">
                    <span className="past-status-dot"></span>
                    {getStatus(interview.status)}
                  </div>

                  {/* Score */}
                  <div className="past-interview-score">
                    <span>{formatScore(interview.overallScore)}</span>

                    <small>Score</small>
                  </div>

                  {/* Report */}
                  <button
                    type="button"
                    className="past-interview-report-btn"
                    onClick={() => handleViewReport(interview._id)}
                    disabled={!interview._id}
                  >
                    View Report
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PastInterviews;
