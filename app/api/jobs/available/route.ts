import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult.error
  }

  const { agent } = authResult

  // Get agent's full data
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

  // Get all jobs the agent qualifies for
  const jobs = await prisma.job.findMany({
    where: {
      levelRequired: { lte: fullAgent.level },
    },
    orderBy: [{ category: 'asc' }, { levelRequired: 'asc' }],
  })

  // Calculate effective success rates
  const jobsWithRates = jobs.map((job) => {
    // Base rate from job
    let successRate = job.baseSuccessRate

    // Level bonus: +1% per level above requirement
    const levelBonus = (fullAgent.level - job.levelRequired) * 0.01
    successRate += levelBonus

    // Equipment job bonus
    const equipmentBonus = fullAgent.equipment.reduce(
      (sum, e) => sum + e.jobBonus,
      0
    )
    successRate += equipmentBonus

    // Family bonus (if any)
    // Could add family-specific job bonuses here

    // Cap at 95%
    successRate = Math.min(0.95, successRate)

    return {
      id: job.id,
      name: job.name,
      description: job.description,
      category: job.category,
      energyCost: job.energyCost,
      levelRequired: job.levelRequired,
      cityRequired: job.cityRequired,
      cashReward: {
        min: job.cashMin,
        max: job.cashMax,
      },
      respectReward: job.respectReward,
      expReward: job.expReward,
      successRate: Math.round(successRate * 100),
      canExecute: fullAgent.energy >= job.energyCost,
    }
  })

  // Group by category
  const grouped = {
    Street: jobsWithRates.filter((j) => j.category === 'Street'),
    Organized: jobsWithRates.filter((j) => j.category === 'Organized'),
    HighStakes: jobsWithRates.filter((j) => j.category === 'HighStakes'),
  }

  return NextResponse.json({
    agentLevel: fullAgent.level,
    currentEnergy: fullAgent.energy,
    jobs: grouped,
    totalJobs: jobsWithRates.length,
  })
}
