import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma, regenerateEnergy, calculateLevelFromExp } from '@/lib/db/prisma'

// GET - List available jobs
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if ('error' in authResult) return authResult.error

  const { agent } = authResult

  const jobs = await prisma.job.findMany({
    where: {
      levelRequired: { lte: agent.level },
    },
    orderBy: { levelRequired: 'asc' },
  })

  return NextResponse.json({
    jobs: jobs.map(job => ({
      id: job.id,
      name: job.name,
      description: job.description,
      category: job.category,
      energyCost: job.energyCost,
      levelRequired: job.levelRequired,
      cashRange: `$${job.cashMin}-$${job.cashMax}`,
      respectReward: job.respectReward,
      successRate: `${Math.round(job.baseSuccessRate * 100)}%`,
    })),
    yourEnergy: agent.energy,
    yourLevel: agent.level,
  })
}

// POST - Execute a job
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if ('error' in authResult) return authResult.error

  const { agent } = authResult

  let body: { jobId?: string } = {}
  try {
    body = await request.json()
  } catch {
    // No body, pick random job
  }

  // Regenerate energy first
  const currentEnergy = await regenerateEnergy(agent)

  // Find a job (either specified or random based on level)
  let job
  if (body.jobId) {
    job = await prisma.job.findUnique({ where: { id: body.jobId } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    if (job.levelRequired > agent.level) {
      return NextResponse.json({
        error: 'Level too low',
        required: job.levelRequired,
        yourLevel: agent.level,
      }, { status: 400 })
    }
  } else {
    // Pick random available job
    const jobs = await prisma.job.findMany({
      where: { levelRequired: { lte: agent.level } },
    })
    if (jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs available' }, { status: 404 })
    }
    job = jobs[Math.floor(Math.random() * jobs.length)]
  }

  // Check energy
  if (currentEnergy < job.energyCost) {
    return NextResponse.json({
      error: 'Not enough energy',
      required: job.energyCost,
      yourEnergy: currentEnergy,
      hint: 'Energy regenerates over time. Wait or buy energy drinks.',
    }, { status: 400 })
  }

  // Calculate success
  const levelBonus = (agent.level - job.levelRequired) * 0.05
  const successRate = Math.min(0.95, job.baseSuccessRate + levelBonus)
  const success = Math.random() < successRate

  // Calculate rewards
  let cashEarned = 0
  let respectEarned = 0
  let expEarned = 0

  if (success) {
    cashEarned = Math.floor(Math.random() * (job.cashMax - job.cashMin + 1)) + job.cashMin
    respectEarned = job.respectReward
    expEarned = job.expReward
  } else {
    // Partial failure - get some exp but no cash
    expEarned = Math.floor(job.expReward * 0.25)
  }

  // Update agent stats
  const newExp = agent.experience + expEarned
  const newLevel = calculateLevelFromExp(newExp)
  const leveledUp = newLevel > agent.level

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

  // Record job history
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

  return NextResponse.json({
    job: job.name,
    success,
    rewards: {
      cash: success ? `+$${cashEarned}` : '$0',
      respect: success ? `+${respectEarned}` : '0',
      exp: `+${expEarned}`,
    },
    leveledUp: leveledUp ? { newLevel, message: `You reached level ${newLevel}!` } : null,
    energyRemaining: currentEnergy - job.energyCost,
    message: success
      ? `Successfully completed ${job.name}!`
      : `${job.name} failed... but you learned something.`,
  })
}
