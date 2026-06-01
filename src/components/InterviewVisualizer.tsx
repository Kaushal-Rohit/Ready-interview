"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface InterviewVisualizerProps {
  isSpeaking: boolean;
  transcript: string;
  isListening: boolean;
}

export default function InterviewVisualizer({
  isSpeaking,
  transcript,
  isListening,
}: InterviewVisualizerProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    setDisplayedText("");
    setTextIndex(0);
  }, [transcript]);

  useEffect(() => {
    if (textIndex < transcript.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + transcript[textIndex]);
        setTextIndex((prev) => prev + 1);
      }, 25);
      return () => clearTimeout(timer);
    }
  }, [textIndex, transcript]);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* ─── AI Sphere ──────────────────────────────────────────────── */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Outer ambient glow rings — only visible when speaking */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute rounded-full"
            style={{
              width: 160 + i * 30,
              height: 160 + i * 30,
              background: `radial-gradient(circle, rgba(79, 70, 229, ${0.06 - i * 0.012}) 0%, transparent 70%)`,
            }}
            animate={
              isSpeaking
                ? {
                    scale: [1, 1.15 + i * 0.05, 1],
                    opacity: [0.6, 0.2, 0.6],
                  }
                : {
                    scale: [1, 1.02, 1],
                    opacity: [0.15, 0.08, 0.15],
                  }
            }
            transition={{
              duration: isSpeaking ? 1.2 + i * 0.3 : 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Rotating orbital ring */}
        <motion.div
          className="absolute w-[130px] h-[130px] rounded-full border border-indigo-200/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-indigo-400"
            animate={
              isSpeaking
                ? { scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }
                : { scale: 1, opacity: 0.4 }
            }
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.div>

        {/* Secondary counter-rotating ring */}
        <motion.div
          className="absolute w-[110px] h-[110px] rounded-full border border-indigo-100/30"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />

        {/* Core sphere */}
        <motion.div
          className="relative w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 40%, #818CF8 100%)",
          }}
          animate={
            isSpeaking
              ? {
                  scale: [1, 1.08, 0.96, 1.06, 1],
                  boxShadow: [
                    "0 0 30px rgba(79, 70, 229, 0.3), 0 0 60px rgba(99, 102, 241, 0.15)",
                    "0 0 50px rgba(79, 70, 229, 0.5), 0 0 90px rgba(99, 102, 241, 0.25)",
                    "0 0 30px rgba(79, 70, 229, 0.3), 0 0 60px rgba(99, 102, 241, 0.15)",
                  ],
                }
              : isListening
              ? {
                  scale: [1, 1.03, 1],
                  boxShadow: [
                    "0 0 25px rgba(16, 185, 129, 0.2), 0 0 50px rgba(16, 185, 129, 0.1)",
                    "0 0 40px rgba(16, 185, 129, 0.35), 0 0 70px rgba(16, 185, 129, 0.15)",
                    "0 0 25px rgba(16, 185, 129, 0.2), 0 0 50px rgba(16, 185, 129, 0.1)",
                  ],
                }
              : {
                  scale: [1, 1.015, 1],
                  boxShadow: [
                    "0 0 20px rgba(79, 70, 229, 0.15), 0 0 40px rgba(99, 102, 241, 0.05)",
                    "0 0 25px rgba(79, 70, 229, 0.2), 0 0 50px rgba(99, 102, 241, 0.08)",
                    "0 0 20px rgba(79, 70, 229, 0.15), 0 0 40px rgba(99, 102, 241, 0.05)",
                  ],
                }
          }
          transition={{
            duration: isSpeaking ? 0.5 : isListening ? 2 : 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Inner waveform bars */}
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-white/80"
                animate={
                  isSpeaking
                    ? {
                        height: [6, 14 + i * 4, 8, 18 - i * 2, 6],
                      }
                    : isListening
                    ? {
                        height: [4, 8 + i * 2, 4],
                      }
                    : {
                        height: [4, 6, 4],
                      }
                }
                transition={{
                  duration: isSpeaking ? 0.3 + i * 0.05 : 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.08,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Status label */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <motion.div
            className={`px-3 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap ${
              isSpeaking
                ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                : isListening
                ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            {isSpeaking ? "● Speaking" : isListening ? "● Listening" : "○ Ready"}
          </motion.div>
        </div>
      </div>

      {/* ─── Transcript ─────────────────────────────────────────────── */}
      <div className="w-full max-w-2xl min-h-[90px] max-h-[170px] overflow-y-auto">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400 mb-1 font-medium">AI Interviewer</p>
              <p className="text-slate-700 text-sm leading-relaxed">
                {displayedText}
                {textIndex < transcript.length && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 align-middle"
                  />
                )}
                {!transcript && (
                  <span className="text-slate-300 italic">Waiting for the interview to begin...</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
