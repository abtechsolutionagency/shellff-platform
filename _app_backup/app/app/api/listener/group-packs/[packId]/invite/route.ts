
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { packId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packId } = params

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
        }
      }
    })

    if (!pack) {
      return NextResponse.json({ error: 'Group pack not found' }, { status: 404 })
    }

    if (pack.packMembers.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!pack.isActive) {
      return NextResponse.json({ error: 'This group pack is no longer active' }, { status: 400 })
    }

    if (pack.currentMembers >= pack.maxMembers) {
      return NextResponse.json({ error: 'This group pack is already full' }, { status: 400 })
    }

    // Check if pack is expired
    if (pack.expiresAt && new Date(pack.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This group pack has expired' }, { status: 400 })
    }

    // Find an available slot (pack member without userId assigned)
    const availableSlot = await prisma.packMember.findFirst({
      where: {
        packId: packId,
        userId: { equals: null as any }, // Available slot
        inviteCode: { not: null }
      }
    })

    if (!availableSlot) {
      return NextResponse.json({ error: 'No available invite slots' }, { status: 400 })
    }

    // Generate invite link using the available slot's invite code
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/join-group?code=${availableSlot.inviteCode}`

    return NextResponse.json({ 
      inviteLink,
      inviteCode: availableSlot.inviteCode 
    })

  } catch (error) {
    console.error('Failed to generate invite link:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
