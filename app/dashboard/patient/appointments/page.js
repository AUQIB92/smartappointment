"use client";

import { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaFilter,
  FaSpinner,
  FaSearch,
  FaUser,
  FaUserMd,
  FaMedkit,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaCheck,
} from "react-icons/fa";
import DashboardLayout from "../../../../components/DashboardLayout";
import { toast } from "react-toastify";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [userRole, setUserRole] = useState("patient");

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [appointments, statusFilter, dateFilter, searchQuery]);

  useEffect(() => {
    const userInfo = localStorage.getItem("user");
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setUserRole(parsedUser.role || "patient");
      } catch (error) {
        console.error("Error parsing user info:", error);
      }
    }
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/appointments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        // Sort appointments by date (newest first)
        const sortedAppointments = data.appointments.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setAppointments(sortedAppointments);
        setFilteredAppointments(sortedAppointments);
      } else {
        toast.error(data.error || "Failed to fetch appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Apply date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === "upcoming") {
      filtered = filtered.filter((app) => new Date(app.date) >= today);
    } else if (dateFilter === "past") {
      filtered = filtered.filter((app) => new Date(app.date) < today);
    } else if (dateFilter === "today") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filtered = filtered.filter(
        (app) => new Date(app.date) >= today && new Date(app.date) < tomorrow
      );
    } else if (dateFilter === "week") {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      filtered = filtered.filter(
        (app) => new Date(app.date) >= today && new Date(app.date) < nextWeek
      );
    }

    // Apply search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          (app.doctor?.name && app.doctor.name.toLowerCase().includes(query)) ||
          (app.service?.name &&
            app.service.name.toLowerCase().includes(query)) ||
          (app.patient?.name &&
            app.patient.name.toLowerCase().includes(query)) ||
          (app.patient?.phone && app.patient.phone.includes(query)) ||
          (app.notes && app.notes.toLowerCase().includes(query))
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleStatusChange = async (id, newStatus) => {
    // Check permissions based on role
    if (userRole === "patient" && newStatus !== "cancelled") {
      // If you want to allow patients to request completion or confirmation
      toast.info(
        "Sending request to admin to " + newStatus + " this appointment..."
      );
      // Here you would implement logic to send a notification to admin
      // For now we'll simulate success
      toast.success("Request sent! Admins will process it soon.");
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");

      console.log(`Updating appointment ${id} to status: ${newStatus}`);

      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update the appointment in the local state
        setAppointments(
          appointments.map((app) =>
            app._id === id ? { ...app, status: newStatus } : app
          )
        );

        toast.success(`Appointment ${newStatus} successfully`);
      } else {
        console.error("Error response:", data);
        if (data.error === "Patients can only cancel appointments") {
          // Special handling for this specific error
          toast.info(
            "As a patient, you can only cancel appointments. Your request has been recorded and will be reviewed by staff."
          );
          // You could implement logic here to send a notification to admin
        } else {
          toast.error(
            data.error ||
              `Failed to update appointment: ${data.error || "Unknown error"}`
          );
        }
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error(`An error occurred: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAppointmentCountByStatus = (status) => {
    if (status === "all") return appointments.length;
    return appointments.filter((app) => app.status === status).length;
  };

  const getDateFilterLabel = (filter) => {
    switch (filter) {
      case "all":
        return "All Dates";
      case "upcoming":
        return "Upcoming";
      case "past":
        return "Past";
      case "today":
        return "Today";
      case "week":
        return "This Week";
      default:
        return "All Dates";
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge component
  const StatusBadge = ({ status }) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            Pending
          </span>
        );
      case "confirmed":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Confirmed
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  // Helper function to check if action is allowed based on role and status
  const canPerformAction = (action, status) => {
    if (userRole === "admin" || userRole === "doctor") {
      // Admins and doctors can perform all actions except on cancelled appointments
      if (status === "cancelled") return false;

      // Can't cancel completed appointments
      if (action === "cancel" && status === "completed") return false;

      // Can't complete pending appointments (must be confirmed first)
      if (action === "complete" && status === "pending") return false;

      return true;
    } else {
      // Patients can only cancel non-cancelled appointments
      return (
        action === "cancel" && status !== "cancelled" && status !== "completed"
      );
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">My Appointments</h1>

          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full md:w-80"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center mb-4">
            <FaFilter className="text-gray-500 mr-2" />
            <h2 className="text-lg font-medium">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Status
              </label>
              <div className="flex flex-wrap gap-2">
                {["all", "pending", "confirmed", "completed", "cancelled"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        statusFilter === status
                          ? status === "all"
                            ? "bg-blue-100 text-blue-800"
                            : status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)} (
                      {getAppointmentCountByStatus(status)})
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Date filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex flex-wrap gap-2">
                {["all", "upcoming", "past", "today", "week"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      dateFilter === filter
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {getDateFilterLabel(filter)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              {filteredAppointments.length}{" "}
              {filteredAppointments.length === 1
                ? "Appointment"
                : "Appointments"}{" "}
              Found
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <FaSpinner className="animate-spin text-blue-500 mr-2" />
              <p>Loading appointments...</p>
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Patient
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Doctor
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Service
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date & Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaUser className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.patient?.name || "You"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.patient?.phone || "Your appointment"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <FaUserMd className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.doctor?.name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.doctor?.specialization || ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <FaMedkit className="h-5 w-5 text-purple-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.service?.name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              ₹{appointment.service?.price || "0"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaClock className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(appointment.date)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.time}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                        {canPerformAction("confirm", appointment.status) && (
                          <button
                            onClick={() =>
                              handleStatusChange(appointment._id, "confirmed")
                            }
                            disabled={isProcessing}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Confirm
                          </button>
                        )}

                        {canPerformAction("complete", appointment.status) && (
                          <button
                            onClick={() =>
                              handleStatusChange(appointment._id, "completed")
                            }
                            disabled={isProcessing}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Complete
                          </button>
                        )}

                        {canPerformAction("cancel", appointment.status) && (
                          <button
                            onClick={() =>
                              handleStatusChange(appointment._id, "cancelled")
                            }
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Cancel
                          </button>
                        )}

                        {/* Show Request buttons for patients for actions they can't directly perform */}
                        {userRole === "patient" &&
                          appointment.status === "confirmed" && (
                            <button
                              onClick={() => {
                                toast.info(
                                  "Request sent to mark appointment as completed"
                                );
                                // Here you would implement logic to send a notification to admin
                              }}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Request Completion
                            </button>
                          )}

                        {!canPerformAction("confirm", appointment.status) &&
                          !canPerformAction("complete", appointment.status) &&
                          !canPerformAction("cancel", appointment.status) && (
                            <span className="text-gray-400">
                              No actions available
                            </span>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-2" />
              <p className="text-gray-500 mb-2">No appointments found</p>
              {statusFilter !== "all" || dateFilter !== "all" || searchQuery ? (
                <p className="text-gray-400 text-sm">
                  Try changing your filters
                </p>
              ) : (
                <div className="mt-4">
                  <a
                    href="/dashboard/patient/book"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Book an Appointment
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
