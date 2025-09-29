
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

    const { inviteCode } = await request.json()

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    // Find the pack member with this invite code
    const packMember = await prisma.packMember.findUnique({
      where: { inviteCode },
      include: {
        pack: {
          include: {
            packMembers: true
          }
        }
      }
    })

    if (!packMember) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    if (!packMember.pack.isActive) {
      return NextResponse.json({ error: 'This group pack is no longer active' }, { status: 400 })
    }

    // Check if pack is expired
    if (packMember.pack.expiresAt && new Date(packMember.pack.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This group pack has expired' }, { status: 400 })
    }

    // Check if pack is already full
    if (packMember.pack.currentMembers >= packMember.pack.maxMembers) {
      return NextResponse.json({ error: 'This group pack is already full' }, { status: 400 })
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already a member of this pack
    const existingMember = await prisma.packMember.findUnique({
      where: {
        packId_userId: {
          packId: packMember.packId,
          userId: user.userId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'You are already a member of this pack' }, { status: 400 })
    }

    // Add user to the pack by updating the existing pack member record
    await prisma.packMember.update({
      where: { id: packMember.id },
      data: {
        userId: user.userId,
        isActive: true
      }
    })

    // Update the pack's current member count
    await prisma.groupCodePack.update({
      where: { id: packMember.packId },
      data: {
        currentMembers: {
          increment: 1
        }
      }
    })

    // If pack is now complete, create unlock codes for all members
    const updatedPack = await prisma.groupCodePack.findUnique({
      where: { id: packMember.packId },
      include: {
        packMembers: {
          where: { isActive: true }
        }
      }
    })

    if (updatedPack && updatedPack.currentMembers >= updatedPack.maxMembers) {
      // Generate unlock codes for each active member
      for (const member of updatedPack.packMembers) {
        if (member.userId) {
          // Check if code already exists
          const existingCode = await prisma.unlockCode.findFirst({
            where: {
              releaseId: updatedPack.releaseId,
              groupPackId: updatedPack.id,
              redeemedBy: member.userId
            }
          })

          if (!existingCode) {
            await prisma.unlockCode.create({
              data: {
                code: `GRP-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                releaseId: updatedPack.releaseId,
                creatorId: updatedPack.creatorId,
                groupPackId: updatedPack.id,
                status: 'unused'
              }
            })
          }
        }
      }

      // Send notifications to all members that the pack is complete
      // This would be implemented with your notification system
      console.log('Group pack completed, notifications would be sent here')
    }

    return NextResponse.json({
      message: 'Successfully joined the group pack',
      packId: packMember.packId
    })

  } catch (error) {
    console.error('Failed to join group pack:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
