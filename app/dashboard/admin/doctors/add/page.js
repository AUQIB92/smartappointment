"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaUserMd,
  FaMobile,
  FaMapMarkerAlt,
  FaStethoscope,
  FaGraduationCap,
  FaArrowLeft,
} from "react-icons/fa";
import DashboardLayout from "../../../../../components/DashboardLayout";
import { toast } from "react-toastify";

export default function AddDoctorPage() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    specialization: "",
    qualifications: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.name ||
      !formData.mobile ||
      !formData.address ||
      !formData.specialization
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Doctor added successfully");

        // Show temporary password (in a real app, this would be sent via SMS)
        if (data.tempPassword) {
          toast.info(`Temporary password: ${data.tempPassword}`);
        }

        // Redirect to doctors list
        router.push("/dashboard/admin/doctors");
      } else {
        toast.error(data.error || "Failed to add doctor");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div>
        <div className="mb-6">
          <Link
            href="/dashboard/admin/doctors"
            className="flex items-center text-primary-600 hover:text-primary-800"
          >
            <FaArrowLeft className="mr-2" /> Back to Doctors
          </Link>
          <h1 className="text-2xl font-bold mt-4">Add New Doctor</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserMd className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter doctor's full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="mobile"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMobile className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter mobile number"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input-field pl-10 h-24"
                    placeholder="Enter address"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="specialization"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Specialization <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaStethoscope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="specialization"
                    name="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="E.g., Cardiology, Dermatology, etc."
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="qualifications"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Qualifications
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="qualifications"
                    name="qualifications"
                    type="text"
                    value={formData.qualifications}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="E.g., MBBS, MD, etc."
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Link
                href="/dashboard/admin/doctors"
                className="btn-secondary mr-4"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add Doctor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
