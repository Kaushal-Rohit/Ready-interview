import { NextRequest, NextResponse } from "next/server";
import { generateOTP, verifyOTP } from "@/utils/db";

// POST: Generate and "send" OTP
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const otp = generateOTP(email);
    console.log(`\n🔐 OTP for ${email}: ${otp}\n`);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      ...(process.env.NODE_ENV !== "production" && { otp }),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate OTP" },
      { status: 500 }
    );
  }
}

// PUT: Verify OTP
export async function PUT(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const isValid = verifyOTP(email, otp);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP. Please try again." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
