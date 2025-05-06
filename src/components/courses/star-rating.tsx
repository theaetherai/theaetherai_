import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  className?: string;
}

export default function StarRating({ 
  rating, 
  maxStars = 5,
  size = 14,
  className = "" 
}: StarRatingProps) {
  // Calculate full stars, half stars, and empty stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className={`flex ${className}`}>
      {/* Render full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star 
          key={`full-${i}`}
          className="text-accent fill-accent"
          size={size}
        />
      ))}
      
      {/* Render half star if needed */}
      {hasHalfStar && (
        <StarHalf
          className="text-accent fill-accent"
          size={size}
        />
      )}
      
      {/* Render empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star 
          key={`empty-${i}`}
          className="text-accent"
          size={size}
        />
      ))}
    </div>
  );
} 