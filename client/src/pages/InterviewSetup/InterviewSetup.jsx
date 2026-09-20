import { useRef, useState } from "react";
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

  const [resume, setResume] = useState(existingResume);
  const [manualMode, setManualMode] = useState(false);

  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");

  const [interviewType, setInterviewType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [language, setLanguage] = useState("English");

  const [manualDetails, setManualDetails] = useState({
    name: "",
    experience: "Fresher",
    skills: "",
    about: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);

  /* =========================================
     FILE UPLOAD
  ========================================= */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF or DOCX file.");
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

  const handleStartInterview = () => {
    const finalRole = role === "Other" ? customRole.trim() : role;

    if (!finalRole) {
      alert("Please select your target job role.");
      return;
    }

    if (!resume && !manualMode) {
      alert("Please upload a resume or enter your details manually.");
      return;
    }

    if (manualMode && !manualDetails.name.trim()) {
      alert("Please enter your name.");
      return;
    }

    const interviewConfig = {
      resume,
      selectedFile,
      manualMode,
      manualDetails,
      role: finalRole,
      interviewType,
      difficulty,
      questionCount,
      language,
    };

    console.log("Interview Configuration:", interviewConfig);

    if (onStartInterview) {
      onStartInterview(interviewConfig);
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
                  >
                    <i className="fa-solid fa-arrow-up-from-bracket" />
                    Upload different resume
                  </button>

                  <button
                    type="button"
                    onClick={handleManualMode}
                    className="text-action"
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
                    />
                  </div>

                  <div className="field">
                    <label>Experience</label>

                    <select
                      name="experience"
                      value={manualDetails.experience}
                      onChange={handleManualChange}
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
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="back-resume-btn"
                  onClick={() => setManualMode(false)}
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

                <p>PDF or DOCX · Recommended</p>

                <button
                  type="button"
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
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
                >
                  Enter details manually
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

            {/* =================================
                LANGUAGE
            ================================== */}

            <div className="language-row">
              <div className="language-info">
                <div className="language-icon">
                  <i className="fa-solid fa-language" />
                </div>

                <div>
                  <strong>Interview language</strong>

                  <span>Language used by your AI interviewer</span>
                </div>
              </div>

              <div className="language-select">
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Hinglish</option>
                </select>

                <i className="fa-solid fa-chevron-down" />
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
          >
            <span>Start Interview</span>

            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      </div>
    </main>
  );
}

export default InterviewSetup;
