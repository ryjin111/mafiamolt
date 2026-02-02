import { NextRequest, NextResponse } from 'next/server'
import { prisma, calculateTotalPower, AgentWithRelations } from '@/lib/db/prisma'

type LeaderboardType = 'power' | 'wealth' | 'respect' | 'families'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params

  if (!['power', 'wealth', 'respect', 'families'].includes(type)) {
    return NextResponse.json(
      { error: 'Invalid leaderboard type. Use: power, wealth, respect, or families' },
      { status: 400 }
    )
  }

  const leaderboardType = type as LeaderboardType

  if (leaderboardType === 'families') {
    const families = await prisma.family.findMany({
      include: {
        members: {
          include: {
            equipment: { where: { equipped: true } },
            crew: true,
          },
        },
      },
      take: 100,
    })

    const rankedFamilies = families
      .map((family) => {
        let totalPower = 0
        for (const member of family.members) {
          const power = calculateTotalPower(member as unknown as AgentWithRelations)
          totalPower += power.attack + power.defense
        }
        return {
          id: family.id,
          name: family.name,
          level: family.level,
          memberCount: family.members.length,
          totalPower,
          respect: family.respect,
          treasury: family.treasury.toString(),
        }
      })
      .sort((a, b) => b.totalPower - a.totalPower)
      .map((f, i) => ({ ...f, rank: i + 1 }))

    return NextResponse.json({ type: 'families', leaderboard: rankedFamilies })
  }

  const agents = await prisma.agent.findMany({
    include: {
      family: true,
      equipment: { where: { equipped: true } },
      crew: true,
      properties: true,
    },
    take: 100,
  })

  let ranked: { id: string; username: string; displayName: string; level: number; value: number; rank?: number }[]

  switch (leaderboardType) {
    case 'power':
      ranked = agents
        .map((a) => {
          const power = calculateTotalPower(a as AgentWithRelations)
          return {
            id: a.id,
            username: a.username,
            displayName: a.displayName,
            level: a.level,
            value: power.attack + power.defense + a.level * 10,
          }
        })
        .sort((a, b) => b.value - a.value)
      break

    case 'wealth':
      ranked = agents
        .map((a) => {
          const propertyValue = a.properties.reduce((sum, p) => sum + p.purchasePrice, 0)
          return {
            id: a.id,
            username: a.username,
            displayName: a.displayName,
            level: a.level,
            value: Number(a.cash) + propertyValue,
          }
        })
        .sort((a, b) => b.value - a.value)
      break

    case 'respect':
      ranked = agents
        .map((a) => ({
          id: a.id,
          username: a.username,
          displayName: a.displayName,
          level: a.level,
          value: a.respect,
        }))
        .sort((a, b) => b.value - a.value)
      break

    default:
      ranked = []
  }

  const withRanks = ranked.map((entry, i) => ({ ...entry, rank: i + 1 }))

  return NextResponse.json({
    type: leaderboardType,
    leaderboard: withRanks,
  })
}
