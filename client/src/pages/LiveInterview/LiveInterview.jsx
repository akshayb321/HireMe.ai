import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../config/api.js";
import "./LiveInterview.css";

const LiveInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const initialInterviewData = location.state || {};

  /* =========================================
     INTERVIEW STATE
  ========================================= */

  const [totalQuestions, setTotalQuestions] = useState(
    initialInterviewData.totalQuestions || 10,
  );

  const [currentQuestion, setCurrentQuestion] = useState(
    initialInterviewData.questionNumber || 1,
  );

  const [currentQuestionText, setCurrentQuestionText] = useState(
    initialInterviewData.question || "",
  );

  /*
    question
      -> Current question

    feedback
      -> AI feedback after answer

    transition
      -> AI transition before next question
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

  const [aiTransition, setAiTransition] = useState("");

  const [answerScore, setAnswerScore] = useState(null);

  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const [loadingInterview, setLoadingInterview] = useState(
    !initialInterviewData.question,
  );

  /* =========================================
     REFS
  ========================================= */

  const recognitionRef = useRef(null);

  const timerRef = useRef(null);

  const finalTranscriptRef = useRef("");

  const selectedVoiceRef = useRef(null);

  const sequenceTimeoutsRef = useRef([]);

  /* =========================================
     UTILITY
  ========================================= */

  const addSequenceTimeout = (callback, delay) => {
    const timeout = setTimeout(callback, delay);

    sequenceTimeoutsRef.current.push(timeout);

    return timeout;
  };

  const clearSequenceTimeouts = () => {
    sequenceTimeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });

    sequenceTimeoutsRef.current = [];
  };

  /* =========================================
     LOAD INTERVIEW
  ========================================= */

  useEffect(() => {
    const loadInterview = async () => {
      if (!id) {
        toast.error("Interview session not found.");
        navigate("/interviews");
        return;
      }

      /*
        If interview data was passed through navigation state,
        we already have the first question.
      */

      if (initialInterviewData.question) {
        setLoadingInterview(false);
        return;
      }

      try {
        setLoadingInterview(true);

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
          toast.error("Interview data could not be loaded.");
          navigate("/interviews");
          return;
        }

        const interview = response.data.data;

        setTotalQuestions(interview.questionCount || 10);

        if (interview.questions?.length) {
          const lastQuestion =
            interview.questions[interview.questions.length - 1];

          setCurrentQuestion(interview.questions.length);

          setCurrentQuestionText(lastQuestion.question || "");

          /*
            If the latest question already has an answer,
            show its feedback.
          */

          if (lastQuestion.answer) {
            setAnswerSubmitted(true);

            setAiFeedback(lastQuestion.feedback || "");

            setAiTransition(lastQuestion.transition || "");

            setAnswerScore(lastQuestion.score ?? null);

            setConversationPhase("feedback");

            setAiState("ready");
          }
        }
      } catch (error) {
        console.error("Load interview error:", error);

        toast.error(
          error.response?.data?.message ||
            "Failed to load the interview session.",
        );

        navigate("/interviews");
      } finally {
        setLoadingInterview(false);
      }
    };

    loadInterview();
  }, [id, navigate]);

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
     TEXT TO SPEECH
  ========================================= */

  const speakText = (text, onEnd) => {
    if (!text) {
      if (onEnd) {
        onEnd();
      }

      return;
    }

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

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);

      setAiState("error");

      if (onEnd) {
        onEnd();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  /* =========================================
     SPEAK CURRENT QUESTION
  ========================================= */

  const speakQuestion = () => {
    if (conversationPhase !== "question") {
      return;
    }

    if (!currentQuestionText) {
      return;
    }

    speakText(currentQuestionText);
  };

  /* =========================================
     LOAD BROWSER VOICES
  ========================================= */

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

  /* =========================================
     AUTO SPEAK QUESTION
  ========================================= */

  useEffect(() => {
    if (
      conversationPhase !== "question" ||
      loadingInterview ||
      !currentQuestionText
    ) {
      return;
    }

    const timer = setTimeout(() => {
      speakQuestion();
    }, 350);

    return () => {
      clearTimeout(timer);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [
    currentQuestion,
    conversationPhase,
    loadingInterview,
    currentQuestionText,
  ]);

  /* =========================================
     SPEECH RECOGNITION
  ========================================= */

  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        "Speech recognition is not supported in this browser. Please use text mode.",
      );

      setAnswerMode("text");

      return;
    }

    /*
      Stop any previous recognition instance.
    */

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore cleanup error.
      }
    }

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

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      setIsRecording(false);

      setAiState("ready");

      if (event.error === "not-allowed") {
        toast.error("Microphone permission is required for voice answers.");
      }
    };

    recognition.onend = () => {
      setIsRecording(false);

      const finalText = finalTranscriptRef.current.trim();

      if (finalText) {
        setTranscript(finalText);
      }

      setAiState("ready");
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error("Speech recognition start error:", error);

      setIsRecording(false);

      setAiState("ready");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore cleanup error.
      }
    }

    setIsRecording(false);

    setAiState("ready");

    const finalText = finalTranscriptRef.current.trim();

    if (finalText) {
      setTranscript(finalText);
    }
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

    return () => {
      clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  };

  /* =========================================
     ANSWER VALIDATION
  ========================================= */

  const hasAnswer =
    answerMode === "voice"
      ? transcript.trim().length > 0 ||
        finalTranscriptRef.current.trim().length > 0
      : typedAnswer.trim().length > 0;

  /* =========================================
     RESET ANSWER STATE
  ========================================= */

  const resetAnswerState = () => {
    setTranscript("");

    setTypedAnswer("");

    setAiFeedback("");

    setAiTransition("");

    setAnswerScore(null);

    setAnswerSubmitted(false);

    setRecordingSeconds(0);

    finalTranscriptRef.current = "";
  };

  /* =========================================
     COMPLETE NEXT QUESTION TRANSITION
  ========================================= */

  const moveToNextQuestion = (nextQuestion, nextQuestionNumber) => {
    setCurrentQuestion(nextQuestionNumber);

    setCurrentQuestionText(nextQuestion);

    resetAnswerState();

    setConversationPhase("question");

    setAiState("speaking");

    setSubmittingAnswer(false);
  };

  /* =========================================
     SUBMIT ANSWER
  ========================================= */

  const handleSubmitAnswer = async () => {
    if (!hasAnswer || answerSubmitted || submittingAnswer) {
      return;
    }

    if (!id) {
      toast.error("Interview session not found.");
      return;
    }

    /*
      Stop recording before submitting.
    */

    if (isRecording) {
      stopRecording();
    }

    /*
      Stop any currently playing question speech.
    */

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    /*
      For voice mode, prefer the final transcript ref.
      This prevents losing the latest speech result.
    */

    const answer =
      answerMode === "voice"
        ? (finalTranscriptRef.current.trim() || transcript.trim()).trim()
        : typedAnswer.trim();

    if (!answer) {
      toast.error("Please provide an answer before submitting.");
      return;
    }

    try {
      setSubmittingAnswer(true);

      setAiState("analyzing");

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required. Please login again.");

        setSubmittingAnswer(false);

        navigate("/login");

        return;
      }

      const response = await api.post(
        `/interviews/${id}/answer`,
        {
          answer,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.data.success || !response.data.data) {
        toast.error("Invalid response from interview server.");

        setSubmittingAnswer(false);

        setAiState("ready");

        return;
      }

      const data = response.data.data;

      /*
        Store evaluation data.
      */

      setAnswerSubmitted(true);

      setAnswerScore(data.score ?? null);

      setAiFeedback(data.feedback || "");

      setAiTransition(data.transition || "");

      /* =========================================
         FINAL QUESTION
      ========================================= */

      if (data.isCompleted) {
        const feedbackSpeech = data.feedback || "Thank you for your answer.";

        const transitionSpeech =
          data.transition ||
          "That completes your interview. Let's review your results.";

        /*
          IMPORTANT:
          First render FEEDBACK UI.
        */

        setConversationPhase("feedback");

        setAiState("speaking");

        /*
          Small delay ensures React renders
          feedback before speech starts.
        */

        addSequenceTimeout(() => {
          speakText(feedbackSpeech, () => {
            /*
              Feedback finished.
              Wait before transition.
            */

            addSequenceTimeout(() => {
              setConversationPhase("transition");

              setAiState("speaking");

              setAiTransition(transitionSpeech);

              /*
                Give React time to render transition UI.
              */

              addSequenceTimeout(() => {
                speakText(transitionSpeech, () => {
                  /*
                    Interview completed.
                    Open report after a short pause.
                  */

                  addSequenceTimeout(() => {
                    setSubmittingAnswer(false);

                    navigate(`/interviews/${id}`);
                  }, 700);
                });
              }, 200);
            }, 1000);
          });
        }, 200);

        toast.success("Interview completed successfully.");

        return;
      }

      /* =========================================
         NORMAL QUESTION
      ========================================= */

      const nextQuestion = data.nextQuestion;

      if (!nextQuestion) {
        toast.error("Next question was not received.");

        setSubmittingAnswer(false);

        setAiState("ready");

        return;
      }

      const nextQuestionNumber = data.questionNumber || currentQuestion + 1;

      const feedbackSpeech = data.feedback || "Thank you for your answer.";

      const transitionSpeech =
        data.transition || "Let's move on to the next question.";

      /*
        =========================================
        STEP 1
        SHOW FEEDBACK UI
        =========================================
      */

      setConversationPhase("feedback");

      setAiState("speaking");

      /*
        IMPORTANT:
        Feedback UI is rendered BEFORE speech.
      */

      addSequenceTimeout(() => {
        speakText(feedbackSpeech, () => {
          /*
            =========================================
            STEP 2
            SHOW TRANSITION UI
            =========================================
          */

          addSequenceTimeout(() => {
            setConversationPhase("transition");

            setAiState("speaking");

            setAiTransition(transitionSpeech);

            /*
              Give React time to render transition UI.
            */

            addSequenceTimeout(() => {
              speakText(transitionSpeech, () => {
                /*
                  =========================================
                  STEP 3
                  SHOW NEXT QUESTION
                  =========================================
                */

                addSequenceTimeout(() => {
                  moveToNextQuestion(nextQuestion, nextQuestionNumber);
                }, 500);
              });
            }, 200);
          }, 1000);
        });
      }, 200);
    } catch (error) {
      console.error("Submit answer error:", error);

      setSubmittingAnswer(false);

      setAiState("ready");

      toast.error(
        error.response?.data?.message ||
          "Something went wrong while evaluating your answer.",
      );
    }
  };

  /* =========================================
     END INTERVIEW
  ========================================= */

  const handleEndInterview = () => {
    if (submittingAnswer) {
      return;
    }

    clearSequenceTimeouts();

    if (isRecording) {
      stopRecording();
    }

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

    navigate("/interviews");
  };

  /* =========================================
     CLEANUP
  ========================================= */

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);

      clearSequenceTimeouts();

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

  /* =========================================
     PROGRESS
  ========================================= */

  const progress =
    totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;

  /* =========================================
     AI STATUS
  ========================================= */

  const getAiStatus = () => {
    if (aiState === "speaking") {
      if (conversationPhase === "feedback") {
        return "Speaking feedback";
      }

      if (conversationPhase === "transition") {
        return "Moving to next question";
      }

      return "Speaking";
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

  /* =========================================
     LOADING STATE
  ========================================= */

  if (loadingInterview) {
    return (
      <div className="live-interview">
        <div className="live-interview-shell">
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

            <p>Loading your interview...</p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================
     MAIN UI
  ========================================= */

  return (
    <div className="live-interview">
      <div className="live-interview-shell">
        {/* =========================================
            HEADER
        ========================================= */}

        <header className="live-header">
          <div>
            <span className="live-label">LIVE INTERVIEW</span>

            <h1>AI Interview</h1>
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
          {/* =========================================
              AI INTERVIEWER
          ========================================= */}

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

            {/* =========================================
                AI CONVERSATION
            ========================================= */}

            <div className="ai-content">
              {/* QUESTION */}

              {conversationPhase === "question" && (
                <div className="conversation-content">
                  <span className="question-label">
                    QUESTION {currentQuestion}
                  </span>

                  <h2>{currentQuestionText}</h2>
                </div>
              )}

              {/* FEEDBACK */}

              {conversationPhase === "feedback" && (
                <div className="conversation-content">
                  <span className="question-label feedback-label">
                    AI FEEDBACK
                  </span>

                  {answerScore !== null && (
                    <div className="answer-score">Score: {answerScore}/100</div>
                  )}

                  <div className="ai-feedback">{aiFeedback}</div>
                </div>
              )}

              {/* TRANSITION */}

              {conversationPhase === "transition" && (
                <div className="conversation-content transition-content">
                  <span className="question-label">NEXT</span>

                  <div className="ai-transition">{aiTransition}</div>

                  <div className="transition-loader">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              {/* AI SPEAKING INDICATOR */}

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
                </div>

                <span>
                  {aiState === "speaking"
                    ? conversationPhase === "feedback"
                      ? "AI is responding..."
                      : conversationPhase === "transition"
                        ? "Moving forward..."
                        : "AI is speaking..."
                    : aiState === "analyzing"
                      ? "Analyzing your response..."
                      : aiState === "listening"
                        ? "Listening to your answer..."
                        : "Question ready"}
                </span>
              </div>

              {/* REPLAY QUESTION */}

              {conversationPhase === "question" && (
                <button
                  type="button"
                  className="replay-btn"
                  onClick={speakQuestion}
                  disabled={submittingAnswer}
                >
                  <i className="fa-solid fa-volume-high" />
                  Replay Question
                </button>
              )}
            </div>

            {/* AI FOOTER */}

            <div className="ai-bottom">
              <span>
                <i className="fa-solid fa-shield-halved" />
                Private & secure
              </span>

              <span>Session #{id || "DEMO"}</span>
            </div>
          </section>

          {/* =========================================
              ANSWER PANEL
          ========================================= */}

          <section className="answer-panel">
            <div className="answer-header">
              <div>
                <span>YOUR ANSWER</span>

                <h2>
                  {isRecording
                    ? "Listening..."
                    : submittingAnswer
                      ? "Analyzing..."
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

            {/* ANSWER TABS */}

            {!answerSubmitted && conversationPhase === "question" && (
              <div className="answer-tabs">
                <button
                  type="button"
                  className={answerMode === "voice" ? "active" : ""}
                  onClick={() => {
                    setAnswerMode("voice");

                    setAiState("ready");
                  }}
                  disabled={submittingAnswer}
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
                  disabled={submittingAnswer}
                >
                  <i className="fa-solid fa-keyboard" />
                  Type
                </button>
              </div>
            )}

            {/* =========================================
                VOICE ANSWER
            ========================================= */}

            {answerMode === "voice" && !answerSubmitted && (
              <div className="voice-answer">
                <div className={`microphone ${isRecording ? "recording" : ""}`}>
                  <div className="mic-ring" />

                  <button
                    type="button"
                    disabled={
                      answerSubmitted ||
                      submittingAnswer ||
                      conversationPhase !== "question"
                    }
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

            {/* =========================================
                TEXT ANSWER
            ========================================= */}

            {answerMode === "text" && !answerSubmitted && (
              <div className="text-answer">
                <textarea
                  value={typedAnswer}
                  onChange={(event) => setTypedAnswer(event.target.value)}
                  placeholder="Type your answer here..."
                  disabled={
                    answerSubmitted ||
                    submittingAnswer ||
                    conversationPhase !== "question"
                  }
                />

                <div className="text-meta">
                  <span>{typedAnswer.length} characters</span>

                  <span>You can switch to Speak</span>
                </div>
              </div>
            )}

            {/* =========================================
                SUBMIT BUTTON
            ========================================= */}

            {!answerSubmitted && conversationPhase === "question" && (
              <button
                type="button"
                className="submit-btn"
                disabled={!hasAnswer || submittingAnswer}
                onClick={handleSubmitAnswer}
              >
                {submittingAnswer ? "Analyzing..." : "Submit Answer"}

                <i
                  className={
                    submittingAnswer
                      ? "fa-solid fa-spinner fa-spin"
                      : "fa-solid fa-arrow-right"
                  }
                />
              </button>
            )}

            {/* =========================================
                SUBMITTED STATE
            ========================================= */}

            {answerSubmitted && conversationPhase !== "question" && (
              <div className="submitted">
                <div>
                  <i className="fa-solid fa-check" />
                </div>

                <span>
                  <strong>Answer submitted</strong>

                  <small>
                    {answerScore !== null
                      ? `AI score: ${answerScore}/100`
                      : "Your response has been captured."}
                  </small>
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
              disabled={submittingAnswer}
            >
              <i className="fa-solid fa-phone-slash" />
              End Interview
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LiveInterview;
