import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import DoctorAvailability from "../../../../models/DoctorAvailability";
import User from "../../../../models/User";
import { withAuth } from "../../../../middleware/auth";

// Get doctor availability
async function getDoctorAvailability(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctor_id");
    const day = searchParams.get("day");

    let query = {};

    if (doctorId) {
      query.doctor_id = doctorId;
    }

    if (day) {
      query.day = day;
    }

    const availability = await DoctorAvailability.find(query)
      .populate("doctor_id", "name specialization")
      .sort({ day: 1 });

    return NextResponse.json({ availability }, { status: 200 });
  } catch (error) {
    console.error("Get doctor availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add or update doctor availability
async function createOrUpdateAvailability(req) {
  try {
    await connectToDatabase();

    const { doctor_id, day, slots, is_available } = await req.json();

    // Validate required fields
    if (!doctor_id || !day || !slots || !slots.length) {
      return NextResponse.json(
        { error: "Doctor ID, day, and at least one slot are required" },
        { status: 400 }
      );
    }

    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctor_id, role: "doctor" });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Validate slots format
    for (const slot of slots) {
      if (!slot.start_time || !slot.end_time) {
        return NextResponse.json(
          { error: "Each slot must have start_time and end_time" },
          { status: 400 }
        );
      }
    }

    // Find existing availability or create new one
    const existingAvailability = await DoctorAvailability.findOne({
      doctor_id,
      day,
    });

    if (existingAvailability) {
      // Update existing availability
      existingAvailability.slots = slots;
      existingAvailability.is_available =
        is_available !== undefined
          ? is_available
          : existingAvailability.is_available;
      await existingAvailability.save();

      return NextResponse.json(
        {
          message: "Doctor availability updated successfully",
          availability: existingAvailability,
        },
        { status: 200 }
      );
    } else {
      // Create new availability
      const newAvailability = new DoctorAvailability({
        doctor_id,
        day,
        slots,
        is_available: is_available !== undefined ? is_available : true,
      });

      await newAvailability.save();

      return NextResponse.json(
        {
          message: "Doctor availability added successfully",
          availability: newAvailability,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Add/update doctor availability error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Doctor already has availability set for this day" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete doctor availability
async function deleteAvailability(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Availability ID is required" },
        { status: 400 }
      );
    }

    const deletedAvailability = await DoctorAvailability.findByIdAndDelete(id);

    if (!deletedAvailability) {
      return NextResponse.json(
        { error: "Availability not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Doctor availability deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete doctor availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getDoctorAvailability, [
  "admin",
  "doctor",
  "patient",
]);
export const POST = withAuth(createOrUpdateAvailability, ["admin"]);
export const DELETE = withAuth(deleteAvailability, ["admin"]);
