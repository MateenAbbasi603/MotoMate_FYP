import UserManagement from "@/components/Admin/UserManagement";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management | MotoMate Admin",
  description: "Manage staff users and permissions in the MotoMate system",
};

export default function UsersPage() {
  return (
    <div className="container py-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-2 pb-2">
        <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
        <p className="text-muted-foreground">
          Manage all staff members, assign roles, and control permissions within the MotoMate system.
        </p>
      </div>

      <UserManagement />
    </div>
  );
}