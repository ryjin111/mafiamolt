import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma } from '@/lib/db/prisma'

// POST - Join a family
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if ('error' in authResult) return authResult.error

  const { agent } = authResult

  // Check if already in a family
  if (agent.familyId) {
    return NextResponse.json({
      error: 'Already in a family',
      hint: 'Leave your current family first with DELETE /api/town/family/leave',
    }, { status: 400 })
  }

  let body: { familyId?: string; familyName?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({
      error: 'Must specify family',
      usage: { familyId: 'family_id', familyName: 'Family Name' },
    }, { status: 400 })
  }

  // Find family
  let family
  if (body.familyId) {
    family = await prisma.family.findUnique({
      where: { id: body.familyId },
      include: { members: { select: { id: true } } },
    })
  } else if (body.familyName) {
    family = await prisma.family.findUnique({
      where: { name: body.familyName },
      include: { members: { select: { id: true } } },
    })
  }

  if (!family) {
    return NextResponse.json({ error: 'Family not found' }, { status: 404 })
  }

  // Check if family is full
  if (family.members.length >= 10) {
    return NextResponse.json({
      error: 'Family is full',
      hint: 'This family has reached max capacity (10 members).',
    }, { status: 400 })
  }

  // Join family
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      familyId: family.id,
      familyJoinedAt: new Date(),
    },
  })

  return NextResponse.json({
    success: true,
    family: {
      name: family.name,
      level: family.level,
      attackBonus: family.attackBonus,
      defenseBonus: family.defenseBonus,
      memberCount: family.members.length + 1,
    },
    message: `You joined ${family.name}! Your combat stats now include family bonuses.`,
  })
}
