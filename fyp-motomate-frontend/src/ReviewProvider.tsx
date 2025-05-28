'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import reviewService from '../services/reviewService';


interface ReviewContextType {
  hasPendingReviews: boolean;
  checkPendingReviews: () => Promise<boolean>;
  isPendingReviewsLoading: boolean;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function useReviews() {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
}

interface ReviewProviderProps {
  children: ReactNode;
}

export function ReviewProvider({ children }: ReviewProviderProps) {
  const [hasPendingReviews, setHasPendingReviews] = useState(false);
  const [isPendingReviewsLoading, setIsPendingReviewsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Exempt paths that don't need review check
  const isExemptPath = [
    '/',
    '/login',
    '/signup',
    '/register',
    '/reviews',
    '/api',
  ].some(path => pathname?.startsWith(path));

  const checkPendingReviews = async (): Promise<boolean> => {
    if (isExemptPath) {
      return false;
    }

    try {
      setIsPendingReviewsLoading(true);
      const response = await reviewService.getPendingReviews();
      const hasPending = response.pendingReviewCount > 0;
      setHasPendingReviews(hasPending);
      return hasPending;
    } catch (error) {
      console.error('Error checking pending reviews:', error);
      return false;
    } finally {
      setIsPendingReviewsLoading(false);
    }
  };

  useEffect(() => {
    // Skip the check for exempt paths
    if (isExemptPath) {
      setIsPendingReviewsLoading(false);
      return;
    }

    // Check for pending reviews and redirect if found
    const performCheck = async () => {
      const hasPending = await checkPendingReviews();
      
      if (hasPending) {
        // Show toast notification
        toast.warning('You have pending reviews that must be completed');
        
        // Redirect to reviews page
        router.push('/reviews?forced=true');
      }
    };

    performCheck();
  }, [pathname]);

  const value = {
    hasPendingReviews,
    checkPendingReviews,
    isPendingReviewsLoading,
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
}