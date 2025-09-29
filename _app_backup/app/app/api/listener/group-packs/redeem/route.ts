
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packId } = await request.json()

    if (!packId) {
      return NextResponse.json({ error: 'Pack ID is required' }, { status: 400 })
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the group pack and verify user is a member
    const pack = await prisma.groupCodePack.findUnique({
      where: { id: packId },
      include: {
        packMembers: {
          where: { userId: user.userId }
        },
        release: true
      }
    })

    if (!pack) {
      return NextResponse.json({ error: 'Group pack not found' }, { status: 404 })
    }

    const userMember = pack.packMembers[0]
    if (!userMember) {
      return NextResponse.json({ error: 'You are not a member of this pack' }, { status: 403 })
    }

    if (userMember.hasRedeemed) {
      return NextResponse.json({ error: 'You have already redeemed your code' }, { status: 400 })
    }

    // Check if pack is complete
    if (pack.currentMembers < pack.maxMembers) {
      return NextResponse.json({ error: 'Group pack is not yet complete' }, { status: 400 })
    }

    // Check if pack is expired
    if (pack.expiresAt && new Date(pack.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This group pack has expired' }, { status: 400 })
    }

    // Find the unlock code for this pack (since codes are now pack-specific)
    const unlockCode = await prisma.unlockCode.findFirst({
      where: {
        groupPackId: packId,
        status: 'unused'
      }
    })

    if (!unlockCode) {
      return NextResponse.json({ error: 'No unlock code available for this pack' }, { status: 404 })
    }

    // Start transaction to redeem the code
    const result = await prisma.$transaction(async (tx) => {
      // Mark the unlock code as used
      await tx.unlockCode.update({
        where: { id: unlockCode.id },
        data: { 
          status: 'redeemed',
          redeemedBy: user.userId,
          redeemedAt: new Date()
        }
      })

      // Update pack member as redeemed
      await tx.packMember.update({
        where: { id: userMember.id },
        data: {
          hasRedeemed: true,
          redeemedAt: new Date(),
          redeemedCodeId: unlockCode.id
        }
      })

      // Add the release to user's purchases
      const existingPurchase = await tx.purchase.findFirst({
        where: {
          userId: user.userId,
          albumId: pack.releaseId
        }
      })

      if (!existingPurchase) {
        await tx.purchase.create({
          data: {
            userId: user.userId,
            type: 'ALBUM',
            albumId: pack.releaseId,
            price: Number(pack.discountedPrice) / pack.maxMembers, // Price per member
            currency: 'SHC',
            status: 'COMPLETED'
          }
        })
      }

      // Create redemption log
      await tx.codeRedemptionLog.create({
        data: {
          codeId: unlockCode.id,
          userId: user.userId,
          success: true
        }
      })

      return { success: true }
    })

    // Check if all members have redeemed (for completion tracking)
    const completedMembers = await prisma.packMember.count({
      where: {
        packId: packId,
        hasRedeemed: true
      }
    })

    if (completedMembers === pack.maxMembers) {
      // All members have redeemed - could trigger completion notifications
      console.log('All group members have redeemed their codes')
    }

    return NextResponse.json({
      message: 'Album unlocked successfully!',
      releaseId: pack.releaseId,
      releaseTitle: pack.release?.title
    })

  } catch (error) {
    console.error('Failed to redeem group code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
