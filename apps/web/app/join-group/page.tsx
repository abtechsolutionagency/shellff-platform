
'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Users, Clock, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

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
}

function JoinGroupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { status } = useSession()
  const [pack, setPack] = useState<GroupPack | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inviteCode = searchParams?.get('code') || null;

const loadPackInfo = useCallback(async () => {
  if (!inviteCode) {
    return;
  }

  try {
    const response = await fetch(`/api/listener/group-packs/preview?code=${inviteCode}`);
    const data = await response.json();

    if (response.ok) {
      setPack(data);
    } else {
      setError(data.error || 'Failed to load group pack information');
    }
  } catch (error) {
    setError('Network error. Please try again.');
  } finally {
    setIsLoading(false);
  }
}, [inviteCode]);

useEffect(() => {
  if (status === 'loading') {
    return;
  }

  if (status === 'unauthenticated') {
    router.push(
      `/auth/signin?callbackUrl=${encodeURIComponent(`/join-group?code=${inviteCode ?? ''}`)}`
    );
    return;
  }

  if (inviteCode) {
    void loadPackInfo();
  } else {
    setError('Invalid invite link');
    setIsLoading(false);
  }
}, [inviteCode, status, router, loadPackInfo]);

const joinPack = async () => {
    if (!inviteCode) return
    
    setIsJoining(true)
    try {
      const response = await fetch('/api/listener/group-packs/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Successfully joined the group pack!')
        router.push('/dashboard')
      } else {
        toast.error(data.error || 'Failed to join group pack')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} SHC`
  }

  const calculateProgress = () => {
    if (!pack) return 0
    return (pack.currentMembers / pack.maxMembers) * 100
  }

  const isExpired = Boolean(pack?.expiresAt && new Date(pack.expiresAt) < new Date())
  const isFull = Boolean(pack && pack.currentMembers >= pack.maxMembers)

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
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
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Link href="/dashboard">
                <Button variant="outline" className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <Button onClick={loadPackInfo} disabled={!inviteCode}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Group pack not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Join Group Pack
          </CardTitle>
          <CardDescription>
            You’ve been invited to join a group pack for exclusive savings!
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Album Info */}
          <div className="flex items-start gap-4">
            {pack.release.coverArt && (
              <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={pack.release.coverArt}
                  alt={pack.release.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{pack.name}</h3>
              <p className="text-sm text-muted-foreground">
                {pack.release.title} by {pack.release.creator.firstName || pack.release.creator.lastName || 'Unknown'}
              </p>
              <Badge variant="outline" className="mt-1 capitalize">
                {pack.packType} Pack
              </Badge>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {pack.currentMembers}/{pack.maxMembers} members
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {isFull 
                ? "This pack is full!" 
                : `${pack.maxMembers - pack.currentMembers} more member${pack.maxMembers - pack.currentMembers > 1 ? 's' : ''} needed`
              }
            </p>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Your Share</h4>
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <span className="line-through text-muted-foreground">
                  {formatPrice(pack.originalPrice / pack.maxMembers)}
                </span>
                <span className="font-semibold text-green-600 text-lg">
                  {formatPrice(pack.discountedPrice / pack.maxMembers)}
                </span>
              </div>
              <Badge variant="secondary">
                {pack.discountPercentage}% off
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Per member pricing. Save {formatPrice((pack.originalPrice - pack.discountedPrice) / pack.maxMembers)} compared to individual purchase!
            </p>
          </div>

          {/* Expiration */}
          {pack.expiresAt && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  {isExpired 
                    ? "This invite has expired"
                    : `Expires on ${new Date(pack.expiresAt).toLocaleDateString()}`
                  }
                </span>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {isFull && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">
                  This group pack is already full
                </span>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">
                  This invite has expired
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button
              onClick={joinPack}
              disabled={isJoining || isFull || isExpired}
              className="flex-1"
            >
              {isJoining ? 'Joining...' : 'Join Pack'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <JoinGroupContent />
    </Suspense>
  )
}
