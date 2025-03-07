import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import DoctorSlot from "../../../../models/DoctorSlot";
import { withAuth } from "../../../../middleware/auth";

// Fix existing slots with incorrect time ranges
async function fixSlots(req) {
  try {
    await connectToDatabase();

    // Find all slots
    const allSlots = await DoctorSlot.find({});

    // Count of fixed slots
    let fixedCount = 0;
    let errorSlots = [];

    // Process each slot
    for (const slot of allSlots) {
      try {
        // Check if the slot has valid start_time and end_time
        if (!slot.start_time || !slot.end_time) {
          errorSlots.push({
            _id: slot._id,
            error: "Missing start or end time",
          });
          continue;
        }

        // Parse start time and end time
        const [startHours, startMinutes] = slot.start_time
          .split(":")
          .map(Number);
        const [endHours, endMinutes] = slot.end_time.split(":").map(Number);

        // Check if parsing was successful
        if (
          isNaN(startHours) ||
          isNaN(startMinutes) ||
          isNaN(endHours) ||
          isNaN(endMinutes)
        ) {
          errorSlots.push({ _id: slot._id, error: "Invalid time format" });
          continue;
        }

        // Calculate total minutes
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;

        // Check if end time is before or equal to start time
        if (endTotalMinutes <= startTotalMinutes) {
          // This is a slot that needs fixing

          // Use the duration to calculate correct end time
          const duration = slot.duration || 15; // Default to 15 minutes if not specified
          const correctedEndMinutes = startTotalMinutes + duration;
          const correctedEndHours = Math.floor(correctedEndMinutes / 60);
          const correctedEndMins = correctedEndMinutes % 60;

          // Format corrected end time
          const correctedEndTime = `${correctedEndHours
            .toString()
            .padStart(2, "0")}:${correctedEndMins.toString().padStart(2, "0")}`;

          // Update the slot with correct end time
          slot.end_time = correctedEndTime;
          await slot.save();

          fixedCount++;
        } else {
          // Slot is already valid, but verify duration matches time difference
          const calculatedDuration = endTotalMinutes - startTotalMinutes;
          if (calculatedDuration !== slot.duration) {
            // Update duration to match time difference
            slot.duration = calculatedDuration;
            await slot.save();
            fixedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing slot ${slot._id}:`, error);
        errorSlots.push({ _id: slot._id, error: error.message });
      }
    }

    return NextResponse.json(
      {
        message: `Fixed ${fixedCount} slots`,
        totalProcessed: allSlots.length,
        errors: errorSlots.length > 0 ? errorSlots : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fix slots error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware (admin only)
export const GET = withAuth(fixSlots, ["admin"]);
