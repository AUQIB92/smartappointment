import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import User from "../../../../models/User";
import { signToken } from "../../../../lib/jwt";
import bcrypt from "bcrypt";

// WARNING: This endpoint is for development purposes only and should be disabled in production!
export async function POST(req) {
  try {
    // Check if we're in development mode
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "This endpoint is only available in development mode" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { mobile, password } = await req.json();

    if (!mobile) {
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 }
      );
    }

    // Find user by mobile number
    const user = await User.findOne({ mobile });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please register first." },
        { status: 404 }
      );
    }

    // If password is provided, verify it (for admin login)
    if (password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
    }

    // For development, we'll just log in the user directly without OTP
    console.log(
      `=== DEVELOPMENT MODE: Direct login for user ${user.name} (${mobile}) ===`
    );

    // Generate JWT token
    const token = signToken({
      id: user._id,
      mobile: user.mobile,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json(
      {
        message: "Login successful",
        token,
        role: user.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Direct login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
