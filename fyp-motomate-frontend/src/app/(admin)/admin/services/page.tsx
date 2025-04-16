// app/admin/services/page.tsx
"use client";

import ServiceList from "@/components/Admin/ServiceList";
import AuthGuard from "../../../../../AuthGuard";



export default function ServicesPage() {
  return (
    <AuthGuard allowedRoles={["super_admin", "admin"]}>
      <ServiceList />
    
    </AuthGuard>
  );
}