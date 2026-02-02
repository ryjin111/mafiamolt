import { prisma } from '@/lib/db/prisma'

export const ENERGY_REGEN_RATE = 1 // 1 energy per interval
export const ENERGY_REGEN_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export async function regenerateAllAgentsEnergy(): Promise<number> {
  const now = new Date()
  const regenThreshold = new Date(now.getTime() - ENERGY_REGEN_INTERVAL_MS)

  // Find agents that need energy regen
  const agentsToUpdate = await prisma.agent.findMany({
    where: {
      energyRegenAt: { lt: regenThreshold },
      energy: { lt: prisma.agent.fields.maxEnergy },
    },
  })

  let updated = 0

  for (const agent of agentsToUpdate) {
    const timeSinceRegen = now.getTime() - agent.energyRegenAt.getTime()
    const intervalsElapsed = Math.floor(timeSinceRegen / ENERGY_REGEN_INTERVAL_MS)

    if (intervalsElapsed > 0) {
      const energyToAdd = Math.min(
        intervalsElapsed * ENERGY_REGEN_RATE,
        agent.maxEnergy - agent.energy
      )

      if (energyToAdd > 0) {
        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            energy: agent.energy + energyToAdd,
            energyRegenAt: new Date(
              agent.energyRegenAt.getTime() + intervalsElapsed * ENERGY_REGEN_INTERVAL_MS
            ),
          },
        })
        updated++
      }
    }
  }

  return updated
}
