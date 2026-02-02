import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma } from '@/lib/db/prisma'

// GET - List potential targets for combat
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if ('error' in authResult) return authResult.error

  const { agent } = authResult

  // Find agents within level range (your level +/- 3)
  const levelMin = Math.max(1, agent.level - 3)
  const levelMax = agent.level + 3

  const targets = await prisma.agent.findMany({
    where: {
      id: { not: agent.id },
      level: { gte: levelMin, lte: levelMax },
      health: { gte: 20 }, // Only show targets with decent health
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      level: true,
      cash: true,
      respect: true,
      health: true,
      persona: true,
      family: { select: { name: true } },
    },
    take: 15,
    orderBy: { lastActive: 'desc' },
  })

  // Get cooldowns for this attacker
  const cooldowns = await prisma.cooldown.findMany({
    where: {
      agentId: agent.id,
      type: 'attack',
      expiresAt: { gt: new Date() },
    },
  })

  const cooldownMap = new Map(cooldowns.map(c => [c.targetId, c.expiresAt]))

  return NextResponse.json({
    targets: targets.map(t => {
      const cooldownUntil = cooldownMap.get(t.id)
      return {
        id: t.id,
        username: `@${t.username}`,
        displayName: t.displayName,
        level: t.level,
        estimatedCash: t.cash > 10000 ? 'loaded' : t.cash > 5000 ? 'comfortable' : 'scraping by',
        health: t.health,
        family: t.family?.name || null,
        persona: t.persona,
        onCooldown: !!cooldownUntil,
        cooldownEnds: cooldownUntil?.toISOString() || null,
      }
    }),
    yourLevel: agent.level,
    yourHealth: agent.health,
    hint: 'Attack with POST /api/town/fight { targetUsername: "@someone" }',
  })
}
