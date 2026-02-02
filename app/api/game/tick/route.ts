import { NextResponse } from 'next/server'
import { prisma, regenerateEnergy, calculateLevelFromExp, calculateTotalPower } from '@/lib/db/prisma'

type GameAction = {
  agent: string
  action: string
  result: string
  rewards?: Record<string, string>
}

async function decideAction(agent: {
  id: string
  displayName: string
  level: number
  energy: number
  health: number
  cash: bigint
  respect: number
  familyId: string | null
  persona: string | null
}): Promise<'work' | 'fight' | 'rest' | 'join_family'> {
  // Persona-based behavior weights (matching frontend personas)
  const persona = agent.persona || 'default'

  if (agent.energy < 10) return 'rest'
  if (agent.health < 20) return 'rest'

  // Random decision based on persona
  const roll = Math.random()

  switch (persona) {
    case 'ruthless': // Aggressive fighter
      if (roll < 0.6 && agent.health >= 40) return 'fight'
      return 'work'
    case 'honorable': // Balanced, prefers family
      if (!agent.familyId && roll < 0.4) return 'join_family'
      if (roll < 0.7) return 'work'
      return 'fight'
    case 'chaotic': // Unpredictable
      if (roll < 0.4) return 'fight'
      if (roll < 0.7) return 'work'
      if (!agent.familyId) return 'join_family'
      return 'work'
    case 'silent': // Assassin - works then strikes
      if (roll < 0.5) return 'work'
      if (roll < 0.8 && agent.health >= 50) return 'fight'
      return 'work'
    case 'default':
    default: // Standard mobster
      if (roll < 0.5) return 'work'
      if (roll < 0.75 && agent.health >= 50) return 'fight'
      if (!agent.familyId && roll < 0.9) return 'join_family'
      return 'work'
  }
}

async function executeWork(agent: any): Promise<GameAction> {
  const currentEnergy = await regenerateEnergy(agent)
  
  const jobs = await prisma.job.findMany({
    where: { levelRequired: { lte: agent.level } },
  })
  
  if (jobs.length === 0) {
    return { agent: agent.displayName, action: 'work', result: 'No jobs available' }
  }
  
  const job = jobs[Math.floor(Math.random() * jobs.length)]
  
  if (currentEnergy < job.energyCost) {
    return { agent: agent.displayName, action: 'rest', result: 'Resting to recover energy' }
  }
  
  const levelBonus = (agent.level - job.levelRequired) * 0.05
  const successRate = Math.min(0.95, job.baseSuccessRate + levelBonus)
  const success = Math.random() < successRate
  
  let cashEarned = 0
  let respectEarned = 0
  let expEarned = 0
  
  if (success) {
    cashEarned = Math.floor(Math.random() * (job.cashMax - job.cashMin + 1)) + job.cashMin
    respectEarned = job.respectReward
    expEarned = job.expReward
  } else {
    expEarned = Math.floor(job.expReward * 0.25)
  }
  
  const newExp = agent.experience + expEarned
  const newLevel = calculateLevelFromExp(newExp)
  
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      energy: currentEnergy - job.energyCost,
      cash: { increment: cashEarned },
      respect: { increment: respectEarned },
      experience: newExp,
      level: newLevel,
      lastActive: new Date(),
    },
  })
  
  await prisma.jobHistory.create({
    data: {
      agentId: agent.id,
      jobId: job.id,
      success,
      cashEarned,
      respectEarned,
      expEarned,
    },
  })
  
  return {
    agent: agent.displayName,
    action: 'work',
    result: success ? `Completed "${job.name}"` : `Failed "${job.name}"`,
    rewards: success ? { cash: `+$${cashEarned}`, respect: `+${respectEarned}`, exp: `+${expEarned}` } : { exp: `+${expEarned}` },
  }
}

async function executeFight(agent: any): Promise<GameAction> {
  // Find a random target (not self, wider level range for more fights)
  const targets = await prisma.agent.findMany({
    where: {
      id: { not: agent.id },
      level: { gte: Math.max(1, agent.level - 5), lte: agent.level + 5 },
      health: { gte: 20 }, // Don't attack nearly dead agents
    },
    include: {
      family: true,
      equipment: true,
      crew: true,
    },
    take: 20,
  })
  
  if (targets.length === 0) {
    return { agent: agent.displayName, action: 'fight', result: 'No worthy opponents found' }
  }
  
  const defender = targets[Math.floor(Math.random() * targets.length)]
  
  // Check cooldown
  const cooldown = await prisma.cooldown.findFirst({
    where: {
      agentId: agent.id,
      targetId: defender.id,
      type: 'attack',
      expiresAt: { gt: new Date() },
    },
  })
  
  if (cooldown) {
    return { agent: agent.displayName, action: 'fight', result: `Must wait before attacking ${defender.displayName} again` }
  }
  
  const attackerStats = calculateTotalPower(agent)
  const defenderStats = calculateTotalPower(defender)

  const attackerRoll = attackerStats.attack * (0.8 + Math.random() * 0.4)
  const defenderRoll = defenderStats.defense * (0.8 + Math.random() * 0.4)

  const attackerWins = attackerRoll > defenderRoll
  const cashStolen = attackerWins ? Math.min(Number(defender.cash) * 0.1, 1000) : 0
  const respectChange = attackerWins ? 5 : -2

  await prisma.combat.create({
    data: {
      attackerId: agent.id,
      defenderId: defender.id,
      attackerPower: attackerStats.attack,
      defenderPower: defenderStats.defense,
      winner: attackerWins ? agent.id : defender.id,
      cashStolen: Math.floor(cashStolen),
      respectChange,
    },
  })
  
  if (attackerWins) {
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        cash: { increment: Math.floor(cashStolen) },
        respect: { increment: respectChange },
        health: { decrement: Math.floor(Math.random() * 10) + 5 },
        lastActive: new Date(),
      },
    })
    await prisma.agent.update({
      where: { id: defender.id },
      data: {
        cash: { decrement: Math.floor(cashStolen) },
        respect: { decrement: 3 },
        health: { decrement: Math.floor(Math.random() * 15) + 10 },
      },
    })
  } else {
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        health: { decrement: Math.floor(Math.random() * 20) + 10 },
        respect: { decrement: 2 },
        lastActive: new Date(),
      },
    })
  }
  
  // Set cooldown (3 min cooldown for faster action)
  await prisma.cooldown.upsert({
    where: {
      agentId_targetId_type: {
        agentId: agent.id,
        targetId: defender.id,
        type: 'attack',
      },
    },
    create: {
      agentId: agent.id,
      targetId: defender.id,
      type: 'attack',
      expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3 min cooldown
    },
    update: {
      expiresAt: new Date(Date.now() + 3 * 60 * 1000),
    },
  })
  
  return {
    agent: agent.displayName,
    action: 'fight',
    result: attackerWins ? `Defeated ${defender.displayName}!` : `Lost to ${defender.displayName}`,
    rewards: attackerWins ? { cash: `+$${Math.floor(cashStolen)}`, respect: `+${respectChange}` } : undefined,
  }
}

async function executeJoinFamily(agent: any): Promise<GameAction> {
  const families = await prisma.family.findMany({
    include: { members: { select: { id: true } } },
  })
  
  const availableFamilies = families.filter(f => f.members.length < 10)
  
  if (availableFamilies.length === 0) {
    return { agent: agent.displayName, action: 'social', result: 'No families accepting members' }
  }
  
  const family = availableFamilies[Math.floor(Math.random() * availableFamilies.length)]
  
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      familyId: family.id,
      familyJoinedAt: new Date(),
      lastActive: new Date(),
    },
  })
  
  return {
    agent: agent.displayName,
    action: 'join_family',
    result: `Joined the ${family.name} family!`,
  }
}

export async function GET() {
  try {
    // Get agents who haven't acted in the last 10 seconds (rapid action)
    const tenSecondsAgo = new Date(Date.now() - 10 * 1000)

    const agents = await prisma.agent.findMany({
      where: {
        NOT: {
          lastActive: { gte: tenSecondsAgo },
        },
      },
      include: {
        family: true,
        equipment: true,
        crew: true,
      },
      take: 50, // Process up to 50 agents per tick for more activity
      orderBy: { lastActive: 'asc' },
    })
    
    const actions: GameAction[] = []
    
    for (const agent of agents) {
      try {
        const decision = await decideAction(agent)
        
        let action: GameAction
        switch (decision) {
          case 'work':
            action = await executeWork(agent)
            break
          case 'fight':
            action = await executeFight(agent)
            break
          case 'join_family':
            action = await executeJoinFamily(agent)
            break
          case 'rest':
          default:
            await prisma.agent.update({
              where: { id: agent.id },
              data: { lastActive: new Date() },
            })
            action = { agent: agent.displayName, action: 'rest', result: 'Taking a break...' }
        }
        
        actions.push(action)
      } catch (err) {
        console.error(`Error processing agent ${agent.id}:`, err)
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: agents.length,
      actions,
    })
  } catch (error) {
    console.error('Game tick error:', error)
    return NextResponse.json({ success: false, error: 'Tick failed' }, { status: 500 })
  }
}
