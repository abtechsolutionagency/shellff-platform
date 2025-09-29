
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Clock, Check, Share2, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface PackMember {
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
}

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
  createdAt: string
  release: {
    title: string
    coverArt?: string
    creator: {
      firstName?: string
      lastName?: string
    }
  }
  packMembers: PackMember[]
}

interface GroupPackProgressProps {
  packId: string
  showInviteLink?: boolean
  onRedemptionComplete?: () => void
}

export default function GroupPackProgress({ 
  packId, 
  showInviteLink = true,
  onRedemptionComplete 
}: GroupPackProgressProps) {
  const [pack, setPack] = useState<GroupPack | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [inviteLink, setInviteLink] = useState('')

  useEffect(() => {
    loadPackDetails()
    if (showInviteLink) {
      generateInviteLink()
    }
  }, [packId])

  const loadPackDetails = async () => {
    try {
      const response = await fetch(`/api/listener/group-packs/${packId}`)
      if (response.ok) {
        const packData = await response.json()
        setPack(packData)
      }
    } catch (error) {
      console.error('Failed to load pack details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateInviteLink = async () => {
    try {
      const response = await fetch(`/api/listener/group-packs/${packId}/invite`)
      if (response.ok) {
        const data = await response.json()
        setInviteLink(data.inviteLink)
      }
    } catch (error) {
      console.error('Failed to generate invite link:', error)
    }
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      toast.success('Invite link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy invite link')
    }
  }

  const shareInviteLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my group pack: ${pack?.name}`,
          text: `Join me in unlocking "${pack?.release.title}" together and save ${pack?.discountPercentage}%!`,
          url: inviteLink
        })
      } catch (error) {
        copyInviteLink()
      }
    } else {
      copyInviteLink()
    }
  }

  const getInitials = (member: PackMember) => {
    const name = member.user.firstName || member.user.email.split('@')[0]
    return name.substring(0, 2).toUpperCase()
  }

  const getRoleBadge = (role: string) => {
    if (role === 'owner') {
      return <Badge variant="default" className="text-xs">Owner</Badge>
    }
    if (role === 'admin') {
      return <Badge variant="secondary" className="text-xs">Admin</Badge>
    }
    return null
  }

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} SHC`
  }

  const calculateProgress = () => {
    if (!pack) return 0
    return (pack.currentMembers / pack.maxMembers) * 100
  }

  const isComplete = pack && pack.currentMembers >= pack.maxMembers
  const isExpired = pack?.expiresAt && new Date(pack.expiresAt) < new Date()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!pack) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Group pack not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          {pack.release.coverArt && (
            <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
              <img
                src={pack.release.coverArt}
                alt={pack.release.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{pack.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {pack.release.title} by {pack.release.creator.firstName || pack.release.creator.lastName || 'Unknown'}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="capitalize">{pack.packType}</Badge>
              {isComplete && (
                <Badge variant="default" className="bg-green-500">
                  <Check className="w-3 h-3 mr-1" />Complete
                </Badge>
              )}
              {isExpired && (
                <Badge variant="destructive">Expired</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm">Progress</h4>
            <span className="text-sm text-muted-foreground">
              {pack.currentMembers}/{pack.maxMembers} members
            </span>
          </div>
          <Progress value={calculateProgress()} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {isComplete 
              ? "All members joined! Ready to unlock." 
              : `${pack.maxMembers - pack.currentMembers} more member${pack.maxMembers - pack.currentMembers > 1 ? 's' : ''} needed`
            }
          </p>
        </div>

        {/* Pricing Info */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Pricing</h4>
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <span className="line-through text-muted-foreground text-sm">
                {formatPrice(pack.originalPrice)}
              </span>
              <span className="font-semibold text-green-600">
                {formatPrice(pack.discountedPrice)}
              </span>
            </div>
            <Badge variant="secondary">
              {pack.discountPercentage}% off
            </Badge>
          </div>
        </div>

        {/* Members List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm">Members</h4>
            <Badge variant="outline" className="text-xs">
              {pack.packMembers.filter(m => m.hasRedeemed).length}/{pack.packMembers.length} redeemed
            </Badge>
          </div>
          <div className="space-y-2">
            {pack.packMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(member)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.user.firstName || member.user.email.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDistanceToNow(new Date(member.joinedAt))} ago
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getRoleBadge(member.role)}
                  {member.hasRedeemed && (
                    <Badge variant="default" className="bg-green-500 text-xs">
                      <Check className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Link Section */}
        {showInviteLink && !isComplete && !isExpired && inviteLink && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Invite Others</h4>
            <div className="flex gap-2">
              <div className="flex-1 p-2 bg-muted rounded-md text-xs font-mono truncate">
                {inviteLink}
              </div>
              <Button size="sm" variant="outline" onClick={copyInviteLink}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={shareInviteLink}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Expiration Info */}
        {pack.expiresAt && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                {isExpired 
                  ? "This pack has expired"
                  : `Expires on ${new Date(pack.expiresAt).toLocaleDateString()}`
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
