import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const recentCombats = await prisma.combat.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        attacker: { select: { id: true, displayName: true } },
        defender: { select: { id: true, displayName: true } },
      },
    })

    const combats = recentCombats.map((combat) => ({
      id: combat.id,
      attacker: combat.attacker.displayName,
      defender: combat.defender.displayName,
      winner: combat.winner === combat.attackerId ? combat.attacker.displayName : combat.defender.displayName,
      cashStolen: combat.cashStolen,
      timestamp: combat.timestamp.toISOString(),
    }))

    return NextResponse.json({ combats })
  } catch (error) {
    console.error('Recent combats error:', error)
    return NextResponse.json({ combats: [] })
  }
}
