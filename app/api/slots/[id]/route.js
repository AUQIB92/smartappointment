import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import DoctorSlot from "../../../../models/DoctorSlot";
import { withAuth } from "../../../../middleware/auth";

// Get a specific slot
async function getSlot(req, { params }) {
  try {
    await connectToDatabase();
    const slotId = params.id;

    const slot = await DoctorSlot.findById(slotId).populate(
      "doctor_id",
      "name specialization"
    );

    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    return NextResponse.json({ slot }, { status: 200 });
  } catch (error) {
    console.error("Get slot error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a specific slot
async function updateSlot(req, { params }) {
  try {
    await connectToDatabase();
    const slotId = params.id;
    const { is_available, is_admin_only } = await req.json();

    // Find and update the slot
    const updatedSlot = await DoctorSlot.findByIdAndUpdate(
      slotId,
      {
        $set: {
          is_available: is_available !== undefined ? is_available : undefined,
          is_admin_only:
            is_admin_only !== undefined ? is_admin_only : undefined,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedSlot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Slot updated successfully",
        slot: updatedSlot,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update slot error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a specific slot
async function deleteSlot(req, { params }) {
  try {
    await connectToDatabase();
    const slotId = params.id;

    // Find and delete the slot
    const deletedSlot = await DoctorSlot.findByIdAndDelete(slotId);

    if (!deletedSlot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Slot deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete slot error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getSlot, ["admin", "doctor", "patient"]);
export const PUT = withAuth(updateSlot, ["admin"]);
export const DELETE = withAuth(deleteSlot, ["admin"]);
