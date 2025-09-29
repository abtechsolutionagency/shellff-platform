
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Loader2, Music, Crown, Headphones } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserType } from '@prisma/client';

interface RoleSwitchModalProps {
  currentRole: UserType;
  username: string;
  sciId?: string | null;
  isRoleRestricted?: boolean;
}

export function RoleSwitchModal({ currentRole, username: _username, sciId, isRoleRestricted = false }: RoleSwitchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const targetRole = currentRole === UserType.LISTENER ? UserType.CREATOR : UserType.LISTENER;

  // Don't render the switch button for role-restricted accounts or admin users
  if (isRoleRestricted || currentRole === UserType.ADMIN) {
    return null;
  }

  const handleRoleSwitch = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/profile/role-switch', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newRole: targetRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to switch role');
      }

      const result = await response.json();
      
      toast({
        title: 'Success!',
        description: result.message,
      });

      setIsOpen(false);
      
      // Force a full page reload to refresh the session and UI
      setTimeout(() => {
        if (targetRole === 'CREATOR') {
          window.location.href = '/creator/releases';
        } else {
          window.location.href = '/dashboard';
        }
      }, 500);
    } catch (error) {
      console.error('Role switch error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to switch role',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roleInfo: Record<Extract<UserType, 'LISTENER' | 'CREATOR'>, {
    title: string;
    description: string;
    icon: typeof Headphones | typeof Music;
    features: string[];
  }> = {
    LISTENER: {
      title: 'Listener',
      description: 'Discover, stream, and enjoy music from creators around the world',
      icon: Headphones,
      features: [
        'Stream unlimited music',
        'Create and share playlists',
        'Follow your favorite creators',
        'Download for offline listening',
        'Access to exclusive releases',
      ],
    },
    CREATOR: {
      title: 'Creator',
      description: 'Upload, share, and monetize your original music',
      icon: Music,
      features: [
        'Upload unlimited tracks and albums',
        'Earn from streams and purchases',
        'Access detailed analytics',
        'Interact with your fanbase',
        'Priority support and tools',
        sciId ? undefined : 'Get your unique Creator ID (SCI)',
      ].filter((feature): feature is string => Boolean(feature)),
    },
  };

  const roleKey = (targetRole === UserType.CREATOR || targetRole === UserType.LISTENER)
    ? targetRole
    : UserType.LISTENER;
  const currentKey = (currentRole === UserType.CREATOR || currentRole === UserType.LISTENER)
    ? currentRole
    : UserType.LISTENER;

  const currentInfo = roleInfo[currentKey];
  const targetInfo = roleInfo[roleKey];
  const CurrentIcon = currentInfo.icon;
  const TargetIcon = targetInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Crown className="h-4 w-4 mr-2" />
          Switch to {targetRole === 'CREATOR' ? 'Creator' : 'Listener'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-poppins text-xl">Switch Account Type</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Current vs Target Role Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Current Role */}
            <Card className="border-2 bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white font-poppins">
                  <CurrentIcon className="h-5 w-5 text-purple-400" />
                  Current: {currentInfo.title}
                  <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">Active</Badge>
                </CardTitle>
                <CardDescription className="text-gray-400 font-inter">{currentInfo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {currentInfo.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <div className="h-1.5 w-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {currentRole === 'CREATOR' && sciId && (
                  <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <p className="text-sm font-medium text-purple-300">Creator ID: {sciId}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Target Role */}
            <Card className="border-2 border-purple-500/30 bg-gray-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white font-poppins">
                  <TargetIcon className="h-5 w-5 text-green-400" />
                  Switch to: {targetInfo.title}
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">New</Badge>
                </CardTitle>
                <CardDescription className="text-gray-400 font-inter">{targetInfo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {targetInfo.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <div className="h-1.5 w-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {targetRole === 'CREATOR' && !sciId && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm font-medium text-green-300">
                      You&apos;ll receive a unique Creator ID (SCI) after switching!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Switch Direction */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4 p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
              <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">{currentRole}</Badge>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <Badge variant="default" className="bg-green-500/20 text-green-300 border-green-500/30">{targetRole}</Badge>
            </div>
          </div>



          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 font-inter"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRoleSwitch}
              disabled={isLoading}
              className="min-w-[120px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-inter"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Switching...
                </>
              ) : (
                <>
                  Switch to {targetRole === 'CREATOR' ? 'Creator' : 'Listener'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
