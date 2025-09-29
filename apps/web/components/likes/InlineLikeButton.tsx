

'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface InlineLikeButtonProps {
  trackId: string;
  trackTitle: string;
  isLiked: boolean;
  isLoading?: boolean;
  onToggle: (trackId: string, currentlyLiked: boolean) => Promise<void>;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function InlineLikeButton({
  trackId,
  trackTitle,
  isLiked,
  isLoading = false,
  onToggle,
  size = 'sm',
  className,
}: InlineLikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    try {
      setIsAnimating(true);
      await onToggle(trackId, isLiked);
      
      // Add haptic feedback on mobile
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Size variants
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none',
        isAnimating && 'animate-heart-pulse',
        className
      )}
      title={isLiked ? `Remove "${trackTitle}" from Liked Songs` : `Add "${trackTitle}" to Liked Songs`}
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

