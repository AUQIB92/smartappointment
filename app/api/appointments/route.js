// app/api/appointments/route.js

import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/db";
import Appointment from "../../../models/Appointment";
import User from "../../../models/User";
import Service from "../../../models/Service";
import { withAuth } from "../../../middleware/auth";
import DoctorSlot from "../../../models/DoctorSlot";
import { sendBookingConfirmation } from "../../../lib/twilio";
import { sendBookingConfirmationEmail } from "../../../lib/emailService";

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
      patient_id, // Allow admin to book for a specific patient
    } = await req.json();

    // Determine the patient ID (either from request or from authenticated user)
    const actualPatientId = patient_id || user.id;

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

    // Check if patient exists
    const patient = await User.findOne({
      _id: actualPatientId,
      role: "patient",
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Parse the appointment date
    const appointmentDate = new Date(date);

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
    const dayOfWeek = days[appointmentDate.getDay()];

    // Parse the time to get hours and minutes
    const [hours, minutes] = time
      .match(/(\d+):(\d+)\s*([AP]M)/i)
      .slice(1, 3)
      .map(Number);
    const isPM = time.toUpperCase().includes("PM");

    // Convert to 24-hour format
    let hour24 = hours;
    if (isPM && hours < 12) hour24 += 12;
    if (!isPM && hours === 12) hour24 = 0;

    // Format as HH:MM for database comparison
    const timeFormat24 = `${hour24.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;

    // Check if this is a valid slot for this doctor
    const validSlot = await DoctorSlot.findOne({
      doctor_id,
      $or: [
        // Check specific date slots
        {
          date: {
            $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
            $lt: new Date(appointmentDate.setHours(23, 59, 59, 999)),
          },
          start_time: timeFormat24,
        },
        // Check weekly recurring slots
        {
          date: null,
          day: dayOfWeek,
          start_time: timeFormat24,
        },
      ],
      is_available: true,
    });

    if (!validSlot) {
      return NextResponse.json(
        { error: "This is not a valid appointment slot" },
        { status: 400 }
      );
    }

    // Check if the appointment slot is already booked
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

    // Check if patient already has an appointment at the same time
    const patientExistingAppointment = await Appointment.findOne({
      patient_id: actualPatientId,
      date: new Date(date),
      time,
      status: { $in: ["pending", "confirmed"] },
    });

    if (patientExistingAppointment) {
      return NextResponse.json(
        { error: "Patient already has an appointment at this time" },
        { status: 400 }
      );
    }

    // Create new appointment
    const appointment = new Appointment({
      patient_id: actualPatientId,
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

    // Mark the slot as booked
    if (validSlot) {
      // If this is a specific date slot (not a weekly recurring slot), mark it as booked
      if (validSlot.date) {
        console.log(`Marking specific date slot ${validSlot._id} as booked`);
        validSlot.booked_by = actualPatientId;
        validSlot.booking_time = new Date();
        await validSlot.save();
      } else {
        // For weekly recurring slots, create a new specific date slot that is marked as booked
        // This prevents the weekly slot from being permanently marked as booked
        console.log(`Creating booked specific date slot for weekly slot ${validSlot._id}`);
        
        // First, check if a specific date slot already exists for this doctor, date, and time
        const specificDateObj = new Date(date);
        const existingSpecificSlot = await DoctorSlot.findOne({
          doctor_id: validSlot.doctor_id,
          date: {
            $gte: new Date(specificDateObj.setHours(0, 0, 0, 0)),
            $lte: new Date(specificDateObj.setHours(23, 59, 59, 999)),
          },
          start_time: validSlot.start_time
        });
        
        if (existingSpecificSlot) {
          // If a specific date slot already exists, update it instead of creating a new one
          console.log(`Found existing specific date slot ${existingSpecificSlot._id}, updating it`);
          existingSpecificSlot.is_available = false;
          existingSpecificSlot.booked_by = actualPatientId;
          existingSpecificSlot.booking_time = new Date();
          await existingSpecificSlot.save();
          console.log(`Updated existing specific date slot: ${existingSpecificSlot._id}`);
        } else {
          // Create a new specific date slot
          const bookedSlot = new DoctorSlot({
            doctor_id: validSlot.doctor_id,
            day: validSlot.day,
            date: new Date(date), // Use the specific date
            start_time: validSlot.start_time,
            end_time: validSlot.end_time,
            duration: validSlot.duration,
            is_available: false, // Mark as unavailable
            is_admin_only: validSlot.is_admin_only,
            booked_by: actualPatientId,
            booking_time: new Date(),
          });
          
          try {
            await bookedSlot.save();
            console.log(`Created booked specific date slot: ${bookedSlot._id}`);
          } catch (slotError) {
            // If there's an error saving the slot (e.g., duplicate key), log it but don't fail the booking
            console.error("Error creating specific date slot:", slotError);
            // The appointment is still created, we just couldn't mark the slot as booked
            console.log("Appointment created but couldn't mark slot as booked");
          }
        }
      }
    }

    // Send booking confirmation SMS
    try {
      // Prepare data for the SMS
      const smsData = {
        patientName: patient.name,
        doctorName: doctor.name,
        date: appointment.date,
        time: appointment.time,
        serviceName: service.name,
        amount: appointment.payment_amount,
        status: appointment.status,
      };

      // Send SMS to patient's mobile number
      await sendBookingConfirmation(patient.mobile, smsData);
    } catch (smsError) {
      // Just log the error but don't fail the booking
      console.error("Error sending booking confirmation SMS:", smsError);
    }

    // Send booking confirmation email if patient has an email
    if (patient.email) {
      try {
        // Prepare data for the email
        const emailData = {
          appointmentId: appointment._id,
          doctorName: doctor.name,
          serviceName: service.name,
          date: appointment.date,
          time: appointment.time,
          amount: appointment.payment_amount,
          paymentMethod: appointment.payment_method,
          notes: appointment.notes || 'None'
        };

        // Send email to patient
        await sendBookingConfirmationEmail(patient.email, patient.name, emailData);
        console.log(`Booking confirmation email sent to ${patient.email}`);
      } catch (emailError) {
        // Just log the error but don't fail the booking
        console.error("Error sending booking confirmation email:", emailError);
      }
    }

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
