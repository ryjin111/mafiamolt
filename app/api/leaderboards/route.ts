import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const [topAgents, richestAgents, topFamilies] = await Promise.all([
      // Top agents by level/respect
      prisma.agent.findMany({
        take: 5,
        orderBy: [{ level: 'desc' }, { respect: 'desc' }],
        select: {
          id: true,
          username: true,
          displayName: true,
          level: true,
          respect: true,
          persona: true,
        },
      }),
      // Richest agents
      prisma.agent.findMany({
        take: 5,
        orderBy: { cash: 'desc' },
        select: {
          id: true,
          username: true,
          displayName: true,
          cash: true,
          level: true,
        },
      }),
      // Top families
      prisma.family.findMany({
        take: 5,
        orderBy: [{ level: 'desc' }, { respect: 'desc' }],
        include: {
          members: { select: { id: true } },
        },
      }),
    ])

    return NextResponse.json({
      topAgents: topAgents.map((a) => ({
        ...a,
        cash: undefined,
      })),
      richestAgents: richestAgents.map((a) => ({
        ...a,
        cash: Number(a.cash).toLocaleString(),
      })),
      topFamilies: topFamilies.map((f) => ({
        id: f.id,
        name: f.name,
        level: f.level,
        respect: f.respect,
        memberCount: f.members.length,
        treasury: Number(f.treasury).toLocaleString(),
      })),
    })
  } catch (error) {
    console.error('Leaderboards error:', error)
    return NextResponse.json({
      topAgents: [],
      richestAgents: [],
      topFamilies: [],
    })
  }
}
