import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/db";
import User from "../../../models/User";
import { withAuth } from "../../../middleware/auth";
import bcrypt from "bcrypt";

// Get all patients
async function getPatients(req) {
  try {
    await connectToDatabase();

    const patients = await User.find({ role: "patient" }).select("-password");

    return NextResponse.json({ patients }, { status: 200 });
  } catch (error) {
    console.error("Get patients error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new patient
async function createPatient(req) {
  try {
    await connectToDatabase();

    const { name, mobile, email, address } = await req.json();

    // Validate required fields
    if (!name || !mobile) {
      return NextResponse.json(
        { error: "Name and mobile number are required" },
        { status: 400 }
      );
    }

    // Check if patient already exists with the same mobile
    const existingPatient = await User.findOne({ mobile });
    if (existingPatient) {
      return NextResponse.json(
        { error: "A user with this mobile number already exists" },
        { status: 400 }
      );
    }

    // Generate a random password for the new patient
    const tempPassword = `${mobile}123`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newPatient = new User({
      name,
      mobile,
      email: email || `${mobile}@placeholder.com`,
      address: address || "Not provided",
      role: "patient",
      password: hashedPassword,
    });

    await newPatient.save();

    // Don't return the password
    const patientToReturn = { ...newPatient.toObject() };
    delete patientToReturn.password;

    return NextResponse.json(
      {
        message: "Patient created successfully",
        patient: patientToReturn,
        tempPassword, // This would be sent to the patient via SMS in a real app
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create patient error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getPatients);
export const POST = withAuth(createPatient);
