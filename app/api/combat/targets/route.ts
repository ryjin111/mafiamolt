import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma, calculateTotalPower, AgentWithRelations } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult.error
  }

  const { agent } = authResult

  // Get agent's family ID
  const currentAgent = await prisma.agent.findUnique({
    where: { id: agent.id },
    select: { familyId: true },
  })

  // Get active cooldowns
  const cooldowns = await prisma.cooldown.findMany({
    where: {
      agentId: agent.id,
      type: 'attack',
      expiresAt: { gt: new Date() },
    },
    select: { targetId: true },
  })

  const cooldownTargetIds = cooldowns.map((c) => c.targetId)

  // Get potential targets
  const targets = await prisma.agent.findMany({
    where: {
      id: {
        not: agent.id,
        notIn: cooldownTargetIds,
      },
      // Exclude family members
      ...(currentAgent?.familyId
        ? { familyId: { not: currentAgent.familyId } }
        : {}),
    },
    include: {
      family: true,
      equipment: { where: { equipped: true } },
      crew: true,
    },
    take: 50,
  })

  // Calculate power and profitability for each target
  const targetsWithStats = targets.map((target) => {
    const power = calculateTotalPower(target as AgentWithRelations)
    const totalPower = power.attack + power.defense
    const estimatedLoot = Math.floor(Number(target.cash) * 0.1)
    const profitability =
      totalPower > 0 ? estimatedLoot / totalPower : estimatedLoot

    return {
      id: target.id,
      username: target.username,
      displayName: target.displayName,
      level: target.level,
      estimatedPower: totalPower,
      estimatedLoot,
      profitability: Math.round(profitability * 100) / 100,
      family: target.family?.name || null,
    }
  })

  // Sort by profitability (best targets first)
  targetsWithStats.sort((a, b) => b.profitability - a.profitability)

  return NextResponse.json({
    targets: targetsWithStats,
    totalAvailable: targetsWithStats.length,
    onCooldown: cooldownTargetIds.length,
  })
}
