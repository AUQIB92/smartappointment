"use client";

import DashboardLayout from "../DashboardLayout";

export default function AdminLayout({ children }) {
  return <DashboardLayout role="admin">{children}</DashboardLayout>;
}
