import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import User from "../../../../models/User";
import { generateAndStoreOTP } from "../../../../lib/otpService";

export async function POST(req) {
  try {
    await connectToDatabase();

    const { mobile, email, isLogin = true } = await req.json();

    // Check if either mobile or email is provided
    if (!mobile && !email) {
      return NextResponse.json(
        { error: "Either mobile number or email is required" },
        { status: 400 }
      );
    }

    // Find user by mobile number or email
    let user;
    let identifier;
    let identifierType;

    if (mobile) {
      user = await User.findOne({ mobile });
      identifier = mobile;
      identifierType = 'phone';
    } else {
      user = await User.findOne({ email });
      identifier = email;
      identifierType = 'email';
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please register first." },
        { status: 404 }
      );
    }

    // Generate and store OTP
    const result = await generateAndStoreOTP(identifier, identifierType, !isLogin);
    
    if (!result.success) {
      console.error('Login API - OTP generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate OTP' },
        { status: 500 }
      );
    }
    
    const otp = result.otp;
    
    // DEVELOPMENT MODE: Log OTP
    console.log(`=== DEVELOPMENT MODE: OTP for ${identifier} is ${otp} ===`);

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent successfully",
        // DEVELOPMENT ONLY: Include OTP in response (remove in production)
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
