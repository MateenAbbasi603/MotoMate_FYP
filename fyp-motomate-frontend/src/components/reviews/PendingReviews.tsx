// src/components/reviews/PendingReviews.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import OrderReviewModal from './OrderReviewModal';
import { PendingReviewOrder } from '../../../services/reviewService';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface PendingReviewsProps {
  pendingReviews: PendingReviewOrder[];
  onReviewSubmitted: () => Promise<void>;
}

const PendingReviews: React.FC<PendingReviewsProps> = ({
  pendingReviews,
  onReviewSubmitted
}) => {
  const [selectedOrder, setSelectedOrder] = useState<PendingReviewOrder | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentlyReviewing, setCurrentlyReviewing] = useState<number | null>(null);

  // Handle opening the review modal for a specific order
  const handleReview = (order: PendingReviewOrder) => {
    setSelectedOrder(order);
    setCurrentlyReviewing(order.orderId);
    setShowModal(true);
  };

  // Handle closing the review modal
  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setSelectedOrder(null);
      setCurrentlyReviewing(null);
    }, 300); // Small delay to allow modal animation to complete
  };

  // Handle successful review submission
  const handleReviewSubmitted = async () => {
    toast.success('Review submitted successfully');
    await onReviewSubmitted();
    handleCloseModal();
  };

  if (pendingReviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pendingReviews.map((order) => (
          <Card 
            key={order.orderId} 
            className={`border ${currentlyReviewing === order.orderId ? 'border-primary shadow-lg' : 'border-gray-200'}`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-md">
                {order.vehicle.make} {order.vehicle.model}
              </CardTitle>
              <CardDescription>
                Completed on {formatDate(order.orderDate)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm">
                <span className="font-medium">Service:</span>{' '}
                {order.service?.serviceName || 'Inspection & Service'}
              </p>
              {order.mechanic && (
                <p className="text-sm">
                  <span className="font-medium">Mechanic:</span>{' '}
                  {order.mechanic.name}
                </p>
              )}
              <p className="text-sm">
                <span className="font-medium">Total:</span>{' '}
                {formatCurrency(order.totalAmount)}
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="default" 
                className="w-full" 
                onClick={() => handleReview(order)}
              >
                {currentlyReviewing === order.orderId ? 'Continue Rating' : 'Rate Service'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Review Modal */}
      {selectedOrder && (
        <OrderReviewModal
          isOpen={showModal}
          order={selectedOrder}
          onClose={handleCloseModal}
          onReviewSubmitted={handleReviewSubmitted}
          disableClose={pendingReviews.length === 1} // Prevent closing if it's the last review
        />
      )}
    </div>
  );
};

export default PendingReviews;