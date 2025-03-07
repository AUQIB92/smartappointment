// app/api/appointments/route.js

import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/db";
import Appointment from "../../../models/Appointment";
import User from "../../../models/User";
import Service from "../../../models/Service";
import { withAuth } from "../../../middleware/auth";

// Get appointments based on user role
async function getAppointments(req) {
  try {
    await connectToDatabase();

    const { user } = req;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const doctorId = searchParams.get("doctor");
    const date = searchParams.get("date");

    let query = {};

    // Filter appointments based on user role (unless specific filters are provided)
    if (!doctorId && user.role === "patient") {
      query.patient_id = user.id;
    } else if (!doctorId && user.role === "doctor") {
      query.doctor_id = user.id;
    }

    // Filter by doctor if provided
    if (doctorId) {
      query.doctor_id = doctorId;
    }

    // Filter by date if provided
    if (date) {
      // Create date range for the entire day
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Get appointments with populated user details
    const appointments = await Appointment.find(query)
      .populate("patient_id", "name mobile")
      .populate("doctor_id", "name specialization")
      .populate("service_id", "name price duration")
      .sort({ date: 1, time: 1 });

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Book a new appointment
async function createAppointment(req) {
  try {
    await connectToDatabase();

    const { user } = req;
    const {
      doctor_id,
      service_id,
      date,
      time,
      notes,
      payment_method = "cash",
      payment_amount = 0,
      booked_by = "patient",
    } = await req.json();

    // Validate required fields
    if (!doctor_id || !service_id || !date || !time) {
      return NextResponse.json(
        { error: "Doctor, service, date and time are required" },
        { status: 400 }
      );
    }

    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctor_id, role: "doctor" });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Check if service exists
    const service = await Service.findById(service_id);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check if the appointment slot is available
    const existingAppointment = await Appointment.findOne({
      doctor_id,
      date: new Date(date),
      time,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 400 }
      );
    }

    // Create new appointment
    const appointment = new Appointment({
      patient_id: user.id,
      doctor_id,
      service_id,
      date: new Date(date),
      time,
      notes,
      payment_method,
      payment_amount,
      booked_by,
      // If booked by admin, mark as confirmed
      status: booked_by === "admin" ? "confirmed" : "pending",
      // If payment method is cash, mark payment as pending
      payment_status: payment_method === "cash" ? "pending" : "completed",
      payment_date: payment_method === "cash" ? null : new Date(),
    });

    await appointment.save();

    return NextResponse.json(
      { message: "Appointment booked successfully", appointment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Book appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export the handler functions with authentication middleware
export const GET = withAuth(getAppointments);
export const POST = withAuth(createAppointment);
