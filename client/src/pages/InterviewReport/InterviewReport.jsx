import { useNavigate, useParams } from "react-router-dom";
import "./InterviewReport.css";

const InterviewReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Temporary data
  // Later API se interview ID ke basis par data aayega
  const interview = {
    role: "Frontend Developer",
    date: "September 18, 2026",
    duration: "24 min",
    questions: 10,
    overallScore: 82,
    technicalScore: 85,
    communicationScore: 78,
    problemSolvingScore: 84,

    summary:
      "You demonstrated a solid understanding of frontend development concepts. Your technical answers were generally strong, while your communication can be improved by giving more structured and concise responses.",

    strengths: [
      "Good understanding of React fundamentals",
      "Strong knowledge of JavaScript concepts",
      "Able to explain technical solutions clearly",
      "Good problem-solving approach",
    ],

    improvements: [
      "Give more structured answers",
      "Avoid unnecessary pauses while answering",
      "Improve explanation of complex concepts",
      "Use more real-world examples",
    ],

    questions: [
      {
        question:
          "What is the difference between useState and useEffect in React?",
        answer:
          "useState is used to manage state in a component, while useEffect is used to perform side effects such as API calls or subscriptions.",
        score: 85,
        feedback:
          "Good answer. You correctly explained the primary purpose of both hooks. Adding a practical example would make the answer stronger.",
      },
      {
        question: "What is event bubbling in JavaScript?",
        answer:
          "Event bubbling means an event starts from the target element and then moves upward through its parent elements.",
        score: 80,
        feedback:
          "Correct explanation. You could improve this by mentioning event propagation and a practical DOM example.",
      },
      {
        question: "How would you optimize a React application?",
        answer:
          "I would optimize it by reducing unnecessary renders, using memoization, lazy loading components, and optimizing API calls.",
        score: 82,
        feedback:
          "Good points covered. Consider explaining when each optimization technique should actually be used.",
      },
    ],
  };

  return (
    <div className="interview-report">
      <div className="interview-report-container">
        {/* Header */}
        <section className="report-header">
          <button
            type="button"
            className="report-back-btn"
            onClick={() => navigate("/interviews")}
          >
            <i className="fa-solid fa-arrow-left"></i>
            Back to Interviews
          </button>

          <div className="report-header-content">
            <div>
              <p className="report-eyebrow">Interview Report</p>

              <h1>{interview.role}</h1>

              <div className="report-meta">
                <span>
                  <i className="fa-regular fa-calendar"></i>
                  {interview.date}
                </span>

                <span>
                  <i className="fa-regular fa-clock"></i>
                  {interview.duration}
                </span>

                <span>
                  <i className="fa-solid fa-list-check"></i>
                  {interview.questions.length} Questions
                </span>
              </div>
            </div>

            <div className="report-overall-score">
              <span className="report-score-value">
                {interview.overallScore}%
              </span>

              <span className="report-score-label">Overall Score</span>
            </div>
          </div>
        </section>

        {/* Performance Overview */}
        <section className="report-section">
          <div className="report-section-heading">
            <p>Performance</p>
            <h2>Performance Overview</h2>
          </div>

          <div className="report-score-grid">
            <div className="report-score-card">
              <div className="report-score-card-top">
                <span>Overall</span>
                <i className="fa-solid fa-chart-line"></i>
              </div>

              <strong>{interview.overallScore}%</strong>

              <div className="report-progress">
                <span
                  style={{
                    width: `${interview.overallScore}%`,
                  }}
                ></span>
              </div>
            </div>

            <div className="report-score-card">
              <div className="report-score-card-top">
                <span>Technical</span>
                <i className="fa-solid fa-code"></i>
              </div>

              <strong>{interview.technicalScore}%</strong>

              <div className="report-progress">
                <span
                  style={{
                    width: `${interview.technicalScore}%`,
                  }}
                ></span>
              </div>
            </div>

            <div className="report-score-card">
              <div className="report-score-card-top">
                <span>Communication</span>
                <i className="fa-solid fa-comments"></i>
              </div>

              <strong>{interview.communicationScore}%</strong>

              <div className="report-progress">
                <span
                  style={{
                    width: `${interview.communicationScore}%`,
                  }}
                ></span>
              </div>
            </div>

            <div className="report-score-card">
              <div className="report-score-card-top">
                <span>Problem Solving</span>
                <i className="fa-solid fa-lightbulb"></i>
              </div>

              <strong>{interview.problemSolvingScore}%</strong>

              <div className="report-progress">
                <span
                  style={{
                    width: `${interview.problemSolvingScore}%`,
                  }}
                ></span>
              </div>
            </div>
          </div>
        </section>

        {/* AI Summary */}
        <section className="report-section">
          <div className="report-section-heading">
            <p>AI Analysis</p>
            <h2>Overall Feedback</h2>
          </div>

          <div className="report-summary-card">
            <div className="report-summary-icon">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>

            <p>{interview.summary}</p>
          </div>
        </section>

        {/* Strengths & Improvements */}
        <section className="report-section">
          <div className="report-feedback-grid">
            <div className="report-feedback-card">
              <div className="report-feedback-header">
                <div className="report-feedback-icon">
                  <i className="fa-solid fa-check"></i>
                </div>

                <div>
                  <p>Your Strengths</p>
                  <h2>What you did well</h2>
                </div>
              </div>

              <ul>
                {interview.strengths.map((strength) => (
                  <li key={strength}>
                    <i className="fa-solid fa-check"></i>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="report-feedback-card">
              <div className="report-feedback-header">
                <div className="report-feedback-icon improvement">
                  <i className="fa-solid fa-arrow-up"></i>
                </div>

                <div>
                  <p>Areas to Improve</p>
                  <h2>Focus on these areas</h2>
                </div>
              </div>

              <ul>
                {interview.improvements.map((improvement) => (
                  <li key={improvement}>
                    <i className="fa-solid fa-arrow-right"></i>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Question Review */}
        <section className="report-section report-questions-section">
          <div className="report-section-heading">
            <p>Detailed Review</p>
            <h2>Question-wise Feedback</h2>
          </div>

          <div className="report-questions-list">
            {interview.questions.map((item, index) => (
              <div className="report-question-card" key={index}>
                <div className="report-question-header">
                  <div className="report-question-number">Q{index + 1}</div>

                  <div className="report-question-title">
                    <h3>{item.question}</h3>
                  </div>

                  <div className="report-question-score">
                    <strong>{item.score}%</strong>
                    <span>Score</span>
                  </div>
                </div>

                <div className="report-answer">
                  <p className="report-answer-label">Your Answer</p>

                  <p>{item.answer}</p>
                </div>

                <div className="report-question-feedback">
                  <p className="report-answer-label">AI Feedback</p>

                  <p>{item.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Actions */}
        <section className="report-actions">
          <button
            type="button"
            className="report-secondary-btn"
            onClick={() => navigate("/interviews")}
          >
            <i className="fa-solid fa-arrow-left"></i>
            Back to Interviews
          </button>

          <button
            type="button"
            className="report-primary-btn"
            onClick={() => navigate("/interview/new")}
          >
            <i className="fa-solid fa-microphone"></i>
            Start New Interview
          </button>
        </section>
      </div>
    </div>
  );
};

export default InterviewReport;
