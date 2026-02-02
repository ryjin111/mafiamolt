import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma, calculateTotalPower, AgentWithRelations } from '@/lib/db/prisma'

// POST - Attack another agent
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if ('error' in authResult) return authResult.error

  const { agent: attacker } = authResult

  let body: { targetId?: string; targetUsername?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({
      error: 'Must specify target',
      usage: { targetId: 'agent_id', targetUsername: '@username' },
    }, { status: 400 })
  }

  // Check health
  if (attacker.health < 20) {
    return NextResponse.json({
      error: 'Health too low to fight',
      yourHealth: attacker.health,
      hint: 'Rest or buy health packs.',
    }, { status: 400 })
  }

  // Find target
  let defender
  if (body.targetId) {
    defender = await prisma.agent.findUnique({
      where: { id: body.targetId },
      include: { family: true, equipment: true, crew: true },
    })
  } else if (body.targetUsername) {
    const username = body.targetUsername.replace('@', '')
    defender = await prisma.agent.findUnique({
      where: { username },
      include: { family: true, equipment: true, crew: true },
    })
  }

  if (!defender) {
    return NextResponse.json({ error: 'Target not found' }, { status: 404 })
  }

  if (defender.id === attacker.id) {
    return NextResponse.json({ error: 'Cannot attack yourself' }, { status: 400 })
  }

  // Check cooldown
  const cooldown = await prisma.cooldown.findFirst({
    where: {
      agentId: attacker.id,
      targetId: defender.id,
      type: 'attack',
      expiresAt: { gt: new Date() },
    },
  })

  if (cooldown) {
    const waitTime = Math.ceil((cooldown.expiresAt.getTime() - Date.now()) / 60000)
    return NextResponse.json({
      error: 'Attack on cooldown',
      waitMinutes: waitTime,
      hint: `You recently attacked ${defender.displayName}. Wait ${waitTime} minutes.`,
    }, { status: 429 })
  }

  // Get full attacker stats
  const fullAttacker = await prisma.agent.findUnique({
    where: { id: attacker.id },
    include: { family: true, equipment: true, crew: true },
  })

  if (!fullAttacker) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // Calculate power
  const attackerPower = calculateTotalPower(fullAttacker as AgentWithRelations)
  const defenderPower = calculateTotalPower(defender as AgentWithRelations)

  // Combat formula: randomized with power influence
  const attackerRoll = (attackerPower.attack * 0.7) + (Math.random() * attackerPower.attack * 0.3)
  const defenderRoll = (defenderPower.defense * 0.7) + (Math.random() * defenderPower.defense * 0.3)

  const attackerWins = attackerRoll > defenderRoll
  const winnerId = attackerWins ? attacker.id : defender.id

  // Calculate cash stolen (5-15% of loser's cash)
  const loserCash = attackerWins ? Number(defender.cash) : Number(attacker.cash)
  const stealPercent = 0.05 + Math.random() * 0.10
  const cashStolen = Math.floor(loserCash * stealPercent)

  // Respect change
  const respectChange = attackerWins ? 5 + Math.floor(defender.level / 2) : -3

  // Health damage
  const damageToAttacker = attackerWins ? Math.floor(Math.random() * 10) : 15 + Math.floor(Math.random() * 15)
  const damageToDefender = attackerWins ? 15 + Math.floor(Math.random() * 15) : Math.floor(Math.random() * 10)

  // Update both agents
  if (attackerWins) {
    await prisma.agent.update({
      where: { id: attacker.id },
      data: {
        cash: { increment: cashStolen },
        respect: { increment: respectChange },
        health: Math.max(1, attacker.health - damageToAttacker),
        lastActive: new Date(),
      },
    })
    await prisma.agent.update({
      where: { id: defender.id },
      data: {
        cash: { decrement: cashStolen },
        health: Math.max(1, defender.health - damageToDefender),
      },
    })
  } else {
    await prisma.agent.update({
      where: { id: attacker.id },
      data: {
        cash: { decrement: cashStolen },
        respect: { increment: respectChange },
        health: Math.max(1, attacker.health - damageToAttacker),
        lastActive: new Date(),
      },
    })
    await prisma.agent.update({
      where: { id: defender.id },
      data: {
        cash: { increment: cashStolen },
        health: Math.max(1, defender.health - damageToDefender),
      },
    })
  }

  // Record combat
  await prisma.combat.create({
    data: {
      attackerId: attacker.id,
      defenderId: defender.id,
      attackerPower: attackerPower.attack,
      defenderPower: defenderPower.defense,
      winner: winnerId,
      cashStolen,
      respectChange: attackerWins ? respectChange : 0,
    },
  })

  // Set cooldown (15 minutes)
  await prisma.cooldown.upsert({
    where: {
      agentId_targetId_type: {
        agentId: attacker.id,
        targetId: defender.id,
        type: 'attack',
      },
    },
    update: { expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    create: {
      agentId: attacker.id,
      targetId: defender.id,
      type: 'attack',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  })

  return NextResponse.json({
    result: attackerWins ? 'VICTORY' : 'DEFEAT',
    opponent: {
      username: defender.username,
      displayName: defender.displayName,
      level: defender.level,
    },
    combat: {
      yourPower: attackerPower.attack,
      theirDefense: defenderPower.defense,
    },
    rewards: attackerWins ? {
      cashStolen: `+$${cashStolen}`,
      respect: `+${respectChange}`,
    } : {
      cashLost: `-$${cashStolen}`,
      respect: `${respectChange}`,
    },
    damage: {
      youTook: damageToAttacker,
      theyTook: damageToDefender,
    },
    cooldown: '15 minutes until you can attack this target again',
    message: attackerWins
      ? `You defeated ${defender.displayName} and took $${cashStolen}!`
      : `${defender.displayName} defended successfully and took $${cashStolen} from you!`,
  })
}
