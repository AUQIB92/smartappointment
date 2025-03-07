"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaUserMd,
  FaPhone,
  FaMapMarkerAlt,
  FaStethoscope,
  FaGraduationCap,
  FaCalendarAlt,
  FaEdit,
  FaArrowLeft,
  FaTrash,
} from "react-icons/fa";
import DashboardLayout from "../../../../../components/DashboardLayout";
import { toast } from "react-toastify";

export default function DoctorDetail({ params }) {
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();
  const doctorId = params.id;

  useEffect(() => {
    if (doctorId) {
      fetchDoctorDetails();
      fetchDoctorAppointments();
    }
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/doctors/${doctorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setDoctor(data.doctor);
      } else {
        toast.error(data.error || "Failed to fetch doctor details");
        router.push("/dashboard/admin/doctors");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      router.push("/dashboard/admin/doctors");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctorAppointments = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/appointments?doctorId=${doctorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setAppointments(data.appointments);
      } else {
        toast.error(data.error || "Failed to fetch doctor appointments");
      }
    } catch (error) {
      toast.error("An error occurred while fetching appointments.");
    }
  };

  const handleDeleteDoctor = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/doctors/${doctorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Doctor deleted successfully");
        router.push("/dashboard/admin/doctors");
      } else {
        toast.error(data.error || "Failed to delete doctor");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setConfirmDelete(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex justify-center items-center h-full">
          <p>Loading doctor details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!doctor) {
    return (
      <DashboardLayout role="admin">
        <div className="text-center py-8">
          <p className="text-red-500">Doctor not found</p>
          <Link
            href="/dashboard/admin/doctors"
            className="btn-primary inline-block mt-4"
          >
            Back to Doctors List
          </Link>
        </div>
      </DashboardLayout>
    );
  }

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
          <div className="flex justify-between items-center mt-4">
            <h1 className="text-2xl font-bold">Doctor Details</h1>
            <div className="flex space-x-3">
              <Link
                href={`/dashboard/admin/doctors/${doctorId}/edit`}
                className="btn-secondary flex items-center"
              >
                <FaEdit className="mr-2" /> Edit
              </Link>
              <button
                onClick={() => setConfirmDelete(true)}
                className="btn-danger flex items-center"
              >
                <FaTrash className="mr-2" /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* Doctor Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/4 flex justify-center mb-4 md:mb-0">
              <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center">
                <FaUserMd className="text-5xl text-primary-600" />
              </div>
            </div>
            <div className="md:w-3/4">
              <h2 className="text-xl font-bold mb-4">{doctor.name}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <FaStethoscope className="mt-1 mr-3 text-primary-600" />
                  <div>
                    <p className="text-sm text-gray-500">Specialization</p>
                    <p className="font-medium">{doctor.specialization}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaGraduationCap className="mt-1 mr-3 text-primary-600" />
                  <div>
                    <p className="text-sm text-gray-500">Qualifications</p>
                    <p className="font-medium">
                      {doctor.qualifications || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaPhone className="mt-1 mr-3 text-primary-600" />
                  <div>
                    <p className="text-sm text-gray-500">Mobile</p>
                    <p className="font-medium">{doctor.mobile}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaMapMarkerAlt className="mt-1 mr-3 text-primary-600" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{doctor.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor's Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Appointments</h2>

          {appointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.slice(0, 5).map((appointment) => (
                    <tr key={appointment._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.patientName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(appointment.date).toLocaleDateString()} at{" "}
                          {appointment.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              appointment.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : appointment.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                          {appointment.status.charAt(0).toUpperCase() +
                            appointment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {appointments.length > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    href={`/dashboard/admin/appointments?doctorId=${doctorId}`}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    View All Appointments
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-2" />
              <p className="text-gray-500">
                No appointments found for this doctor
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
              <p className="mb-6">
                Are you sure you want to delete Dr. {doctor.name}? This action
                cannot be undone and will remove all associated appointments.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={handleDeleteDoctor} className="btn-danger">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
