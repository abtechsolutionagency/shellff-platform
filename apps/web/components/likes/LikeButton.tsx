

'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LikeButtonProps {
  trackId: string;
  isLiked: boolean;
  isLoading?: boolean;
  onToggle: (trackId: string, currentlyLiked: boolean) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'overlay' | 'inline' | 'minimal';
  className?: string;
  showTooltip?: boolean;
}

export function LikeButton({
  trackId,
  isLiked,
  isLoading = false,
  onToggle,
  size = 'md',
  variant = 'overlay',
  className,
  showTooltip = true,
}: LikeButtonProps) {
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
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Variant styles
  const variantClasses = {
    overlay: 'bg-black/40 hover:bg-black/60 text-white border-0',
    inline: 'bg-gray-800/80 hover:bg-gray-700/80 text-white border-0',
    minimal: 'bg-transparent hover:bg-gray-800/50 text-white border-0',
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        'rounded-full transition-all duration-200 flex items-center justify-center',
        'group relative overflow-hidden',
        isAnimating && 'scale-110',
        isLiked && 'text-red-500',
        className
      )}
      title={showTooltip ? (isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs') : undefined}
    >
      <Heart
        className={cn(
          iconSizes[size],
          'transition-all duration-200',
          isLiked ? 'fill-current text-red-500' : 'text-white',
          isAnimating && 'scale-125',
          isLoading && 'animate-pulse'
        )}
      />
      
      {/* Like animation effect */}
      {isAnimating && isLiked && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Heart burst effect */}
          <div className="absolute inset-0 animate-ping">
            <Heart className={cn(iconSizes[size], 'text-red-400 opacity-75 mx-auto my-auto')} />
          </div>
          
          {/* Floating hearts */}
          <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                className={cn(
                  'absolute text-red-400 opacity-0 w-2 h-2',
                  'animate-float-up',
                )}
                style={{
                  left: `${30 + i * 20}%`,
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </Button>
  );
}

