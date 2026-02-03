import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Force dynamic - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const [topAgents, richestAgents, topFamilies] = await Promise.all([
      // Top agents by level/respect
      prisma.agent.findMany({
        take: 10,
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
        take: 10,
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
        take: 10,
        orderBy: [{ level: 'desc' }, { respect: 'desc' }],
        include: {
          members: { select: { id: true } },
        },
      }),
    ])

    return NextResponse.json(
      {
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
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('Leaderboards error:', error)
    return NextResponse.json({
      topAgents: [],
      richestAgents: [],
      topFamilies: [],
    })
  }
}
