export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/utils/groqClient";
import { saveResume } from "@/utils/localDb";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let rawText = "";

    // ─── PDF Extraction with Fallback ──────────────────────────────────
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      try {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const textResult = await parser.getText();
        rawText = textResult.pages.map((p) => p.text).join("\n");
      } catch (pdfError) {
        console.warn("PDF parser failed, attempting UTF-8 fallback:", pdfError);

        // Fallback: decode buffer as UTF-8 and strip binary noise
        const rawDecode = buffer.toString("utf-8");
        // Extract printable ASCII/Unicode runs (3+ chars) to salvage readable text
        const textChunks = rawDecode.match(/[\x20-\x7E\u00A0-\uFFFF]{3,}/g);
        if (textChunks && textChunks.length > 0) {
          rawText = textChunks.join(" ");
        }

        if (!rawText.trim()) {
          return NextResponse.json(
            {
              error:
                "Could not extract text from this PDF. The file may be image-based or corrupted. Please try a text-based PDF or a .txt file.",
            },
            { status: 422 }
          );
        }
      }
    } else if (
      file.type === "text/plain" ||
      file.name.endsWith(".txt")
    ) {
      rawText = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or TXT file." },
        { status: 400 }
      );
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from the file." },
        { status: 422 }
      );
    }

    // ─── Groq AI Extraction ────────────────────────────────────────────
    const extractionPrompt = `You are a resume parsing AI. Extract structured information from the following resume text. Return ONLY valid JSON with no extra text.

Resume Text:
"""
${rawText.slice(0, 6000)}
"""

Return JSON in this exact format:
{
  "name": "Full Name",
  "email": "email@example.com",
  "skills": ["skill1", "skill2", ...],
  "experience": ["Company - Role - Duration - Brief description", ...],
  "projects": ["Project name - Brief description", ...],
  "education": ["Degree - Institution - Year", ...],
  "summary": "A 2-3 sentence professional summary"
}

If a field is not found, use an empty string or empty array. Extract at least 5-10 skills if possible.`;

    const result = await chatCompletion(
      [
        {
          role: "system",
          content: "You are a precise resume parser. Return only valid JSON.",
        },
        { role: "user", content: extractionPrompt },
      ],
      { temperature: 0.3, response_format: { type: "json_object" } }
    );

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      // If Groq returns malformed JSON, return a minimal fallback
      parsed = {
        name: "",
        email: "",
        skills: [],
        experience: [],
        projects: [],
        education: [],
        summary: rawText.slice(0, 200),
      };
    }

    // Save to persistent file DB (use email from form or parsed resume)
    const userEmail = formData.get("email") as string | null;
    if (userEmail || parsed.email) {
      try {
        saveResume(userEmail || parsed.email, parsed);
      } catch (dbErr) {
        console.warn("Failed to persist resume to localDb:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Resume parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse resume. Please try again." },
      { status: 500 }
    );
  }
}
