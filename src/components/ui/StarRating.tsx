import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StarRatingProps {
  rating: number;
  showNumber?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, showNumber = true, size = 'md' }) => {
  const starSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <Star
            key={`star-${starValue}`}
            className={cn(
              starSize,
              starValue <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            )}
          />
        ))}
      </div>
      {showNumber && <span className="text-sm text-gray-600 font-medium">{rating.toFixed(1)}</span>}
    </div>
  );
};
