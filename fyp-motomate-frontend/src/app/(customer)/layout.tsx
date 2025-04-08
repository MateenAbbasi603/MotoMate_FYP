import { ReactNode } from "react";
import AuthGuard from "../../../AuthGuard";
import CustomerNavbar from "@/components/layout/CustomerNavbar";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["customer"]}>
      <div className="flex min-h-screen flex-col">
        <CustomerNavbar />
        <main className="flex-1 pt-14">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
} 