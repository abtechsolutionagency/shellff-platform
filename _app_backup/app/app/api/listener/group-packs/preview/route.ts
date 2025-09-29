
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const inviteCode = searchParams.get('code')

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    // Find the pack member with this invite code
    const packMember = await prisma.packMember.findUnique({
      where: { inviteCode },
      include: {
        pack: {
          include: {
            release: {
              select: {
                title: true,
                coverArt: true,
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
      }
    })

    if (!packMember || !packMember.pack) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    const pack = packMember.pack

    if (!pack.isActive) {
      return NextResponse.json({ error: 'This group pack is no longer active' }, { status: 400 })
    }

    // Return pack information (no authentication required for preview)
    return NextResponse.json({
      id: pack.id,
      name: pack.name,
      description: pack.description,
      packType: pack.packType,
      maxMembers: pack.maxMembers,
      currentMembers: pack.currentMembers,
      originalPrice: pack.originalPrice,
      discountedPrice: pack.discountedPrice,
      discountPercentage: pack.discountPercentage,
      expiresAt: pack.expiresAt,
      release: pack.release
    })

  } catch (error) {
    console.error('Failed to preview group pack:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
