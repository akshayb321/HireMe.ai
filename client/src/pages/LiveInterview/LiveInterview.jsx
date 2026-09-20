import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./LiveInterview.css";

const LiveInterview = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const totalQuestions = 10;

  const questions = [
    "Tell me about yourself and your experience with frontend development.",
    "What are the main differences between JavaScript and TypeScript?",
    "Can you explain your experience with React and how you use it in your projects?",
    "How do you optimize the performance of a React application?",
    "What is the difference between REST and GraphQL?",
    "How do you handle authentication in a MERN application?",
    "How would you design a scalable frontend application?",
    "Tell me about a challenging project you have worked on.",
    "How do you debug a difficult frontend issue?",
    "Why should we hire you for this role?",
  ];

  const [currentQuestion, setCurrentQuestion] = useState(3);

  /*
    conversationPhase:
    question -> AI is showing current question
    feedback -> AI is showing feedback after user's answer
  */
  const [conversationPhase, setConversationPhase] = useState("question");

  const [aiState, setAiState] = useState("speaking");
  const [isRecording, setIsRecording] = useState(false);

  const [answerMode, setAnswerMode] = useState("voice");

  const [transcript, setTranscript] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");

  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [aiFeedback, setAiFeedback] = useState("");

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const finalTranscriptRef = useRef("");

  /*
    Keep the same male voice throughout the interview.
  */
  const selectedVoiceRef = useRef(null);

  const currentQuestionText = questions[currentQuestion - 1];

  /* =========================================
     VOICE SELECTION
  ========================================= */

  const getMaleVoice = () => {
    if (!("speechSynthesis" in window)) {
      return null;
    }

    const voices = window.speechSynthesis.getVoices();

    if (!voices.length) {
      return null;
    }

    if (selectedVoiceRef.current) {
      return selectedVoiceRef.current;
    }

    /*
      Prefer male English voices.

      Browser voice availability is different on Chrome,
      Edge, Windows, macOS etc., so we keep fallbacks.
    */

    const maleVoicePatterns =
      /Google US English|Google UK English Male|Microsoft David|Microsoft Mark|Microsoft Guy|Daniel|Alex|Fred|Tom|Male/i;

    const preferredMaleVoice = voices.find(
      (voice) =>
        /en-US|en-GB|en-IN/i.test(voice.lang) &&
        maleVoicePatterns.test(voice.name),
    );

    const englishMaleFallback = voices.find(
      (voice) =>
        /en-US|en-GB|en-IN/i.test(voice.lang) &&
        /Male|David|Mark|Guy|Daniel|Alex|Fred|Tom/i.test(voice.name),
    );

    const englishFallback = voices.find((voice) =>
      /en-US|en-GB|en-IN/i.test(voice.lang),
    );

    selectedVoiceRef.current =
      preferredMaleVoice || englishMaleFallback || englishFallback || voices[0];

    return selectedVoiceRef.current;
  };

  /* =========================================
     GENERIC TEXT TO SPEECH
  ========================================= */

  const speakText = (text, onEnd) => {
    if (!("speechSynthesis" in window)) {
      setAiState("unavailable");

      if (onEnd) {
        onEnd();
      }

      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voice = getMaleVoice();

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setAiState("speaking");
    };

    utterance.onend = () => {
      if (onEnd) {
        onEnd();
      } else {
        setAiState("ready");
      }
    };

    utterance.onerror = () => {
      setAiState("error");

      if (onEnd) {
        onEnd();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  /* =========================================
     QUESTION SPEECH
  ========================================= */

  const speakQuestion = () => {
    if (conversationPhase !== "question") {
      return;
    }

    speakText(currentQuestionText);
  };

  /*
    Load browser voices early.

    This helps Chrome/Edge populate voices before
    the first question is spoken.
  */
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    const loadVoice = () => {
      getMaleVoice();
    };

    loadVoice();

    window.speechSynthesis.addEventListener("voiceschanged", loadVoice);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoice);
    };
  }, []);

  /*
    Speak current question automatically.

    IMPORTANT:
    We only do this when the conversation phase is "question".

    After AI feedback + next question speech finishes,
    we directly move to the next question without
    triggering this effect again.
  */
  useEffect(() => {
    if (conversationPhase !== "question") {
      return;
    }

    const timer = setTimeout(() => {
      speakQuestion();
    }, 300);

    return () => {
      clearTimeout(timer);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentQuestion, conversationPhase]);

  /* =========================================
     SPEECH RECOGNITION
  ========================================= */

  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAnswerMode("text");
      return;
    }

    /*
      Reset previous transcript properly.

      This fixes the old issue where interim speech
      was repeatedly appended and created duplicated text.
    */
    finalTranscriptRef.current = "";
    setTranscript("");
    setRecordingSeconds(0);

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsRecording(true);
      setAiState("listening");
    };

    recognition.onresult = (event) => {
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscriptRef.current += `${text} `;
        } else {
          interimText += text;
        }
      }

      const finalText = finalTranscriptRef.current.trim();

      setTranscript(`${finalText} ${interimText}`.trim());
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setAiState("ready");
    };

    recognition.onend = () => {
      setIsRecording(false);

      setTranscript(finalTranscriptRef.current.trim());

      setAiState("ready");
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setIsRecording(false);
      setAiState("ready");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsRecording(false);
    setAiState("ready");

    setTranscript(finalTranscriptRef.current.trim());
  };

  /* =========================================
     RECORDING TIMER
  ========================================= */

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((previous) => previous + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  };

  /* =========================================
     SIMPLE FRONTEND FEEDBACK ENGINE
     =========================================

     This is temporary prototype logic.

     Later Gemini/backend will replace this with
     real AI analysis of:
     - correctness
     - missing concepts
     - communication
     - technical depth
     - answer quality
  */

  const generateFeedback = (answer, questionNumber) => {
    const cleanedAnswer = answer.trim();

    if (!cleanedAnswer) {
      return {
        feedback:
          "I couldn't hear a complete answer from you. Let's continue with the next question.",
        transition: "Alright, let's move on to the next question.",
      };
    }

    const wordCount = cleanedAnswer.split(/\s+/).filter(Boolean).length;

    /*
      Question-specific keywords for prototype feedback.
    */

    const keywordMap = {
      1: ["frontend", "react", "javascript", "html", "css", "project"],

      2: ["javascript", "typescript", "type", "static", "dynamic", "interface"],

      3: ["react", "component", "hooks", "state", "props"],

      4: ["performance", "lazy", "memo", "optimization", "render", "cache"],

      5: ["rest", "graphql", "api", "query", "endpoint"],

      6: ["authentication", "jwt", "token", "login", "middleware", "password"],

      7: [
        "scalable",
        "component",
        "architecture",
        "state",
        "performance",
        "api",
      ],

      8: ["project", "challenge", "problem", "solution", "debug"],

      9: ["debug", "console", "network", "error", "devtools", "log"],

      10: ["skills", "experience", "react", "javascript", "project", "value"],
    };

    const keywords = keywordMap[questionNumber] || [];

    const lowerAnswer = cleanedAnswer.toLowerCase();

    const matchedKeywords = keywords.filter((keyword) =>
      lowerAnswer.includes(keyword),
    );

    /*
      Basic prototype classification.
    */

    if (wordCount >= 45 && matchedKeywords.length >= 2) {
      return {
        feedback:
          "Good explanation. Your answer covers the main idea and you supported it with relevant technical points. Keep this level of detail, but try to make your explanation slightly more structured.",
        transition: "Good, let's take the next one.",
      };
    }

    if (wordCount >= 20 && matchedKeywords.length >= 1) {
      return {
        feedback:
          "You're on the right track. Your answer covers part of the concept, but there are a few important points that could be explained more clearly. Try to give a more structured explanation and include a practical example when possible.",
        transition: "With that clarified, let's continue.",
      };
    }

    if (wordCount < 10) {
      return {
        feedback:
          "That's a very brief answer. You have mentioned the basic idea, but I would like to hear a little more explanation and an example so I can understand your technical knowledge better.",
        transition: "Alright, let's move on to the next question.",
      };
    }

    return {
      feedback:
        "That's a good start, but your answer is missing some important technical details. Try to explain the concept more clearly and connect it with how you would use it in a real project.",
      transition: "Good, let's take the next one.",
    };
  };

  /* =========================================
     SUBMIT ANSWER
  ========================================= */

  const hasAnswer =
    answerMode === "voice"
      ? transcript.trim().length > 0
      : typedAnswer.trim().length > 0;

  const handleSubmitAnswer = () => {
    if (!hasAnswer || answerSubmitted) {
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const answer =
      answerMode === "voice" ? transcript.trim() : typedAnswer.trim();

    const result = generateFeedback(answer, currentQuestion);

    setAiFeedback(result.feedback);
    setAnswerSubmitted(true);

    /*
    First show ONLY AI feedback.
  */
    setConversationPhase("feedback");
    setAiState("analyzing");

    /*
    Speak ONLY the feedback + transition.

    IMPORTANT:
    We do NOT speak the next question here.
    This allows us to change the UI to the next
    question BEFORE its voice starts.
  */
    setTimeout(() => {
      const feedbackSpeech = `${result.feedback} ${result.transition}`;

      speakText(feedbackSpeech, () => {
        /*
        FINAL QUESTION
      */
        if (currentQuestion === totalQuestions) {
          setAiState("ready");

          setTimeout(() => {
            navigate(`/interviews/${id || "new"}`);
          }, 500);

          return;
        }

        /*
        IMPORTANT FLOW:

        1. Change question number
        2. Change container from feedback -> question
        3. Clear previous answer
        4. React renders the NEW question first
        5. Then the useEffect below speaks that question
      */

        setCurrentQuestion((previous) => previous + 1);

        setTranscript("");
        setTypedAnswer("");
        setAiFeedback("");
        setAnswerSubmitted(false);
        setRecordingSeconds(0);

        finalTranscriptRef.current = "";

        /*
        This changes the LEFT AI CARD immediately
        from feedback -> next question.
      */
        setConversationPhase("question");

        /*
        Question speech will be handled automatically
        by the existing [currentQuestion, conversationPhase]
        useEffect.
      */
        setAiState("speaking");
      });
    }, 600);
  };

  /* =========================================
     END INTERVIEW
  ========================================= */

  const handleEndInterview = () => {
    if (isRecording) {
      stopRecording();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore recognition cleanup errors.
      }
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    navigate("/interviews");
  };

  /* =========================================
     CLEANUP
  ========================================= */

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup errors.
        }
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const progress = (currentQuestion / totalQuestions) * 100;

  /* =========================================
     AI STATUS
  ========================================= */

  const getAiStatus = () => {
    if (aiState === "speaking") {
      return conversationPhase === "feedback"
        ? "Speaking feedback"
        : "Speaking";
    }

    if (aiState === "listening") {
      return "Listening to you";
    }

    if (aiState === "analyzing") {
      return "Analyzing response";
    }

    if (aiState === "error") {
      return "Voice unavailable";
    }

    if (aiState === "unavailable") {
      return "Voice unavailable";
    }

    return "Ready for your answer";
  };

  return (
    <div className="live-interview">
      <div className="live-interview-shell">
        {/* =========================================
            HEADER
        ========================================= */}

        <header className="live-header">
          <div>
            <span className="live-label">LIVE INTERVIEW</span>

            <h1>Frontend Developer Interview</h1>
          </div>

          <div className="live-progress-box">
            <div className="live-progress-info">
              <span>Question</span>

              <strong>
                {currentQuestion}
                <small>/ {totalQuestions}</small>
              </strong>
            </div>

            <div className="live-progress">
              <span
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        </header>

        {/* =========================================
            MAIN
        ========================================= */}

        <main className="live-main">
          {/* =====================================
              AI INTERVIEWER
          ====================================== */}

          <section className="ai-interviewer">
            <div className="ai-top">
              <div className="ai-profile">
                <div className="ai-photo-wrap">
                  <img
                    src="https://res.cloudinary.com/jwqnivpq/image/upload/v1789810656/ai.webp"
                    alt="AI Interviewer"
                  />

                  <span className="ai-online" />
                </div>

                <div>
                  <h3>AI Interviewer</h3>

                  <div className="ai-status">
                    <span className="status-dot" />

                    {getAiStatus()}
                  </div>
                </div>
              </div>

              <span className="ai-pill">AI</span>
            </div>

            {/* =====================================
                ACTIVE AI CONVERSATION
            ====================================== */}

            <div className="ai-content">
              {conversationPhase === "question" ? (
                <>
                  <span className="question-label">
                    QUESTION {currentQuestion}
                  </span>

                  <h2>{currentQuestionText}</h2>
                </>
              ) : (
                <>
                  <span className="question-label feedback-label">
                    AI FEEDBACK
                  </span>

                  <div className="ai-feedback">{aiFeedback}</div>
                </>
              )}

              <div className="ai-speaking">
                <div
                  className={`wave ${
                    aiState === "speaking" ? "wave-active" : ""
                  }`}
                >
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <span>
                  {aiState === "speaking"
                    ? conversationPhase === "feedback"
                      ? "AI is responding..."
                      : "AI is speaking..."
                    : aiState === "analyzing"
                      ? "Analyzing your response..."
                      : aiState === "listening"
                        ? "Listening to your answer..."
                        : "Question ready"}
                </span>
              </div>

              {conversationPhase === "question" && (
                <button
                  type="button"
                  className="replay-btn"
                  onClick={speakQuestion}
                >
                  <i className="fa-solid fa-volume-high" />
                  Replay Question
                </button>
              )}
            </div>

            <div className="ai-bottom">
              <span>
                <i className="fa-solid fa-shield-halved" />
                Private & secure
              </span>

              <span>Session #{id || "DEMO"}</span>
            </div>
          </section>

          {/* =====================================
              ANSWER PANEL
              RIGHT SIDE 
          ====================================== */}

          <section className="answer-panel">
            <div className="answer-header">
              <div>
                <span>YOUR ANSWER</span>

                <h2>
                  {isRecording
                    ? "Listening..."
                    : answerSubmitted
                      ? "Answer submitted"
                      : "Ready when you are"}
                </h2>
              </div>

              {isRecording && (
                <div className="recording-time">
                  <span />

                  {formatTime(recordingSeconds)}
                </div>
              )}
            </div>

            {!answerSubmitted && (
              <div className="answer-tabs">
                <button
                  type="button"
                  className={answerMode === "voice" ? "active" : ""}
                  onClick={() => {
                    setAnswerMode("voice");
                    setAiState("ready");
                  }}
                >
                  <i className="fa-solid fa-microphone" />
                  Speak
                </button>

                <button
                  type="button"
                  className={answerMode === "text" ? "active" : ""}
                  onClick={() => {
                    if (isRecording) {
                      stopRecording();
                    }

                    setAnswerMode("text");
                    setAiState("ready");
                  }}
                >
                  <i className="fa-solid fa-keyboard" />
                  Type
                </button>
              </div>
            )}

            {/* =====================================
                VOICE
            ====================================== */}

            {answerMode === "voice" && (
              <div className="voice-answer">
                <div className={`microphone ${isRecording ? "recording" : ""}`}>
                  <div className="mic-ring" />

                  <button
                    type="button"
                    disabled={answerSubmitted}
                    onClick={() => {
                      if (isRecording) {
                        stopRecording();
                      } else {
                        startRecording();
                      }
                    }}
                  >
                    <i
                      className={
                        isRecording
                          ? "fa-solid fa-stop"
                          : "fa-solid fa-microphone"
                      }
                    />
                  </button>
                </div>

                <h3>
                  {isRecording ? "Listening to your answer" : "Start speaking"}
                </h3>

                <p>
                  Speak naturally. Your response will appear as a live
                  transcript.
                </p>

                <div
                  className={`transcript ${
                    transcript ? "transcript-filled" : ""
                  }`}
                >
                  {transcript || <span>Your answer will appear here...</span>}
                </div>
              </div>
            )}

            {/* =====================================
                TYPE
            ====================================== */}

            {answerMode === "text" && (
              <div className="text-answer">
                <textarea
                  value={typedAnswer}
                  onChange={(event) => setTypedAnswer(event.target.value)}
                  placeholder="Type your answer here..."
                  disabled={answerSubmitted}
                />

                <div className="text-meta">
                  <span>{typedAnswer.length} characters</span>

                  <span>You can switch to Speak</span>
                </div>
              </div>
            )}

            {!answerSubmitted && (
              <button
                type="button"
                className="submit-btn"
                disabled={!hasAnswer}
                onClick={handleSubmitAnswer}
              >
                Submit Answer
                <i className="fa-solid fa-arrow-right" />
              </button>
            )}

            {answerSubmitted && (
              <div className="submitted">
                <div>
                  <i className="fa-solid fa-check" />
                </div>

                <span>
                  <strong>Answer submitted</strong>

                  <small>Your response has been captured.</small>
                </span>
              </div>
            )}
          </section>
        </main>

        {/* =========================================
            BOTTOM BAR
        ========================================= */}

        <footer className="live-bottom">
          <div className="secure-note">
            <i className="fa-solid fa-lock" />
            Your interview session is private
          </div>

          <div className="bottom-actions">
            <button
              type="button"
              className="end-btn"
              onClick={handleEndInterview}
            >
              <i className="fa-solid fa-phone-slash" />
              End Interview
            </button>

            {/*
              Automatic conversation flow is now used.

              This button is intentionally hidden from
              normal flow. It is not needed because AI
              automatically moves to the next question
              after speaking feedback + next question.
            */}
            <button
              type="button"
              className="next-btn"
              disabled
              style={{ display: "none" }}
            >
              Next Question
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LiveInterview;
