"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import authService from "./services/authService";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          // Store the page the user tried to access for redirect after login
          localStorage.setItem("redirectAfterLogin", pathname);
          router.push("/login");
          return;
        }

        // If we need to check roles
        if (allowedRoles && allowedRoles.length > 0) {
          const user = await authService.getCurrentUser();
          
          // Check if user role is in the allowed roles
          if (!allowedRoles.includes(user.role)) {
            router.push("/unauthorized");
            return;
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2  className="animate-spin h-12 w-12" />
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}

// Simple spinner component if you don't have one already
export function Spinner({ size = "default" }: { size?: "default" | "sm" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex justify-center">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-primary ${sizeClasses[size]}`}></div>
    </div>
  );
}