
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

    // Get all group packs where the user is a member
    const userPacks = await prisma.groupCodePack.findMany({
      where: {
        packMembers: {
          some: {
            user: {
              email: session.user.email
            }
          }
        }
      },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(userPacks)

  } catch (error) {
    console.error('Failed to fetch user group packs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
