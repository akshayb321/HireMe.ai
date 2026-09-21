import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
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
    title: "Technical",
    description: "Skills & technical concepts",
    icon: "fa-solid fa-code",
  },
  {
    value: "behavioral",
    title: "Behavioral",
    description: "HR & personality",
    icon: "fa-solid fa-user-group",
  },
  {
    value: "mixed",
    title: "Mixed",
    description: "Technical + behavioral",
    icon: "fa-solid fa-layer-group",
  },
];

function InterviewSetup({ existingResume = null, onStartInterview }) {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [resume, setResume] = useState(existingResume);
  const [manualMode, setManualMode] = useState(false);

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

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  /* =========================================
     FILE UPLOAD
  ========================================= */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setSelectedFile(null);

      toast.error("Please upload a PDF resume only.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setSelectedFile(file);

    setResume({
      fileName: file.name,
      fileType: file.type,
      isNew: true,
    });

    setManualMode(false);
  };

  /* =========================================
     REMOVE RESUME
  ========================================= */

  const removeResume = () => {
    if (loading) return;

    setResume(null);
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================================
     MANUAL MODE
  ========================================= */

  const handleManualMode = () => {
    if (loading) return;

    removeResume();
    setManualMode(true);
  };

  const handleManualChange = (event) => {
    const { name, value } = event.target;

    setManualDetails((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================
     START INTERVIEW
  ========================================= */

  const handleStartInterview = async () => {
    if (loading) {
      return;
    }

    const finalRole = role === "Other" ? customRole.trim() : role;

    if (!finalRole) {
      toast.error("Please select your target job role.");
      return;
    }

    if (!resume && !manualMode) {
      toast.error("Please upload a resume or enter your details manually.");
      return;
    }

    if (manualMode && !manualDetails.name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    const useExistingResume =
      !manualMode && !selectedFile && !!resume && !resume.isNew;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required. Please login again.");
        navigate("/login");
        return;
      }

      const formData = new FormData();

      formData.append("role", finalRole);
      formData.append("interviewType", interviewType);
      formData.append("difficulty", difficulty);
      formData.append("questionCount", String(questionCount));
      formData.append("manualMode", String(manualMode));
      formData.append("useExistingResume", String(useExistingResume));

      if (manualMode) {
        formData.append(
          "manualDetails",
          JSON.stringify({
            name: manualDetails.name.trim(),
            experience: manualDetails.experience,
            skills: manualDetails.skills.trim(),
            about: manualDetails.about.trim(),
          }),
        );
      }

      if (selectedFile) {
        formData.append("resume", selectedFile);
      }

      const response = await api.post("/interviews/start", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data?.success || !response.data?.data) {
        toast.error("Unable to start the interview.");
        return;
      }

      const data = response.data.data;

      /*
        Keep parent callback support if the parent
        is already using onStartInterview.
      */
      if (onStartInterview) {
        onStartInterview({
          interviewId: data.interviewId,
          questionNumber: data.questionNumber,
          totalQuestions: data.totalQuestions,
          question: data.question,
        });
      }

      toast.success("Interview started successfully.");

      /*
        Navigate only after the backend has successfully
        created the interview and generated question 1.
      */
      navigate(`/interview/${data.interviewId}`, {
        replace: true,
        state: {
          questionNumber: data.questionNumber,
          totalQuestions: data.totalQuestions,
          question: data.question,
        },
      });
    } catch (error) {
      console.error("========== START INTERVIEW ERROR ==========");
      console.error("Message:", error.message);
      console.error("Response:", error.response);
      console.error("Response Data:", error.response?.data);
      console.error("Status:", error.response?.status);
      console.error("============================================");

      toast.error(
        error.response?.data?.message ||
          "Failed to start interview. Please try again.",
      );
    } finally {
      setStartingInterview(false);
    }
  };

  return (
    <main className="interview-setup-page">
      <div className="interview-setup-container">
        {/* =====================================
            HEADER
        ====================================== */}

        <header className="setup-header">
          <div className="setup-header-left">
            <div className="setup-header-icon">
              <i className="fa-solid fa-sparkles" />
            </div>

            <div>
              <div className="setup-eyebrow">INTERVIEW SETUP</div>

              <h1>Prepare for your interview</h1>

              <p>Configure your interview before you begin.</p>
            </div>
          </div>

          <div className="setup-step">
            <span>STEP</span>
            <strong>01</strong>
            <small>/ 01</small>
          </div>
        </header>

        {/* =====================================
            MAIN TWO COLUMN AREA
        ====================================== */}

        <div className="setup-layout">
          {/* ===================================
              LEFT — RESUME / PROFILE
          ==================================== */}

          <section className="setup-panel resume-panel">
            <div className="panel-header">
              <div className="panel-title">
                <div className="panel-icon">
                  <i className="fa-solid fa-file-lines" />
                </div>

                <div>
                  <h2>Your profile</h2>

                  <p>Give your AI interviewer some context.</p>
                </div>
              </div>

              <span className="panel-number">01</span>
            </div>

            {/* =================================
                EXISTING RESUME
            ================================== */}

            {!manualMode && resume ? (
              <div className="resume-content">
                <div className="resume-preview">
                  <div className="resume-document">
                    <div className="resume-document-top">
                      <span>PDF</span>
                    </div>

                    <i className="fa-solid fa-file-lines" />
                  </div>

                  <div className="resume-info">
                    <span className="resume-status">
                      <i className="fa-solid fa-circle-check" />
                      {resume.isNew ? "Ready to use" : "Previously uploaded"}
                    </span>

                    <h3>{resume.fileName}</h3>

                    <p>PDF document</p>
                  </div>

                  <button
                    type="button"
                    className="remove-resume-btn"
                    onClick={removeResume}
                    aria-label="Remove resume"
                    disabled={loading}
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>

                <div className="resume-note">
                  <i className="fa-solid fa-wand-magic-sparkles" />

                  <span>
                    Your resume will help generate personalized interview
                    questions.
                  </span>
                </div>

                <div className="resume-actions">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="secondary-action"
                    disabled={loading}
                  >
                    <i className="fa-solid fa-arrow-up-from-bracket" />
                    Upload different resume
                  </button>

                  <button
                    type="button"
                    onClick={handleManualMode}
                    className="text-action"
                    disabled={loading}
                  >
                    Enter manually
                    <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>
              </div>
            ) : manualMode ? (
              /* =================================
                 MANUAL DETAILS
              ================================== */

              <div className="manual-content">
                <div className="manual-heading">
                  <div>
                    <h3>Enter your details</h3>

                    <p>
                      No resume? You can still take a personalized interview.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="small-upload-btn"
                    disabled={loading}
                  >
                    <i className="fa-solid fa-file-arrow-up" />
                    Upload
                  </button>
                </div>

                <div className="manual-fields">
                  <div className="field">
                    <label>
                      Full name
                      <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={manualDetails.name}
                      onChange={handleManualChange}
                      placeholder="Your full name"
                      disabled={loading}
                    />
                  </div>

                  <div className="field">
                    <label>Experience</label>

                    <select
                      name="experience"
                      value={manualDetails.experience}
                      onChange={handleManualChange}
                      disabled={loading}
                    >
                      <option>Fresher</option>
                      <option>0–1 years</option>
                      <option>1–3 years</option>
                      <option>3–5 years</option>
                      <option>5+ years</option>
                    </select>
                  </div>

                  <div className="field field-full">
                    <label>Skills</label>

                    <input
                      type="text"
                      name="skills"
                      value={manualDetails.skills}
                      onChange={handleManualChange}
                      placeholder="React, JavaScript, Node.js..."
                      disabled={loading}
                    />
                  </div>

                  <div className="field field-full">
                    <label>About you</label>

                    <textarea
                      name="about"
                      value={manualDetails.about}
                      onChange={handleManualChange}
                      placeholder="Briefly describe yourself..."
                      rows="4"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="back-resume-btn"
                  onClick={() => setManualMode(false)}
                  disabled={loading}
                >
                  <i className="fa-solid fa-arrow-left" />
                  Back to resume
                </button>
              </div>
            ) : (
              /* =================================
                 EMPTY RESUME
              ================================== */

              <div className="empty-resume">
                <div className="empty-resume-icon">
                  <i className="fa-solid fa-cloud-arrow-up" />
                </div>

                <h3>Upload your resume</h3>

                <p>PDF · Recommended</p>

                <button
                  type="button"
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <i className="fa-solid fa-arrow-up-from-bracket" />
                  Choose resume
                </button>

                <div className="or-divider">
                  <span>or</span>
                </div>

                <button
                  type="button"
                  className="manual-btn"
                  onClick={handleManualMode}
                  disabled={loading}
                >
                  Enter details manually
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              hidden
            />
          </section>

          {/* ===================================
              RIGHT — INTERVIEW SETTINGS
          ==================================== */}

          <section className="setup-panel settings-panel">
            <div className="panel-header">
              <div className="panel-title">
                <div className="panel-icon">
                  <i className="fa-solid fa-sliders" />
                </div>

                <div>
                  <h2>Interview settings</h2>

                  <p>Choose how your interview should work.</p>
                </div>
              </div>

              <span className="panel-number">02</span>
            </div>

            {/* =================================
                ROLE
            ================================== */}

            <div className="field">
              <label>
                Target job role
                <span>*</span>
              </label>

              <div className="select-box">
                <i className="fa-solid fa-briefcase" />

                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  disabled={loading}
                >
                  <option value="">Select your role</option>

                  {roleOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <i className="fa-solid fa-chevron-down select-arrow" />
              </div>
            </div>

            {role === "Other" && (
              <div className="field custom-role">
                <label>
                  Enter your role
                  <span>*</span>
                </label>

                <input
                  type="text"
                  value={customRole}
                  onChange={(event) => setCustomRole(event.target.value)}
                  placeholder="e.g. Content Writer"
                  disabled={loading}
                />
              </div>
            )}

            {/* =================================
                INTERVIEW TYPE
            ================================== */}

            <div className="setting-block">
              <div className="setting-heading">
                <label>Interview type</label>

                <span>Choose your focus</span>
              </div>

              <div className="type-grid">
                {interviewTypes.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    className={`type-card ${
                      interviewType === item.value ? "selected" : ""
                    }`}
                    onClick={() => setInterviewType(item.value)}
                    disabled={loading}
                  >
                    <div className="type-card-icon">
                      <i className={item.icon} />
                    </div>

                    <div className="type-card-content">
                      <strong>{item.title}</strong>

                      <span>{item.description}</span>
                    </div>

                    <div className="type-check">
                      <i className="fa-solid fa-check" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* =================================
                DIFFICULTY
            ================================== */}

            <div className="setting-block">
              <div className="setting-heading">
                <label>Difficulty</label>

                <span>Set the challenge level</span>
              </div>

              <div className="segmented-control">
                {["easy", "medium", "hard"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={difficulty === item ? "active" : ""}
                    onClick={() => setDifficulty(item)}
                    disabled={loading}
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* =================================
                QUESTIONS
            ================================== */}

            <div className="setting-block">
              <div className="setting-heading">
                <label>Number of questions</label>

                <span>How long should it be?</span>
              </div>

              <div className="question-options">
                {[5, 10, 15].map((number) => (
                  <button
                    type="button"
                    key={number}
                    className={questionCount === number ? "active" : ""}
                    onClick={() => setQuestionCount(number)}
                    disabled={loading}
                  >
                    <strong>{number}</strong>

                    <span>
                      {number === 5
                        ? "Quick"
                        : number === 10
                          ? "Standard"
                          : "Complete"}
                    </span>

                    {number === 10 && <small>Recommended</small>}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* =====================================
            BOTTOM ACTION
        ====================================== */}

        <div className="setup-footer">
          <div className="privacy-info">
            <div className="privacy-icon">
              <i className="fa-solid fa-shield-halved" />
            </div>

            <div>
              <strong>Private & secure</strong>

              <span>Your interview data stays protected.</span>
            </div>
          </div>

          <button
            type="button"
            className="start-interview-btn"
            onClick={handleStartInterview}
            disabled={loading}
          >
            <span>{loading ? "Starting Interview..." : "Start Interview"}</span>

            <i
              className={
                loading
                  ? "fa-solid fa-spinner fa-spin"
                  : "fa-solid fa-arrow-right"
              }
            />
          </button>
        </div>
      </div>
    </main>
  );
}

export default InterviewSetup;
