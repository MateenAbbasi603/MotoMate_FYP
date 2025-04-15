// app/admin/services/page.tsx
"use client";

import ServiceForm from "@/components/Admin/ServiceForm";
import AuthGuard from "../../../../../../AuthGuard";



export default function ServicesPage() {
  return (
    <AuthGuard allowedRoles={["super_admin", "admin"]}>
      <ServiceForm />
    
    </AuthGuard>
  );
}