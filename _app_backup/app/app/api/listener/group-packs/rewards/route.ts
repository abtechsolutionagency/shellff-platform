
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's pack memberships with redemption data
    const userPacks = await prisma.packMember.findMany({
      where: {
        userId: user.userId,
        hasRedeemed: true
      },
      include: {
        pack: {
          include: {
            release: {
              select: {
                title: true,
                creator: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        redeemedAt: 'desc'
      }
    })

    // Calculate total savings
    const totalSaved = userPacks.reduce((sum: number, member: any) => {
      const pack = member.pack
      const originalPricePerMember = Number(pack.originalPrice) / pack.maxMembers
      const discountedPricePerMember = Number(pack.discountedPrice) / pack.maxMembers
      return sum + (originalPricePerMember - discountedPricePerMember)
    }, 0)

    // Count completed packs and albums
    const packsCompleted = userPacks.length
    const albumsUnlocked = userPacks.length // Each pack = 1 album

    // Determine savings rank based on total saved
    let savingsRank = 'Bronze'
    if (totalSaved >= 100) savingsRank = 'Platinum'
    else if (totalSaved >= 50) savingsRank = 'Gold'
    else if (totalSaved >= 20) savingsRank = 'Silver'

    // Generate achievements based on user activity
    const achievements = [
      {
        id: 'first-pack',
        name: 'First Pack Member',
        description: 'Join your first group pack',
        icon: 'star',
        earned: packsCompleted >= 1,
        earnedAt: packsCompleted >= 1 ? userPacks[userPacks.length - 1]?.redeemedAt : undefined,
        progress: Math.min(packsCompleted, 1),
        maxProgress: 1
      },
      {
        id: 'pack-collector',
        name: 'Pack Collector',
        description: 'Complete 5 group packs',
        icon: 'trophy',
        earned: packsCompleted >= 5,
        earnedAt: packsCompleted >= 5 ? userPacks[4]?.redeemedAt : undefined,
        progress: Math.min(packsCompleted, 5),
        maxProgress: 5
      },
      {
        id: 'super-saver',
        name: 'Super Saver',
        description: 'Save 20 SHC through group packs',
        icon: 'coins',
        earned: totalSaved >= 20,
        earnedAt: totalSaved >= 20 ? userPacks[0]?.redeemedAt : undefined,
        progress: Math.min(totalSaved, 20),
        maxProgress: 20
      },
      {
        id: 'savings-champion',
        name: 'Savings Champion',
        description: 'Save 100 SHC through group packs',
        icon: 'trending',
        earned: totalSaved >= 100,
        earnedAt: totalSaved >= 100 ? userPacks[0]?.redeemedAt : undefined,
        progress: Math.min(totalSaved, 100),
        maxProgress: 100
      }
    ]

    // Get recent savings (last 5 redemptions)
    const recentSavings = userPacks.slice(0, 5).map((member: any) => {
      const pack = member.pack
      const originalPricePerMember = Number(pack.originalPrice) / pack.maxMembers
      const discountedPricePerMember = Number(pack.discountedPrice) / pack.maxMembers
      const savedAmount = originalPricePerMember - discountedPricePerMember

      return {
        id: member.id,
        packName: pack.name,
        releaseTitle: pack.release.title,
        savedAmount: savedAmount,
        redeemedAt: member.redeemedAt || new Date().toISOString()
      }
    })

    return NextResponse.json({
      totalSaved: Number(totalSaved.toFixed(2)),
      packsCompleted,
      albumsUnlocked,
      savingsRank,
      achievements,
      recentSavings
    })

  } catch (error) {
    console.error('Failed to fetch reward data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
