"use client";

import { motion } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { EvaluationResult } from "@/utils/stateEngine";

interface PerformanceChartProps {
  evaluation: EvaluationResult;
}

const COLORS = ["#4F46E5", "#6366F1", "#818CF8", "#A78BFA", "#10B981", "#059669", "#0EA5E9", "#F59E0B"];

export default function PerformanceChart({ evaluation }: PerformanceChartProps) {
  const allScores = Object.values(evaluation.categoryScores);
  const avg = (key: "accuracy" | "clarity" | "depth" | "relevance" | "timeEfficiency") =>
    allScores.reduce((s, c) => s + c[key], 0) / Math.max(allScores.length, 1);

  const radarData = [
    { subject: "Accuracy", value: avg("accuracy"), fullMark: 10 },
    { subject: "Clarity", value: avg("clarity"), fullMark: 10 },
    { subject: "Depth", value: avg("depth"), fullMark: 10 },
    { subject: "Relevance", value: avg("relevance"), fullMark: 10 },
    { subject: "Time Eff.", value: avg("timeEfficiency"), fullMark: 10 },
  ];

  const barData = Object.entries(evaluation.skillBreakdown).map(([skill, score]) => ({
    skill: skill.length > 12 ? skill.slice(0, 12) + "…" : skill,
    score: Math.min(100, Math.max(0, score)),
  }));

  const badgeConfig = {
    Strong: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
    Average: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    "Needs Improvement": { bg: "bg-red-100", text: "text-red-600", border: "border-red-200" },
  };
  const badge = badgeConfig[evaluation.badge];

  return (
    <div className="space-y-8">
      {/* Final Score */}
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="text-center">
        <div className="relative inline-flex flex-col items-center">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#F1F5F9" strokeWidth="8" />
              <motion.circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - evaluation.finalScore / 100) }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-4xl font-bold text-slate-900">{evaluation.finalScore}</motion.span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
            className={`mt-4 px-5 py-1.5 rounded-full text-sm font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
            {evaluation.badge}
          </motion.div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Performance Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748B", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
              <Radar name="Score" dataKey="value" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Skill Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <YAxis type="category" dataKey="skill" width={95} tick={{ fill: "#64748B", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px", color: "#0F172A" }} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="text-sm font-semibold text-emerald-700">Strengths</h3>
          </div>
          <ul className="space-y-2.5">
            {evaluation.strengths.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 + i * 0.1 }} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">●</span>{s}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="bg-red-50/50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 className="text-sm font-semibold text-red-600">Areas for Improvement</h3>
          </div>
          <ul className="space-y-2.5">
            {evaluation.weaknesses.map((w, i) => (
              <motion.li key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 + i * 0.1 }} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">●</span>{w}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
