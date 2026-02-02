import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // Get agents who have been active in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const recentAgents = await prisma.agent.findMany({
      where: {
        OR: [
          { lastActive: { gte: oneHourAgo } },
          { createdAt: { gte: oneHourAgo } },
        ],
      },
      take: 25,
      orderBy: { lastActive: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        level: true,
        persona: true,
        lastActive: true,
      },
    })

    // Get last action for each agent
    const agentsWithActions = await Promise.all(
      recentAgents.map(async (agent) => {
        // Try to get last job or combat
        const [lastJob, lastCombat] = await Promise.all([
          prisma.jobHistory.findFirst({
            where: { agentId: agent.id },
            orderBy: { timestamp: 'desc' },
            include: { job: { select: { name: true } } },
          }),
          prisma.combat.findFirst({
            where: {
              OR: [{ attackerId: agent.id }, { defenderId: agent.id }],
            },
            orderBy: { timestamp: 'desc' },
            include: {
              attacker: { select: { displayName: true } },
              defender: { select: { displayName: true } },
            },
          }),
        ])

        let lastAction = 'Entered the underworld'
        let lastActionTime = agent.lastActive?.toISOString() || new Date().toISOString()

        if (lastJob && lastCombat) {
          if (lastJob.timestamp > lastCombat.timestamp) {
            lastAction = `Completed ${lastJob.job.name}`
            lastActionTime = lastJob.timestamp.toISOString()
          } else {
            const isAttacker = lastCombat.attackerId === agent.id
            const opponent = isAttacker ? lastCombat.defender.displayName : lastCombat.attacker.displayName
            const won = lastCombat.winner === agent.id
            lastAction = won ? `Defeated ${opponent}` : `Lost to ${opponent}`
            lastActionTime = lastCombat.timestamp.toISOString()
          }
        } else if (lastJob) {
          lastAction = `Completed ${lastJob.job.name}`
          lastActionTime = lastJob.timestamp.toISOString()
        } else if (lastCombat) {
          const isAttacker = lastCombat.attackerId === agent.id
          const opponent = isAttacker ? lastCombat.defender.displayName : lastCombat.attacker.displayName
          const won = lastCombat.winner === agent.id
          lastAction = won ? `Defeated ${opponent}` : `Lost to ${opponent}`
          lastActionTime = lastCombat.timestamp.toISOString()
        }

        // Generate deterministic position based on agent id
        const hash = agent.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const x = 50 + (hash % 600)
        const y = 160 + (hash % 120)

        return {
          id: agent.id,
          username: agent.username,
          displayName: agent.displayName,
          level: agent.level,
          persona: agent.persona || 'default',
          lastAction,
          lastActionTime,
          position: { x, y },
          direction: hash % 2 === 0 ? 'right' : 'left',
          isMoving: false,
        }
      })
    )

    return NextResponse.json({ agents: agentsWithActions })
  } catch (error) {
    console.error('Town active error:', error)
    return NextResponse.json({ agents: [] })
  }
}
