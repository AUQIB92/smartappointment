import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import User from "../../../../models/User";
import { generateOTP, sendOTP } from "../../../../lib/twilio";
import bcrypt from "bcrypt";

// Validate mobile number function
function validateMobileNumber(mobile) {
  const mobileRegex = /^(\+91)?[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
}

export async function POST(req) {
  try {
    await connectToDatabase();

    // Parse request body
    const {
      name,
      email,
      mobile,
      address,
      role = "patient",
    } = await req.json();

    // Check if required fields exist
    if (!name || !mobile) {
      return NextResponse.json(
        { error: "Name and mobile are required" },
        { status: 400 }
      );
    }

    // Validate mobile number format
    if (!validateMobileNumber(mobile)) {
      return NextResponse.json(
        {
          error:
            "Invalid mobile number format. Please enter a valid 10-digit Indian mobile number",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this mobile number already exists" },
        { status: 400 }
      );
    }

    // Generate a temporary password
    const tempPassword = `${mobile}123`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    // Create user
    const user = new User({
      name,
      email: email || `${mobile}@placeholder.com`, // Use email if provided, otherwise create placeholder
      mobile,
      address: address || "Not provided",
      password: hashedPassword,
      role,
      otp: {
        code: otp,
        expiresAt: otpExpiry,
      },
    });

    await user.save();

    // DEVELOPMENT MODE: Skip Twilio and log OTP instead
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

    // Don't return the password
    const userToReturn = { ...user.toObject() };
    delete userToReturn.password;

    return NextResponse.json(
      { 
        message: "OTP sent successfully", 
        user: userToReturn,
        // DEVELOPMENT ONLY: Include OTP in response (remove in production)
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
