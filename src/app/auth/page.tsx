"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type AuthMode = "login" | "register";

// ─── localStorage Auth Helpers ────────────────────────────────────────────────

interface StoredUser {
  email: string;
  password: string;
  createdAt: string;
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem("hack2hire_users");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUser(user: StoredUser) {
  const users = getStoredUsers();
  users.push(user);
  localStorage.setItem("hack2hire_users", JSON.stringify(users));
}

function findUser(email: string): StoredUser | undefined {
  return getStoredUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

function setAuthSession(email: string) {
  const session = {
    email,
    id: `user_${Date.now()}`,
    hasResume: !!localStorage.getItem("hack2hire_resume"),
    loggedInAt: new Date().toISOString(),
  };
  sessionStorage.setItem("hack2hire_auth", JSON.stringify(session));
  // Also check if resume data exists in localStorage and sync to sessionStorage
  const savedResume = localStorage.getItem("hack2hire_resume");
  if (savedResume) {
    sessionStorage.setItem("hack2hire_resume", savedResume);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Gmail validation
  const isGmailValid = (e: string) => e.toLowerCase().endsWith("@gmail.com");

  // Password strength checks
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const passwordStrong = Object.values(passwordChecks).every(Boolean);

  // ─── Login ──────────────────────────────────────────────────────────
  const handleLogin = () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (!isGmailValid(email)) {
      setError("Only @gmail.com accounts are permitted for this beta.");
      return;
    }
    setError("");
    setLoading(true);

    // Simulate slight network delay for UX
    setTimeout(() => {
      const user = findUser(email);
      if (!user) {
        setError("No account found with this email. Please sign up first.");
        setLoading(false);
        return;
      }
      if (user.password !== password) {
        setError("Invalid credentials. Please check your password.");
        setLoading(false);
        return;
      }
      setAuthSession(email);
      router.push("/dashboard");
    }, 300);
  };

  // ─── Register ───────────────────────────────────────────────────────
  const handleRegister = () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (!isGmailValid(email)) {
      setError("Only @gmail.com accounts are permitted for this beta.");
      return;
    }
    if (!passwordStrong) {
      setError("Password does not meet all requirements");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);

    setTimeout(() => {
      const existing = findUser(email);
      if (existing) {
        setError("An account with this email already exists. Please log in.");
        setLoading(false);
        return;
      }
      saveUser({
        email: email.toLowerCase(),
        password,
        createdAt: new Date().toISOString(),
      });
      setAuthSession(email);
      router.push("/dashboard");
    }, 300);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const stageVariants = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35 } },
    exit: { opacity: 0, x: -30, transition: { duration: 0.25 } },
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Ready<span className="text-indigo-600">?</span>.com
              </h1>
            </div>
            <p className="text-slate-400 text-sm">AI-Powered Mock Interview Platform</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* ─── LOGIN ─────────────────────────────────────── */}
            {mode === "login" && (
              <motion.div key="login" variants={stageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
                  <p className="text-slate-400 text-sm">Sign in with your Gmail account</p>
                </div>
                <Input
                  label="Gmail Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                  error={email && !isGmailValid(email) ? "Only @gmail.com accounts are permitted for this beta." : undefined}
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                />
                <Button variant="primary" size="lg" className="w-full" onClick={handleLogin} loading={loading}
                  disabled={!email || !password || !isGmailValid(email)}>
                  Sign In
                </Button>
                <p className="text-center text-sm text-slate-400">
                  Don&apos;t have an account?{" "}
                  <button onClick={() => switchMode("register")} className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                    Sign Up
                  </button>
                </p>
              </motion.div>
            )}

            {/* ─── REGISTER ──────────────────────────────────── */}
            {mode === "register" && (
              <motion.div key="register" variants={stageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Create your account</h2>
                  <p className="text-slate-400 text-sm">Use your Gmail address to register</p>
                </div>
                <Input
                  label="Gmail Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                  error={email && !isGmailValid(email) ? "Only @gmail.com accounts are permitted for this beta." : undefined}
                />
                <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                />
                <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                />
                {/* Password strength indicators */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "8+ characters", met: passwordChecks.length },
                    { label: "Uppercase letter", met: passwordChecks.uppercase },
                    { label: "Number", met: passwordChecks.number },
                    { label: "Special character", met: passwordChecks.special },
                  ].map(({ label, met }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs ${met ? "text-emerald-600" : "text-slate-300"}`}>
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${met ? "bg-emerald-100" : "bg-slate-100"}`}>
                        {met && <span className="text-[8px]">✓</span>}
                      </div>
                      {label}
                    </div>
                  ))}
                </div>
                <Button variant="primary" size="lg" className="w-full" onClick={handleRegister} loading={loading}
                  disabled={!email || !password || !confirmPassword || !isGmailValid(email) || !passwordStrong || password !== confirmPassword}>
                  Create Account
                </Button>
                <p className="text-center text-sm text-slate-400">
                  Already have an account?{" "}
                  <button onClick={() => switchMode("login")} className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                    Sign In
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-600 text-sm mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right Panel — Illustration */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden bg-slate-50">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(#4F46E5 1px, transparent 1px), linear-gradient(90deg, #4F46E5 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        {/* Floating geometric shapes */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-2xl border border-indigo-200/50"
            style={{
              width: 60 + i * 25,
              height: 60 + i * 25,
              background: `rgba(79, 70, 229, ${0.03 + i * 0.01})`,
              left: `${15 + i * 14}%`,
              top: `${15 + (i % 3) * 22}%`,
            }}
            animate={{
              y: [0, -15 - i * 3, 0],
              rotate: [0, 5 + i * 2, 0],
            }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          />
        ))}

        <div className="relative z-10 text-center px-12">
          {/* Central icon */}
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: "spring" }} className="relative w-44 h-44 mx-auto mb-8">
            <motion.div className="absolute inset-0 rounded-full border-2 border-indigo-200/50" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
            <motion.div className="absolute inset-4 rounded-full border-2 border-indigo-300/40" animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} />
            <div className="absolute inset-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/25">
              <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-3xl font-bold text-slate-900 mb-4">
            AI-Powered Interview
            <br />
            <span className="gradient-text">Practice & Analysis</span>
          </motion.h2>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-slate-500 max-w-sm mx-auto leading-relaxed">
            Get real-time feedback on your technical interview performance with AI-driven evaluation and personalized coaching.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="flex flex-wrap justify-center gap-2 mt-8">
            {["Voice Recognition", "Real-time Scoring", "Smart Analytics", "Code Editor"].map((feature, i) => (
              <motion.span key={feature} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 + i * 0.1 }} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-500 text-xs shadow-sm">
                {feature}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
