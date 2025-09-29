
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

    // For now, we'll generate notifications based on pack states
    // In a real system, you'd have a notifications table
    const userPacks = await prisma.groupCodePack.findMany({
      where: {
        packMembers: {
          some: {
            userId: user.userId,
            isActive: true
          }
        }
      },
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
        },
        packMembers: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                firstName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const notifications: any[] = []

    // Generate notifications based on pack states
    for (const pack of userPacks) {
      // Cast to any to access the loaded packMembers
      const packWithMembers = pack as any
      const userMember = packWithMembers.packMembers.find((m: any) => m.userId === user.userId)
      const isComplete = pack.currentMembers >= pack.maxMembers
      const isExpiringSoon = pack.expiresAt && 
        new Date(pack.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000 && // 24 hours
        new Date(pack.expiresAt).getTime() > Date.now()

      // Pack complete and ready for redemption
      if (isComplete && userMember && !userMember.hasRedeemed) {
        notifications.push({
          id: `pack-complete-${pack.id}`,
          type: 'redemption_available',
          title: 'Ready to Unlock!',
          message: `Your group pack is complete! Tap to unlock "${packWithMembers.release.title}" now.`,
          packId: pack.id,
          packName: pack.name,
          releaseTitle: packWithMembers.release.title,
          isRead: false,
          createdAt: pack.updatedAt,
          priority: 1
        })
      }
      // Pack expiring soon
      else if (isExpiringSoon && !isComplete) {
        notifications.push({
          id: `pack-expiring-${pack.id}`,
          type: 'pack_expiring',
          title: 'Group Pack Expiring Soon',
          message: `Your group pack expires soon! Share the invite to complete it.`,
          packId: pack.id,
          packName: pack.name,
          releaseTitle: packWithMembers.release.title,
          isRead: false,
          createdAt: pack.updatedAt,
          priority: 2
        })
      }
      // Recent member joined (if pack was updated recently and not by current user)
      else if (
        pack.updatedAt.getTime() > Date.now() - 2 * 60 * 60 * 1000 && // Last 2 hours
        pack.currentMembers > 1 && 
        !isComplete
      ) {
        const latestMember = packWithMembers.packMembers
          .filter((m: any) => m.userId !== user.userId)
          .sort((a: any, b: any) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())[0]
        
        if (latestMember) {
          notifications.push({
            id: `member-joined-${pack.id}-${latestMember.id}`,
            type: 'member_joined',
            title: 'New Member Joined!',
            message: `${latestMember.user.firstName || 'Someone'} joined your group pack. ${pack.maxMembers - pack.currentMembers} more needed.`,
            packId: pack.id,
            packName: pack.name,
            releaseTitle: packWithMembers.release.title,
            isRead: false,
            createdAt: latestMember.joinedAt,
            priority: 3
          })
        }
      }
    }

    // Sort by priority and creation date
    notifications.sort((a: any, b: any) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Limit to most recent 10 notifications
    const limitedNotifications = notifications.slice(0, 10)
    const unreadCount = limitedNotifications.filter((n: any) => !n.isRead).length

    return NextResponse.json({
      notifications: limitedNotifications,
      unreadCount
    })

  } catch (error) {
    console.error('Failed to fetch group pack notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
