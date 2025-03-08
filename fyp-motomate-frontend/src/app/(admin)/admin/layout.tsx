import { ReactNode } from "react";
import AuthGuard from "../../../../AuthGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["super_admin", "admin","service_agent","mechanic","finance_officer"]}>
      {/* Admin layout components */}
      <div className="flex min-h-screen">
        {/* Admin sidebar would go here */}
        <div className="flex-1">
          {/* Main content area */}
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}