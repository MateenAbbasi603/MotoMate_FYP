// app/components/common/StarRating.tsx
'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  initialRating?: number;
  totalStars?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  initialRating = 0,
  totalStars = 5,
  onChange,
  readOnly = false,
  size = 24,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (selectedRating: number) => {
    if (readOnly) return;
    
    setRating(selectedRating);
    if (onChange) {
      onChange(selectedRating);
    }
  };

  const handleMouseEnter = (hoveredRating: number) => {
    if (readOnly) return;
    setHoverRating(hoveredRating);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };

  return (
    <div className="flex gap-1">
      {[...Array(totalStars)].map((_, i) => {
        const starValue = i + 1;
        const filled = hoverRating ? hoverRating >= starValue : rating >= starValue;

        return (
          <Star
            key={i}
            size={size}
            className={`cursor-${readOnly ? 'default' : 'pointer'} transition-colors`}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            fill={filled ? 'gold' : 'transparent'}
            color={filled ? 'gold' : '#ccc'}
            strokeWidth={1}
          />
        );
      })}
    </div>
  );
};

export default StarRating;