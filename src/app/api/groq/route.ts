export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/utils/groqClient";
import type { QuestionType, Difficulty, ScoreBreakdown } from "@/utils/stateEngine";

// ─── Start Interview ──────────────────────────────────────────────────────────

async function handleStart(body: {
  resumeData: Record<string, unknown>;
  jobTitle: string;
  jobDescription: string;
  questionType: QuestionType;
  difficulty: Difficulty;
}) {
  const { resumeData, jobTitle, jobDescription, questionType, difficulty } = body;

  const systemPrompt = `You are a senior technical interviewer conducting a mock interview.

CANDIDATE PROFILE:
${JSON.stringify(resumeData, null, 2)}

TARGET ROLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}

INSTRUCTIONS:
- Generate exactly ONE ${difficulty} difficulty ${questionType} interview question
- The question should be relevant to both the candidate's background and the job requirements
- For Technical: ask about coding, algorithms, system design, or specific technologies
- For Conceptual: ask about theoretical understanding of concepts
- For Behavioral: ask STAR-method style questions about past experiences
- For Scenario: present a hypothetical workplace scenario to solve

Return ONLY valid JSON:
{
  "question": "Your interview question here",
  "expectedKeyPoints": ["key point 1", "key point 2", "key point 3"],
  "category": "${questionType}",
  "difficulty": "${difficulty}"
}`;

  const result = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate a ${difficulty} ${questionType} question for this candidate.` },
    ],
    { temperature: 0.8, response_format: { type: "json_object" } }
  );

  return JSON.parse(result);
}

// ─── Evaluate Answer ──────────────────────────────────────────────────────────

async function handleEvaluate(body: {
  question: string;
  answer: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  resumeData: Record<string, unknown>;
  jobTitle: string;
  jobDescription: string;
  responseTimeSeconds: number;
  nextQuestionType: QuestionType;
  nextDifficulty: Difficulty;
}) {
  const {
    question,
    answer,
    questionType,
    difficulty,
    resumeData,
    jobTitle,
    jobDescription,
    responseTimeSeconds,
    nextQuestionType,
    nextDifficulty,
  } = body;

  const systemPrompt = `You are an expert interview evaluator. Score the candidate's answer objectively.

CONTEXT:
- Role: ${jobTitle}
- JD: ${jobDescription}
- Question Type: ${questionType} (${difficulty})
- Response Time: ${responseTimeSeconds} seconds (max allowed: 90 seconds)

CANDIDATE PROFILE:
${JSON.stringify(resumeData, null, 2)}

SCORING CRITERIA (1-10 each):
1. Accuracy: How correct and factually accurate is the answer?
2. Clarity: How well-structured and easy to understand?
3. Depth: How thorough and detailed?
4. Relevance: How well does it address the specific question?
5. Time Efficiency: Did they answer within reasonable time? (penalize if close to or over 90s)

Also generate the NEXT interview question (${nextDifficulty} difficulty, ${nextQuestionType} type).

Return ONLY valid JSON:
{
  "scores": {
    "accuracy": <1-10>,
    "clarity": <1-10>,
    "depth": <1-10>,
    "relevance": <1-10>,
    "timeEfficiency": <1-10>
  },
  "feedback": "Brief 1-2 sentence feedback on the answer",
  "nextQuestion": {
    "question": "Next interview question",
    "expectedKeyPoints": ["point1", "point2"],
    "category": "${nextQuestionType}",
    "difficulty": "${nextDifficulty}"
  }
}`;

  const result = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Question asked: "${question}"\n\nCandidate's answer: "${answer}"`,
      },
    ],
    { temperature: 0.4, response_format: { type: "json_object" } }
  );

  return JSON.parse(result);
}

// ─── Generate Summary ─────────────────────────────────────────────────────────

async function handleSummary(body: {
  questionHistory: Array<{
    type: QuestionType;
    difficulty: Difficulty;
    question: string;
    answer: string;
    scores: ScoreBreakdown;
  }>;
  resumeData: Record<string, unknown>;
  jobTitle: string;
  jobDescription: string;
  finalScore: number;
}) {
  const { questionHistory, resumeData, jobTitle, jobDescription, finalScore } = body;

  const systemPrompt = `You are a career coach generating a comprehensive interview feedback report.

ROLE: ${jobTitle}
JD: ${jobDescription}
CANDIDATE: ${JSON.stringify(resumeData, null, 2)}
OVERALL SCORE: ${finalScore}/100

INTERVIEW TRANSCRIPT:
${questionHistory
  .map(
    (q, i) =>
      `Q${i + 1} [${q.type}/${q.difficulty}]: ${q.question}\nAnswer: ${q.answer}\nScores: Accuracy=${q.scores.accuracy}, Clarity=${q.scores.clarity}, Depth=${q.scores.depth}, Relevance=${q.scores.relevance}, TimeEff=${q.scores.timeEfficiency}`
  )
  .join("\n\n")}

Generate actionable feedback. Return ONLY valid JSON:
{
  "strengths": ["strength 1 (specific and actionable)", "strength 2", "strength 3", "strength 4"],
  "weaknesses": ["weakness 1 (specific and actionable)", "weakness 2", "weakness 3", "weakness 4"],
  "overallFeedback": "A paragraph summarizing overall performance and key recommendations",
  "topSkillsShown": ["skill1", "skill2", "skill3"],
  "improvementAreas": ["area1", "area2", "area3"]
}`;

  const result = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate the comprehensive feedback report." },
    ],
    { temperature: 0.5, response_format: { type: "json_object" } }
  );

  return JSON.parse(result);
}

// ─── Main Route Handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const body = await request.json();

    let result;

    switch (action) {
      case "start":
        result = await handleStart(body);
        break;
      case "evaluate":
        result = await handleEvaluate(body);
        break;
      case "summary":
        result = await handleSummary(body);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Groq route error:", error);
    return NextResponse.json(
      { error: "AI processing failed. Please try again." },
      { status: 500 }
    );
  }
}
