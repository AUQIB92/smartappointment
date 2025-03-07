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
        setDoctorAvailability(data.availability);
      } else {
        toast.error(data.error || "Failed to fetch doctor availability");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const checkAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    setIsCheckingSlots(true);
    try {
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

      // Check if doctor is available on this day
      const dayAvailability = doctorAvailability.find(
        (a) => a.day === dayOfWeek
      );

      if (
        !dayAvailability ||
        !dayAvailability.is_available ||
        dayAvailability.slots.length === 0
      ) {
        setAvailableSlots([]);
        setIsCheckingSlots(false);
        return;
      }

      // Get all available time slots from doctor's schedule
      const allAvailableSlots = dayAvailability.slots
        .map((slot) => {
          // Generate 30-minute slots between start and end time
          const slots = [];
          const startParts = slot.start_time.match(/(\d+):(\d+) ([AP]M)/);
          const endParts = slot.end_time.match(/(\d+):(\d+) ([AP]M)/);

          if (!startParts || !endParts) return slots;

          let startHour = parseInt(startParts[1]);
          if (startParts[3] === "PM" && startHour !== 12) startHour += 12;
          if (startParts[3] === "AM" && startHour === 12) startHour = 0;

          let endHour = parseInt(endParts[1]);
          if (endParts[3] === "PM" && endHour !== 12) endHour += 12;
          if (endParts[3] === "AM" && endHour === 12) endHour = 0;

          const startMinute = parseInt(startParts[2]);
          const endMinute = parseInt(endParts[2]);

          let currentTime = new Date();
          currentTime.setHours(startHour, startMinute, 0, 0);

          const endTime = new Date();
          endTime.setHours(endHour, endMinute, 0, 0);

          while (currentTime < endTime) {
            const hour = currentTime.getHours();
            const minute = currentTime.getMinutes();

            let formattedHour = hour % 12;
            if (formattedHour === 0) formattedHour = 12;

            const ampm = hour >= 12 ? "PM" : "AM";
            const timeSlot = `${formattedHour
              .toString()
              .padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${ampm}`;

            slots.push(timeSlot);

            // Add 30 minutes
            currentTime.setMinutes(currentTime.getMinutes() + 30);
          }

          return slots;
        })
        .flat();

      // Fetch admin-added slots for this doctor and date
      const token = localStorage.getItem("token");
      const adminSlotsRes = await fetch(
        `/api/doctors/${selectedDoctor}/slots?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let adminSlots = [];
      if (adminSlotsRes.ok) {
        const adminSlotsData = await adminSlotsRes.json();
        adminSlots = adminSlotsData.slots
          .filter((slot) => slot.is_available && !slot.booked_by)
          .map((slot) => {
            // Convert 24-hour format to 12-hour format
            const [hours, minutes] = slot.start_time.split(":");
            const hour = parseInt(hours);
            const minute = parseInt(minutes);
            const ampm = hour >= 12 ? "PM" : "AM";
            const formattedHour = hour % 12 || 12;
            return `${formattedHour.toString().padStart(2, "0")}:${minute
              .toString()
              .padStart(2, "0")} ${ampm}`;
          });
      }

      // Combine regular slots with admin-added slots
      const combinedSlots = [...new Set([...allAvailableSlots, ...adminSlots])];

      // Check which slots are already booked
      const res = await fetch(
        `/api/appointments?doctor=${selectedDoctor}&date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        // Get all booked time slots for the selected doctor and date
        const booked = data.appointments
          .filter(
            (app) => app.status === "pending" || app.status === "confirmed"
          )
          .map((app) => app.time);

        setBookedSlots(booked);

        // Filter available time slots
        const available = combinedSlots.filter(
          (time) => !booked.includes(time)
        );
        setAvailableSlots(available);
      } else {
        toast.error(data.error || "Failed to check available slots");
      }
    } catch (error) {
      console.error("Error checking slots:", error);
      toast.error("An error occurred. Please try again.");
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
    return doctorAvailability.some(
      (a) => a.day === dayName && a.is_available && a.slots.length > 0
    );
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

            {doctorDetails && serviceDetails && (
              <div className="bg-primary-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-primary-800">
                  Appointment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center">
                    <FaUserMd className="h-5 w-5 text-primary-600 mr-2" />
                    <span>{doctorDetails.name}</span>
                  </div>
                  <div className="flex items-center">
                    <FaMedkit className="h-5 w-5 text-primary-600 mr-2" />
                    <span>{serviceDetails.name}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Date
                </label>
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
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />

                {selectedDoctor &&
                  !isDateAvailable(selectedDate) &&
                  selectedDate && (
                    <p className="text-red-500 text-sm mt-1">
                      Doctor is not available on this day
                    </p>
                  )}
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Time
                </label>

                {isCheckingSlots ? (
                  <div className="flex items-center justify-center h-20">
                    <FaSpinner className="animate-spin h-6 w-6 text-primary-500" />
                  </div>
                ) : selectedDate && availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 text-sm border rounded-md ${
                          selectedTime === time
                            ? "bg-primary-500 text-white border-primary-500"
                            : "border-gray-300 hover:border-primary-500"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <p className="text-red-500">
                    No available slots for this date
                  </p>
                ) : (
                  <p className="text-gray-500">Please select a date first</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Any specific concerns or information you want to share with the doctor"
              ></textarea>
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
