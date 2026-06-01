// ─── In-Memory Database (Hackathon Demo) ──────────────────────────────────────
// Persists across requests during server runtime. Resets on server restart.

import type { ResumeData, EvaluationResult, QuestionRecord } from "./stateEngine";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string; // plain text for demo — never do this in production
  createdAt: string;
  resumeData: ResumeData | null;
  interviewHistory: InterviewSession[];
}

export interface InterviewSession {
  id: string;
  jobTitle: string;
  jobDescription: string;
  timestamp: string;
  durationSeconds: number;
  questionHistory: QuestionRecord[];
  evaluation: EvaluationResult;
  terminationReason: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const users = new Map<string, UserRecord>();
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// ─── User Operations ──────────────────────────────────────────────────────────

export function createUser(email: string, password: string): UserRecord {
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const user: UserRecord = {
    id,
    email: email.toLowerCase(),
    passwordHash: password,
    createdAt: new Date().toISOString(),
    resumeData: null,
    interviewHistory: [],
  };
  users.set(email.toLowerCase(), user);
  return user;
}

export function findUserByEmail(email: string): UserRecord | undefined {
  return users.get(email.toLowerCase());
}

export function verifyPassword(user: UserRecord, password: string): boolean {
  return user.passwordHash === password;
}

export function updateUserResume(email: string, resumeData: ResumeData): boolean {
  const user = users.get(email.toLowerCase());
  if (!user) return false;
  user.resumeData = resumeData;
  return true;
}

export function addInterviewSession(email: string, session: InterviewSession): boolean {
  const user = users.get(email.toLowerCase());
  if (!user) return false;
  user.interviewHistory.unshift(session); // newest first
  return true;
}

export function getUserHistory(email: string): InterviewSession[] {
  const user = users.get(email.toLowerCase());
  return user?.interviewHistory || [];
}

// ─── OTP Operations ───────────────────────────────────────────────────────────

export function generateOTP(email: string): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
  return otp;
}

export function verifyOTP(email: string, otp: string): boolean {
  const stored = otpStore.get(email.toLowerCase());
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return false;
  }
  if (stored.otp !== otp) return false;
  otpStore.delete(email.toLowerCase());
  return true;
}
