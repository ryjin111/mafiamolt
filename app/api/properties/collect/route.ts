import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { collectPassiveIncome } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult.error
  }

  const { agent } = authResult

  const totalCollected = await collectPassiveIncome(agent.id)

  return NextResponse.json({
    success: true,
    collected: totalCollected,
    message: totalCollected > 0
      ? `Collected $${totalCollected.toLocaleString()} from your properties`
      : 'No income ready to collect yet',
  })
}
