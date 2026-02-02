import { prisma, AgentWithRelations, calculateTotalPower } from '@/lib/db/prisma'

export const ATTACK_ENERGY_COST = 10
export const ATTACK_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour
export const CASH_STEAL_PERCENTAGE = 0.1 // 10%
export const RESPECT_WIN = 5
export const RESPECT_LOSS = 3
export const HEALTH_LOSS = 20
export const RANDOMNESS_FACTOR = 0.1 // ±10%

export interface CombatResult {
  winner: 'attacker' | 'defender'
  attackerPower: number
  defenderPower: number
  cashStolen: number
  attackerRespectChange: number
  defenderRespectChange: number
  attackerHealthChange: number
  defenderHealthChange: number
}

export function calculateCombat(
  attacker: AgentWithRelations,
  defender: AgentWithRelations
): CombatResult {
  const attackerPower = calculateTotalPower(attacker)
  const defenderPower = calculateTotalPower(defender)

  // Add randomness (±10%)
  const attackerRoll =
    attackerPower.attack * (1 + (Math.random() - 0.5) * 2 * RANDOMNESS_FACTOR)
  const defenderRoll =
    defenderPower.defense * (1 + (Math.random() - 0.5) * 2 * RANDOMNESS_FACTOR)

  const attackerWins = attackerRoll > defenderRoll

  // Calculate cash stolen (10% of defender's cash if attacker wins)
  const cashStolen = attackerWins
    ? Math.floor(Number(defender.cash) * CASH_STEAL_PERCENTAGE)
    : 0

  return {
    winner: attackerWins ? 'attacker' : 'defender',
    attackerPower: Math.round(attackerRoll),
    defenderPower: Math.round(defenderRoll),
    cashStolen,
    attackerRespectChange: attackerWins ? RESPECT_WIN : -RESPECT_LOSS,
    defenderRespectChange: attackerWins ? -RESPECT_LOSS : RESPECT_WIN,
    attackerHealthChange: attackerWins ? 0 : -HEALTH_LOSS,
    defenderHealthChange: attackerWins ? -HEALTH_LOSS : 0,
  }
}

export async function canAttack(
  attackerId: string,
  defenderId: string
): Promise<{ canAttack: boolean; reason?: string; cooldownExpires?: Date }> {
  // Can't attack self
  if (attackerId === defenderId) {
    return { canAttack: false, reason: 'Cannot attack yourself' }
  }

  // Check if same family
  const [attacker, defender] = await Promise.all([
    prisma.agent.findUnique({ where: { id: attackerId }, select: { familyId: true } }),
    prisma.agent.findUnique({ where: { id: defenderId }, select: { familyId: true } }),
  ])

  if (attacker?.familyId && attacker.familyId === defender?.familyId) {
    return { canAttack: false, reason: 'Cannot attack family members' }
  }

  // Check cooldown
  const cooldown = await prisma.cooldown.findUnique({
    where: {
      agentId_targetId_type: {
        agentId: attackerId,
        targetId: defenderId,
        type: 'attack',
      },
    },
  })

  if (cooldown && cooldown.expiresAt > new Date()) {
    return {
      canAttack: false,
      reason: 'On cooldown',
      cooldownExpires: cooldown.expiresAt,
    }
  }

  return { canAttack: true }
}

export async function setCooldown(
  agentId: string,
  targetId: string,
  type: string,
  durationMs: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + durationMs)

  await prisma.cooldown.upsert({
    where: {
      agentId_targetId_type: {
        agentId,
        targetId,
        type,
      },
    },
    update: { expiresAt },
    create: {
      agentId,
      targetId,
      type,
      expiresAt,
    },
  })
}
