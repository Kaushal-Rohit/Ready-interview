"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import JobDescriptionModal from "@/components/JobDescriptionModal";
import PerformanceChart from "@/components/PerformanceChart";
import HistoryCard from "@/components/HistoryCard";
import type { ResumeData, EvaluationResult } from "@/utils/stateEngine";
import type { InterviewSession } from "@/utils/db";

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showJDModal, setShowJDModal] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<InterviewSession[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showResumeModal, setShowResumeModal] = useState(false);

  useEffect(() => {
    const authStr = sessionStorage.getItem("hack2hire_auth");
    if (!authStr) {
      router.push("/auth");
      return;
    }
    const auth = JSON.parse(authStr);
    setUserEmail(auth.email || "");

    // Load resume: prefer sessionStorage (current session), fall back to localStorage (persisted)
    const savedResume = sessionStorage.getItem("hack2hire_resume") || localStorage.getItem("hack2hire_resume");
    if (savedResume) {
      const parsed = JSON.parse(savedResume);
      setResumeData(parsed);
      // Sync to both stores
      sessionStorage.setItem("hack2hire_resume", savedResume);
      localStorage.setItem("hack2hire_resume", savedResume);
    } else {
      setShowResumeModal(true);
    }

    // Load evaluation
    const savedEval = sessionStorage.getItem("hack2hire_evaluation") || localStorage.getItem("hack2hire_evaluation");
    if (savedEval) {
      setEvaluation(JSON.parse(savedEval));
      sessionStorage.setItem("hack2hire_evaluation", savedEval);
    }

    // Load history
    const savedHistory = sessionStorage.getItem("hack2hire_history") || localStorage.getItem("hack2hire_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
      sessionStorage.setItem("hack2hire_history", savedHistory);
    }
  }, [router]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/resume", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setResumeData(data.data);
        const resumeStr = JSON.stringify(data.data);
        sessionStorage.setItem("hack2hire_resume", resumeStr);
        localStorage.setItem("hack2hire_resume", resumeStr);
        setShowResumeModal(false);
      } else {
        alert(data.error || "Failed to parse resume");
      }
    } catch {
      alert("Failed to upload resume. Please try again.");
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleJDSubmit = (jobTitle: string, jobDescription: string) => {
    sessionStorage.setItem("hack2hire_job", JSON.stringify({ jobTitle, jobDescription }));
    router.push("/interview");
  };

  // Upload area component used in both modal and inline
  const UploadArea = () => (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
        dragOver ? "border-indigo-500 bg-indigo-50 scale-[1.01]" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
      }`}
    >
      <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
      />
      {uploading ? (
        <div className="space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
          <p className="text-slate-400">Parsing your resume with AI...</p>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-500">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">Drop your resume here</h3>
          <p className="text-slate-400 text-sm mb-4">or click to browse — PDF & TXT supported</p>
          <div className="flex justify-center gap-3">
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs border border-indigo-100">PDF</span>
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs border border-indigo-100">TXT</span>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-slate-200 px-6 lg:px-10 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Ready<span className="text-indigo-600">?</span>.com</h1>
            <p className="text-slate-400 text-[11px]">Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm hidden sm:block">{userEmail}</span>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
            {resumeData?.name?.charAt(0) || userEmail?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </div>
      </motion.div>

      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Resume Upload Modal (blocks new users) */}
        <AnimatePresence>
          {showResumeModal && !resumeData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-xl border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Upload Your Resume</h2>
                <p className="text-slate-400 text-sm mb-6">We need your resume to personalize your interview experience.</p>
                <UploadArea />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {resumeData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Top Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              {/* Profile Card */}
              <Card className="lg:col-span-1" delay={0.1}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-indigo-500/15">
                    {resumeData.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{resumeData.name || "Candidate"}</h3>
                    <p className="text-slate-400 text-xs">{resumeData.email || userEmail}</p>
                  </div>
                </div>
                {resumeData.summary && <p className="text-slate-500 text-sm mb-5 leading-relaxed">{resumeData.summary}</p>}
                <div className="mb-4">
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeData.skills.slice(0, 10).map((skill) => (
                      <span key={skill} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium border border-indigo-100">{skill}</span>
                    ))}
                  </div>
                </div>
                {resumeData.experience.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Experience</h4>
                    <ul className="space-y-2">
                      {resumeData.experience.slice(0, 3).map((exp, i) => (
                        <li key={i} className="text-slate-500 text-xs flex items-start gap-2">
                          <span className="text-indigo-400 mt-0.5">▸</span>{exp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              {/* CTA Card */}
              <Card className="lg:col-span-1 flex flex-col items-center justify-center text-center" delay={0.2}>
                <motion.div className="relative mb-6" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="absolute inset-0 rounded-full border-2 border-indigo-300/30"
                      animate={{ scale: [1, 1.5 + i * 0.2], opacity: [0.4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                      style={{ width: 110, height: 110, left: -11, top: -11 }}
                    />
                  ))}
                  <Button variant="primary" size="xl" glow onClick={() => setShowJDModal(true)}
                    className="w-[88px] h-[88px] rounded-full text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    </svg>
                  </Button>
                </motion.div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Ready for Interview?</h3>
                <p className="text-slate-400 text-sm">Start your AI-powered mock session</p>
              </Card>

              {/* Quick Stats Card */}
              <Card className="lg:col-span-1" delay={0.3}>
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  Quick Stats
                </h3>
                {evaluation ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Last Score</span>
                      <span className={`text-xl font-bold ${evaluation.finalScore >= 75 ? "text-emerald-600" : evaluation.finalScore >= 50 ? "text-amber-600" : "text-red-500"}`}>
                        {evaluation.finalScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${evaluation.finalScore}%` }} transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full rounded-full ${evaluation.finalScore >= 75 ? "bg-emerald-500" : evaluation.finalScore >= 50 ? "bg-amber-500" : "bg-red-500"}`} />
                    </div>
                    <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold border ${
                      evaluation.badge === "Strong" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : evaluation.badge === "Average" ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-red-50 text-red-600 border-red-200"
                    }`}>{evaluation.badge}</span>
                    <p className="text-slate-400 text-xs">Sessions completed: {history.length}</p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <p className="text-slate-400 text-sm">No sessions yet</p>
                    <p className="text-slate-300 text-xs mt-1">Complete an interview to see stats</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Performance Analysis */}
            {evaluation && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-10">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  Latest Performance
                </h2>
                <PerformanceChart evaluation={evaluation} />
              </motion.div>
            )}

            {/* Interview History Timeline */}
            {history.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  Interview History
                </h2>
                <div className="space-y-4">
                  {history.map((session, i) => (
                    <HistoryCard key={session.id} session={session} index={i} />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      <JobDescriptionModal
        isOpen={showJDModal}
        onClose={() => setShowJDModal(false)}
        onSubmit={handleJDSubmit}
        resumeSkills={resumeData?.skills || []}
      />
    </div>
  );
}
