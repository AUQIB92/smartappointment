import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/db";
import User from "../../../models/User";
import { withAuth } from "../../../middleware/auth";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

// Get all doctors
async function getDoctors(req) {
  try {
    await connectToDatabase();

    // Get all doctors
    const doctors = await User.find({ role: "doctor" }).select(
      "-otp -password"
    );

    return NextResponse.json({ doctors }, { status: 200 });
  } catch (error) {
    console.error("Get doctors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add a new doctor (admin only)
async function createDoctor(req) {
  try {
    await connectToDatabase();

    const { name, mobile, address, specialization, qualifications, email } =
      await req.json();

    // Validate required fields
    if (!name || !mobile || !address || !specialization) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if doctor already exists
    const existingDoctor = await User.findOne({ mobile, role: "doctor" });

    if (existingDoctor) {
      return NextResponse.json(
        { error: "Doctor with this mobile number already exists" },
        { status: 409 }
      );
    }

    // Check if email is already in use (if provided)
    if (email) {
      const existingUserWithEmail = await User.findOne({ email });
      if (existingUserWithEmail) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 }
        );
      }
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Generate a unique clerkId for the doctor
    const doctorClerkId = "doctor-" + new mongoose.Types.ObjectId().toString();

    // Create new doctor
    const newDoctor = new User({
      name,
      mobile,
      address,
      email: email || `doctor_${mobile}@drimranshealthcare.com`, // Generate a unique email if not provided
      password: hashedPassword,
      role: "doctor",
      specialization,
      qualifications,
      verified: true, // Doctors added by admin are automatically verified
      clerkId: doctorClerkId, // Add unique clerkId
    });

    await newDoctor.save();

    return NextResponse.json(
      {
        message: "Doctor added successfully",
        doctor: {
          id: newDoctor._id,
          name: newDoctor.name,
          mobile: newDoctor.mobile,
          email: newDoctor.email,
          specialization: newDoctor.specialization,
          clerkId: newDoctor.clerkId,
        },
        tempPassword, // This would be sent to the doctor via SMS in a real application
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add doctor error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware to POST request (admin only)
export const POST = withAuth(createDoctor, ["admin"]);
export const GET = getDoctors;
