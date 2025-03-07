import { NextResponse } from "next/server";
import connectToDatabase from "../../../../../lib/db";
import DoctorSlot from "../../../../../models/DoctorSlot";
import { withAuth } from "../../../../../middleware/auth";

// Get doctor slots for a specific date
async function getDoctorSlots(req, { params }) {
  try {
    await connectToDatabase();

    const doctorId = params?.id;
    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    let query = { doctor_id: doctorId };

    // If date is provided, filter by date
    if (dateParam) {
      const date = new Date(dateParam);

      // Get day of week for the selected date
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const dayOfWeek = days[date.getDay()];

      // Query for slots with matching date OR matching day
      query = {
        doctor_id: doctorId,
        $or: [
          // Specific date slots (admin-added)
          {
            date: {
              $gte: new Date(date.setHours(0, 0, 0, 0)),
              $lte: new Date(date.setHours(23, 59, 59, 999)),
            },
          },
          // Regular weekly slots
          { day: dayOfWeek, date: null },
        ],
      };
    }

    const slots = await DoctorSlot.find(query).sort({ start_time: 1 });

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error("Get doctor slots error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export the handler function with authentication middleware
export const GET = withAuth(getDoctorSlots);
