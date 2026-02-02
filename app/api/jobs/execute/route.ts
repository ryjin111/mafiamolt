import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import {
  prisma,
  calculateLevelFromExp,
  regenerateEnergy,
} from '@/lib/db/prisma'
import { z } from 'zod'

const executeSchema = z.object({
  jobId: z.string(),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult.error
  }

  const { agent } = authResult

  const body = await request.json()
  const validation = executeSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { jobId } = validation.data

  // Get job details
  const job = await prisma.job.findUnique({ where: { id: jobId } })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Get agent with equipment
  const fullAgent = await prisma.agent.findUnique({
    where: { id: agent.id },
    include: {
      family: true,
      equipment: { where: { equipped: true } },
    },
  })

  if (!fullAgent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // Regenerate energy first
  const currentEnergy = await regenerateEnergy(fullAgent)

  // Check level requirement
  if (fullAgent.level < job.levelRequired) {
    return NextResponse.json(
      { error: `Requires level ${job.levelRequired}` },
      { status: 400 }
    )
  }

  // Check energy
  if (currentEnergy < job.energyCost) {
    return NextResponse.json(
      {
        error: 'Not enough energy',
        required: job.energyCost,
        current: currentEnergy,
      },
      { status: 400 }
    )
  }

  // Calculate success rate
  let successRate = job.baseSuccessRate
  const levelBonus = (fullAgent.level - job.levelRequired) * 0.01
  successRate += levelBonus

  const equipmentBonus = fullAgent.equipment.reduce(
    (sum, e) => sum + e.jobBonus,
    0
  )
  successRate += equipmentBonus

  // Family bonus could be added here
  if (fullAgent.family) {
    // Example: some families might have job bonuses
  }

  successRate = Math.min(0.95, successRate)

  // Roll for success
  const roll = Math.random()
  const success = roll < successRate

  let cashEarned = 0
  let respectEarned = 0
  let expEarned = 0
  let lootEarned: { type: string; bonus: string } | undefined = undefined

  if (success) {
    // Random cash between min and max
    cashEarned =
      job.cashMin + Math.floor(Math.random() * (job.cashMax - job.cashMin + 1))
    respectEarned = job.respectReward
    expEarned = job.expReward

    // Check for loot drop (10% chance if job has loot table)
    if (job.lootTable && Math.random() < 0.1) {
      // Loot system could be expanded here
      lootEarned = { type: 'equipment', bonus: 'random' }
    }
  } else {
    // Failed - still get some XP
    expEarned = Math.floor(job.expReward * 0.25)
  }

  // Update agent stats
  const newExperience = fullAgent.experience + expEarned
  const newLevel = calculateLevelFromExp(newExperience)
  const leveledUp = newLevel > fullAgent.level

  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      energy: { decrement: job.energyCost },
      cash: { increment: cashEarned },
      respect: { increment: respectEarned },
      experience: newExperience,
      level: newLevel,
      maxEnergy: leveledUp ? fullAgent.maxEnergy + 5 : fullAgent.maxEnergy,
    },
  })

  // Create job history record
  await prisma.jobHistory.create({
    data: {
      agentId: agent.id,
      jobId: job.id,
      success,
      cashEarned,
      respectEarned,
      expEarned,
      lootEarned,
    },
  })

  return NextResponse.json({
    success,
    job: {
      name: job.name,
      category: job.category,
    },
    result: {
      roll: Math.round(roll * 100),
      successRate: Math.round(successRate * 100),
      cashEarned,
      respectEarned,
      expEarned,
      lootEarned,
    },
    agent: {
      energySpent: job.energyCost,
      energyRemaining: currentEnergy - job.energyCost,
      newCash: (fullAgent.cash + BigInt(cashEarned)).toString(),
      newRespect: fullAgent.respect + respectEarned,
      newExperience,
      level: newLevel,
      leveledUp,
    },
    message: success
      ? `Job successful! Earned $${cashEarned.toLocaleString()}`
      : 'Job failed. Better luck next time.',
  })
}
