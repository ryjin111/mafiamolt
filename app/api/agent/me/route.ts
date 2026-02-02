import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import {
  prisma,
  regenerateEnergy,
  calculateTotalPower,
  AgentWithRelations,
} from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult.error
  }

  const { agent } = authResult

  // Get full agent with relations
  const fullAgent = await prisma.agent.findUnique({
    where: { id: agent.id },
    include: {
      family: true,
      equipment: true,
      crew: true,
      properties: true,
    },
  })

  if (!fullAgent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // Regenerate energy before returning stats
  const currentEnergy = await regenerateEnergy(fullAgent)

  // Calculate total power
  const power = calculateTotalPower(fullAgent as AgentWithRelations)

  // Get active cooldowns
  const cooldowns = await prisma.cooldown.findMany({
    where: {
      agentId: agent.id,
      expiresAt: { gt: new Date() },
    },
  })

  // Get recent job history
  const recentJobs = await prisma.jobHistory.findMany({
    where: { agentId: agent.id },
    orderBy: { timestamp: 'desc' },
    take: 10,
    include: { job: { select: { name: true, category: true } } },
  })

  // Get recent combat history
  const recentCombat = await prisma.combat.findMany({
    where: {
      OR: [{ attackerId: agent.id }, { defenderId: agent.id }],
    },
    orderBy: { timestamp: 'desc' },
    take: 10,
  })

  // Calculate property income
  const propertyIncome = fullAgent.properties.reduce(
    (sum, p) => sum + p.incomePerHour,
    0
  )

  // Calculate crew upkeep
  const crewUpkeep = fullAgent.crew.reduce((sum, c) => sum + c.upkeepCost, 0)

  return NextResponse.json({
    agent: {
      id: fullAgent.id,
      username: fullAgent.username,
      displayName: fullAgent.displayName,
      walletAddress: fullAgent.walletAddress,
      persona: fullAgent.persona,

      // Core stats
      level: fullAgent.level,
      experience: fullAgent.experience,
      cash: fullAgent.cash.toString(), // BigInt to string for JSON
      respect: fullAgent.respect,

      // Resources
      energy: currentEnergy,
      maxEnergy: fullAgent.maxEnergy,
      health: fullAgent.health,
      maxHealth: fullAgent.maxHealth,

      // Combat power (base + bonuses)
      baseAttack: fullAgent.baseAttack,
      baseDefense: fullAgent.baseDefense,
      totalAttack: power.attack,
      totalDefense: power.defense,
      totalPower: power.attack + power.defense,

      // Timestamps
      createdAt: fullAgent.createdAt,
      lastActive: fullAgent.lastActive,
    },

    // Relations
    family: fullAgent.family
      ? {
          id: fullAgent.family.id,
          name: fullAgent.family.name,
          level: fullAgent.family.level,
          attackBonus: fullAgent.family.attackBonus,
          defenseBonus: fullAgent.family.defenseBonus,
        }
      : null,

    equipment: fullAgent.equipment.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      rarity: e.rarity,
      attackBonus: e.attackBonus,
      defenseBonus: e.defenseBonus,
      equipped: e.equipped,
      durability: e.durability,
    })),

    crew: fullAgent.crew.map((c) => ({
      id: c.id,
      name: c.name,
      specialty: c.specialty,
      attackBonus: c.attackBonus,
      defenseBonus: c.defenseBonus,
      upkeepCost: c.upkeepCost,
    })),

    properties: fullAgent.properties.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      city: p.city,
      level: p.level,
      incomePerHour: p.incomePerHour,
      lastIncome: p.lastIncome,
    })),

    // Economics
    economics: {
      propertyIncomePerHour: propertyIncome,
      crewUpkeepPerDay: crewUpkeep,
      netIncomePerDay: propertyIncome * 24 - crewUpkeep,
    },

    // Activity
    cooldowns: cooldowns.map((c) => ({
      targetId: c.targetId,
      type: c.type,
      expiresAt: c.expiresAt,
    })),

    recentJobs: recentJobs.map((j) => ({
      jobName: j.job.name,
      category: j.job.category,
      success: j.success,
      cashEarned: j.cashEarned,
      timestamp: j.timestamp,
    })),

    recentCombat: recentCombat.map((c) => ({
      wasAttacker: c.attackerId === agent.id,
      won: c.winner === agent.id,
      cashStolen: c.cashStolen,
      respectChange: c.respectChange,
      timestamp: c.timestamp,
    })),
  })
}
