"use client";

import { motion } from "framer-motion";
import type { InterviewSession } from "@/utils/db";

interface HistoryCardProps {
  session: InterviewSession;
  index: number;
}

export default function HistoryCard({ session, index }: HistoryCardProps) {
  const badge = session.evaluation.badge;
  const badgeColors = {
    Strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Average: "bg-amber-50 text-amber-700 border-amber-200",
    "Needs Improvement": "bg-red-50 text-red-600 border-red-200",
  };

  const formatDate = (timestamp: string) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white border border-slate-200 rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all duration-300"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 text-sm">{session.jobTitle}</h4>
          <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{session.jobDescription.slice(0, 80)}...</p>
        </div>
        <span className={`flex-shrink-0 ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold border ${badgeColors[badge]}`}>
          {badge}
        </span>
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {formatDate(session.timestamp)}
        </div>
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {formatDuration(session.durationSeconds)}
        </div>
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          Score: <span className="font-semibold text-slate-600">{session.evaluation.finalScore}/100</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${session.evaluation.finalScore}%` }}
          transition={{ duration: 0.8, delay: 0.3 + index * 0.08 }}
          className={`h-full rounded-full ${
            session.evaluation.finalScore >= 75 ? "bg-emerald-500" :
            session.evaluation.finalScore >= 50 ? "bg-amber-500" : "bg-red-500"
          }`}
        />
      </div>

      {/* AI Insights */}
      {(session.evaluation.strengths.length > 0 || session.evaluation.weaknesses.length > 0) && (
        <div className="space-y-3">
          {session.evaluation.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 mb-1.5 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Strengths
              </p>
              <ul className="space-y-1">
                {session.evaluation.strengths.slice(0, 2).map((s, i) => (
                  <li key={i} className="text-xs text-slate-500 pl-3 border-l-2 border-emerald-200">{s}</li>
                ))}
              </ul>
            </div>
          )}
          {session.evaluation.weaknesses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 mb-1.5 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Areas to Improve
              </p>
              <ul className="space-y-1">
                {session.evaluation.weaknesses.slice(0, 2).map((w, i) => (
                  <li key={i} className="text-xs text-slate-500 pl-3 border-l-2 border-red-200">{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Termination reason */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[11px] text-slate-300 italic">{session.terminationReason}</p>
      </div>
    </motion.div>
  );
}
