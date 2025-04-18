'use client'


import { MechanicRatingDialog } from "@/components/MechanicRatingDialog";
import LogoutButton from "@/components/User/LogoutBtn";

// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

<LogoutButton/>     
<MechanicRatingDialog />

    </div>
  );
}