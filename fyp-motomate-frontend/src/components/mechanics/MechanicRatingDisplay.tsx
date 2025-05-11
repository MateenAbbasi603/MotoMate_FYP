// app/components/mechanics/MechanicRatingDisplay.tsx
'use client';

import React, { useEffect, useState } from 'react';
import StarRating from '../common/StarRating';
import reviewService from '../../../services/reviewService';

interface MechanicRatingDisplayProps {
  mechanicId: number;
  showDetails?: boolean;
}

const MechanicRatingDisplay: React.FC<MechanicRatingDisplayProps> = ({
  mechanicId,
  showDetails = false,
}) => {
  const [rating, setRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        setLoading(true);
        const data:any = await reviewService.getMechanicRating(mechanicId);
        
        if (data.success) {
          setRating(data.averageRating);
          setTotalReviews(data.totalReviews);
        }
      } catch (error) {
        console.error('Error fetching mechanic rating:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mechanicId) {
      fetchRating();
    }
  }, [mechanicId]);

  if (loading) {
    return <div className="h-5 w-24 animate-pulse bg-gray-200 rounded"></div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <StarRating initialRating={rating} readOnly size={16} />
      
      {showDetails ? (
        <span className="text-sm text-gray-600">
          {rating > 0 ? rating.toFixed(1) : 'N/A'} 
          {totalReviews > 0 && ` (${totalReviews} review${totalReviews !== 1 ? 's' : ''})`}
        </span>
      ) : (
        <span className="text-sm text-gray-600">
          {rating > 0 ? rating.toFixed(1) : 'N/A'}
        </span>
      )}
    </div>
  );
};

export default MechanicRatingDisplay;