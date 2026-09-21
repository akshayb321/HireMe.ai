import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import api from "../../config/api.js";
import "./InterviewSetup.css";

const roleOptions = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "MERN Stack Developer",
  "Java Developer",
  "Python Developer",
  "Data Analyst",
  "UI/UX Designer",
  "Digital Marketing",
  "HR",
  "Sales",
  "Other",
];

const interviewTypes = [
  {
    value: "technical",
    label: "Technical",
    description: "Technical questions",
    icon: "fa-solid fa-code",
  },
  {
    value: "behavioral",
    label: "Behavioral",
    description: "Soft skills & behavior",
    icon: "fa-solid fa-comments",
  },
  {
    value: "mixed",
    label: "Mixed",
    description: "Technical + behavioral",
    icon: "fa-solid fa-layer-group",
  },
];

const difficultyOptions = [
  {
    value: "easy",
    label: "Easy",
    description: "Beginner friendly",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Balanced level",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Advanced level",
  },
];

const questionOptions = [5, 10, 15];

const InterviewSetup = ({ existingResume = null, onStartInterview }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [manualMode, setManualMode] = useState(false);

  const [resume, setResume] = useState(existingResume || null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");

  const [interviewType, setInterviewType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(10);

  const [manualDetails, setManualDetails] = useState({
    name: "",
    experience: "Fresher",
    skills: "",
    about: "",
  });

  const [loading, setLoading] = useState(false);

  const existingResumeName =
    existingResume?.resumeName ||
    existingResume?.name ||
    existingResume?.fileName ||
    (typeof existingResume === "string" ? existingResume : "");

  const displayedResumeName =
    selectedFile?.name ||
    resume?.resumeName ||
    resume?.name ||
    resume?.fileName ||
    existingResumeName;

  const hasResume = Boolean(selectedFile || resume || existingResume);

  const finalRole = role === "Other" ? customRole.trim() : role.trim();

  /* =====================================================
     RESUME
  ===================================================== */

  const handleResumeUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF resume only.");

      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setResume(null);
    setManualMode(false);

    toast.success("Resume selected successfully.");
  };

  const handleRemoveResume = () => {
    setSelectedFile(null);
    setResume(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =====================================================
     MANUAL FORM
  ===================================================== */

  const handleManualDetailsChange = (field, value) => {
    setManualDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleManualMode = () => {
    setManualMode(true);
    setStep(1);
  };

  const handleResumeMode = () => {
    setManualMode(false);
    setStep(1);
  };

  /* =====================================================
     NEXT
  ===================================================== */

  const handleNext = () => {
    if (!manualMode && !hasResume) {
      toast.error("Please upload a resume or choose manual entry.");
      return;
    }

    if (manualMode && !manualDetails.name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    if (manualMode && !manualDetails.skills.trim()) {
      toast.error("Please enter your skills.");
      return;
    }

    setStep(2);
  };

  /* =====================================================
     START INTERVIEW
  ===================================================== */

  const handleStartInterview = async () => {
    if (!finalRole) {
      toast.error("Please select or enter your target job role.");
      return;
    }

    if (!manualMode && !hasResume) {
      toast.error("Please upload a resume first.");
      return;
    }

    if (manualMode && !manualDetails.name.trim()) {
      toast.error("Please enter your full name.");
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

      formData.append("role", finalRole);
      formData.append("interviewType", interviewType);
      formData.append("difficulty", difficulty);
      formData.append("questionCount", questionCount);
      formData.append("manualMode", manualMode);

      formData.append(
        "useExistingResume",
        !manualMode && !selectedFile && Boolean(existingResume),
      );

      if (manualMode) {
        formData.append("manualDetails", JSON.stringify(manualDetails));
      }

      if (selectedFile) {
        formData.append("resume", selectedFile);
      }

      const response = await api.post("/interviews/start", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const interviewId = response.data.data?.interviewId;

        if (onStartInterview) {
          onStartInterview(response.data.data);
        }

        toast.success(
          response.data.message || "Interview started successfully.",
        );

        navigate(`/interview/${interviewId}`, {
          state: response.data.data,
        });
      }
    } catch (error) {
      console.error("Start interview error:", error);

      toast.error(
        error.response?.data?.message ||
          "Something went wrong while starting the interview.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="interview-setup">
      <div className="interview-setup-container">
        {/* ================================================
            COMPACT PAGE HEADER
        ================================================= */}

        <section className="setup-page-header">
          <div className="setup-heading-content">
            <p className="setup-eyebrow">INTERVIEW PREPARATION</p>

            <h1>Setup Your Interview</h1>

            <p className="setup-page-description">
              Customize your preferences and get ready for your AI-powered
              interview.
            </p>
          </div>

          <div className="setup-step-indicator">
            <div
              className={`setup-step-dot ${
                step === 1 ? "active" : "completed"
              }`}
            >
              {step === 2 ? <i className="fa-solid fa-check"></i> : "1"}
            </div>

            <span></span>

            <div className={`setup-step-dot ${step === 2 ? "active" : ""}`}>
              2
            </div>
          </div>
        </section>

        {/* ================================================
            MAIN TWO COLUMN LAYOUT
        ================================================= */}

        <div className="setup-main-grid">
          {/* =================================================
              LEFT
          ================================================= */}

          <section className="setup-left-card">
            {/* =================================================
                STEP 1
            ================================================= */}

            {step === 1 && (
              <div className="setup-step-content">
                <div className="setup-card-header">
                  <div>
                    <span className="setup-section-step">STEP 1</span>

                    <h2>
                      {manualMode
                        ? "Tell us about yourself"
                        : "Prepare your interview"}
                    </h2>

                    <p>
                      {manualMode
                        ? "Provide a few details to personalize your interview."
                        : "Use your existing resume or upload a new one."}
                    </p>
                  </div>

                  {/* TOP RIGHT BUTTON */}
                  {manualMode && (
                    <button
                      type="button"
                      className="use-resume-btn"
                      onClick={handleResumeMode}
                    >
                      <i className="fa-solid fa-file-lines"></i>
                      Use Resume
                    </button>
                  )}
                </div>

                {!manualMode ? (
                  <>
                    {/* =========================
                        RESUME
                    ========================== */}

                    <div className="resume-section">
                      <div className="resume-section-heading">
                        <div className="resume-heading-icon">
                          <i className="fa-regular fa-file-lines"></i>
                        </div>

                        <div>
                          <h3>Your Resume</h3>

                          <p>
                            Used to generate personalized interview questions.
                          </p>
                        </div>
                      </div>

                      {hasResume ? (
                        <div className="existing-resume-box">
                          <div className="existing-resume-icon">
                            <i className="fa-solid fa-file-pdf"></i>
                          </div>

                          <div className="existing-resume-info">
                            <span className="resume-status">
                              {selectedFile
                                ? "New Resume Selected"
                                : "Current Resume"}
                            </span>

                            <strong>
                              {displayedResumeName || "Resume.pdf"}
                            </strong>

                            <small>PDF • Ready to use</small>
                          </div>

                          <div className="resume-actions">
                            <button
                              type="button"
                              className="resume-replace-btn"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <i className="fa-solid fa-arrow-up-from-bracket"></i>
                              Replace
                            </button>

                            {selectedFile && (
                              <button
                                type="button"
                                className="resume-remove-btn"
                                onClick={handleRemoveResume}
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="resume-upload-box"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="resume-upload-icon">
                            <i className="fa-solid fa-cloud-arrow-up"></i>
                          </div>

                          <h3>Upload Your Resume</h3>

                          <p>
                            Drag and drop your PDF here
                            <br />
                            or click to browse
                          </p>

                          <span>Supported format: PDF</span>

                          <button
                            type="button"
                            className="choose-file-btn"
                            onClick={(event) => {
                              event.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                          >
                            Choose File
                          </button>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleResumeUpload}
                        hidden
                      />
                    </div>

                    {/* =========================
                        DIVIDER
                    ========================== */}

                    <div className="setup-divider">
                      <span></span>
                      <p>OR</p>
                      <span></span>
                    </div>

                    {/* =========================
                        MANUAL ENTRY
                    ========================== */}

                    <div className="manual-entry-box">
                      <div className="manual-entry-icon">
                        <i className="fa-solid fa-pen-to-square"></i>
                      </div>

                      <div className="manual-entry-content">
                        <h3>Prefer manual entry?</h3>

                        <p>Enter your profile details manually.</p>
                      </div>

                      <button
                        type="button"
                        className="manual-entry-btn"
                        onClick={handleManualMode}
                      >
                        Enter Details
                        <i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>

                    {/* =========================
                        NEXT
                    ========================== */}

                    <div className="setup-footer-action">
                      <button
                        type="button"
                        className="setup-primary-btn"
                        onClick={handleNext}
                        disabled={!hasResume}
                      >
                        Continue
                        <i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>
                  </>
                ) : (
                  /* =================================================
                     MANUAL FORM
                  ================================================= */

                  <div className="manual-mode-content">
                    <div className="manual-form">
                      <div className="manual-field full-width">
                        <label htmlFor="manual-name">Full Name</label>

                        <input
                          id="manual-name"
                          type="text"
                          placeholder="Enter your full name"
                          value={manualDetails.name}
                          onChange={(event) =>
                            handleManualDetailsChange(
                              "name",
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      {/* NORMAL DROPDOWN */}
                      <div className="manual-field">
                        <label htmlFor="experience">Experience</label>

                        <select
                          id="experience"
                          value={manualDetails.experience}
                          onChange={(event) =>
                            handleManualDetailsChange(
                              "experience",
                              event.target.value,
                            )
                          }
                        >
                          <option value="Fresher">Fresher</option>

                          <option value="0-1 Years">0-1 Years</option>

                          <option value="1-3 Years">1-3 Years</option>

                          <option value="3-5 Years">3-5 Years</option>

                          <option value="5+ Years">5+ Years</option>
                        </select>
                      </div>

                      <div className="manual-field">
                        <label htmlFor="manual-skills">Skills</label>

                        <input
                          id="manual-skills"
                          type="text"
                          placeholder="React, Node.js, MongoDB..."
                          value={manualDetails.skills}
                          onChange={(event) =>
                            handleManualDetailsChange(
                              "skills",
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="manual-field full-width">
                        <label htmlFor="manual-about">About You</label>

                        <textarea
                          id="manual-about"
                          rows="4"
                          placeholder="Tell us about yourself, your projects, interests or career goals..."
                          value={manualDetails.about}
                          onChange={(event) =>
                            handleManualDetailsChange(
                              "about",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="setup-footer-action">
                      <button
                        type="button"
                        className="setup-primary-btn"
                        onClick={handleNext}
                      >
                        Next
                        <i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                STEP 2
            ================================================= */}

            {step === 2 && (
              <div className="setup-step-content">
                <div className="setup-card-header">
                  <div>
                    <span className="setup-section-step">STEP 2</span>

                    <h2>Customize Your Interview</h2>

                    <p>Select your interview style and difficulty.</p>
                  </div>
                </div>

                {/* SELECTED SOURCE */}

                <div className="selected-source-badge">
                  <div className="selected-source-icon">
                    <i
                      className={
                        manualMode
                          ? "fa-solid fa-user-pen"
                          : "fa-solid fa-file-circle-check"
                      }
                    ></i>
                  </div>

                  <div className="selected-source-info">
                    <span>
                      {manualMode ? "Manual Entry Selected" : "Resume Selected"}
                    </span>

                    <strong>
                      {manualMode
                        ? manualDetails.name || "Candidate details"
                        : displayedResumeName || "Your Resume"}
                    </strong>
                  </div>

                  <button type="button" onClick={() => setStep(1)}>
                    Change
                  </button>
                </div>

                {/* TARGET ROLE */}

                <div className="setup-field-group">
                  <div className="field-label-row">
                    <label htmlFor="job-role">Target Job Role</label>

                    <span>Required</span>
                  </div>

                  <select
                    id="job-role"
                    className="setup-normal-select"
                    value={role}
                    onChange={(event) => {
                      setRole(event.target.value);

                      if (event.target.value !== "Other") {
                        setCustomRole("");
                      }
                    }}
                  >
                    <option value="">Select your target job role</option>

                    {roleOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  {role === "Other" && (
                    <input
                      type="text"
                      className="setup-normal-input"
                      placeholder="Enter your target job role"
                      value={customRole}
                      maxLength={100}
                      onChange={(event) => setCustomRole(event.target.value)}
                    />
                  )}
                </div>

                {/* INTERVIEW TYPE */}

                <div className="setup-field-group">
                  <div className="field-label-row">
                    <label>Interview Type</label>
                  </div>

                  <div className="option-grid">
                    {interviewTypes.map((item) => (
                      <button
                        type="button"
                        key={item.value}
                        className={`option-card ${
                          interviewType === item.value ? "selected" : ""
                        }`}
                        onClick={() => setInterviewType(item.value)}
                      >
                        <div className="option-card-icon">
                          <i className={item.icon}></i>
                        </div>

                        <div className="option-card-content">
                          <strong>{item.label}</strong>

                          <span>{item.description}</span>
                        </div>

                        <div className="option-check">
                          {interviewType === item.value && (
                            <i className="fa-solid fa-check"></i>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* DIFFICULTY */}

                <div className="setup-field-group">
                  <div className="field-label-row">
                    <label>Difficulty Level</label>
                  </div>

                  <div className="difficulty-grid">
                    {difficultyOptions.map((item) => (
                      <button
                        type="button"
                        key={item.value}
                        className={`difficulty-card ${
                          difficulty === item.value
                            ? `selected ${item.value}`
                            : ""
                        }`}
                        onClick={() => setDifficulty(item.value)}
                      >
                        <strong>{item.label}</strong>

                        <span>{item.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* QUESTIONS */}

                <div className="setup-field-group">
                  <div className="field-label-row">
                    <label>Number of Questions</label>
                  </div>

                  <div className="question-grid">
                    {questionOptions.map((count) => (
                      <button
                        type="button"
                        key={count}
                        className={`question-card ${
                          questionCount === count ? "selected" : ""
                        }`}
                        onClick={() => setQuestionCount(count)}
                      >
                        <strong>{count}</strong>

                        <span>Questions</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="step-two-actions">
                  <button
                    type="button"
                    className="secondary-action-btn"
                    onClick={() => setStep(1)}
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    Back
                  </button>

                  <button
                    type="button"
                    className="setup-primary-btn start-btn"
                    onClick={handleStartInterview}
                    disabled={loading}
                  >
                    <i
                      className={
                        loading
                          ? "fa-solid fa-spinner fa-spin"
                          : "fa-solid fa-microphone"
                      }
                    ></i>

                    {loading ? "Starting..." : "Start Interview"}

                    {!loading && <i className="fa-solid fa-arrow-right"></i>}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* =================================================
              RIGHT CARD
          ================================================= */}

          <aside className="setup-right-card">
            <div className="benefits-heading">
              <div className="benefits-icon">
                <i className="fa-solid fa-gift"></i>
              </div>

              <div>
                <h3>What you'll get</h3>

                <p>Everything you need for a realistic interview experience.</p>
              </div>
            </div>

            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-check">
                  <i className="fa-solid fa-check"></i>
                </div>

                <div>
                  <strong>AI Generated Questions</strong>

                  <span>Questions personalized for your role.</span>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-check">
                  <i className="fa-solid fa-check"></i>
                </div>

                <div>
                  <strong>Voice Based Interview</strong>

                  <span>Practice answering naturally with voice.</span>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-check">
                  <i className="fa-solid fa-check"></i>
                </div>

                <div>
                  <strong>Real-time Evaluation</strong>

                  <span>Get evaluated during your interview.</span>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-check">
                  <i className="fa-solid fa-check"></i>
                </div>

                <div>
                  <strong>Detailed Feedback</strong>

                  <span>Understand your strengths and weaknesses.</span>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-check">
                  <i className="fa-solid fa-check"></i>
                </div>

                <div>
                  <strong>Performance Report</strong>

                  <span>Review your complete interview performance.</span>
                </div>
              </div>
            </div>

            {/* =================================================
                ILLUSTRATION
                Replace src with your actual image
            ================================================= */}

            <div className="benefits-illustration">
              <img
                src="https://res.cloudinary.com/jwqnivpq/image/upload/v1789737353/left_img.png"
                alt="AI interview illustration"
              />

              <p>You can do it!</p>
            </div>

            <div className="secure-note">
              <i className="fa-solid fa-shield-halved"></i>

              <span>Your information is private and securely processed.</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;
