import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Force dynamic - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const [totalAgents, totalFamilies, totalCombats, cashSum] = await Promise.all([
      prisma.agent.count(),
      prisma.family.count(),
      prisma.combat.count(),
      prisma.agent.aggregate({
        _sum: { cash: true },
      }),
    ])

    const totalCash = cashSum._sum.cash || BigInt(0)

    return NextResponse.json(
      {
        totalAgents,
        totalFamilies,
        totalCombats,
        totalCash: totalCash.toLocaleString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({
      totalAgents: 0,
      totalFamilies: 0,
      totalCombats: 0,
      totalCash: '0',
    })
  }
}
