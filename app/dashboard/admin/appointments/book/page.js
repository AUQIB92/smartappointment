"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../../../../components/layouts/AdminLayout";
import {
  FaCalendarAlt,
  FaUserMd,
  FaUser,
  FaClock,
  FaSpinner,
  FaMedkit,
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle,
  FaPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";

export default function AdminBookAppointment() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Select Patient, 2: Select Doctor, 3: Select Service, 4: Select Slot, 5: Confirm
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientMobile, setNewPatientMobile] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [doctorAvailability, setDoctorAvailability] = useState([]);
  const [patientDetails, setPatientDetails] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [serviceDetails, setServiceDetails] = useState(null);

  // Get tomorrow's date as the minimum date for booking
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()); // Admins can book for today
  const minDate = tomorrow.toISOString().split("T")[0];

  // Get date 90 days from now as the maximum date for booking (admins can book further)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientDetails(selectedPatient);
    } else {
      setPatientDetails(null);
    }
  }, [selectedPatient]);

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

  const fetchPatients = async () => {
    try {
      setIsLoadingPatients(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setPatients(data.patients);
      } else {
        toast.error(data.error || "Failed to fetch patients");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/patients/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setPatientDetails(data.patient);
      } else {
        toast.error(data.error || "Failed to fetch patient details");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

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

    if (
      !selectedPatient ||
      !selectedDoctor ||
      !selectedService ||
      !selectedDate ||
      !selectedTime
    ) {
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
          patient_id: selectedPatient, // Admin books for a patient
          doctor_id: selectedDoctor,
          service_id: selectedService,
          date: selectedDate,
          time: selectedTime,
          notes,
          payment_method: "cash", // Default to cash for admin bookings
          payment_amount: serviceDetails?.price || 0,
          booked_by: "admin", // Indicate this was booked by admin
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Appointment booked successfully");
        router.push("/dashboard/admin/appointments");
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
    if (step === 1 && !selectedPatient) {
      toast.error("Please select a patient");
      return;
    }

    if (step === 2 && !selectedDoctor) {
      toast.error("Please select a doctor");
      return;
    }

    if (step === 3 && !selectedService) {
      toast.error("Please select a service");
      return;
    }

    if (step === 4 && (!selectedDate || !selectedTime)) {
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

  const handleCreateNewPatient = async () => {
    // Validate input
    if (!newPatientName.trim()) {
      toast.error("Please enter patient name");
      return;
    }

    if (!newPatientMobile || newPatientMobile.length < 10) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    setIsCreatingPatient(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPatientName,
          mobile: newPatientMobile,
          email: `${newPatientMobile}@placeholder.com`, // Placeholder email
          address: "Address not provided", // Placeholder address
          role: "patient",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Patient created successfully");

        // Set the newly created patient as the selected patient
        setSelectedPatient(data.patient._id);
        setPatientDetails({
          _id: data.patient._id,
          name: data.patient.name,
          mobile: data.patient.mobile,
        });

        // Add the new patient to the patients list
        setPatients((prev) => [data.patient, ...prev]);

        // Move to the next step
        setStep(2);

        // Reset form
        setShowNewPatientForm(false);
        setNewPatientName("");
        setNewPatientMobile("");
      } else {
        toast.error(data.error || "Failed to create patient");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsCreatingPatient(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1: // Select Patient
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 1: Select a Patient
            </h2>

            {!showNewPatientForm ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-md text-gray-700 font-medium">
                    Select Existing Patient
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNewPatientForm(true)}
                    className="text-primary-600 hover:text-primary-800 flex items-center text-sm"
                  >
                    <FaPlus className="mr-1" /> Add New Patient
                  </button>
                </div>

                {isLoadingPatients ? (
                  <div className="flex justify-center py-8">
                    <FaSpinner className="animate-spin h-8 w-8 text-primary-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patients.map((patient) => (
                      <div
                        key={patient._id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedPatient === patient._id
                            ? "border-primary-500 bg-primary-50"
                            : "border-gray-200 hover:border-primary-300"
                        }`}
                        onClick={() => setSelectedPatient(patient._id)}
                      >
                        <div className="flex items-center">
                          <div className="bg-primary-100 p-3 rounded-full">
                            <FaUser className="h-6 w-6 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <h3 className="font-medium">{patient.name}</h3>
                            <p className="text-sm text-gray-600">
                              {patient.mobile}
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
                    disabled={!selectedPatient}
                  >
                    Next <FaArrowRight className="ml-2" />
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-800">
                    Add New Patient
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNewPatientForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <span className="sr-only">Close</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label
                      htmlFor="patientName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      id="patientName"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter patient name"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="patientMobile"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      id="patientMobile"
                      value={newPatientMobile}
                      onChange={(e) => setNewPatientMobile(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewPatientForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewPatient}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    disabled={isCreatingPatient}
                  >
                    {isCreatingPatient ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" /> Creating...
                      </>
                    ) : (
                      <>
                        <FaPlus className="mr-2" /> Create & Continue
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 2: // Select Doctor
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 2: Select a Doctor
            </h2>

            {patientDetails && (
              <div className="bg-primary-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-primary-800">
                  Selected Patient
                </h3>
                <div className="flex items-center mt-2">
                  <FaUser className="h-5 w-5 text-primary-600 mr-2" />
                  <span>
                    {patientDetails.name} - {patientDetails.mobile}
                  </span>
                </div>
              </div>
            )}

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
                disabled={!selectedDoctor}
              >
                Next <FaArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        );

      case 3: // Select Service
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 3: Select a Service
            </h2>

            <div className="bg-primary-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-primary-800">
                Appointment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div className="flex items-center">
                  <FaUser className="h-5 w-5 text-primary-600 mr-2" />
                  <span>{patientDetails?.name}</span>
                </div>
                <div className="flex items-center">
                  <FaUserMd className="h-5 w-5 text-primary-600 mr-2" />
                  <span>
                    {doctorDetails?.name} - {doctorDetails?.specialization}
                  </span>
                </div>
              </div>
            </div>

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

      case 4: // Select Date and Time
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 4: Select Date and Time
            </h2>

            <div className="bg-primary-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-primary-800">
                Appointment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                <div className="flex items-center">
                  <FaUser className="h-5 w-5 text-primary-600 mr-2" />
                  <span>{patientDetails?.name}</span>
                </div>
                <div className="flex items-center">
                  <FaUserMd className="h-5 w-5 text-primary-600 mr-2" />
                  <span>{doctorDetails?.name}</span>
                </div>
                <div className="flex items-center">
                  <FaMedkit className="h-5 w-5 text-primary-600 mr-2" />
                  <span>{serviceDetails?.name}</span>
                </div>
              </div>
            </div>

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
                placeholder="Any specific concerns or information"
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

      case 5: // Confirm
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 5: Confirm Appointment
            </h2>

            <div className="bg-primary-50 p-6 rounded-lg">
              <h3 className="font-medium text-primary-800 text-lg mb-4">
                Appointment Summary
              </h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <FaUser className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Patient</p>
                    <p>
                      {patientDetails?.name} - {patientDetails?.mobile}
                    </p>
                  </div>
                </div>

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
                    <p className="text-sm font-medium">
                      Price: ₹{serviceDetails?.price}
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

                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This appointment will be marked as
                    confirmed and payment will be handled at the clinic.
                  </p>
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
    <AdminLayout>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Book Appointment for Patient
        </h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: "Select Patient", icon: FaUser },
              { step: 2, label: "Select Doctor", icon: FaUserMd },
              { step: 3, label: "Select Service", icon: FaMedkit },
              { step: 4, label: "Choose Slot", icon: FaCalendarAlt },
              { step: 5, label: "Confirm", icon: FaCheckCircle },
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
              style={{ width: `${((step - 1) / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </AdminLayout>
  );
}
