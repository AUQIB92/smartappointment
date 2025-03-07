"use client";

import { useState } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaUserMd,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

export default function AppointmentCard({
  appointment,
  userRole,
  onStatusChange,
}) {
  const [isLoading, setIsLoading] = useState(false);

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            Pending
          </span>
        );
      case "confirmed":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Confirmed
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/appointments/${appointment._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Appointment ${newStatus} successfully`);
        if (onStatusChange) {
          onStatusChange(appointment._id, newStatus);
        }
      } else {
        toast.error(data.error || "Failed to update appointment");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {appointment.doctor_id?.name || "Doctor"}
          </h3>
          {appointment.doctor_id?.specialization && (
            <p className="text-gray-600">
              {appointment.doctor_id.specialization}
            </p>
          )}
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-700">
          <FaCalendarAlt className="mr-2 text-primary-500" />
          <span>{formatDate(appointment.date)}</span>
        </div>

        <div className="flex items-center text-gray-700">
          <FaClock className="mr-2 text-primary-500" />
          <span>{appointment.time}</span>
        </div>

        {userRole === "doctor" && (
          <div className="flex items-center text-gray-700">
            <FaUser className="mr-2 text-primary-500" />
            <span>Patient: {appointment.patient_id?.name || "Patient"}</span>
          </div>
        )}

        {userRole === "patient" && (
          <div className="flex items-center text-gray-700">
            <FaUserMd className="mr-2 text-primary-500" />
            <span>Doctor: {appointment.doctor_id?.name || "Doctor"}</span>
          </div>
        )}

        {appointment.notes && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700">
            <p className="text-sm font-medium">Notes:</p>
            <p className="text-sm">{appointment.notes}</p>
          </div>
        )}
      </div>

      {/* Action buttons based on role and status */}
      {userRole === "doctor" && appointment.status === "pending" && (
        <div className="flex space-x-2">
          <button
            onClick={() => handleStatusChange("confirmed")}
            disabled={isLoading}
            className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <FaCheckCircle className="mr-1" /> Confirm
          </button>
          <button
            onClick={() => handleStatusChange("cancelled")}
            disabled={isLoading}
            className="flex items-center px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <FaTimesCircle className="mr-1" /> Cancel
          </button>
        </div>
      )}

      {userRole === "doctor" && appointment.status === "confirmed" && (
        <button
          onClick={() => handleStatusChange("completed")}
          disabled={isLoading}
          className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <FaCheckCircle className="mr-1" /> Mark as Completed
        </button>
      )}

      {userRole === "patient" &&
        (appointment.status === "pending" ||
          appointment.status === "confirmed") && (
          <button
            onClick={() => handleStatusChange("cancelled")}
            disabled={isLoading}
            className="flex items-center px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <FaTimesCircle className="mr-1" /> Cancel Appointment
          </button>
        )}
    </div>
  );
}
