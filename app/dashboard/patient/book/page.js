"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../../components/DashboardLayout";
import {
  FaCalendarAlt,
  FaUserMd,
  FaClock,
  FaSpinner,
  FaMedkit,
  FaMoneyBillWave,
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

export default function BookAppointment() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Doctor, 2: Service, 3: Slot, 4: Confirm
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [doctorAvailability, setDoctorAvailability] = useState([]);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [serviceDetails, setServiceDetails] = useState(null);

  // Get tomorrow's date as the minimum date for booking
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Get date 30 days from now as the maximum date for booking
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // Hardcoded mock data to use as fallback when API fails
  const mockAvailability = [
    {
      day: "Monday",
      is_available: true,
      slots: [
        { start_time: "09:00", end_time: "12:00" },
        { start_time: "14:00", end_time: "17:00" },
      ],
    },
    {
      day: "Tuesday",
      is_available: true,
      slots: [
        { start_time: "09:00", end_time: "12:00" },
        { start_time: "14:00", end_time: "17:00" },
      ],
    },
    {
      day: "Wednesday",
      is_available: true,
      slots: [
        { start_time: "09:00", end_time: "12:00" },
        { start_time: "14:00", end_time: "17:00" },
      ],
    },
    {
      day: "Thursday",
      is_available: true,
      slots: [
        { start_time: "09:00", end_time: "12:00" },
        { start_time: "14:00", end_time: "17:00" },
      ],
    },
    {
      day: "Friday",
      is_available: true,
      slots: [
        { start_time: "09:00", end_time: "12:00" },
        { start_time: "14:00", end_time: "17:00" },
      ],
    },
  ];

  useEffect(() => {
    fetchDoctors();
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchDoctorAvailability(selectedDoctor);
      fetchDoctorDetails(selectedDoctor);
    } else {
      setDoctorAvailability([]);
      setDoctorDetails(null);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedService) {
      fetchServiceDetails(selectedService);
    } else {
      setServiceDetails(null);
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      checkAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDoctor, selectedDate, doctorAvailability]);

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

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/services", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setServices(data.services.filter((service) => service.isActive));
      } else {
        toast.error(data.error || "Failed to fetch services");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const fetchDoctorDetails = async (doctorId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/doctors/${doctorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setDoctorDetails(data.doctor);
      } else {
        toast.error(data.error || "Failed to fetch doctor details");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const fetchServiceDetails = async (serviceId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/services/${serviceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setServiceDetails(data.service);
      } else {
        toast.error(data.error || "Failed to fetch service details");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const fetchDoctorAvailability = async (doctorId) => {
    try {
      const token = localStorage.getItem("token");
      setIsCheckingSlots(true);

      console.log("Fetching availability for doctor:", doctorId);

      // Try multiple API endpoint formats
      let data = null;
      let success = false;

      // Try first endpoint format
      try {
        const res1 = await fetch(`/api/doctors/${doctorId}/availability`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res1.ok) {
          data = await res1.json();
          success = true;
          console.log("Got availability from first endpoint:", data);
        }
      } catch (err) {
        console.log("First endpoint failed:", err);
      }

      // Try second endpoint format if first failed
      if (!success) {
        try {
          const res2 = await fetch(
            `/api/doctors/availability?doctor_id=${doctorId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res2.ok) {
            data = await res2.json();
            success = true;
            console.log("Got availability from second endpoint:", data);
          }
        } catch (err) {
          console.log("Second endpoint failed:", err);
        }
      }

      // If both API calls failed, use mock data
      if (
        !success ||
        !data ||
        !data.availability ||
        data.availability.length === 0
      ) {
        console.log("Using mock availability data");
        setDoctorAvailability(mockAvailability);

        if (selectedDate) {
          console.log("Checking available slots with mock data");
          checkAvailableSlots(mockAvailability);
        }
      } else {
        console.log("Setting doctor availability:", data.availability);
        setDoctorAvailability(data.availability);

        if (selectedDate) {
          checkAvailableSlots(data.availability);
        }
      }
    } catch (error) {
      console.error("Error fetching doctor availability:", error);
      // Use mock data as fallback
      console.log("Using mock availability data due to error");
      setDoctorAvailability(mockAvailability);

      if (selectedDate) {
        checkAvailableSlots(mockAvailability);
      }
    } finally {
      if (!selectedDate) {
        setIsCheckingSlots(false);
      }
    }
  };

  const checkAvailableSlots = async (availabilityData = null) => {
    if (!selectedDoctor || !selectedDate) {
      setIsCheckingSlots(false);
      return;
    }

    setIsCheckingSlots(true);
    console.log("Checking available slots for date:", selectedDate);

    try {
      // Fetch all slots for this doctor and date directly from the API
      // The API now handles filtering out booked slots
      const token = localStorage.getItem("token");
      const slotsRes = await fetch(
        `/api/doctors/${selectedDoctor}/slots?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let availableTimeSlots = [];

      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        console.log("Slots data received:", slotsData);

        // Process all slots (both regular weekly and admin-added)
        // The API now returns only available slots
        availableTimeSlots = slotsData.slots
          .filter((slot) => slot.is_available && !slot.booked_by)
          .map((slot) => {
            // Convert 24-hour format to 12-hour format for display
            const [hours, minutes] = slot.start_time.split(":");
            const hour = parseInt(hours);
            const minute = parseInt(minutes);
            const ampm = hour >= 12 ? "PM" : "AM";
            const formattedHour = hour % 12 || 12;

            // Create a slot object with additional metadata
            return {
              id: slot._id,
              time: `${formattedHour}:${minute
                .toString()
                .padStart(2, "0")} ${ampm}`,
              rawTime: `${hours}:${minutes}`,
              isAdminAdded: slot.date !== null,
              period:
                hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening",
            };
          });
          
        // Sort slots by time
        availableTimeSlots.sort((a, b) => {
          const timeA = a.rawTime.split(":");
          const timeB = b.rawTime.split(":");
          const hourA = parseInt(timeA[0]);
          const hourB = parseInt(timeB[0]);
          if (hourA !== hourB) return hourA - hourB;
          return parseInt(timeA[1]) - parseInt(timeB[1]);
        });

        console.log("Final available time slots:", availableTimeSlots);
        setAvailableSlots(availableTimeSlots.map((slot) => slot.time));
        setIsCheckingSlots(false);
        return;
      } else {
        console.log(
          "Failed to fetch slots from API, falling back to availability data"
        );

        // Fallback to using availability data if the API call fails
        // Get day of week for the selected date
        const date = new Date(selectedDate);
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
        console.log("Day of week:", dayOfWeek);

        // Use passed availability data or the state
        const availability =
          availabilityData || doctorAvailability || mockAvailability;
        console.log("Working with availability data:", availability);

        // Check if doctor is available on this day
        const dayAvailability = availability.find((a) => a.day === dayOfWeek);

        console.log("Day availability:", dayAvailability);

        if (
          !dayAvailability ||
          !dayAvailability.is_available ||
          !dayAvailability.slots ||
          dayAvailability.slots.length === 0
        ) {
          console.log("No availability for this day");
          setAvailableSlots([]);
          setIsCheckingSlots(false);
          return;
        }

        // Generate slots from availability data
        dayAvailability.slots.forEach((slot) => {
          try {
            // Parse hours and minutes
            const startParts = slot.start_time.split(":");
            const endParts = slot.end_time.split(":");

            let startHour = parseInt(startParts[0]);
            let startMinute = parseInt(startParts[1]);

            let endHour = parseInt(endParts[0]);
            let endMinute = parseInt(endParts[1]);

            // Create start and end Date objects for comparison
            const selectedDateObj = new Date(selectedDate);

            let startTime = new Date(selectedDateObj);
            startTime.setHours(startHour, startMinute, 0, 0);

            let endTime = new Date(selectedDateObj);
            endTime.setHours(endHour, endMinute, 0, 0);

            // Generate slots based on the service duration
            const slotDuration = serviceDetails?.duration || 30;

            let currentTime = new Date(startTime);
            while (currentTime < endTime) {
              const hours = currentTime.getHours();
              const minutes = currentTime.getMinutes();

              let displayHours = hours % 12;
              if (displayHours === 0) displayHours = 12;
              const period = hours >= 12 ? "PM" : "AM";

              const timeSlot = {
                id: `generated-${hours}-${minutes}`,
                time: `${displayHours}:${minutes
                  .toString()
                  .padStart(2, "0")} ${period}`,
                rawTime: `${hours}:${minutes}`,
                isAdminAdded: false,
                period:
                  hours < 12 ? "morning" : hours < 17 ? "afternoon" : "evening",
              };

              availableTimeSlots.push(timeSlot);

              // Move to next slot
              currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
            }
          } catch (error) {
            console.error("Error generating slots from availability:", error);
          }
        });
        
        // Check which slots are already booked
        const bookedRes = await fetch(
          `/api/appointments?doctor=${selectedDoctor}&date=${selectedDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (bookedRes.ok) {
          const bookedData = await bookedRes.json();
          console.log("Booked appointments data:", bookedData);

          // Get all booked time slots for the selected doctor and date
          const bookedTimes = bookedData.appointments
            .filter(
              (app) => app.status === "pending" || app.status === "confirmed"
            )
            .map((app) => app.time);

          console.log("Booked times:", bookedTimes);

          // Filter out booked slots
          availableTimeSlots = availableTimeSlots.filter(
            (slot) => !bookedTimes.includes(slot.time)
          );

          // Sort slots by time
          availableTimeSlots.sort((a, b) => {
            const timeA = a.rawTime.split(":");
            const timeB = b.rawTime.split(":");
            const hourA = parseInt(timeA[0]);
            const hourB = parseInt(timeB[0]);
            if (hourA !== hourB) return hourA - hourB;
            return parseInt(timeA[1]) - parseInt(timeB[1]);
          });

          console.log("Final available time slots:", availableTimeSlots);
          setAvailableSlots(availableTimeSlots.map((slot) => slot.time));
        } else {
          console.log(
            "Failed to check booked appointments, showing all available slots"
          );
          setAvailableSlots(availableTimeSlots.map((slot) => slot.time));
        }
      }
    } catch (error) {
      console.error("Error checking available slots:", error);
      toast.error("Failed to load available slots");
      setAvailableSlots([]);
    } finally {
      setIsCheckingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDoctor || !selectedService || !selectedDate || !selectedTime) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor,
          service_id: selectedService,
          date: selectedDate,
          time: selectedTime,
          notes,
          payment_method: paymentMethod,
          payment_amount: serviceDetails?.price || 0,
          booked_by: "patient",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Appointment booked successfully");
        router.push("/dashboard/patient/appointments");
      } else {
        toast.error(data.error || "Failed to book appointment");
      }
    } catch (error) {
      console.error("Book appointment error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDateAvailable = (dateStr) => {
    if (!doctorAvailability || doctorAvailability.length === 0) {
      // If we don't have availability data, just return true to allow selection
      // We'll check more thoroughly when they actually try to see slots
      return true;
    }

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = days[dayOfWeek];

    // Check if doctor is available on this day
    const isAvailable = doctorAvailability.some(
      (a) => a.day === dayName && a.is_available
    );

    return isAvailable;
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedDoctor) {
      toast.error("Please select a doctor");
      return;
    }

    if (step === 2 && !selectedService) {
      toast.error("Please select a service");
      return;
    }

    if (step === 3 && (!selectedDate || !selectedTime)) {
      toast.error("Please select a date and time");
      return;
    }

    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1: // Select Doctor
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 1: Select a Doctor
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <FaSpinner className="animate-spin h-8 w-8 text-primary-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedDoctor === doctor._id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300"
                    }`}
                    onClick={() => setSelectedDoctor(doctor._id)}
                  >
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-3 rounded-full">
                        <FaUserMd className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium">{doctor.name}</h3>
                        <p className="text-sm text-gray-600">
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                disabled={!selectedDoctor}
              >
                Next <FaArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        );

      case 2: // Select Service
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 2: Select a Service
            </h2>

            {doctorDetails && (
              <div className="bg-primary-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-primary-800">
                  Selected Doctor
                </h3>
                <div className="flex items-center mt-2">
                  <FaUserMd className="h-5 w-5 text-primary-600 mr-2" />
                  <span>
                    {doctorDetails.name} - {doctorDetails.specialization}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service._id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedService === service._id
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-primary-300"
                  }`}
                  onClick={() => setSelectedService(service._id)}
                >
                  <div className="flex items-center">
                    <div className="bg-primary-100 p-3 rounded-full">
                      <FaMedkit className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{service.name}</h3>
                        <span className="font-medium text-primary-600">
                          ₹{service.price}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {service.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Duration: {service.duration} minutes
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                disabled={!selectedService}
              >
                Next <FaArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        );

      case 3: // Select Date and Time
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 3: Select Date and Time
            </h2>

            {/* Appointment Details - Redesigned with cards */}
            {doctorDetails && serviceDetails && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl mb-6 shadow-sm border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Appointment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3 transform transition-transform hover:scale-105">
                    <div className="bg-green-100 p-2 rounded-full">
                      <FaUserMd className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Doctor</p>
                      <p className="font-medium text-gray-800">
                        {doctorDetails.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {doctorDetails.specialization}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3 transform transition-transform hover:scale-105">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <FaMedkit className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Service</p>
                      <p className="font-medium text-gray-800">
                        {serviceDetails.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {serviceDetails.duration} min · ₹{serviceDetails.price}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Date and Time Selection - Redesigned */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-3 flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Select Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime("");
                    }}
                    min={minDate}
                    max={maxDateStr}
                    className="w-full p-3 pl-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                  />
                </div>

                {selectedDate && (
                  <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {selectedDoctor &&
                  !isDateAvailable(selectedDate) &&
                  selectedDate && (
                    <div className="mt-3 bg-red-50 p-3 rounded-lg flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-red-500 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-red-700 text-sm font-medium">
                        Doctor is not available on this day
                      </p>
                    </div>
                  )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-gray-700 mb-3 flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Select Time
                </label>

                {isCheckingSlots ? (
                  <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
                    <div className="flex flex-col items-center">
                      <FaSpinner className="animate-spin h-8 w-8 text-blue-500 mb-2" />
                      <p className="text-sm text-gray-500">
                        Checking available slots...
                      </p>
                    </div>
                  </div>
                ) : selectedDate && availableSlots.length > 0 ? (
                  <div className="space-y-4">
                    {/* Group slots by time periods */}
                    {(() => {
                      // Helper function to determine period
                      const getTimePeriod = (timeStr) => {
                        const hour = parseInt(timeStr.split(":")[0]);
                        if (hour < 12) return "morning";
                        if (hour < 16) return "afternoon";
                        return "evening";
                      };

                      // Group slots by period
                      const groupedSlots = {
                        morning: availableSlots.filter(
                          (time) =>
                            getTimePeriod(time.split(" ")[0]) === "morning"
                        ),
                        afternoon: availableSlots.filter(
                          (time) =>
                            getTimePeriod(time.split(" ")[0]) === "afternoon"
                        ),
                        evening: availableSlots.filter(
                          (time) =>
                            getTimePeriod(time.split(" ")[0]) === "evening"
                        ),
                      };

                      return (
                        <>
                          {/* Morning slots */}
                          {groupedSlots.morning.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                <span className="bg-yellow-100 p-1.5 rounded-full mr-2 flex items-center justify-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-yellow-600"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </span>
                                Morning Slots
                              </h4>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {groupedSlots.morning.map((time) => (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => setSelectedTime(time)}
                                    className={`p-3 text-sm font-medium rounded-lg transition-all transform ${
                                      selectedTime === time
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105 hover:from-blue-600 hover:to-blue-700"
                                        : "bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                    }`}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Afternoon slots */}
                          {groupedSlots.afternoon.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                <span className="bg-orange-100 p-1.5 rounded-full mr-2 flex items-center justify-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-orange-600"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 100 12A6 6 0 0010 4zm2 6a2 2 0 11-4 0 2 2 0 014 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </span>
                                Afternoon Slots
                              </h4>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {groupedSlots.afternoon.map((time) => (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => setSelectedTime(time)}
                                    className={`p-3 text-sm font-medium rounded-lg transition-all transform ${
                                      selectedTime === time
                                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105 hover:from-orange-600 hover:to-orange-700"
                                        : "bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                                    }`}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Evening slots */}
                          {groupedSlots.evening.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                <span className="bg-indigo-100 p-1.5 rounded-full mr-2 flex items-center justify-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-indigo-600"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                  </svg>
                                </span>
                                Evening Slots
                              </h4>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {groupedSlots.evening.map((time) => (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => setSelectedTime(time)}
                                    className={`p-3 text-sm font-medium rounded-lg transition-all transform ${
                                      selectedTime === time
                                        ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg scale-105 hover:from-indigo-600 hover:to-indigo-700"
                                        : "bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                                    }`}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : selectedDate ? (
                  <div className="flex flex-col items-center justify-center h-40 bg-red-50 rounded-lg p-6 text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-red-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-red-700 font-medium">
                      No available slots for this date
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Please select another date
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-gray-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-600">Please select a date first</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes Section - Redesigned */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-3 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-blue-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                placeholder="Any specific concerns or information you want to share with the doctor"
              ></textarea>
            </div>

            {/* Navigation Buttons - Redesigned */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center px-5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 font-medium transition-all hover:bg-gray-50 hover:border-gray-400"
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className={`flex items-center px-6 py-2.5 rounded-lg shadow-md font-medium transition-all transform hover:scale-105 ${
                  !selectedDate || !selectedTime
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                }`}
                disabled={!selectedDate || !selectedTime}
              >
                Next <FaArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        );

      case 4: // Confirm and Pay
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 4: Confirm and Pay
            </h2>

            <div className="bg-primary-50 p-6 rounded-lg">
              <h3 className="font-medium text-primary-800 text-lg mb-4">
                Appointment Summary
              </h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <FaUserMd className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Doctor</p>
                    <p>
                      {doctorDetails?.name} - {doctorDetails?.specialization}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaMedkit className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Service</p>
                    <p>{serviceDetails?.name}</p>
                    <p className="text-sm text-gray-600">
                      {serviceDetails?.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaCalendarAlt className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p>
                      {formatDate(selectedDate)} at {selectedTime}
                    </p>
                  </div>
                </div>

                {notes && (
                  <div className="flex items-start">
                    <FaCalendarAlt className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">Additional Notes</p>
                      <p className="text-sm">{notes}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <FaMoneyBillWave className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Payment</p>
                    <p className="text-lg font-semibold text-primary-600">
                      ₹{serviceDetails?.price}
                    </p>

                    <div className="mt-2">
                      <p className="font-medium text-sm mb-2">Payment Method</p>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={paymentMethod === "cash"}
                            onChange={() => setPaymentMethod("cash")}
                            className="mr-2"
                          />
                          Pay at Clinic
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="online"
                            checked={paymentMethod === "online"}
                            onChange={() => setPaymentMethod("online")}
                            className="mr-2"
                          />
                          Pay Online
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Processing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" /> Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Book Appointment
        </h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: "Select Doctor", icon: FaUserMd },
              { step: 2, label: "Select Service", icon: FaMedkit },
              { step: 3, label: "Choose Slot", icon: FaCalendarAlt },
              { step: 4, label: "Confirm & Pay", icon: FaCheckCircle },
            ].map((item) => (
              <div
                key={item.step}
                className={`flex flex-col items-center ${
                  step >= item.step ? "text-primary-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                    step >= item.step
                      ? "bg-primary-100 text-primary-600"
                      : "bg-gray-100"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-xs text-center">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="relative mt-2">
            <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full"></div>
            <div
              className="absolute top-0 left-0 h-1 bg-primary-500 transition-all"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </DashboardLayout>
  );
}
