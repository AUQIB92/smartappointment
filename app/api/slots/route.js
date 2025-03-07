import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/db";
import DoctorSlot from "../../../models/DoctorSlot";
import User from "../../../models/User";
import { withAuth } from "../../../middleware/auth";
import { generateDefaultDoctorSlots } from "../../../utils/slotGenerator";

// Get slots with filtering options
async function getSlots(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctor_id");
    const day = searchParams.get("day");
    const isAvailable = searchParams.get("is_available");
    const isAdminOnly = searchParams.get("is_admin_only");

    let query = {};

    if (doctorId) {
      query.doctor_id = doctorId;
    }

    if (day) {
      query.day = day;
    }

    if (isAvailable !== null && isAvailable !== undefined) {
      query.is_available = isAvailable === "true";
    }

    if (isAdminOnly !== null && isAdminOnly !== undefined) {
      query.is_admin_only = isAdminOnly === "true";
    }

    const slots = await DoctorSlot.find(query)
      .populate("doctor_id", "name specialization")
      .sort({ day: 1, start_time: 1 });

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error("Get slots error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Generate default slots for a doctor
async function generateSlots(req) {
  try {
    await connectToDatabase();
    const { doctor_id } = await req.json();

    if (!doctor_id) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctor_id, role: "doctor" });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Check if slots already exist for this doctor
    const existingSlots = await DoctorSlot.find({ doctor_id });
    if (existingSlots.length > 0) {
      return NextResponse.json(
        {
          message: "Slots already exist for this doctor",
          count: existingSlots.length,
        },
        { status: 200 }
      );
    }

    // Generate default slots
    const slots = generateDefaultDoctorSlots(doctor_id);

    // Insert slots into database
    await DoctorSlot.insertMany(slots);

    return NextResponse.json(
      {
        message: "Default slots generated successfully",
        count: slots.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Generate slots error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update multiple slots
async function updateSlots(req) {
  try {
    await connectToDatabase();
    const { slots } = await req.json();

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: "Valid slots array is required" },
        { status: 400 }
      );
    }

    const updatePromises = slots.map(async (slot) => {
      if (!slot._id) {
        return { error: "Slot ID is required", slot };
      }

      try {
        const updatedSlot = await DoctorSlot.findByIdAndUpdate(
          slot._id,
          {
            $set: {
              is_available: slot.is_available,
              is_admin_only: slot.is_admin_only,
              updated_at: new Date(),
            },
          },
          { new: true }
        );

        return updatedSlot || { error: "Slot not found", id: slot._id };
      } catch (err) {
        return { error: err.message, id: slot._id };
      }
    });

    const results = await Promise.all(updatePromises);

    return NextResponse.json(
      { message: "Slots updated", results },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update slots error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getSlots, ["admin", "doctor", "patient"]);
export const POST = withAuth(generateSlots, ["admin"]);
export const PUT = withAuth(updateSlots, ["admin"]);
