import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import DoctorSlot from "../../../../models/DoctorSlot";
import User from "../../../../models/User";
import { withAuth } from "../../../../middleware/auth";

// Add a single slot
async function addSlot(req) {
  try {
    await connectToDatabase();
    const {
      doctor_id,
      day,
      start_time,
      end_time: originalEndTime,
      duration,
      is_admin_only,
      is_available,
      date,
    } = await req.json();

    // Create a mutable variable for end time
    let end_time = originalEndTime;

    // Validate required fields
    if (!doctor_id || !day || !start_time || !end_time) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return NextResponse.json(
        { error: "Times must be in 24-hour format (HH:MM)" },
        { status: 400 }
      );
    }

    // Validate duration - enforce 15 minutes as default
    const slotDuration = duration || 15;
    if (
      slotDuration !== 15 &&
      slotDuration !== 30 &&
      slotDuration !== 45 &&
      slotDuration !== 60
    ) {
      return NextResponse.json(
        { error: "Duration must be 15, 30, 45, or 60 minutes" },
        { status: 400 }
      );
    }

    // Validate end time is after start time
    const [startHours, startMinutes] = start_time.split(":").map(Number);
    const [endHours, endMinutes] = end_time.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes <= startTotalMinutes) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Validate slot duration matches provided duration
    const calculatedDuration = endTotalMinutes - startTotalMinutes;
    if (calculatedDuration !== slotDuration) {
      // Recalculate correct end time based on start time and duration
      const correctedEndMinutes = startTotalMinutes + slotDuration;
      const correctedEndHours = Math.floor(correctedEndMinutes / 60);
      const correctedEndMins = correctedEndMinutes % 60;
      const correctedEndTime = `${correctedEndHours
        .toString()
        .padStart(2, "0")}:${correctedEndMins.toString().padStart(2, "0")}`;

      // Use corrected end time instead
      end_time = correctedEndTime;
    }

    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctor_id, role: "doctor" });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Check if slot already exists
    const existingSlot = await DoctorSlot.findOne({
      doctor_id,
      day,
      start_time,
    });

    if (existingSlot) {
      return NextResponse.json(
        {
          error:
            "A slot with this time already exists for this doctor on this day",
        },
        { status: 409 }
      );
    }

    // Create new slot
    const newSlot = new DoctorSlot({
      doctor_id,
      day,
      start_time,
      end_time,
      duration: slotDuration, // Use validated duration
      is_admin_only: is_admin_only || false,
      is_available: is_available !== undefined ? is_available : true,
      date: date || null, // Explicitly set date to null if not provided
    });

    await newSlot.save();

    return NextResponse.json(
      {
        message: "Slot added successfully",
        slot: newSlot,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add slot error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Duplicate slot. A slot with these details already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware (admin only)
export const POST = withAuth(addSlot, ["admin"]);
