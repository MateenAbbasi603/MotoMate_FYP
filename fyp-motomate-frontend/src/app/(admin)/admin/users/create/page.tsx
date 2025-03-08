// app/admin/users/create/page.tsx

import CreateStaffForm from "@/components/Admin/CreateAdminStaff";

export default function CreateStaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create Staff Member</h1>
        <p className="text-muted-foreground">
          Add a new staff member with administrative access to the system.
        </p>
      </div>
      <CreateStaffForm />
    </div>
  );
}
