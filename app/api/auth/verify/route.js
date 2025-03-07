import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import User from "../../../../models/User";
import { signToken } from "../../../../lib/jwt";

export async function POST(req) {
  try {
    await connectToDatabase();

    const { mobile, otp, isRegistration } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json(
        { error: "Mobile number and OTP are required" },
        { status: 400 }
      );
    }

    // Find user by mobile number
    const user = await User.findOne({ mobile });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if OTP exists and is valid
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return NextResponse.json(
        { error: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.otp.expiresAt)) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.otp.code !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // If this is a registration verification, mark user as verified
    if (isRegistration) {
      user.verified = true;
    }

    // Clear OTP after successful verification
    user.otp = {
      code: null,
      expiresAt: null,
    };

    await user.save();

    // Generate JWT token
    const token = signToken({
      id: user._id,
      mobile: user.mobile,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json(
      {
        message: "OTP verified successfully",
        token,
        role: user.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
