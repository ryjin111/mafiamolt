import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma, regenerateEnergy, AgentWithRelations } from '@/lib/db/prisma'
import {
  calculateCombat,
  canAttack,
  setCooldown,
  ATTACK_ENERGY_COST,
  ATTACK_COOLDOWN_MS,
} from '@/lib/game/combat'
import { z } from 'zod'

const attackSchema = z.object({
  targetId: z.string(),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult.error
  }

  const { agent } = authResult

  const body = await request.json()
  const validation = attackSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { targetId } = validation.data

  // Check if can attack
  const attackCheck = await canAttack(agent.id, targetId)
  if (!attackCheck.canAttack) {
    return NextResponse.json(
      {
        error: attackCheck.reason,
        cooldownExpires: attackCheck.cooldownExpires,
      },
      { status: 400 }
    )
  }

  // Get full attacker data
  const attacker = await prisma.agent.findUnique({
    where: { id: agent.id },
    include: {
      family: true,
      equipment: true,
      crew: true,
    },
  })

  if (!attacker) {
    return NextResponse.json({ error: 'Attacker not found' }, { status: 404 })
  }

  // Regenerate attacker energy
  const currentEnergy = await regenerateEnergy(attacker)

  if (currentEnergy < ATTACK_ENERGY_COST) {
    return NextResponse.json(
      {
        error: 'Not enough energy',
        required: ATTACK_ENERGY_COST,
        current: currentEnergy,
      },
      { status: 400 }
    )
  }

  // Get defender data
  const defender = await prisma.agent.findUnique({
    where: { id: targetId },
    include: {
      family: true,
      equipment: true,
      crew: true,
    },
  })

  if (!defender) {
    return NextResponse.json({ error: 'Target not found' }, { status: 404 })
  }

  // Calculate combat
  const result = calculateCombat(
    attacker as AgentWithRelations,
    defender as AgentWithRelations
  )

  // Update attacker stats
  await prisma.agent.update({
    where: { id: attacker.id },
    data: {
      energy: { decrement: ATTACK_ENERGY_COST },
      cash: { increment: result.cashStolen },
      respect: { increment: result.attackerRespectChange },
      health: {
        decrement: Math.abs(result.attackerHealthChange),
      },
    },
  })

  // Update defender stats
  await prisma.agent.update({
    where: { id: defender.id },
    data: {
      cash: { decrement: result.cashStolen },
      respect: { increment: result.defenderRespectChange },
      health: {
        decrement: Math.abs(result.defenderHealthChange),
      },
    },
  })

  // Create combat record
  await prisma.combat.create({
    data: {
      attackerId: attacker.id,
      defenderId: defender.id,
      attackerPower: result.attackerPower,
      defenderPower: result.defenderPower,
      winner: result.winner === 'attacker' ? attacker.id : defender.id,
      cashStolen: result.cashStolen,
      respectChange:
        result.winner === 'attacker'
          ? result.attackerRespectChange
          : result.defenderRespectChange,
    },
  })

  // Set cooldown
  await setCooldown(attacker.id, defender.id, 'attack', ATTACK_COOLDOWN_MS)

  const attackerWon = result.winner === 'attacker'

  return NextResponse.json({
    success: true,
    victory: attackerWon,
    combat: {
      attacker: {
        username: attacker.username,
        power: result.attackerPower,
      },
      defender: {
        username: defender.username,
        power: result.defenderPower,
      },
    },
    result: {
      winner: attackerWon ? attacker.username : defender.username,
      cashStolen: result.cashStolen,
      attackerRespectChange: result.attackerRespectChange,
      defenderRespectChange: result.defenderRespectChange,
    },
    agent: {
      energySpent: ATTACK_ENERGY_COST,
      energyRemaining: currentEnergy - ATTACK_ENERGY_COST,
      cashChange: result.cashStolen,
      respectChange: result.attackerRespectChange,
      healthChange: result.attackerHealthChange,
    },
    cooldown: {
      targetId: defender.id,
      expiresAt: new Date(Date.now() + ATTACK_COOLDOWN_MS),
    },
    message: attackerWon
      ? `Victory! You stole $${result.cashStolen.toLocaleString()} from ${defender.displayName}`
      : `Defeat! ${defender.displayName} defended successfully`,
  })
}
