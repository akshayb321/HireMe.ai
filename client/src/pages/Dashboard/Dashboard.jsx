import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  // Temporary data
  // Later API se aayega
  const userName = "Akshay";

  const stats = [
    {
      value: "12",
      label: "Interviews",
    },
    {
      value: "78%",
      label: "Average Score",
    },
    {
      value: "82%",
      label: "Last Interview",
    },
  ];

  const recentInterviews = [
    {
      id: "1",
      role: "Frontend Developer",
      date: "Sep 18, 2026",
      score: "82%",
    },
    {
      id: "2",
      role: "MERN Stack Developer",
      date: "Sep 15, 2026",
      score: "76%",
    },
    {
      id: "3",
      role: "React Developer",
      date: "Sep 12, 2026",
      score: "74%",
    },
  ];

  const handleStartInterview = () => {
    navigate("/interview-setup");
  };

  const handleUploadResume = () => {
    // Temporary
    // Actual resume upload API later add karenge
    console.log("Upload resume");
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* =========================
            WELCOME SECTION
        ========================= */}

        <section className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">Your interview workspace</p>

            <h1>
              Good morning, {userName} <span>👋</span>
            </h1>

            <p className="dashboard-subtitle">
              Practice smarter, improve your skills, and become interview-ready
              with AI.
            </p>
          </div>
        </section>

        {/* =========================
            QUICK ACTIONS
        ========================= */}

        <section className="dashboard-actions">
          {/* Resume Card */}
          <div className="dashboard-action-card">
            <div className="dashboard-action-icon">
              <i className="fa-regular fa-file-lines"></i>
            </div>

            <div className="dashboard-action-content">
              <h2>Upload Resume</h2>

              <p>
                Upload your latest resume to get personalized interview
                questions and feedback.
              </p>

              <button
                type="button"
                className="dashboard-secondary-btn"
                onClick={handleUploadResume}
              >
                <i className="fa-solid fa-arrow-up-from-bracket"></i>
                Upload Resume
              </button>
            </div>
          </div>

          {/* Interview Card */}
          <div className="dashboard-action-card dashboard-interview-card">
            <div className="dashboard-action-icon">
              <i className="fa-solid fa-microphone"></i>
            </div>

            <div className="dashboard-action-content">
              <h2>Start Interview</h2>

              <p>
                Practice a realistic AI-powered interview based on your skills
                and target role.
              </p>

              <button
                type="button"
                className="dashboard-primary-btn"
                onClick={handleStartInterview}
              >
                <i className="fa-solid fa-microphone"></i>
                Start Interview
              </button>
            </div>
          </div>
        </section>

        {/* =========================
            PROGRESS
        ========================= */}

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <p className="dashboard-section-label">Your Progress</p>

              <h2>Interview overview</h2>
            </div>
          </div>

          <div className="dashboard-stats">
            {stats.map((stat) => (
              <div className="dashboard-stat-card" key={stat.label}>
                <span className="dashboard-stat-value">{stat.value}</span>

                <span className="dashboard-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* =========================
            RECENT INTERVIEWS
        ========================= */}

        <section className="dashboard-section dashboard-recent-section">
          <div className="dashboard-section-header dashboard-recent-header">
            <div>
              <p className="dashboard-section-label">Your Activity</p>

              <h2>Recent Interviews</h2>
            </div>

            <button
              type="button"
              className="dashboard-view-all"
              onClick={() => navigate("/interviews")}
            >
              View all
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div className="dashboard-interviews-list">
            {recentInterviews.map((interview) => (
              <div className="dashboard-interview-row" key={interview.id}>
                <div className="dashboard-interview-info">
                  <div className="dashboard-interview-icon">
                    <i className="fa-solid fa-briefcase"></i>
                  </div>

                  <div>
                    <h3>{interview.role}</h3>
                    <p>{interview.date}</p>
                  </div>
                </div>

                <div className="dashboard-interview-score">
                  <span>{interview.score}</span>
                  <small>Score</small>
                </div>

                <button
                  type="button"
                  className="dashboard-report-btn"
                  onClick={() => navigate(`/interviews/${interview.id}`)}
                >
                  View Report
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
