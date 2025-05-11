'use client';

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import reviewService from "../../services/reviewService";

interface ReviewGuardProps {
  children: ReactNode;
}

/**
 * A component that forces users to complete their pending reviews
 * before accessing the protected content.
 */
export default function ReviewGuard({ children }: ReviewGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasPendingReviews, setHasPendingReviews] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkPendingReviews = async () => {
      try {
        setIsChecking(true);
        const response = await reviewService.getPendingReviews();
        
        const hasPending = response.pendingReviewCount > 0;
        setHasPendingReviews(hasPending);
        
        if (hasPending) {
          toast.warning("You have pending reviews that must be completed", {
            duration: 5000,
          });
          router.push("/customer/reviews?forced=true");
        }
      } catch (error) {
        console.error("Error checking pending reviews:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPendingReviews();
  }, [router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user has pending reviews, component will redirect (handled in useEffect)
  // Otherwise, render children
  return <>{children}</>;
}