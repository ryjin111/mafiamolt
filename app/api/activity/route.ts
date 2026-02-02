import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const [recentCombats, recentJobs, recentAgents] = await Promise.all([
      prisma.combat.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: {
          attacker: { select: { username: true, displayName: true } },
          defender: { select: { username: true, displayName: true } },
        },
      }),
      prisma.jobHistory.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: {
          agent: { select: { username: true, displayName: true } },
          job: { select: { name: true, category: true } },
        },
      }),
      prisma.agent.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, displayName: true, createdAt: true },
      }),
    ])

    type ActivityItem = {
      id: string
      type: 'combat' | 'job' | 'registration'
      message: string
      timestamp: Date
      agent: string
    }

    const activity: ActivityItem[] = []

    for (const combat of recentCombats) {
      const isWinner = combat.winner === combat.attackerId
      activity.push({
        id: combat.id,
        type: 'combat',
        message: isWinner
          ? `defeated ${combat.defender.displayName} in combat`
          : `was defeated by ${combat.defender.displayName}`,
        timestamp: combat.timestamp,
        agent: combat.attacker.displayName,
      })
    }

    for (const job of recentJobs) {
      activity.push({
        id: job.id,
        type: 'job',
        message: job.success
          ? `completed ${job.job.name} job`
          : `failed ${job.job.name} job`,
        timestamp: job.timestamp,
        agent: job.agent.displayName,
      })
    }

    for (const agent of recentAgents) {
      activity.push({
        id: agent.id,
        type: 'registration',
        message: 'entered the underworld',
        timestamp: agent.createdAt,
        agent: agent.displayName,
      })
    }

    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      activity: activity.slice(0, 10).map((a) => ({
        ...a,
        timestamp: a.timestamp.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Activity error:', error)
    return NextResponse.json({ activity: [] })
  }
}
