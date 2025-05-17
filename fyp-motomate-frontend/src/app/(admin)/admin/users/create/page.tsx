import CreateStaffForm from "@/components/Admin/CreateAdminStaff";
import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { UserPlus } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Staff Member | MotoMate Admin",
  description: "Add a new staff member with administrative access to the system",
};

export default function CreateStaffPage() {
  return (
    <div className="container py-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-2 pb-2">
        <div className="flex items-center gap-2">
          <UserPlus className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Create Staff Member</h1>
        </div>
        <p className="text-muted-foreground">
          Add a new staff member with appropriate permissions to manage the MotoMate system.
        </p>
        <Separator className="my-4" />
      </div>

      <CreateStaffForm />
    </div>
  );
}