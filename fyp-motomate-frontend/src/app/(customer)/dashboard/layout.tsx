// app/dashboard/layout.tsx
import { ReactNode } from "react";
import AuthGuard from "../../../../AuthGuard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      {/* Your dashboard layout components like sidebar, header, etc. */}
      <div className="flex min-h-screen">
        {/* Sidebar would go here */}
        <div className="flex-1">
          {/* Main content area */}
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}