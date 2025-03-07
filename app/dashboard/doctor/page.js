"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaCalendarAlt,
  FaCalendarCheck,
  FaCalendarTimes,
  FaUser,
  FaClock,
} from "react-icons/fa";
import DashboardLayout from "../../../components/DashboardLayout";
import DashboardCard from "../../../components/DashboardCard";
import AppointmentCard from "../../../components/AppointmentCard";
import { toast } from "react-toastify";

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
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
        setAppointments(data.appointments);

        // Calculate stats
        const total = data.appointments.length;

        // Today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = data.appointments.filter((app) => {
          const appDate = new Date(app.date);
          appDate.setHours(0, 0, 0, 0);
          return appDate.getTime() === today.getTime();
        }).length;

        const pending = data.appointments.filter(
          (app) => app.status === "pending"
        ).length;
        const completed = data.appointments.filter(
          (app) => app.status === "completed"
        ).length;

        setStats({ total, today: todayAppointments, pending, completed });
      } else {
        toast.error(data.error || "Failed to fetch appointments");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setAppointments(
      appointments.map((app) =>
        app._id === id ? { ...app, status: newStatus } : app
      )
    );

    // Update stats
    const newStats = { ...stats };
    if (newStatus === "confirmed") {
      newStats.pending -= 1;
    } else if (newStatus === "completed") {
      newStats.completed += 1;
    }
    setStats(newStats);
  };

  // Get today's appointments
  const todayAppointments = appointments
    .filter((app) => {
      const appDate = new Date(app.date);
      appDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return (
        appDate.getTime() === today.getTime() &&
        (app.status === "pending" || app.status === "confirmed")
      );
    })
    .sort((a, b) => {
      // Sort by time
      const timeA = a.time.split(":").map(Number);
      const timeB = b.time.split(":").map(Number);
      if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
      return timeA[1] - timeB[1];
    });

  // Get pending appointments
  const pendingAppointments = appointments
    .filter((app) => app.status === "pending")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  return (
    <DashboardLayout role="doctor">
      <div>
        <h1 className="text-2xl font-bold mb-6">Doctor Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="Total Appointments"
            value={stats.total}
            icon={<FaCalendarAlt />}
            color="primary"
          />
          <DashboardCard
            title="Today's Appointments"
            value={stats.today}
            icon={<FaCalendarAlt />}
            color="secondary"
          />
          <DashboardCard
            title="Pending Approval"
            value={stats.pending}
            icon={<FaClock />}
            color="warning"
          />
          <DashboardCard
            title="Completed"
            value={stats.completed}
            icon={<FaCalendarCheck />}
            color="success"
          />
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Today's Appointments</h2>
            <Link
              href="/dashboard/doctor/appointments"
              className="text-primary-600 hover:text-primary-800"
            >
              View All
            </Link>
          </div>

          {isLoading ? (
            <p>Loading appointments...</p>
          ) : todayAppointments.length > 0 ? (
            <div>
              {todayAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  userRole="doctor"
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-2" />
              <p className="text-gray-500">
                No appointments scheduled for today
              </p>
            </div>
          )}
        </div>

        {/* Pending Appointments */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Pending Appointments</h2>
            <Link
              href="/dashboard/doctor/appointments?status=pending"
              className="text-primary-600 hover:text-primary-800"
            >
              View All
            </Link>
          </div>

          {isLoading ? (
            <p>Loading appointments...</p>
          ) : pendingAppointments.length > 0 ? (
            <div>
              {pendingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  userRole="doctor"
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaCalendarCheck className="mx-auto text-4xl text-gray-300 mb-2" />
              <p className="text-gray-500">No pending appointments</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/doctor/appointments"
              className="bg-primary-50 hover:bg-primary-100 p-4 rounded-lg flex flex-col items-center text-center"
            >
              <FaCalendarAlt className="text-3xl text-primary-500 mb-2" />
              <h3 className="font-medium">Manage Appointments</h3>
              <p className="text-sm text-gray-600 mt-1">
                View and manage all your appointments
              </p>
            </Link>

            <Link
              href="/dashboard/doctor/availability"
              className="bg-primary-50 hover:bg-primary-100 p-4 rounded-lg flex flex-col items-center text-center"
            >
              <FaClock className="text-3xl text-primary-500 mb-2" />
              <h3 className="font-medium">Set Availability</h3>
              <p className="text-sm text-gray-600 mt-1">
                Update your available time slots
              </p>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
