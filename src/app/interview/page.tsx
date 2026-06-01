"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import InterviewVisualizer from "@/components/InterviewVisualizer";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  createInitialState, updateState, shouldTerminate, applyTimePenalty,
  getNextQuestionType, getDifficulty, computeFinalEvaluation,
  MAX_RESPONSE_TIME_SECONDS, STRIKE_LIMIT, GREETING_MESSAGE,
} from "@/utils/stateEngine";
import type { InterviewState, ResumeData, ScoreBreakdown, QuestionRecord } from "@/utils/stateEngine";
import type { InterviewSession } from "@/utils/db";

export default function InterviewPage() {
  const router = useRouter();
  const { startRecording, stopRecording, isRecording, audioBlob, resetRecording, killMicrophone } = useAudioRecorder();
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();

  const [interviewState, setInterviewState] = useState<InterviewState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(MAX_RESPONSE_TIME_SECONDS);
  const [phase, setPhase] = useState<"pre-start" | "greeting" | "ai-speaking" | "user-turn" | "processing" | "ended">("pre-start");
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [silentTimeouts, setSilentTimeouts] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [codeContent, setCodeContent] = useState("");
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef<InterviewState | null>(null);

  useEffect(() => { stateRef.current = interviewState; }, [interviewState]);

  // ─── Initialize State (no audio, no mic) ────────────────────────────
  useEffect(() => {
    const resumeStr = sessionStorage.getItem("hack2hire_resume");
    const jobStr = sessionStorage.getItem("hack2hire_job");
    if (!resumeStr || !jobStr) { router.push("/dashboard"); return; }

    const resumeData: ResumeData = JSON.parse(resumeStr);
    const { jobTitle, jobDescription } = JSON.parse(jobStr);
    const state = createInitialState(resumeData, jobTitle, jobDescription);
    setInterviewState(state);
    stateRef.current = state;
    setPhase("pre-start");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Begin Interview (user click → triggers first audio) ────────────
  const beginInterview = () => {
    setIsInterviewStarted(true);
    setPhase("greeting");
    setAiTranscript(GREETING_MESSAGE);
    setCurrentQuestion(GREETING_MESSAGE);

    // CRITICAL: First speak() call MUST be inside the onClick handler
    // to satisfy browser autoplay policies
    speak(GREETING_MESSAGE, () => {
      setPhase("user-turn");
      startTimer();
    });
  };

  // ─── Timer ──────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setTimeRemaining(MAX_RESPONSE_TIME_SECONDS);
    setQuestionStartTime(Date.now());
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); killMicrophone(); };
  }, [killMicrophone]);

  // ─── Determine if code editor should show ───────────────────────────
  const shouldShowCodeEditor = (questionType: string) => {
    return questionType === "Technical" || questionType === "Scenario";
  };

  // ─── Generate Question ──────────────────────────────────────────────
  const generateQuestion = async (state: InterviewState) => {
    setPhase("processing");
    setStatusMessage("Preparing your next question...");
    setCodeContent("");
    try {
      const res = await fetch("/api/groq?action=start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData: state.resumeData, jobTitle: state.jobTitle,
          jobDescription: state.jobDescription,
          questionType: state.currentQuestionType, difficulty: state.currentDifficulty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const question = data.data.question;
        setCurrentQuestion(question);
        setAiTranscript(question);
        setPhase("ai-speaking");

        // Show code editor for Technical/Scenario questions
        const showEditor = shouldShowCodeEditor(state.currentQuestionType);
        setShowCodeEditor(showEditor);

        setSilentTimeouts(0);
        speak(question, () => { setPhase("user-turn"); startTimer(); });
      }
    } catch (error) {
      console.error("Failed to generate question:", error);
      setStatusMessage("Error generating question. Retrying...");
      setTimeout(() => generateQuestion(state), 2000);
    }
  };

  // ─── Timeout ────────────────────────────────────────────────────────
  const handleTimeout = () => {
    const currentState = stateRef.current;
    if (!currentState) return;
    const newTimeouts = silentTimeouts + 1;
    setSilentTimeouts(newTimeouts);
    if (newTimeouts >= STRIKE_LIMIT) {
      endInterview(currentState, "Four consecutive timeouts. Interview terminated.");
      return;
    }
    const prompt = "I didn't catch that, could you please answer?";
    setAiTranscript(prompt);
    setPhase("ai-speaking");
    speak(prompt, () => { setPhase("user-turn"); startTimer(); });
  };

  // ─── Process Audio + Code ───────────────────────────────────────────
  useEffect(() => {
    if (audioBlob && (phase === "user-turn" || phase === "processing")) {
      processUserResponse(audioBlob);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  const processUserResponse = async (blob: Blob) => {
    stopTimer();
    setPhase("processing");
    setStatusMessage("Transcribing your response...");
    const responseTime = Math.floor((Date.now() - questionStartTime) / 1000);

    try {
      // Transcribe audio via Deepgram REST API
      const formData = new FormData();
      formData.append("audio", blob, "response.webm");

      let transcript = "";
      try {
        const transcribeRes = await fetch("/api/deepgram", { method: "POST", body: formData });
        const transcribeData = await transcribeRes.json();
        transcript = transcribeData.transcript || "";
        setUserTranscript(transcript);
      } catch (deepgramErr) {
        console.error("Deepgram fetch failed:", deepgramErr);
        setStatusMessage("Speech recognition failed. Retrying your turn...");
        // Don't trigger a strike for API failures — let the user try again
        setPhase("user-turn");
        startTimer();
        resetRecording();
        return;
      }

      if (!transcript.trim() && !codeContent.trim()) { handleTimeout(); return; }
      setSilentTimeouts(0);

      const currentState = stateRef.current;
      if (!currentState) return;

      // ─── GREETING phase: just acknowledge and move to first real question ───
      if (currentState.status === "GREETING") {
        const newState: InterviewState = {
          ...currentState,
          status: "IN_PROGRESS",
          currentQuestionType: "Technical",
          currentQuestionIndex: 0,
        };
        setInterviewState(newState);
        stateRef.current = newState;
        setShowCodeEditor(false);

        // AI acknowledges the introduction
        const ackMessage = "Thank you for that introduction! Let's proceed with the technical questions now.";
        setAiTranscript(ackMessage);
        setPhase("ai-speaking");
        speak(ackMessage, () => {
          generateQuestion(newState);
        });
        resetRecording();
        return;
      }

      // ─── NORMAL evaluation ──────────────────────────────────────────────
      const nextIndex = currentState.currentQuestionIndex + 1;
      const nextType = getNextQuestionType(nextIndex);

      // Combine spoken answer with code content for Technical/Scenario
      const combinedAnswer = codeContent.trim()
        ? `${transcript}\n\n[Candidate's Code/Notes]:\n\`\`\`\n${codeContent.trim()}\n\`\`\``
        : transcript;

      const evalRes = await fetch("/api/groq?action=evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion, answer: combinedAnswer,
          questionType: currentState.currentQuestionType, difficulty: currentState.currentDifficulty,
          resumeData: currentState.resumeData, jobTitle: currentState.jobTitle,
          jobDescription: currentState.jobDescription, responseTimeSeconds: responseTime,
          nextQuestionType: nextType, nextDifficulty: getDifficulty(currentState),
        }),
      });
      const evalData = await evalRes.json();

      if (evalData.success) {
        let scores: ScoreBreakdown = evalData.data.scores;
        scores = applyTimePenalty(scores, responseTime);

        const record: QuestionRecord = {
          index: currentState.currentQuestionIndex, type: currentState.currentQuestionType,
          difficulty: currentState.currentDifficulty, question: currentQuestion,
          answer: combinedAnswer, scores, responseTimeSeconds: responseTime,
          timedOut: false, timePenaltyApplied: responseTime >= MAX_RESPONSE_TIME_SECONDS * 0.8,
        };

        const newState = updateState(currentState, record);
        newState.status = "IN_PROGRESS";
        setInterviewState(newState);
        stateRef.current = newState;

        const termination = shouldTerminate(newState);
        if (termination.terminate) {
          endInterview(newState, termination.reason || "Interview completed.");
          return;
        }

        setCodeContent("");
        setUserTranscript("");
        if (evalData.data.nextQuestion) {
          const nextQ = evalData.data.nextQuestion.question;
          setCurrentQuestion(nextQ);
          setAiTranscript(nextQ);
          setPhase("ai-speaking");
          setShowCodeEditor(shouldShowCodeEditor(newState.currentQuestionType));
          speak(nextQ, () => { setPhase("user-turn"); startTimer(); });
        } else {
          generateQuestion(newState);
        }
      }
    } catch (error) {
      console.error("Processing error:", error);
      setStatusMessage("Error processing response. Please try again.");
      setPhase("user-turn");
      startTimer();
    }
    resetRecording();
  };

  // ─── Submit with Code (manual submit button) ───────────────────────
  const handleSubmitAnswer = () => {
    if (isRecording) stopRecording();
    else if (codeContent.trim() && !audioBlob) {
      // If user only typed code without speaking, create a minimal blob
      processCodeOnlyResponse();
    }
  };

  const processCodeOnlyResponse = async () => {
    stopTimer();
    setPhase("processing");
    setStatusMessage("Analyzing your code...");
    const responseTime = Math.floor((Date.now() - questionStartTime) / 1000);
    const currentState = stateRef.current;
    if (!currentState) return;

    const combinedAnswer = `[Candidate's Code/Notes]:\n\`\`\`\n${codeContent.trim()}\n\`\`\``;
    setUserTranscript(combinedAnswer);

    const nextIndex = currentState.currentQuestionIndex + 1;
    const nextType = getNextQuestionType(nextIndex);

    try {
      const evalRes = await fetch("/api/groq?action=evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion, answer: combinedAnswer,
          questionType: currentState.currentQuestionType, difficulty: currentState.currentDifficulty,
          resumeData: currentState.resumeData, jobTitle: currentState.jobTitle,
          jobDescription: currentState.jobDescription, responseTimeSeconds: responseTime,
          nextQuestionType: nextType, nextDifficulty: getDifficulty(currentState),
        }),
      });
      const evalData = await evalRes.json();
      if (evalData.success) {
        let scores: ScoreBreakdown = evalData.data.scores;
        scores = applyTimePenalty(scores, responseTime);
        const record: QuestionRecord = {
          index: currentState.currentQuestionIndex, type: currentState.currentQuestionType,
          difficulty: currentState.currentDifficulty, question: currentQuestion,
          answer: combinedAnswer, scores, responseTimeSeconds: responseTime,
          timedOut: false, timePenaltyApplied: responseTime >= MAX_RESPONSE_TIME_SECONDS * 0.8,
        };
        const newState = updateState(currentState, record);
        newState.status = "IN_PROGRESS";
        setInterviewState(newState);
        stateRef.current = newState;
        const termination = shouldTerminate(newState);
        if (termination.terminate) { endInterview(newState, termination.reason || "Interview completed."); return; }
        setCodeContent("");
        setUserTranscript("");
        if (evalData.data.nextQuestion) {
          const nextQ = evalData.data.nextQuestion.question;
          setCurrentQuestion(nextQ);
          setAiTranscript(nextQ);
          setPhase("ai-speaking");
          setShowCodeEditor(shouldShowCodeEditor(newState.currentQuestionType));
          speak(nextQ, () => { setPhase("user-turn"); startTimer(); });
        } else { generateQuestion(newState); }
      }
    } catch (error) {
      console.error("Code evaluation error:", error);
      setPhase("user-turn");
      startTimer();
    }
  };

  // ─── End Interview ──────────────────────────────────────────────────
  const endInterview = async (state: InterviewState, reason: string) => {
    stopTimer();
    stopSpeaking();
    killMicrophone();
    setPhase("ended");
    setStatusMessage(reason);
    setShowCodeEditor(false);
    speak(reason);

    const evaluation = computeFinalEvaluation(state);
    try {
      const summaryRes = await fetch("/api/groq?action=summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionHistory: state.questionHistory, resumeData: state.resumeData,
          jobTitle: state.jobTitle, jobDescription: state.jobDescription,
          finalScore: evaluation.finalScore,
        }),
      });
      const summaryData = await summaryRes.json();
      if (summaryData.success) {
        evaluation.strengths = summaryData.data.strengths || evaluation.strengths;
        evaluation.weaknesses = summaryData.data.weaknesses || evaluation.weaknesses;
      }
    } catch (error) { console.error("Summary error:", error); }

    sessionStorage.setItem("hack2hire_evaluation", JSON.stringify(evaluation));
    localStorage.setItem("hack2hire_evaluation", JSON.stringify(evaluation));
    const session: InterviewSession = {
      id: `session_${Date.now()}`, jobTitle: state.jobTitle, jobDescription: state.jobDescription,
      timestamp: new Date().toISOString(), durationSeconds: Math.floor((Date.now() - sessionStartTime) / 1000),
      questionHistory: state.questionHistory, evaluation, terminationReason: reason,
    };
    const existingHistory = JSON.parse(sessionStorage.getItem("hack2hire_history") || localStorage.getItem("hack2hire_history") || "[]");
    existingHistory.unshift(session);
    const historyStr = JSON.stringify(existingHistory);
    sessionStorage.setItem("hack2hire_history", historyStr);
    localStorage.setItem("hack2hire_history", historyStr);
    setTimeout(() => router.push("/dashboard"), 5000);
  };

  // ─── Mic Toggle ─────────────────────────────────────────────────────
  const handleMicToggle = () => {
    if (!isInterviewStarted || isSpeaking) return;
    if (isRecording) stopRecording();
    else { resetRecording(); startRecording(); }
  };

  const timerPercentage = (timeRemaining / MAX_RESPONSE_TIME_SECONDS) * 100;
  const timerColor = timeRemaining > 30 ? "#10B981" : timeRemaining > 10 ? "#F59E0B" : "#EF4444";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
          </div>
          <span className="text-slate-600 text-sm font-medium">Live Interview</span>
        </div>
        <div className="flex items-center gap-4">
          {interviewState && isInterviewStarted && phase !== "pre-start" && phase !== "greeting" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Q</span>
                <span className="text-sm font-bold text-slate-900">
                  {Math.min(interviewState.currentQuestionIndex + 1, interviewState.totalQuestions)}
                </span>
                <span className="text-xs text-slate-400">/ {interviewState.totalQuestions}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                interviewState.currentDifficulty === "Easy" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : interviewState.currentDifficulty === "Medium" ? "bg-amber-50 text-amber-600 border-amber-200"
                : "bg-red-50 text-red-600 border-red-200"
              }`}>{interviewState.currentDifficulty}</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-xs font-medium border border-indigo-100">
                {interviewState.currentQuestionType}
              </span>
            </>
          )}
          {isInterviewStarted && (
            <Button variant="danger" size="sm" onClick={() => {
              if (interviewState) endInterview(interviewState, "Interview ended by candidate.");
            }}>End Session</Button>
          )}
        </div>
      </motion.div>

      {/* ─── Main Content ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
        {/* Pre-interview start screen */}
        {phase === "pre-start" && !isInterviewStarted && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-500">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Interview is Ready</h2>
              <p className="text-slate-400 max-w-md mx-auto">
                The AI will greet you first, then ask {interviewState?.totalQuestions || 8} questions.
                You&apos;ll have {MAX_RESPONSE_TIME_SECONDS}s per question. A code editor will appear for technical questions.
              </p>
            </div>
            <Button variant="primary" size="xl" onClick={beginInterview}>Begin Interview</Button>
          </motion.div>
        )}

        {/* Active interview UI */}
        {isInterviewStarted && (
          <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 items-start">
            {/* Left panel: Visualizer + controls */}
            <div className={`flex flex-col items-center gap-6 ${showCodeEditor ? "lg:w-1/2 w-full" : "w-full"}`}>
              {/* Timer */}
              <AnimatePresence>
                {phase === "user-turn" && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#F1F5F9" strokeWidth="5" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke={timerColor} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - timerPercentage / 100)}`}
                        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-xl font-bold ${timeRemaining <= 10 ? "text-red-500" : "text-slate-900"}`}>{timeRemaining}</span>
                      <span className="text-[9px] text-slate-400">sec</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <InterviewVisualizer isSpeaking={isSpeaking} transcript={aiTranscript} isListening={isRecording} />

              {/* User transcript */}
              {userTranscript && phase !== "ai-speaking" && phase !== "greeting" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs text-emerald-600 mb-1 font-medium">Your Response</p>
                  <p className="text-slate-700 text-sm whitespace-pre-wrap">{userTranscript}</p>
                </motion.div>
              )}

              {/* Status */}
              <AnimatePresence>
                {(phase === "processing" || phase === "ended") && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                    {phase !== "ended" && <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />}
                    <p className="text-slate-500 text-sm">{statusMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Strikes */}
              {silentTimeouts > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Strikes:</span>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i < silentTimeouts ? "bg-red-500" : "bg-slate-200"}`} />
                  ))}
                </div>
              )}

              {/* Mic + Submit Controls */}
              <AnimatePresence>
                {phase === "user-turn" && (
                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="flex items-center gap-4">
                    {/* Mic button */}
                    <div className="relative">
                      {isRecording && [0, 1, 2].map((i) => (
                        <motion.div key={i} className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
                          animate={{ scale: [1, 1.8 + i * 0.3], opacity: [0.5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                          style={{ width: 72, height: 72, left: -4, top: -4 }}
                        />
                      ))}
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleMicToggle}
                        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isRecording
                            ? "bg-emerald-500 shadow-xl shadow-emerald-500/25"
                            : "bg-indigo-600 shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30"
                        }`}>
                        {isRecording ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          </svg>
                        )}
                      </motion.button>
                      <p className="text-center mt-2 text-[11px] text-slate-400">
                        {isRecording ? "Recording..." : "Speak"}
                      </p>
                    </div>

                    {/* Submit button — visible when code editor is open or recording */}
                    {(showCodeEditor || isRecording) && (
                      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                        <Button variant="primary" size="lg" onClick={handleSubmitAnswer}
                          disabled={!isRecording && !codeContent.trim()}>
                          Submit Answer
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── Right Panel: Code Editor ─────────────────────────── */}
            <AnimatePresence>
              {showCodeEditor && phase === "user-turn" && (
                <motion.div
                  initial={{ opacity: 0, x: 40, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: "auto" }}
                  exit={{ opacity: 0, x: 40, width: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="lg:w-1/2 w-full"
                >
                  <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
                    {/* Editor header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-400" />
                          <div className="w-3 h-3 rounded-full bg-amber-400" />
                          <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        </div>
                        <span className="text-slate-400 text-xs font-mono ml-2">scratch.code</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-medium border border-indigo-500/30">
                          {interviewState?.currentQuestionType}
                        </span>
                      </div>
                    </div>

                    {/* Code textarea */}
                    <div className="relative">
                      {/* Line numbers */}
                      <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-800/50 flex flex-col items-end py-4 pr-3 select-none overflow-hidden">
                        {Array.from({ length: Math.max(20, (codeContent.match(/\n/g) || []).length + 2) }, (_, i) => (
                          <span key={i} className="text-slate-600 text-[11px] font-mono leading-6">{i + 1}</span>
                        ))}
                      </div>
                      <textarea
                        value={codeContent}
                        onChange={(e) => setCodeContent(e.target.value)}
                        placeholder="// Write your code, algorithm, or architecture notes here...&#10;// This will be submitted alongside your spoken answer."
                        className="w-full min-h-[400px] bg-transparent text-emerald-300 font-mono text-sm p-4 pl-14 resize-none outline-none placeholder-slate-600 leading-6"
                        spellCheck={false}
                      />
                    </div>

                    {/* Editor footer */}
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-t border-slate-700 text-[11px] text-slate-500">
                      <span>Lines: {(codeContent.match(/\n/g) || []).length + 1}</span>
                      <span>Characters: {codeContent.length}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
