import fs from "fs";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DbUser {
  email: string;
  password: string;
  createdAt: string;
}

export interface DbResume {
  email: string;
  name: string;
  parsedEmail: string;
  skills: string[];
  experience: string[];
  projects: string[];
  education: string[];
  summary: string;
  uploadedAt: string;
}

export interface DbFeedback {
  email: string;
  sessionId: string;
  jobTitle: string;
  score: number;
  badge: string;
  strengths: string[];
  weaknesses: string[];
  durationSeconds: number;
  timestamp: string;
}

export interface DatabaseSchema {
  users: DbUser[];
  resumes: DbResume[];
  feedbacks: DbFeedback[];
}

// ─── File Path ────────────────────────────────────────────────────────────────

const DB_PATH = path.join(process.cwd(), "local-database.json");

// ─── Read / Write ─────────────────────────────────────────────────────────────

function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        resumes: Array.isArray(parsed.resumes) ? parsed.resumes : [],
        feedbacks: Array.isArray(parsed.feedbacks) ? parsed.feedbacks : [],
      };
    }
  } catch (err) {
    console.warn("Failed to read local-database.json, creating fresh:", err);
  }
  return { users: [], resumes: [], feedbacks: [] };
}

function writeDb(db: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write local-database.json:", err);
  }
}

// ─── User Operations ──────────────────────────────────────────────────────────

export function findUserByEmail(email: string): DbUser | undefined {
  const db = readDb();
  return db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

export function createUser(email: string, password: string): DbUser {
  const db = readDb();
  const user: DbUser = {
    email: email.toLowerCase(),
    password,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDb(db);
  return user;
}

export function verifyUser(email: string, password: string): boolean {
  const user = findUserByEmail(email);
  return !!user && user.password === password;
}

// ─── Resume Operations ────────────────────────────────────────────────────────

export function findResumeByEmail(email: string): DbResume | undefined {
  const db = readDb();
  return db.resumes.find(
    (r) => r.email.toLowerCase() === email.toLowerCase()
  );
}

export function saveResume(
  email: string,
  data: {
    name: string;
    email: string;
    skills: string[];
    experience: string[];
    projects: string[];
    education: string[];
    summary: string;
  }
): DbResume {
  const db = readDb();
  // Replace existing or add new
  const idx = db.resumes.findIndex(
    (r) => r.email.toLowerCase() === email.toLowerCase()
  );
  const resume: DbResume = {
    email: email.toLowerCase(),
    name: data.name,
    parsedEmail: data.email,
    skills: data.skills,
    experience: data.experience,
    projects: data.projects,
    education: data.education,
    summary: data.summary,
    uploadedAt: new Date().toISOString(),
  };
  if (idx >= 0) {
    db.resumes[idx] = resume;
  } else {
    db.resumes.push(resume);
  }
  writeDb(db);
  return resume;
}

// ─── Feedback Operations ──────────────────────────────────────────────────────

export function saveFeedback(feedback: DbFeedback): void {
  const db = readDb();
  db.feedbacks.push(feedback);
  writeDb(db);
}

export function getFeedbacksByEmail(email: string): DbFeedback[] {
  const db = readDb();
  return db.feedbacks.filter(
    (f) => f.email.toLowerCase() === email.toLowerCase()
  );
}
