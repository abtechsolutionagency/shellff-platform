
'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Users, Check, Clock, AlertCircle, Gift } from 'lucide-react'
import { toast } from 'sonner'

interface GroupPack {
  id: string
  name: string
  description?: string
  packType: string
  maxMembers: number
  currentMembers: number
  originalPrice: number
  discountedPrice: number
  discountPercentage: number
  expiresAt?: string
  release: {
    title: string
    coverArt?: string
    creator: {
      firstName?: string
      lastName?: string
    }
  }
  packMembers: Array<{
    id: string
    userId: string
    role: string
    hasRedeemed: boolean
    joinedAt: string
    user: {
      firstName?: string
      lastName?: string
      email: string
    }
  }>
}

interface GroupCodeRedemptionProps {
  onSuccess?: (packId: string) => void
}

export default function GroupCodeRedemption({ onSuccess }: GroupCodeRedemptionProps) {
  const { data: session } = useSession()
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userPacks, setUserPacks] = useState<GroupPack[]>([])

  // Load user's current group packs
  const loadUserPacks = useCallback(async () => {
    try {
      const response = await fetch('/api/listener/group-packs');
      if (response.ok) {
        const packs = await response.json();
        setUserPacks(packs);
      }
    } catch (error) {
      console.error('Failed to load user packs:', error);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.email) {
      void loadUserPacks();
    }
  }, [loadUserPacks, session?.user?.email]);

  const joinGroupPack = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/listener/group-packs/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Successfully joined the group pack!')
        setInviteCode('')
        loadUserPacks()
        onSuccess?.(data.packId)
      } else {
        toast.error(data.error || 'Failed to join group pack')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const redeemGroupCode = async (packId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/listener/group-packs/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Album unlocked successfully!')
        loadUserPacks()
      } else {
        toast.error(data.error || 'Failed to redeem code')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPackStatusBadge = (pack: GroupPack) => {
    const userMember = pack.packMembers.find(m => m.user.email === session?.user?.email)
    const isComplete = pack.currentMembers >= pack.maxMembers
    const isExpired = pack.expiresAt && new Date(pack.expiresAt) < new Date()

    if (userMember?.hasRedeemed) {
      return <Badge variant="default" className="bg-green-500"><Check className="w-3 h-3 mr-1" />Redeemed</Badge>
    }
    
    if (isExpired) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>
    }
    
    if (isComplete) {
      return <Badge variant="default" className="bg-blue-500"><Gift className="w-3 h-3 mr-1" />Ready to Redeem</Badge>
    }
    
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Waiting for Members</Badge>
  }

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} SHC`
  }

  const calculateProgress = (current: number, max: number) => {
    return (current / max) * 100
  }

  return (
    <div className="space-y-6">
      {/* Join Group Pack Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Join a Group Pack
          </CardTitle>
          <CardDescription>
            Enter an invite code to join a group and unlock albums together
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter invite code..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="flex-1"
            />
            <Button onClick={joinGroupPack} disabled={isLoading}>
              {isLoading ? 'Joining...' : 'Join Pack'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User's Group Packs */}
      {userPacks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Group Packs</h3>
          {userPacks.map((pack) => {
            const userMember = pack.packMembers.find(m => m.user.email === session?.user?.email)
            const isComplete = pack.currentMembers >= pack.maxMembers
            const isExpired = pack.expiresAt && new Date(pack.expiresAt) < new Date()
            const canRedeem = isComplete && !userMember?.hasRedeemed && !isExpired

            return (
              <Card key={pack.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {pack.release.coverArt && (
                      <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={pack.release.coverArt}
                          alt={pack.release.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{pack.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {pack.release.title} by {pack.release.creator.firstName || pack.release.creator.lastName || 'Unknown'}
                          </p>
                        </div>
                        {getPackStatusBadge(pack)}
                      </div>

                      <div className="space-y-3">
                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Members: {pack.currentMembers}/{pack.maxMembers}</span>
                            <span>{Math.round(calculateProgress(pack.currentMembers, pack.maxMembers))}%</span>
                          </div>
                          <Progress value={calculateProgress(pack.currentMembers, pack.maxMembers)} className="h-2" />
                        </div>

                        {/* Pricing */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex gap-2">
                            <span className="line-through text-muted-foreground">
                              {formatPrice(pack.originalPrice)}
                            </span>
                            <span className="font-semibold text-green-600">
                              {formatPrice(pack.discountedPrice)}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {pack.discountPercentage}% off
                            </Badge>
                          </div>
                        </div>

                        {/* Expiration */}
                        {pack.expiresAt && (
                          <p className="text-xs text-muted-foreground">
                            Expires: {new Date(pack.expiresAt).toLocaleDateString()}
                          </p>
                        )}

                        {/* Action Button */}
                        {canRedeem && (
                          <Button
                            size="sm"
                            onClick={() => redeemGroupCode(pack.id)}
                            disabled={isLoading}
                            className="w-full"
                          >
                            {isLoading ? 'Redeeming...' : 'Unlock Album'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Members List */}
                  {pack.packMembers.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="text-xs font-medium mb-2">Members:</h5>
                      <div className="flex flex-wrap gap-1">
                        {pack.packMembers.map((member) => (
                          <Badge
                            key={member.id}
                            variant={member.hasRedeemed ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {member.user.firstName || member.user.email.split('@')[0]}
                            {member.hasRedeemed && <Check className="w-3 h-3 ml-1" />}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {userPacks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Group Packs Yet</h3>
            <p className="text-muted-foreground text-sm">
              Join a group pack using an invite code to unlock albums together and save money!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
