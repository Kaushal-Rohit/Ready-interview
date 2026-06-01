export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "No audio file provided", transcript: "" },
        { status: 400 }
      );
    }

    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length < 100) {
      return NextResponse.json({
        success: true,
        transcript: "",
        confidence: 0,
      });
    }

    // Use Deepgram REST API directly instead of SDK stream approach
    // The SDK's Readable.from() was producing "corrupt or unsupported data" errors
    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramKey) {
      console.error("DEEPGRAM_API_KEY not set");
      return NextResponse.json(
        { success: false, error: "Deepgram API key not configured", transcript: "" },
        { status: 500 }
      );
    }

    const contentType = audioFile.type || "audio/webm";

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en&punctuate=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${deepgramKey}`,
          "Content-Type": contentType,
        },
        body: buffer,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Deepgram API error:", response.status, errorBody);
      return NextResponse.json({
        success: false,
        error: `Deepgram returned ${response.status}`,
        transcript: "",
      });
    }

    const data = await response.json();
    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
    const confidence =
      data?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    return NextResponse.json({
      success: true,
      transcript,
      confidence,
    });
  } catch (error) {
    console.error("Deepgram route error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process audio", transcript: "" },
      { status: 500 }
    );
  }
}
