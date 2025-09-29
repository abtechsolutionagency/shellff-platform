
'use client';

import { useState } from 'react';
import { List } from 'lucide-react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QueueManager } from './QueueManager';

interface QueueButtonProps {
  className?: string;
  showCount?: boolean;
}

export function QueueButton({ className, showCount = true }: QueueButtonProps) {
  const { queue } = useMusicPlayer();
  const [showQueue, setShowQueue] = useState(false);
  
  const queueCount = queue?.tracks.length || 0;
  
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowQueue(true)}
        className={cn(
          "relative text-gray-400 hover:text-white transition-colors duration-200",
          className
        )}
      >
        <List className="w-5 h-5" />
        {showCount && queueCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#9B5DE5] text-white text-xs rounded-full flex items-center justify-center font-medium">
            {queueCount > 99 ? '99+' : queueCount}
          </div>
        )}
      </Button>
      
      <QueueManager 
        isOpen={showQueue} 
        onClose={() => setShowQueue(false)} 
      />
    </>
  );
}
