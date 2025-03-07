"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../../../components/DashboardLayout";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSpinner,
  FaClock,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_OPTIONS = [
  "08:00 AM",
  "08:30 AM",
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
];

export default function DoctorAvailabilityPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [availabilityData, setAvailabilityData] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [slots, setSlots] = useState([{ start_time: "", end_time: "" }]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchAvailability(selectedDoctor);
    } else {
      setAvailabilityData([]);
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.error || "Failed to fetch doctors");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = async (doctorId) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/doctors/availability?doctor_id=${doctorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setAvailabilityData(data.availability);
      } else {
        toast.error(data.error || "Failed to fetch availability");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSlot = () => {
    setSlots([...slots, { start_time: "", end_time: "" }]);
  };

  const handleRemoveSlot = (index) => {
    const newSlots = [...slots];
    newSlots.splice(index, 1);
    setSlots(newSlots);
  };

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  };

  const resetForm = () => {
    setSelectedDay("");
    setIsAvailable(true);
    setSlots([{ start_time: "", end_time: "" }]);
    setEditMode(false);
    setEditId(null);
  };

  const handleEdit = (availability) => {
    setEditMode(true);
    setEditId(availability._id);
    setSelectedDay(availability.day);
    setIsAvailable(availability.is_available);
    setSlots(
      availability.slots.length > 0
        ? [...availability.slots]
        : [{ start_time: "", end_time: "" }]
    );
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this availability?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/doctors/availability?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Availability deleted successfully");
        fetchAvailability(selectedDoctor);
      } else {
        toast.error(data.error || "Failed to delete availability");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!selectedDoctor || !selectedDay) {
      toast.error("Please select a doctor and day");
      return;
    }

    // Validate slots
    if (slots.length === 0) {
      toast.error("Please add at least one time slot");
      return;
    }

    for (const slot of slots) {
      if (!slot.start_time || !slot.end_time) {
        toast.error("Please fill in all time slots");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/doctors/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor,
          day: selectedDay,
          slots,
          is_available: isAvailable,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          editMode
            ? "Availability updated successfully"
            : "Availability added successfully"
        );
        resetForm();
        fetchAvailability(selectedDoctor);
      } else {
        toast.error(data.error || "Failed to save availability");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Manage Doctor Availability</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor Selection */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Select Doctor
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={selectedDoctor}
                onChange={(e) => {
                  setSelectedDoctor(e.target.value);
                  resetForm();
                }}
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editMode ? "Edit Availability" : "Add Availability"}
              </h2>

              {selectedDoctor ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      Day of Week
                    </label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      required
                    >
                      <option value="">Select a day</option>
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      Availability Status
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio text-primary-500"
                          name="availability"
                          checked={isAvailable}
                          onChange={() => setIsAvailable(true)}
                        />
                        <span className="ml-2">Available</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio text-primary-500"
                          name="availability"
                          checked={!isAvailable}
                          onChange={() => setIsAvailable(false)}
                        />
                        <span className="ml-2">Not Available</span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      Time Slots
                    </label>
                    {slots.map((slot, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <div className="flex-1 mr-2">
                          <select
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={slot.start_time}
                            onChange={(e) =>
                              handleSlotChange(
                                index,
                                "start_time",
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">Start Time</option>
                            {TIME_OPTIONS.map((time) => (
                              <option key={`start-${time}`} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1 ml-2">
                          <select
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={slot.end_time}
                            onChange={(e) =>
                              handleSlotChange(
                                index,
                                "end_time",
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">End Time</option>
                            {TIME_OPTIONS.map((time) => (
                              <option key={`end-${time}`} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                        {slots.length > 1 && (
                          <button
                            type="button"
                            className="ml-2 text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveSlot(index)}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="mt-2 flex items-center text-primary-500 hover:text-primary-700"
                      onClick={handleAddSlot}
                    >
                      <FaPlus className="mr-1" /> Add Time Slot
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="btn-secondary mr-2"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="animate-spin inline-block mr-2" />
                          Saving...
                        </>
                      ) : (
                        "Save Availability"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  Please select a doctor first
                </p>
              )}
            </div>
          </div>

          {/* Availability List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">
                Current Availability
              </h2>

              {selectedDoctor ? (
                isLoading ? (
                  <div className="text-center py-10">
                    <FaSpinner className="animate-spin text-3xl text-primary-500 mx-auto mb-2" />
                    <p>Loading availability...</p>
                  </div>
                ) : availabilityData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Day
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time Slots
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {availabilityData.map((availability) => (
                          <tr key={availability._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {availability.day}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {availability.is_available ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  <FaCheck className="mr-1" /> Available
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  <FaTimes className="mr-1" /> Not Available
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {availability.slots.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {availability.slots.map((slot, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 text-xs bg-gray-100 rounded"
                                    >
                                      {slot.start_time} - {slot.end_time}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-500">No slots</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                onClick={() => handleEdit(availability)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDelete(availability._id)}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No availability settings found for this doctor
                  </p>
                )
              ) : (
                <p className="text-center py-4 text-gray-500">
                  Please select a doctor to view availability
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
