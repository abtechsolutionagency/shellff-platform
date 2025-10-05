
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

    const { achievementId } = await request.json()

    if (!achievementId) {
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 })
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // In a real implementation, you would:
    // 1. Verify the achievement is earned and not already claimed
    // 2. Record the claim in a user_achievements table
    // 3. Award any associated rewards (SHC, badges, etc.)

    // For now, we'll simulate the claim process
    console.log(`User ${user.id} claimed achievement: ${achievementId}`)

    // You could award SHC rewards here
    // await prisma.user.update({
    //   where: { userId: user.userId },
    //   data: { shcBalance: { increment: rewardAmount } }
    // })

    return NextResponse.json({
      message: 'Achievement claimed successfully!',
      achievementId
    })

  } catch (error) {
    console.error('Failed to claim achievement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
