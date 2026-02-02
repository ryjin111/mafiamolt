import { PrismaClient, Agent } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export type AgentWithRelations = Agent & {
  family?: { attackBonus: number; defenseBonus: number } | null
  equipment: { attackBonus: number; defenseBonus: number; equipped: boolean }[]
  crew: { attackBonus: number; defenseBonus: number }[]
}

export async function getAgent(id: string) {
  return prisma.agent.findUnique({
    where: { id },
    include: {
      family: true,
      equipment: true,
      crew: true,
      properties: true,
    },
  })
}

export async function getAgentByApiKey(apiKey: string) {
  return prisma.agent.findUnique({
    where: { apiKey },
    include: {
      family: true,
      equipment: true,
      crew: true,
      properties: true,
    },
  })
}

export async function updateAgentStats(
  id: string,
  stats: Partial<{
    level: number
    experience: number
    cash: bigint
    respect: number
    energy: number
    health: number
    baseAttack: number
    baseDefense: number
  }>
) {
  return prisma.agent.update({
    where: { id },
    data: {
      ...stats,
      lastActive: new Date(),
    },
  })
}

const ENERGY_REGEN_RATE = 1 // 1 energy per 5 minutes
const ENERGY_REGEN_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes in ms

export async function regenerateEnergy(agent: Agent): Promise<number> {
  const now = new Date()
  const timeSinceRegen = now.getTime() - agent.energyRegenAt.getTime()
  const intervalsElapsed = Math.floor(timeSinceRegen / ENERGY_REGEN_INTERVAL_MS)

  if (intervalsElapsed <= 0 || agent.energy >= agent.maxEnergy) {
    return agent.energy
  }

  const energyToAdd = Math.min(
    intervalsElapsed * ENERGY_REGEN_RATE,
    agent.maxEnergy - agent.energy
  )

  const newEnergy = agent.energy + energyToAdd

  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      energy: newEnergy,
      energyRegenAt: new Date(
        agent.energyRegenAt.getTime() + intervalsElapsed * ENERGY_REGEN_INTERVAL_MS
      ),
    },
  })

  return newEnergy
}

export async function collectPassiveIncome(agentId: string): Promise<number> {
  const properties = await prisma.property.findMany({
    where: { ownerId: agentId },
  })

  const now = new Date()
  let totalIncome = 0

  for (const property of properties) {
    const hoursSinceCollection =
      (now.getTime() - property.lastIncome.getTime()) / (1000 * 60 * 60)

    if (hoursSinceCollection >= 1) {
      const fullHours = Math.floor(hoursSinceCollection)
      const income = fullHours * property.incomePerHour
      totalIncome += income

      await prisma.property.update({
        where: { id: property.id },
        data: {
          lastIncome: new Date(
            property.lastIncome.getTime() + fullHours * 60 * 60 * 1000
          ),
        },
      })
    }
  }

  if (totalIncome > 0) {
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        cash: { increment: totalIncome },
      },
    })
  }

  return totalIncome
}

export function calculateTotalPower(agent: AgentWithRelations): {
  attack: number
  defense: number
} {
  let attack = agent.baseAttack
  let defense = agent.baseDefense

  // Add equipped equipment bonuses
  for (const equip of agent.equipment) {
    if (equip.equipped) {
      attack += equip.attackBonus
      defense += equip.defenseBonus
    }
  }

  // Add crew bonuses
  for (const crew of agent.crew) {
    attack += crew.attackBonus
    defense += crew.defenseBonus
  }

  // Add family bonuses
  if (agent.family) {
    attack += agent.family.attackBonus
    defense += agent.family.defenseBonus
  }

  return { attack, defense }
}

export function calculateLevelFromExp(experience: number): number {
  // Level formula: level = floor(sqrt(experience / 100)) + 1
  return Math.floor(Math.sqrt(experience / 100)) + 1
}

export function expRequiredForLevel(level: number): number {
  // Inverse of above formula
  return (level - 1) ** 2 * 100
}
