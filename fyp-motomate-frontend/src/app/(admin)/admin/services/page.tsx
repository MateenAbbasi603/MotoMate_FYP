// app/admin/services/page.tsx
"use client";

import ServiceList from "@/components/Admin/ServiceList";
import AuthGuard from "../../../../../AuthGuard";
import ServiceForm from "@/components/Admin/ServiceForm";



export default function ServicesPage() {
  return (
    <AuthGuard allowedRoles={["super_admin", "admin"]}>
      <ServiceList />
      <ServiceForm/>
    </AuthGuard>
  );
}