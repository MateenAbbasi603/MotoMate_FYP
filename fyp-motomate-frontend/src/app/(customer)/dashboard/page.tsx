'use client'

import { Button } from "@/components/ui/button";
import authService from "../../../../services/authService";
import LogoutButton from "@/components/User/LogoutBtn";
import InspectionRequestForm from "@/components/User/InspectionRequestForm";
import OrderForm from "@/components/User/OrderForm";

// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

<LogoutButton/>     


<OrderForm/>
    </div>
  );
}