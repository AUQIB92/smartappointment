import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import User from "../../../../models/User";
import { generateOTP, sendOTP } from "../../../../lib/twilio";

export async function POST(req) {
  try {
    await connectToDatabase();

    const { name, mobile, address, role } = await req.json();

    // Validate required fields
    if (!name || !mobile || !address) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Ensure only patients can register through this endpoint
    if (role !== "patient") {
      return NextResponse.json(
        { error: "Only patients can register through this endpoint" },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ mobile });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this mobile number already exists" },
        { status: 409 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    // Create new user
    const newUser = new User({
      name,
      mobile,
      address,
      role: "patient", // Force role to be patient
      otp: {
        code: otp,
        expiresAt: otpExpiry,
      },
      verified: false,
    });

    await newUser.save();

    // Send OTP via Twilio
    const result = await sendOTP(mobile, otp);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "User registered successfully. OTP sent for verification.",
        userId: newUser._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
