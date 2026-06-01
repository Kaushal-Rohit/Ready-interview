export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, verifyUser } from "@/utils/localDb";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email. Please sign up first." },
        { status: 404 }
      );
    }

    if (!verifyUser(email, password)) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your password." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
