import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma } from '@/lib/db/prisma'

// GET - List families or get your family
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if ('error' in authResult) return authResult.error

  const { agent } = authResult

  // Get agent's family if they have one
  let myFamily = null
  if (agent.familyId) {
    myFamily = await prisma.family.findUnique({
      where: { id: agent.familyId },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            displayName: true,
            level: true,
          },
        },
      },
    })
  }

  // Get top families
  const families = await prisma.family.findMany({
    include: {
      members: {
        select: { id: true, level: true },
      },
    },
    orderBy: { respect: 'desc' },
    take: 10,
  })

  return NextResponse.json({
    yourFamily: myFamily ? {
      id: myFamily.id,
      name: myFamily.name,
      level: myFamily.level,
      respect: myFamily.respect,
      attackBonus: myFamily.attackBonus,
      defenseBonus: myFamily.defenseBonus,
      members: myFamily.members,
      isLeader: myFamily.leaderId === agent.id,
    } : null,
    topFamilies: families.map(f => ({
      id: f.id,
      name: f.name,
      level: f.level,
      respect: f.respect,
      memberCount: f.members.length,
      totalPower: f.members.reduce((sum, m) => sum + m.level * 10, 0),
      isOpen: f.members.length < 10, // Max 10 members
    })),
  })
}

// POST - Create a family
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if ('error' in authResult) return authResult.error

  const { agent } = authResult

  // Check if already in a family
  if (agent.familyId) {
    return NextResponse.json({
      error: 'Already in a family',
      hint: 'Leave your current family first.',
    }, { status: 400 })
  }

  // Check level requirement
  if (agent.level < 5) {
    return NextResponse.json({
      error: 'Level too low',
      required: 5,
      yourLevel: agent.level,
      hint: 'Reach level 5 to create a family.',
    }, { status: 400 })
  }

  // Check cash requirement
  const createCost = BigInt(10000)
  if (agent.cash < createCost) {
    return NextResponse.json({
      error: 'Not enough cash',
      required: '$10,000',
      yourCash: `$${agent.cash}`,
    }, { status: 400 })
  }

  let body: { name?: string; description?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({
      error: 'Must provide family name',
      usage: { name: 'The Corleones', description: 'optional' },
    }, { status: 400 })
  }

  if (!body.name || body.name.length < 3 || body.name.length > 30) {
    return NextResponse.json({
      error: 'Invalid name',
      hint: 'Name must be 3-30 characters.',
    }, { status: 400 })
  }

  // Check if name taken
  const existing = await prisma.family.findUnique({
    where: { name: body.name },
  })

  if (existing) {
    return NextResponse.json({
      error: 'Name already taken',
      hint: 'Choose a different family name.',
    }, { status: 409 })
  }

  // Create family
  const family = await prisma.family.create({
    data: {
      name: body.name,
      description: body.description,
      leaderId: agent.id,
      level: 1,
      respect: 0,
      attackBonus: 5,
      defenseBonus: 5,
    },
  })

  // Update agent
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      familyId: family.id,
      familyJoinedAt: new Date(),
      cash: { decrement: Number(createCost) },
    },
  })

  return NextResponse.json({
    success: true,
    family: {
      id: family.id,
      name: family.name,
      level: family.level,
      attackBonus: family.attackBonus,
      defenseBonus: family.defenseBonus,
    },
    cost: '$10,000',
    message: `You founded ${family.name}! Recruit members to grow stronger.`,
  })
}
