// src/app/(customer)/layout.tsx
'use client';

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthGuard from "../../../AuthGuard";
import CustomerNavbar from "@/components/layout/CustomerNavbar";
import reviewService from "../../../services/reviewService";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const [isCheckingReviews, setIsCheckingReviews] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check for pending reviews on layout mount and path changes
  useEffect(() => {
    const checkPendingReviews = async () => {
      // Skip checks for review page and API routes to prevent infinite redirects
      if (pathname?.includes("/reviews") || pathname?.startsWith("/api")) {
        setIsCheckingReviews(false);
        return;
      }

      try {
        setIsCheckingReviews(true);
        const response = await reviewService.getPendingReviews();
        
        if (response.pendingReviewCount > 0) {
          toast.warning("You have pending reviews that must be completed", {
            duration: 5000,
          });
          router.push("/customer/reviews?forced=true");
        }
      } catch (error) {
        console.error("Error checking pending reviews:", error);
      } finally {
        setIsCheckingReviews(false);
      }
    };

    checkPendingReviews();
  }, [pathname, router]);

  return (
    <AuthGuard allowedRoles={["customer"]}>
      <div className="flex min-h-screen flex-col">
        <CustomerNavbar />
        <main className="flex-1 pt-14">
          <div className="container py-6">
            {isCheckingReviews ? (
              // Show loading indicator while checking reviews
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}