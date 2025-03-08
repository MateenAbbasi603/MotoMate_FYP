import UserManagement from "@/components/Admin/UserManagement";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage all users, staff members, and customers in the system.
        </p>
      </div>
      <UserManagement />
    </div>
  );
}
