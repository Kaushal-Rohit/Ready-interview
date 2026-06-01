// ─── Types ────────────────────────────────────────────────────────────────────

export type QuestionType = "Introduction" | "Technical" | "Conceptual" | "Behavioral" | "Scenario";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type InterviewStatus = "GREETING" | "IN_PROGRESS" | "TERMINATED";

export interface ScoreBreakdown {
  accuracy: number;    // 1-10
  clarity: number;     // 1-10
  depth: number;       // 1-10
  relevance: number;   // 1-10
  timeEfficiency: number; // 1-10
}

export interface QuestionRecord {
  index: number;
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  answer: string;
  scores: ScoreBreakdown;
  responseTimeSeconds: number;
  timedOut: boolean;
  timePenaltyApplied: boolean;
}

export interface InterviewState {
  sessionId: string;
  status: InterviewStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestionType: QuestionType;
  currentDifficulty: Difficulty;
  questionHistory: QuestionRecord[];
  consecutiveTimeouts: number;     // for 4-strike rule
  consecutivePoorScores: number;   // for early termination
  isTerminated: boolean;
  terminationReason: string | null;
  resumeData: ResumeData | null;
  jobDescription: string;
  jobTitle: string;
}

export interface ResumeData {
  name: string;
  email: string;
  skills: string[];
  experience: string[];
  projects: string[];
  education: string[];
  summary: string;
}

export interface EvaluationResult {
  finalScore: number;                // 0-100
  badge: "Strong" | "Average" | "Needs Improvement";
  categoryScores: Record<string, ScoreBreakdown>;
  strengths: string[];
  weaknesses: string[];
  skillBreakdown: Record<string, number>; // skill -> score
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TYPES: QuestionType[] = ["Technical", "Conceptual", "Behavioral", "Scenario"];
const MAX_QUESTIONS = 8;
const MAX_RESPONSE_TIME_SECONDS = 90;
const POOR_SCORE_THRESHOLD = 4; // average score below this = "poor"
const CONSECUTIVE_POOR_LIMIT = 3;
const STRIKE_LIMIT = 4;

export const GREETING_MESSAGE = "Hello! Welcome to your mock interview today. I have reviewed your resume and the target job description. Let's start with a brief introduction. Could you please introduce yourself and highlight your core background?";

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createInitialState(
  resumeData: ResumeData,
  jobTitle: string,
  jobDescription: string
): InterviewState {
  return {
    sessionId: `session_${Date.now()}`,
    status: "GREETING" as InterviewStatus,
    currentQuestionIndex: 0,
    totalQuestions: MAX_QUESTIONS,
    currentQuestionType: "Introduction" as QuestionType,
    currentDifficulty: "Easy",
    questionHistory: [],
    consecutiveTimeouts: 0,
    consecutivePoorScores: 0,
    isTerminated: false,
    terminationReason: null,
    resumeData,
    jobDescription,
    jobTitle,
  };
}

// ─── State Updates ────────────────────────────────────────────────────────────

export function getNextQuestionType(index: number): QuestionType {
  return QUESTION_TYPES[Math.floor(index / 2) % QUESTION_TYPES.length];
}

export function getDifficulty(state: InterviewState): Difficulty {
  if (state.questionHistory.length < 2) return "Easy";
  const recentAvg = getRecentAverageScore(state, 2);
  if (recentAvg >= 7) return "Hard";
  if (recentAvg >= 5) return "Medium";
  return "Easy";
}

function getRecentAverageScore(state: InterviewState, count: number): number {
  const recent = state.questionHistory.slice(-count);
  if (recent.length === 0) return 5;
  const total = recent.reduce((sum, q) => {
    const avg =
      (q.scores.accuracy +
        q.scores.clarity +
        q.scores.depth +
        q.scores.relevance +
        q.scores.timeEfficiency) /
      5;
    return sum + avg;
  }, 0);
  return total / recent.length;
}

export function applyTimePenalty(scores: ScoreBreakdown, responseTime: number): ScoreBreakdown {
  if (responseTime >= MAX_RESPONSE_TIME_SECONDS) {
    return {
      ...scores,
      timeEfficiency: Math.max(1, scores.timeEfficiency - 3),
    };
  }
  if (responseTime >= MAX_RESPONSE_TIME_SECONDS * 0.8) {
    return {
      ...scores,
      timeEfficiency: Math.max(1, scores.timeEfficiency - 1),
    };
  }
  return scores;
}

export function updateState(
  state: InterviewState,
  record: QuestionRecord
): InterviewState {
  const newHistory = [...state.questionHistory, record];
  const avgScore =
    (record.scores.accuracy +
      record.scores.clarity +
      record.scores.depth +
      record.scores.relevance +
      record.scores.timeEfficiency) /
    5;

  const isPoor = avgScore < POOR_SCORE_THRESHOLD;
  const newConsecutivePoor = isPoor ? state.consecutivePoorScores + 1 : 0;
  const newTimeouts = record.timedOut ? state.consecutiveTimeouts + 1 : 0;

  const nextIndex = state.currentQuestionIndex + 1;
  const newState: InterviewState = {
    ...state,
    currentQuestionIndex: nextIndex,
    currentQuestionType: getNextQuestionType(nextIndex),
    questionHistory: newHistory,
    consecutiveTimeouts: newTimeouts,
    consecutivePoorScores: newConsecutivePoor,
  };

  // Update difficulty based on performance
  newState.currentDifficulty = getDifficulty(newState);

  return newState;
}

// ─── Termination Logic ────────────────────────────────────────────────────────

export function shouldTerminate(state: InterviewState): {
  terminate: boolean;
  reason: string | null;
} {
  // 4-strike timeout rule
  if (state.consecutiveTimeouts >= STRIKE_LIMIT) {
    return {
      terminate: true,
      reason: "Four consecutive timeouts detected. Interview terminated.",
    };
  }

  // Early termination: poor performance on easy questions
  if (
    state.consecutivePoorScores >= CONSECUTIVE_POOR_LIMIT &&
    state.currentDifficulty === "Easy"
  ) {
    return {
      terminate: true,
      reason:
        "Thank you, we have collected sufficient points to generate your readiness analysis.",
    };
  }

  // Normal completion
  if (state.currentQuestionIndex >= state.totalQuestions) {
    return {
      terminate: true,
      reason: "Interview session completed successfully.",
    };
  }

  return { terminate: false, reason: null };
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

export function computeFinalEvaluation(state: InterviewState): EvaluationResult {
  const history = state.questionHistory;
  if (history.length === 0) {
    return {
      finalScore: 0,
      badge: "Needs Improvement",
      categoryScores: {},
      strengths: ["No data collected"],
      weaknesses: ["Interview was not completed"],
      skillBreakdown: {},
    };
  }

  // Category scores
  const categoryScores: Record<string, ScoreBreakdown> = {};
  for (const q of history) {
    if (!categoryScores[q.type]) {
      categoryScores[q.type] = { accuracy: 0, clarity: 0, depth: 0, relevance: 0, timeEfficiency: 0 };
    }
    categoryScores[q.type].accuracy += q.scores.accuracy;
    categoryScores[q.type].clarity += q.scores.clarity;
    categoryScores[q.type].depth += q.scores.depth;
    categoryScores[q.type].relevance += q.scores.relevance;
    categoryScores[q.type].timeEfficiency += q.scores.timeEfficiency;
  }

  // Average category scores
  const typeCounts: Record<string, number> = {};
  for (const q of history) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
  }
  for (const type of Object.keys(categoryScores)) {
    const count = typeCounts[type];
    categoryScores[type].accuracy = Math.round((categoryScores[type].accuracy / count) * 10) / 10;
    categoryScores[type].clarity = Math.round((categoryScores[type].clarity / count) * 10) / 10;
    categoryScores[type].depth = Math.round((categoryScores[type].depth / count) * 10) / 10;
    categoryScores[type].relevance = Math.round((categoryScores[type].relevance / count) * 10) / 10;
    categoryScores[type].timeEfficiency = Math.round((categoryScores[type].timeEfficiency / count) * 10) / 10;
  }

  // Overall score (0-100)
  const allScores = history.map(
    (q) =>
      (q.scores.accuracy + q.scores.clarity + q.scores.depth + q.scores.relevance + q.scores.timeEfficiency) / 5
  );
  const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  const finalScore = Math.round(avgScore * 10); // scale 1-10 -> 0-100

  // Badge
  let badge: EvaluationResult["badge"];
  if (finalScore >= 75) badge = "Strong";
  else if (finalScore >= 50) badge = "Average";
  else badge = "Needs Improvement";

  // Skill breakdown from resume skills
  const skills = state.resumeData?.skills || [];
  const skillBreakdown: Record<string, number> = {};
  for (const skill of skills.slice(0, 8)) {
    // Distribute scores across skills based on question history
    const relevantQuestions = history.filter(
      (q) => q.question.toLowerCase().includes(skill.toLowerCase()) || q.answer.toLowerCase().includes(skill.toLowerCase())
    );
    if (relevantQuestions.length > 0) {
      const avg =
        relevantQuestions.reduce(
          (s, q) =>
            s + (q.scores.accuracy + q.scores.clarity + q.scores.depth + q.scores.relevance + q.scores.timeEfficiency) / 5,
          0
        ) / relevantQuestions.length;
      skillBreakdown[skill] = Math.round(avg * 10);
    } else {
      skillBreakdown[skill] = Math.round(finalScore * (0.8 + Math.random() * 0.4));
    }
  }

  return {
    finalScore,
    badge,
    categoryScores,
    strengths: [],  // Will be populated by Groq summary
    weaknesses: [], // Will be populated by Groq summary
    skillBreakdown,
  };
}

export { MAX_RESPONSE_TIME_SECONDS, STRIKE_LIMIT, MAX_QUESTIONS };
