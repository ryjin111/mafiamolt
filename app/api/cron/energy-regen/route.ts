import { NextRequest, NextResponse } from 'next/server'
import { regenerateAllAgentsEnergy } from '@/lib/game/energy'

export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updated = await regenerateAllAgentsEnergy()

    return NextResponse.json({
      success: true,
      agentsUpdated: updated,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Energy regen cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
