import { ReactNode } from "react";
import AuthGuard from "../../../../AuthGuard";
import AdminNavbar from "@/components/layout/AdminNavbar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["super_admin", "admin", "service_agent", "mechanic", "finance_officer"]}>
      <div className="flex min-h-screen flex-col">
        <AdminNavbar />
        <main className="flex-1 pt-14">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}