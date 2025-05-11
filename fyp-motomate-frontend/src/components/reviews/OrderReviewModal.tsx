// src/components/reviews/OrderReviewModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StarRating from '../common/StarRating';
import { toast } from 'sonner';

import { AlertTriangle } from 'lucide-react';
import reviewService from '../../../services/reviewService';

interface OrderReviewModalProps {
  isOpen: boolean;
  order: {
    orderId: number;
    mechanic?: {
      mechanicId: number;
      name: string;
    };
    vehicle: {
      make: string;
      model: string;
    };
  };
  onClose: () => void;
  onReviewSubmitted: () => Promise<void>;
  disableClose?: boolean;
}

const OrderReviewModal: React.FC<OrderReviewModalProps> = ({
  isOpen,
  order,
  onClose,
  onReviewSubmitted,
  disableClose = false
}) => {
  const [mechanicRating, setMechanicRating] = useState(0);
  const [mechanicComments, setMechanicComments] = useState('');
  const [workshopRating, setWorkshopRating] = useState(0);
  const [workshopComments, setWorkshopComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedClose, setAttemptedClose] = useState(false);
  
  // Reset state when order changes
  useEffect(() => {
    if (order) {
      setMechanicRating(0);
      setMechanicComments('');
      setWorkshopRating(0);
      setWorkshopComments('');
      setAttemptedClose(false);
    }
  }, [order?.orderId]);

  const handleSubmit = async () => {
    if (mechanicRating === 0) {
      toast.error('Please rate the mechanic performance');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await reviewService.submitReview({
        orderId: order.orderId,
        mechanicRating,
        mechanicComments,
        workshopRating,
        workshopComments
      });

      if (response.success) {
        await onReviewSubmitted();
      } else {
        toast.error(response.message || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error?.response?.data?.message || 'An error occurred while submitting your review');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dialog open state changes
  const handleOpenChange = (open: boolean) => {
    // If trying to close and mechanic is not rated
    if (!open && mechanicRating === 0) {
      setAttemptedClose(true);
      // Don't allow closing if this is a required review
      if (disableClose) {
        toast.error('Please rate the mechanic performance to continue');
        return;
      }
    }
    
    // Allow closing if we're not in disableClose mode
    if (!open && !disableClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            Please rate your experience with the {order.vehicle.make} {order.vehicle.model} service.
            {disableClose && (
              <span className="block mt-1 font-medium text-yellow-600">
                This review is required to continue using the app.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {order.mechanic && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Mechanic Performance</h3>
              <p className="text-sm text-gray-500">
                How would you rate {order.mechanic.name}'s performance?
              </p>
              <div className="flex items-center space-x-2">
                <StarRating 
                  initialRating={mechanicRating} 
                  onChange={setMechanicRating} 
                />
                <span className="text-sm font-medium">
                  {mechanicRating > 0 ? `${mechanicRating}/5` : "Required"}
                </span>
              </div>
              
              {attemptedClose && mechanicRating === 0 && (
                <div className="flex items-center mt-1 text-red-500 text-sm">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Please rate the mechanic performance
                </div>
              )}
              
              <Textarea
                placeholder="Additional comments about mechanic performance (optional)"
                value={mechanicComments}
                onChange={(e) => setMechanicComments(e.target.value)}
                className="resize-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Workshop Rating</h3>
            <p className="text-sm text-gray-500">
              How would you rate our workshop services overall?
            </p>
            <div className="flex items-center space-x-2">
              <StarRating 
                initialRating={workshopRating} 
                onChange={setWorkshopRating} 
              />
              <span className="text-sm font-medium">
                {workshopRating > 0 ? `${workshopRating}/5` : "Optional"}
              </span>
            </div>
            <Textarea
              placeholder="Additional comments about our workshop (optional)"
              value={workshopComments}
              onChange={(e) => setWorkshopComments(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || mechanicRating === 0}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderReviewModal;