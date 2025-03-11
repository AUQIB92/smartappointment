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

    const {
      name,
      mobile,
      email,
      address,
      specialization,
      qualifications,
      password,
    } = await req.json();

    // Validate required fields
    if (!name || !mobile || !specialization) {
      return NextResponse.json(
        { error: "Name, mobile, and specialization are required" },
        { status: 400 }
      );
    }

    // Check if doctor already exists with the same mobile
    const existingDoctor = await User.findOne({ mobile });
    if (existingDoctor) {
      return NextResponse.json(
        { error: "A user with this mobile number already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password || `${mobile}123`, 10);

    // Create the new doctor
    const newDoctor = new User({
      name,
      mobile,
      email: email || `${mobile}@placeholder.com`,
      address: address || "Not provided",
      role: "doctor",
      specialization,
      qualifications: qualifications || "Not provided",
      password: hashedPassword,
      verified: true, // Doctors are verified by default
    });

    await newDoctor.save();

    // Don't return the password
    const doctorToReturn = { ...newDoctor.toObject() };
    delete doctorToReturn.password;

    return NextResponse.json(
      {
        message: "Doctor created successfully",
        doctor: doctorToReturn,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create doctor error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware to POST request (admin only)
export const POST = withAuth(createDoctor, ["admin"]);
export const GET = getDoctors;
