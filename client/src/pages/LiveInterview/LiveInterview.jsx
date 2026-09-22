import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../config/api.js";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
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

  const [showEndInterviewModal, setShowEndInterviewModal] = useState(false);

  const [loadingInterview, setLoadingInterview] = useState(
    !initialInterviewData.question,
  );

  /* =========================================
     SPEECH RECOGNITION CONFIG
  ========================================= */

  /*
    Experimental automatic restart threshold.

    The user will NOT see this value anywhere in the UI.

    After 35 FINAL words are recognized:
    recognition.stop()
        ↓
    onend
        ↓
    120ms
        ↓
    new recognition.start()
  */
  const AUTO_RESTART_WORD_LIMIT = 35;

  const AUTO_RESTART_DELAY = 120;

  /* =========================================
     REFS
  ========================================= */

  const recognitionRef = useRef(null);

  const timerRef = useRef(null);

  /*
    Stores only confirmed/final speech.
  */
  const finalTranscriptRef = useRef("");

  /*
    Stores the currently changing/interim speech.
  */
  const interimTranscriptRef = useRef("");

  const selectedVoiceRef = useRef(null);

  const sequenceTimeoutsRef = useRef([]);

  /*
    true = user currently wants voice recognition
    to continue.
  */
  const shouldKeepListeningRef = useRef(false);

  /*
    Prevents multiple recognition.start() calls.
  */
  const isStartingRecognitionRef = useRef(false);

  /*
    Used for manual stop.
  */
  const manuallyStoppedRef = useRef(false);

  /*
    Used to invalidate old recognition instances.
  */
  const recognitionSessionRef = useRef(0);

  /*
    Counts FINAL words only inside the CURRENT
    recognition segment.

    Example:

    Segment 1 -> 35 words -> restart
    Segment 2 -> 35 words -> restart
    Segment 3 -> 35 words -> restart
  */
  const segmentWordCountRef = useRef(0);

  /*
    true only when the recognition instance was
    stopped automatically because the 35-word
    threshold was reached.
  */
  const autoRestartRef = useRef(false);

  /*
    Stores the automatic restart timeout so it can
    be cancelled during submit/end/unmount.
  */
  const autoRestartTimeoutRef = useRef(null);

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

  /*
    Count words from recognized FINAL text.

    We intentionally count only final speech because
    interim results can change/repeat many times.
  */
  const countWords = (text) => {
    if (!text || !text.trim()) {
      return 0;
    }

    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  /*
    Cancel any pending automatic 35-word restart.
  */
  const clearAutoRestartTimeout = () => {
    if (autoRestartTimeoutRef.current) {
      clearTimeout(autoRestartTimeoutRef.current);

      autoRestartTimeoutRef.current = null;
    }
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

      if (initialInterviewData.question) {
        setLoadingInterview(false);
        return;
      }

      try {
        setLoadingInterview(true);

        const token = localStorage.getItem("token");

        if (!token) {
          toast.error("Authentication required. Please login again.");
          navigate("/auth/login");
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
     SPEECH RECOGNITION HELPERS
  ========================================= */

  const updateTranscriptDisplay = () => {
    const finalText = finalTranscriptRef.current.trim();

    const interimText = interimTranscriptRef.current.trim();

    const combinedText = `${finalText} ${interimText}`.trim();

    setTranscript(combinedText);
  };

  const getCurrentVoiceAnswer = () => {
    const finalText = finalTranscriptRef.current.trim();

    const interimText = interimTranscriptRef.current.trim();

    return `${finalText} ${interimText}`.trim();
  };

  const createRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.lang = "en-US";

    return recognition;
  };

  /* =========================================
     START / RESTART SPEECH RECOGNITION
  ========================================= */

  const startRecognitionInstance = () => {
    if (!shouldKeepListeningRef.current) {
      return;
    }

    if (conversationPhase !== "question") {
      return;
    }

    if (answerSubmitted || submittingAnswer) {
      return;
    }

    if (isStartingRecognitionRef.current) {
      return;
    }

    const currentRecognition = recognitionRef.current;

    /*
      If recognition is already running, don't start
      another recognition instance.
    */
    if (currentRecognition) {
      return;
    }

    const recognition = createRecognition();

    if (!recognition) {
      toast.error(
        "Speech recognition is not supported in this browser. Please use text mode.",
      );

      shouldKeepListeningRef.current = false;

      setAnswerMode("text");

      setIsRecording(false);

      setAiState("ready");

      return;
    }

    const sessionId = ++recognitionSessionRef.current;

    isStartingRecognitionRef.current = true;

    manuallyStoppedRef.current = false;

    /*
      Every new recognition instance gets its own
      35-word segment counter.
    */
    segmentWordCountRef.current = 0;

    /*
      This is now a normal recognition instance.
      Automatic restart becomes true only after
      the 35-word threshold is reached.
    */
    autoRestartRef.current = false;

    recognition.onstart = () => {
      if (sessionId !== recognitionSessionRef.current) {
        return;
      }

      isStartingRecognitionRef.current = false;

      setIsRecording(true);

      setAiState("listening");
    };

    recognition.onresult = (event) => {
      if (sessionId !== recognitionSessionRef.current) {
        return;
      }

      let newInterimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        if (!result || !result[0]) {
          continue;
        }

        const text = result[0].transcript.trim();

        if (!text) {
          continue;
        }

        if (result.isFinal) {
          /*
            FINAL result.

            Add it permanently to the main transcript.
          */
          finalTranscriptRef.current =
            `${finalTranscriptRef.current} ${text}`.trim();

          /*
            Count only FINAL words for the automatic
            restart mechanism.
          */
          const finalWordCount = countWords(text);

          segmentWordCountRef.current += finalWordCount;

          /*
            Once final speech is received, interim
            speech for this event should not remain.
          */
          newInterimText = "";
        } else {
          /*
            IMPORTANT:
            Interim text is NOT appended permanently.

            The browser may send the same interim phrase
            multiple times.
          */
          newInterimText = `${newInterimText} ${text}`.trim();
        }
      }

      interimTranscriptRef.current = newInterimText;

      updateTranscriptDisplay();

      /* =========================================
         35-WORD AUTOMATIC RESTART
      ========================================= */

      if (
        segmentWordCountRef.current >= AUTO_RESTART_WORD_LIMIT &&
        shouldKeepListeningRef.current &&
        !answerSubmitted &&
        !submittingAnswer &&
        conversationPhase === "question" &&
        !autoRestartRef.current
      ) {
        /*
          Mark this recognition instance as an
          automatic restart.

          IMPORTANT:
          We do NOT display anything to the user.
        */
        autoRestartRef.current = true;

        /*
          Stop this recognition normally.

          We intentionally use stop(), NOT abort(),
          so the browser gets a chance to return any
          final captured result before onend.
        */
        try {
          recognition.stop();
        } catch (error) {
          console.error("Automatic 35-word recognition stop error:", error);
        }
      }
    };

    recognition.onerror = (event) => {
      if (sessionId !== recognitionSessionRef.current) {
        return;
      }

      console.error("Speech recognition error:", event.error);

      isStartingRecognitionRef.current = false;

      /*
        Permission-related errors cannot be recovered
        automatically.
      */
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        shouldKeepListeningRef.current = false;

        autoRestartRef.current = false;

        setIsRecording(false);

        setAiState("error");

        toast.error("Microphone permission is required for voice answers.");

        return;
      }

      /*
        "aborted" can happen during intentional stop.
        Do nothing here.
      */

      if (event.error === "aborted") {
        return;
      }

      /*
        Other browser errors are logged only.

        IMPORTANT:
        We are NOT automatically restarting because of
        onerror. Our current experiment is specifically
        testing the 35-word restart strategy.
      */
    };

    recognition.onend = () => {
      if (sessionId !== recognitionSessionRef.current) {
        return;
      }

      /*
        Save whether this particular recognition instance
        needs an automatic restart.
      */
      const shouldAutoRestart =
        autoRestartRef.current &&
        shouldKeepListeningRef.current &&
        !manuallyStoppedRef.current &&
        !answerSubmitted &&
        !submittingAnswer &&
        conversationPhase === "question";

      /*
        The current recognition instance is now finished.
      */
      recognitionRef.current = null;

      isStartingRecognitionRef.current = false;

      updateTranscriptDisplay();

      /*
        =========================================
        AUTOMATIC 35-WORD RESTART
        =========================================

        This is the ONLY place where onend can
        automatically start a new recognition instance.
      */
      if (shouldAutoRestart) {
        /*
          Reset the flag immediately so this instance
          cannot accidentally trigger another restart.
        */
        autoRestartRef.current = false;

        /*
          Keep the UI exactly as it is.

          No toast.
          No "Restarting..." message.
          No extra display.
        */

        clearAutoRestartTimeout();

        autoRestartTimeoutRef.current = setTimeout(() => {
          autoRestartTimeoutRef.current = null;

          /*
            User may have submitted/paused/ended during
            the 120ms delay.
          */
          if (
            !shouldKeepListeningRef.current ||
            manuallyStoppedRef.current ||
            answerSubmitted ||
            submittingAnswer ||
            conversationPhase !== "question"
          ) {
            return;
          }

          /*
            Start a completely fresh recognition instance.

            Existing finalTranscriptRef is NOT cleared.
          */
          startRecognitionInstance();
        }, AUTO_RESTART_DELAY);

        return;
      }

      /*
        IMPORTANT:

        If onend happens normally before 35 words,
        we DO NOT automatically restart.

        This is intentional for this experiment.
      */
      setIsRecording(false);

      if (!submittingAnswer) {
        setAiState("ready");
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error("Speech recognition start error:", error);

      recognitionRef.current = null;

      isStartingRecognitionRef.current = false;

      /*
        Do not automatically restart here.

        We want this experiment to test specifically
        the 35-word controlled restart.
      */
      setIsRecording(false);

      setAiState("ready");
    }
  };

  /* =========================================
     START RECORDING
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

    if (
      answerSubmitted ||
      submittingAnswer ||
      conversationPhase !== "question"
    ) {
      return;
    }

    /*
      Starting manually means:
      - user wants recognition
      - no automatic restart is currently pending
      - old transcript must remain
    */
    shouldKeepListeningRef.current = true;

    manuallyStoppedRef.current = false;

    autoRestartRef.current = false;

    clearAutoRestartTimeout();

    /*
      Only interim text from the previous recognition
      instance is removed.

      FINAL transcript remains untouched.
    */
    interimTranscriptRef.current = "";

    /*
      Start a fresh 35-word segment.
    */
    segmentWordCountRef.current = 0;

    updateTranscriptDisplay();

    setAiState("listening");

    startRecognitionInstance();
  };

  /* =========================================
     STOP / PAUSE RECORDING
  ========================================= */

  const stopRecording = () => {
    /*
      User intentionally pressed the microphone button.

      Therefore:
      NO automatic restart.
    */
    shouldKeepListeningRef.current = false;

    manuallyStoppedRef.current = true;

    autoRestartRef.current = false;

    clearAutoRestartTimeout();

    /*
      Preserve everything currently available.
    */
    const currentAnswer = getCurrentVoiceAnswer();

    if (currentAnswer) {
      setTranscript(currentAnswer);
    }

    interimTranscriptRef.current = "";

    const recognition = recognitionRef.current;

    if (recognition) {
      /*
        Invalidate the recognition session BEFORE stopping it.

        Therefore its onend cannot trigger an automatic restart.
      */
      recognitionRef.current = null;

      recognitionSessionRef.current += 1;

      try {
        recognition.stop();
      } catch {
        try {
          recognition.abort();
        } catch {
          // Ignore cleanup error.
        }
      }
    }

    isStartingRecognitionRef.current = false;

    segmentWordCountRef.current = 0;

    setIsRecording(false);

    setAiState("ready");
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
      ? getCurrentVoiceAnswer().trim().length > 0
      : typedAnswer.trim().length > 0;

  /* =========================================
     RESET ANSWER STATE
  ========================================= */

  const resetAnswerState = () => {
    /*
      Stop any previous recognition completely.
    */
    shouldKeepListeningRef.current = false;

    manuallyStoppedRef.current = true;

    autoRestartRef.current = false;

    clearAutoRestartTimeout();

    if (recognitionRef.current) {
      const oldRecognition = recognitionRef.current;

      recognitionRef.current = null;

      recognitionSessionRef.current += 1;

      try {
        oldRecognition.abort();
      } catch {
        // Ignore cleanup error.
      }
    }

    isStartingRecognitionRef.current = false;

    segmentWordCountRef.current = 0;

    interimTranscriptRef.current = "";

    finalTranscriptRef.current = "";

    setTranscript("");

    setTypedAnswer("");

    setAiFeedback("");

    setAiTransition("");

    setAnswerScore(null);

    setAnswerSubmitted(false);

    setRecordingSeconds(0);

    setIsRecording(false);
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
      Permanently stop automatic recognition restart
      before submitting.
    */
    shouldKeepListeningRef.current = false;

    manuallyStoppedRef.current = true;

    autoRestartRef.current = false;

    clearAutoRestartTimeout();

    /*
      Capture complete answer BEFORE stopping recognition.
    */
    const voiceAnswerBeforeStop = getCurrentVoiceAnswer();

    /*
      Stop recording.
    */
    if (isRecording || recognitionRef.current) {
      stopRecording();
    }

    /*
      Stop any currently playing question speech.
    */
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    /*
      Use captured answer.
    */
    const answer =
      answerMode === "voice"
        ? voiceAnswerBeforeStop.trim()
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

        navigate("/auth/login");

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

      /* =========================================
         STORE EVALUATION DATA
      ========================================= */

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

        setConversationPhase("feedback");

        setAiState("speaking");

        addSequenceTimeout(() => {
          speakText(feedbackSpeech, () => {
            addSequenceTimeout(() => {
              setConversationPhase("transition");

              setAiState("speaking");

              setAiTransition(transitionSpeech);

              addSequenceTimeout(() => {
                speakText(transitionSpeech, () => {
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

      /* =========================================
         STEP 1
         SHOW FEEDBACK UI
      ========================================= */

      setConversationPhase("feedback");

      setAiState("speaking");

      addSequenceTimeout(() => {
        speakText(feedbackSpeech, () => {
          /* =========================================
             STEP 2
             SHOW TRANSITION UI
          ========================================= */

          addSequenceTimeout(() => {
            setConversationPhase("transition");

            setAiState("speaking");

            setAiTransition(transitionSpeech);

            addSequenceTimeout(() => {
              speakText(transitionSpeech, () => {
                /* =========================================
                   STEP 3
                   SHOW NEXT QUESTION
                ========================================= */

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

  const handleEndInterview = async () => {
    if (submittingAnswer) {
      return;
    }

    try {
      clearSequenceTimeouts();

      /*
        Permanently disable automatic restart.
      */
      shouldKeepListeningRef.current = false;

      manuallyStoppedRef.current = true;

      autoRestartRef.current = false;

      clearAutoRestartTimeout();

      if (recognitionRef.current) {
        const recognition = recognitionRef.current;

        recognitionRef.current = null;

        recognitionSessionRef.current += 1;

        try {
          recognition.abort();
        } catch {
          // Ignore cleanup errors.
        }
      }

      isStartingRecognitionRef.current = false;

      segmentWordCountRef.current = 0;

      setIsRecording(false);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required. Please login again.");
        navigate("/auth/login");
        return;
      }

      const response = await api.patch(
        `/interviews/${id}/end`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to end interview");
      }

      toast.success("Interview ended successfully.");

      navigate(`/interviews/${id}`);
    } catch (error) {
      console.error("End interview error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to end interview. Please try again.",
      );
    }
  };

  /* =========================================
     CLEANUP
  ========================================= */

  useEffect(() => {
    return () => {
      shouldKeepListeningRef.current = false;

      manuallyStoppedRef.current = true;

      autoRestartRef.current = false;

      clearAutoRestartTimeout();

      clearInterval(timerRef.current);

      clearSequenceTimeouts();

      if (recognitionRef.current) {
        const recognition = recognitionRef.current;

        recognitionRef.current = null;

        recognitionSessionRef.current += 1;

        try {
          recognition.abort();
        } catch {
          // Ignore cleanup errors.
        }
      }

      isStartingRecognitionRef.current = false;

      segmentWordCountRef.current = 0;

      interimTranscriptRef.current = "";

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
              onClick={() => setShowEndInterviewModal(true)}
              disabled={submittingAnswer}
            >
              <i className="fa-solid fa-phone-slash" />
              End Interview
            </button>
          </div>
        </footer>

        {/* =========================================
            END INTERVIEW CONFIRMATION MODAL
        ========================================= */}

        <ConfirmModal
          isOpen={showEndInterviewModal}
          title="End Interview?"
          message="Are you sure you want to end this interview? Your current interview session will be ended."
          confirmText="End Interview"
          cancelText="Continue Interview"
          onCancel={() => setShowEndInterviewModal(false)}
          onConfirm={() => {
            setShowEndInterviewModal(false);
            handleEndInterview();
          }}
        />
      </div>
    </div>
  );
};

export default LiveInterview;
