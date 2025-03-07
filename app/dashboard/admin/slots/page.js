"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../../../components/layouts/AdminLayout";
import { toast } from "react-toastify";
import { formatTime } from "../../../../utils/slotGenerator";
import {
  FaCalendarAlt,
  FaUserMd,
  FaLock,
  FaLockOpen,
  FaCheck,
  FaTimes,
  FaSync,
  FaPlus,
} from "react-icons/fa";

export default function SlotManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day: "Monday",
    start_time: "06:30",
    end_time: "06:45",
    duration: 15,
    is_admin_only: false,
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchSlots(selectedDoctor);
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setDoctors(data.doctors || []);
        if (data.doctors && data.doctors.length > 0) {
          setSelectedDoctor(data.doctors[0]._id);
        }
      } else {
        toast.error(data.error || "Failed to fetch doctors");
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("An error occurred while fetching doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (doctorId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/slots?doctor_id=${doctorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.slots && data.slots.length > 0) {
          setSlots(data.slots);
        } else {
          setSlots([]);
          toast.info("No slots found for this doctor");
        }
      } else {
        toast.error(data.error || "Failed to fetch slots");
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("An error occurred while fetching slots");
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultSlots = async () => {
    if (!selectedDoctor) {
      toast.error("Please select a doctor first");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doctor_id: selectedDoctor }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Default slots generated successfully");
        fetchSlots(selectedDoctor);
      } else {
        toast.error(data.error || "Failed to generate slots");
      }
    } catch (error) {
      console.error("Error generating slots:", error);
      toast.error("An error occurred while generating slots");
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminOnly = async (slot) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/slots/${slot._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_admin_only: !slot.is_admin_only,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the slot in the local state
        setSlots((prevSlots) =>
          prevSlots.map((s) =>
            s._id === slot._id
              ? { ...s, is_admin_only: !slot.is_admin_only }
              : s
          )
        );
        toast.success(
          `Slot ${
            slot.is_admin_only ? "opened to all" : "restricted to admin only"
          }`
        );
      } else {
        toast.error(data.error || "Failed to update slot");
      }
    } catch (error) {
      console.error("Error updating slot:", error);
      toast.error("An error occurred while updating the slot");
    }
  };

  const toggleAvailability = async (slot) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/slots/${slot._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_available: !slot.is_available,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the slot in the local state
        setSlots((prevSlots) =>
          prevSlots.map((s) =>
            s._id === slot._id ? { ...s, is_available: !slot.is_available } : s
          )
        );
        toast.success(
          `Slot ${
            slot.is_available ? "marked as unavailable" : "marked as available"
          }`
        );
      } else {
        toast.error(data.error || "Failed to update slot");
      }
    } catch (error) {
      console.error("Error updating slot:", error);
      toast.error("An error occurred while updating the slot");
    }
  };

  const handleNewSlotChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSlot({
      ...newSlot,
      [name]: type === "checkbox" ? checked : value,
    });

    // If changing start time or duration, update end time
    if (name === "start_time" || name === "duration") {
      try {
        // Get the current start time or the new one if that's what changed
        const startTimeValue =
          name === "start_time" ? value : newSlot.start_time;

        // Ensure we have a valid start time before continuing
        if (!startTimeValue || !startTimeValue.includes(":")) {
          console.warn("Invalid start time format for calculation");
          return;
        }

        // Parse start time components
        const [hours, minutes] = startTimeValue.split(":").map(Number);

        // Ensure we have valid numbers
        if (isNaN(hours) || isNaN(minutes)) {
          console.warn("Invalid time components for calculation");
          return;
        }

        // Calculate total minutes
        const startMinutes = hours * 60 + minutes;

        // Get duration (either the new value or existing)
        const duration =
          name === "duration" ? parseInt(value) : parseInt(newSlot.duration);

        if (isNaN(duration)) {
          console.warn("Invalid duration for calculation");
          return;
        }

        // Calculate end time in minutes
        const endMinutes = startMinutes + duration;

        // Convert back to hours and minutes
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;

        // Handle time wrapping past midnight
        const adjustedHours = endHours >= 24 ? endHours - 24 : endHours;

        // Format as HH:MM
        const endTime = `${adjustedHours.toString().padStart(2, "0")}:${endMins
          .toString()
          .padStart(2, "0")}`;

        setNewSlot((prev) => ({
          ...prev,
          end_time: endTime,
        }));
      } catch (error) {
        console.error("Error calculating end time:", error);
      }
    }
  };

  const addSlot = async () => {
    if (!selectedDoctor) {
      toast.error("Please select a doctor first");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const slotData = {
        doctor_id: selectedDoctor,
        day: newSlot.day,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        duration: parseInt(newSlot.duration),
        is_admin_only: newSlot.is_admin_only,
        is_available: true,
        date: null, // Explicitly set date to null
      };

      const response = await fetch("/api/slots/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(slotData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Slot added successfully");
        fetchSlots(selectedDoctor);
        setShowAddForm(false);
      } else {
        toast.error(data.error || "Failed to add slot");
      }
    } catch (error) {
      console.error("Error adding slot:", error);
      toast.error("An error occurred while adding the slot");
    } finally {
      setLoading(false);
    }
  };

  // Filter slots by day
  const filteredSlots =
    selectedDay === "All"
      ? slots
      : slots.filter((slot) => slot.day === selectedDay);

  // Group slots by day
  const slotsByDay = days.reduce((acc, day) => {
    acc[day] = filteredSlots.filter((slot) => slot.day === day);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Slot Management</h1>
          <div className="flex space-x-2">
            <button
              onClick={generateDefaultSlots}
              className="btn-primary flex items-center"
              disabled={loading || !selectedDoctor}
            >
              <FaSync className="mr-2" /> Generate Default Slots
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-secondary flex items-center"
            >
              <FaPlus className="mr-2" /> Add Slot
            </button>
          </div>
        </div>

        {/* Doctor Selection */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
            <div className="mb-4 md:mb-0 flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Doctor
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                disabled={loading}
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Day
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                <option value="All">All Days</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Time Range Info */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Working Hours: 6:30 AM - 7:00 PM (15-minute intervals)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Early Morning:</span> 6:30 AM -
                9:00 AM
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Morning:</span> 9:00 AM - 1:00 PM
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Lunch Break:</span> 1:00 PM - 2:00
                PM
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Afternoon/Evening:</span> 2:00 PM
                - 7:00 PM
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Default slot duration:</span> 15
                minutes
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Admin-only slots:</span> Early
                morning slots (6:30 AM - 9:00 AM)
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Working days:</span> Monday,
                Tuesday, Wednesday, Friday, Saturday
              </p>
            </div>
          </div>
        </div>

        {/* Add Slot Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Slot</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day
                </label>
                <select
                  name="day"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newSlot.day}
                  onChange={handleNewSlotChange}
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="start_time"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newSlot.start_time}
                  onChange={handleNewSlotChange}
                  min="06:30"
                  max="19:00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  From 6:30 AM to 7:00 PM
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  name="duration"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newSlot.duration}
                  onChange={handleNewSlotChange}
                >
                  <option value="15">15 minutes (recommended)</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  15-minute slots provide more flexibility
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Only
                </label>
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    name="is_admin_only"
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                    checked={newSlot.is_admin_only}
                    onChange={handleNewSlotChange}
                  />
                  <span className="ml-2">Restrict to admin only</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-600">
                  Time: {formatTime(newSlot.start_time || "")} -{" "}
                  {formatTime(newSlot.end_time || "")}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={addSlot}
                  className="btn-primary"
                  disabled={loading}
                >
                  Add Slot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Slots Display */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-4" />
            <h2 className="text-xl text-gray-500 mb-4">No slots found</h2>
            <p className="text-gray-500 mb-4">
              {selectedDoctor
                ? "No slots found for this doctor on the selected day."
                : "Please select a doctor to view their slots."}
            </p>
            {selectedDoctor && (
              <button
                onClick={generateDefaultSlots}
                className="btn-primary inline-flex items-center"
              >
                <FaSync className="mr-2" /> Generate Default Slots
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(slotsByDay).map(([day, daySlots]) => {
              if (daySlots.length === 0) return null;

              return (
                <div
                  key={day}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="bg-gray-50 p-4 border-b">
                    <h2 className="text-lg font-semibold">{day}</h2>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {daySlots.map((slot) => (
                        <div
                          key={slot._id}
                          className={`border rounded-lg p-3 ${
                            slot.is_available
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-medium">
                              {formatTime(slot.start_time || "")} -{" "}
                              {formatTime(slot.end_time || "")}
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => toggleAdminOnly(slot)}
                                className="p-1 rounded-full hover:bg-gray-200"
                                title={
                                  slot.is_admin_only
                                    ? "Make available to all"
                                    : "Restrict to admin only"
                                }
                              >
                                {slot.is_admin_only ? (
                                  <FaLock className="text-purple-600" />
                                ) : (
                                  <FaLockOpen className="text-blue-600" />
                                )}
                              </button>
                              <button
                                onClick={() => toggleAvailability(slot)}
                                className="p-1 rounded-full hover:bg-gray-200"
                                title={
                                  slot.is_available
                                    ? "Mark as unavailable"
                                    : "Mark as available"
                                }
                              >
                                {slot.is_available ? (
                                  <FaCheck className="text-green-600" />
                                ) : (
                                  <FaTimes className="text-red-600" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                slot.is_admin_only
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {slot.is_admin_only
                                ? "Admin Only"
                                : "Open to All"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
