
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Gift, Star, Trophy, Coins, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface RewardData {
  totalSaved: number
  packsCompleted: number
  albumsUnlocked: number
  savingsRank: string
  achievements: Array<{
    id: string
    name: string
    description: string
    icon: string
    earned: boolean
    earnedAt?: string
    progress?: number
    maxProgress?: number
  }>
  recentSavings: Array<{
    id: string
    packName: string
    releaseTitle: string
    savedAmount: number
    redeemedAt: string
  }>
}

interface GroupRewardDistributionProps {
  className?: string
}

export default function GroupRewardDistribution({ className }: GroupRewardDistributionProps) {
  const { data: session } = useSession()
  const [rewards, setRewards] = useState<RewardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      loadRewardData()
    }
  }, [session])

  const loadRewardData = async () => {
    try {
      const response = await fetch('/api/listener/group-packs/rewards')
      if (response.ok) {
        const data = await response.json()
        setRewards(data)
      }
    } catch (error) {
      console.error('Failed to load reward data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const claimAchievement = async (achievementId: string) => {
    try {
      const response = await fetch('/api/listener/group-packs/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId })
      })

      if (response.ok) {
        toast.success('Achievement claimed!')
        loadRewardData()
      } else {
        toast.error('Failed to claim achievement')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    }
  }

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'star':
        return <Star className="w-6 h-6" />
      case 'trophy':
        return <Trophy className="w-6 h-6" />
      case 'coins':
        return <Coins className="w-6 h-6" />
      case 'trending':
        return <TrendingUp className="w-6 h-6" />
      default:
        return <Gift className="w-6 h-6" />
    }
  }

  const getRankColor = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'bronze':
        return 'text-amber-600'
      case 'silver':
        return 'text-gray-600'
      case 'gold':
        return 'text-yellow-600'
      case 'platinum':
        return 'text-purple-600'
      default:
        return 'text-muted-foreground'
    }
  }

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} SHC`
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!rewards) {
    return (
      <div className={`${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Rewards Yet</h3>
            <p className="text-muted-foreground text-sm">
              Join group packs to start earning rewards and savings!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatPrice(rewards.totalSaved)}
            </div>
            <p className="text-sm text-muted-foreground">Total Saved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {rewards.packsCompleted}
            </div>
            <p className="text-sm text-muted-foreground">Packs Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {rewards.albumsUnlocked}
            </div>
            <p className="text-sm text-muted-foreground">Albums Unlocked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold mb-1 ${getRankColor(rewards.savingsRank)}`}>
              {rewards.savingsRank}
            </div>
            <p className="text-sm text-muted-foreground">Savings Rank</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      {rewards.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border ${
                    achievement.earned 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-muted bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${
                      achievement.earned 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {getAchievementIcon(achievement.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm">{achievement.name}</h4>
                        {achievement.earned && (
                          <Badge variant="default" className="bg-green-500 text-xs">
                            Earned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      
                      {!achievement.earned && achievement.progress !== undefined && achievement.maxProgress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.maxProgress) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}

                      {achievement.earned && !achievement.earnedAt && (
                        <Button
                          size="sm"
                          onClick={() => claimAchievement(achievement.id)}
                          className="mt-2 h-7 text-xs"
                        >
                          Claim Reward
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Savings */}
      {rewards.recentSavings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Recent Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rewards.recentSavings.map((saving) => (
                <div key={saving.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm">{saving.releaseTitle}</h4>
                    <p className="text-xs text-muted-foreground">{saving.packName}</p>
                    <p className="text-xs text-muted-foreground">
                      Redeemed {new Date(saving.redeemedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      +{formatPrice(saving.savedAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground">saved</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
