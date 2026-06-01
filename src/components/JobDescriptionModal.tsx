"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface JobDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobTitle: string, jobDescription: string) => void;
  resumeSkills: string[];
  loading?: boolean;
}

export default function JobDescriptionModal({
  isOpen, onClose, onSubmit, resumeSkills, loading = false,
}: JobDescriptionModalProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [matchedSkills, setMatchedSkills] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!jobTitle.trim() || !jobDescription.trim()) return;
    const jdLower = jobDescription.toLowerCase();
    const matched = resumeSkills.filter((s) => jdLower.includes(s.toLowerCase()));
    setMatchedSkills(matched);
    setShowSuccess(true);
    setTimeout(() => onSubmit(jobTitle.trim(), jobDescription.trim()), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Interview Target" maxWidth="max-w-2xl">
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready for Interview!</h3>
            <p className="text-slate-400">Preparing your personalized session...</p>
            {matchedSkills.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 flex flex-wrap justify-center gap-2">
                {matchedSkills.map((skill) => (
                  <span key={skill} className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">✓ {skill}</span>
                ))}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <p className="text-slate-400 text-sm">Provide the target job details so the AI can tailor questions to evaluate your fit.</p>
            <Input label="Job Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Senior Frontend Engineer"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
            />
            <div>
              <label className="block text-sm text-slate-400 mb-2 ml-1">Job Description</label>
              <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={5}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 transition-all duration-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none"
              />
            </div>
            {resumeSkills.length > 0 && (
              <div>
                <p className="text-xs text-slate-300 mb-2">Your detected skills:</p>
                <div className="flex flex-wrap gap-1.5">
                  {resumeSkills.slice(0, 12).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-xs border border-indigo-100">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!jobTitle.trim() || !jobDescription.trim()} className="flex-1">
                Start Interview
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
