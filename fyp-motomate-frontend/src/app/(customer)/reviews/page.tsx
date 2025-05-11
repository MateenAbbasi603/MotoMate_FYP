'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PendingReviews from '@/components/reviews/PendingReviews';

import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';
import reviewService from '../../../../services/reviewService';

export default function ReviewsPage() {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const isForced = searchParams.get('forced') === 'true';

  // Function to fetch pending reviews
  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Force fresh data
      const response = await reviewService.getPendingReviews(true);
      
      setPendingReviews(response.orders as any);
      
      // If no pending reviews, redirect back to dashboard
      if (response.pendingReviewCount === 0) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle review submissions
  const handleReviewSubmitted = async () => {
    // Fetch updated pending reviews after submission
    await fetchPendingReviews();
  };

  // Fetch pending reviews on component mount
  useEffect(() => {
    fetchPendingReviews();
  }, []);

  // Track attempts to leave the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only prevent navigation if there are pending reviews
      if (pendingReviews.length > 0) {
        // Standard way of showing a confirmation dialog
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // This text isn't actually shown in modern browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pendingReviews]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-yellow-600" />
          <h1 className="text-2xl font-bold">Service Reviews Required</h1>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-red-800">Error Loading Reviews</h2>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchPendingReviews}>Try Again</Button>
          </div>
        ) : (
          <>
            {pendingReviews.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                    Please Complete Required Reviews
                  </h2>
                  <p className="text-yellow-700">
                    You have {pendingReviews.length} service{pendingReviews.length > 1 ? 's' : ''} that require your review. 
                    {isForced && (
                      <strong className="block mt-2">
                        These reviews are mandatory and must be completed to continue using the app.
                      </strong>
                    )}
                  </p>
                </div>
                
                <PendingReviews 
                  pendingReviews={pendingReviews} 
                  onReviewSubmitted={handleReviewSubmitted} 
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">You have no pending reviews</p>
                <Button onClick={() => router.push('/dashboard')}>
                  Return to Dashboard
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}