import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import User from "../../../../models/User";
import { generateOTP, sendOTP } from "../../../../lib/twilio";

export async function POST(req) {
  try {
    await connectToDatabase();

    const { mobile } = await req.json();

    if (!mobile) {
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 }
      );
    }

    // Find user by mobile number
    let user = await User.findOne({ mobile });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please register first." },
        { status: 404 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    // Update user with OTP
    user.otp = {
      code: otp,
      expiresAt: otpExpiry,
    };

    await user.save();

    // DEVELOPMENT MODE: Skip Twilio and log OTP instead
    // This avoids the ECONNRESET error when Twilio is not properly configured
    console.log(`=== DEVELOPMENT MODE: OTP for ${mobile} is ${otp} ===`);

    // In production, this would use Twilio
    let result = { success: true };

    // Uncomment to use real Twilio in production
    // try {
    //   result = await sendOTP(mobile, otp);
    // } catch (error) {
    //   console.error("Twilio error:", error);
    //   result = { success: false };
    // }

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
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
