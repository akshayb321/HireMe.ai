import { useNavigate } from "react-router-dom";
import "./PastInterviews.css";

const PastInterviews = () => {
  const navigate = useNavigate();

  // Temporary data
  // Later API se user's all interviews aayenge
  const interviews = [
    {
      id: "1",
      role: "Frontend Developer",
      date: "Sep 18, 2026",
      duration: "18 min",
      score: "82%",
      status: "Completed",
    },
    {
      id: "2",
      role: "MERN Stack Developer",
      date: "Sep 15, 2026",
      duration: "22 min",
      score: "76%",
      status: "Completed",
    },
    {
      id: "3",
      role: "React Developer",
      date: "Sep 12, 2026",
      duration: "16 min",
      score: "74%",
      status: "Completed",
    },
    {
      id: "4",
      role: "Full Stack Developer",
      date: "Sep 9, 2026",
      duration: "20 min",
      score: "68%",
      status: "Completed",
    },
    {
      id: "5",
      role: "JavaScript Developer",
      date: "Sep 6, 2026",
      duration: "15 min",
      score: "71%",
      status: "Completed",
    },
    {
      id: "6",
      role: "Node.js Developer",
      date: "Sep 3, 2026",
      duration: "19 min",
      score: "79%",
      status: "Completed",
    },
    {
      id: "7",
      role: "Backend Developer",
      date: "Aug 30, 2026",
      duration: "21 min",
      score: "73%",
      status: "Completed",
    },
    {
      id: "8",
      role: "Software Developer",
      date: "Aug 27, 2026",
      duration: "17 min",
      score: "81%",
      status: "Completed",
    },
  ];

  const handleStartInterview = () => {
    navigate("/interview/new");
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

              <h2>{interviews.length} Interviews</h2>
            </div>
          </div>

          <div className="past-interviews-list">
            {interviews.map((interview) => (
              <article className="past-interview-card" key={interview.id}>
                {/* Interview Info */}
                <div className="past-interview-main">
                  <div className="past-interview-icon">
                    <i className="fa-solid fa-briefcase"></i>
                  </div>

                  <div className="past-interview-info">
                    <h3>{interview.role}</h3>

                    <div className="past-interview-meta">
                      <span>
                        <i className="fa-regular fa-calendar"></i>
                        {interview.date}
                      </span>

                      <span>
                        <i className="fa-regular fa-clock"></i>
                        {interview.duration}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="past-interview-status">
                  <span className="past-status-dot"></span>
                  {interview.status}
                </div>

                {/* Score */}
                <div className="past-interview-score">
                  <span>{interview.score}</span>
                  <small>Score</small>
                </div>

                {/* Report */}
                <button
                  type="button"
                  className="past-interview-report-btn"
                  onClick={() => handleViewReport(interview.id)}
                >
                  View Report
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PastInterviews;
