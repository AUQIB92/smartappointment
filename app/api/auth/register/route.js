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
      password,
      role = "patient",
    } = await req.json();

    // Check if required fields exist
    if (!name || !mobile || !password) {
      return NextResponse.json(
        { error: "Name, mobile, and password are required" },
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email: email || `${mobile}@placeholder.com`, // Use email if provided, otherwise create placeholder
      mobile,
      password: hashedPassword,
      role,
    });

    await user.save();

    // Don't return the password
    const userToReturn = { ...user.toObject() };
    delete userToReturn.password;

    return NextResponse.json(
      { message: "User registered successfully", user: userToReturn },
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
