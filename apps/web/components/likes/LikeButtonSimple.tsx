

'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLikes } from '@/hooks/useLikes';

interface LikeButtonSimpleProps {
  trackId: string;
  trackTitle?: string;
  isLiked: boolean;
  onLikeChange?: (trackId: string, isLiked: boolean) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

/**
 * Simple like button that manages its own state using the useLikes hook
 */
export function LikeButtonSimple({
  trackId,
  trackTitle,
  isLiked,
  onLikeChange,
  size = 'md',
  className,
  disabled = false,
}: LikeButtonSimpleProps) {
  const { toggleLike, isTrackLoading } = useLikes();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isTrackLoading(trackId)) return;

    const newLikedState = await toggleLike(trackId, isLiked, trackTitle);
    
    if (onLikeChange) {
      onLikeChange(trackId, newLikedState);
    }
  };

  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const isLoading = isTrackLoading(trackId);

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      title={isLiked ? `Remove from Liked Songs` : `Add to Liked Songs`}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          'transition-all duration-200',
          isLiked ? 'fill-current text-red-500' : 'text-gray-400 hover:text-red-400',
          isLoading && 'animate-pulse',
        )}
      />
    </button>
  );
}

