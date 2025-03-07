import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import User from "../../../../models/User";
import { withAuth } from "../../../../middleware/auth";

// Get a specific patient by ID
async function getPatient(req, { params }) {
  try {
    await connectToDatabase();

    const patientId = params?.id;
    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    const patient = await User.findOne({
      _id: patientId,
      role: "patient",
    }).select("-password");

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient }, { status: 200 });
  } catch (error) {
    console.error("Get patient error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getPatient);
