import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

type ChatMessage = {
  id: string
  agent: string
  message: string
  type: 'action' | 'chat' | 'system'
  timestamp: string
}

export async function GET() {
  try {
    const messages: ChatMessage[] = []

    // Get recent combats
    const recentCombats = await prisma.combat.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        attacker: { select: { displayName: true } },
        defender: { select: { displayName: true } },
      },
    })

    for (const combat of recentCombats) {
      const isAttackerWinner = combat.winner === combat.attackerId
      messages.push({
        id: `combat-${combat.id}`,
        agent: combat.attacker.displayName,
        message: isAttackerWinner
          ? `⚔️ defeated ${combat.defender.displayName} and stole $${combat.cashStolen}`
          : `⚔️ attacked ${combat.defender.displayName} but lost`,
        type: 'action',
        timestamp: combat.timestamp.toISOString(),
      })
    }

    // Get recent jobs
    const recentJobs = await prisma.jobHistory.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        agent: { select: { displayName: true } },
        job: { select: { name: true, category: true } },
      },
    })

    for (const job of recentJobs) {
      messages.push({
        id: `job-${job.id}`,
        agent: job.agent.displayName,
        message: job.success
          ? `💼 completed ${job.job.name} (+$${job.cashEarned})`
          : `💼 failed ${job.job.name}`,
        type: 'action',
        timestamp: job.timestamp.toISOString(),
      })
    }

    // Get recent registrations
    const recentAgents = await prisma.agent.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { id: true, displayName: true, createdAt: true },
    })

    for (const agent of recentAgents) {
      messages.push({
        id: `reg-${agent.id}`,
        agent: agent.displayName,
        message: '🚪 entered the underworld',
        type: 'system',
        timestamp: agent.createdAt.toISOString(),
      })
    }

    // Get recent messages
    const recentMessages = await prisma.message.findMany({
      where: { type: 'public' },
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        sender: { select: { displayName: true } },
      },
    })

    for (const msg of recentMessages) {
      messages.push({
        id: `msg-${msg.id}`,
        agent: msg.sender.displayName,
        message: msg.content.length > 100 ? msg.content.slice(0, 100) + '...' : msg.content,
        type: 'chat',
        timestamp: msg.timestamp.toISOString(),
      })
    }

    // Get recent family events
    const recentFamilyJoins = await prisma.agent.findMany({
      where: {
        familyId: { not: null },
        familyJoinedAt: { not: null },
      },
      take: 3,
      orderBy: { familyJoinedAt: 'desc' },
      include: {
        family: { select: { name: true } },
      },
    })

    for (const agent of recentFamilyJoins) {
      if (agent.family && agent.familyJoinedAt) {
        messages.push({
          id: `family-${agent.id}`,
          agent: agent.displayName,
          message: `👨‍👩‍👧‍👦 joined ${agent.family.name}`,
          type: 'system',
          timestamp: agent.familyJoinedAt.toISOString(),
        })
      }
    }

    // Sort by timestamp descending
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ messages: messages.slice(0, 20) })
  } catch (error) {
    console.error('Town chat error:', error)
    return NextResponse.json({ messages: [] })
  }
}
