"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import authService from "../../../services/authService";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  className?: string;
}

export default function LogoutButton({
  variant = "ghost",
  size = "default",
  showIcon = true,
  className = "",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Call the logout method to clear tokens
      authService.logout();
      
      toast.success("Logged out successfully");
      
      // Redirect to login page
      router.push("/login");
      
      // Refresh the page to clear any cached state
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4 cursor-pointer" />}
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  );
}