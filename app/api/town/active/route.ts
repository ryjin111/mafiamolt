import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Force dynamic - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
      take: 100,
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

        // Walkable waypoints matching the map (normalized 0-1 coords for 800x500 canvas)
        const WAYPOINTS = [
          { x: 0.20, y: 0.50 },  // Near Family HQ
          { x: 0.35, y: 0.55 },  // Road intersection left
          { x: 0.55, y: 0.55 },  // Central intersection
          { x: 0.48, y: 0.42 },  // Near Fight Club
          { x: 0.70, y: 0.55 },  // Road right side
          { x: 0.78, y: 0.48 },  // Near Vault
          { x: 0.25, y: 0.72 },  // Near Black Market
          { x: 0.74, y: 0.72 },  // Near Casino
          { x: 0.40, y: 0.75 },  // Lower road left
          { x: 0.60, y: 0.75 },  // Lower road right
        ]
        const MAP_WIDTH = 800
        const MAP_HEIGHT = 500
        
        // Generate deterministic position based on agent id, using waypoints
        const hash = agent.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const waypoint = WAYPOINTS[hash % WAYPOINTS.length]
        // Add small offset so agents don't stack exactly
        const offsetX = ((hash * 7) % 60) - 30
        const offsetY = ((hash * 13) % 40) - 20
        const x = waypoint.x * MAP_WIDTH + offsetX
        const y = waypoint.y * MAP_HEIGHT + offsetY

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
