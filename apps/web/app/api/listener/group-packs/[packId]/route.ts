
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

    // Find the group pack and verify user has access
    const pack = await prisma.groupCodePack.findUnique({
      where: { id: packId },
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
        },
        packMembers: {
          include: {
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        }
      }
    })

    if (!pack) {
      return NextResponse.json({ error: 'Group pack not found' }, { status: 404 })
    }

    // Check if user is a member - need to access the loaded packMembers
    const packWithMembers = pack as any
    const userMember = packWithMembers.packMembers.find((member: any) => member.userId === user.userId)
    if (!userMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(pack)

  } catch (error) {
    console.error('Failed to fetch group pack details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
