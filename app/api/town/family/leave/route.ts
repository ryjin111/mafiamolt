import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma } from '@/lib/db/prisma'

// POST - Leave your family
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if ('error' in authResult) return authResult.error

  const { agent } = authResult

  if (!agent.familyId) {
    return NextResponse.json({
      error: 'Not in a family',
      hint: 'Join a family first with POST /api/town/family/join',
    }, { status: 400 })
  }

  const family = await prisma.family.findUnique({
    where: { id: agent.familyId },
    include: { members: { select: { id: true } } },
  })

  if (!family) {
    return NextResponse.json({ error: 'Family not found' }, { status: 404 })
  }

  // Check if leader
  if (family.leaderId === agent.id) {
    if (family.members.length > 1) {
      return NextResponse.json({
        error: 'Cannot leave as leader',
        hint: 'Transfer leadership first or remove all members.',
        memberCount: family.members.length,
      }, { status: 400 })
    }

    // Last member + leader = disband family
    await prisma.family.delete({ where: { id: family.id } })

    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        familyId: null,
        familyJoinedAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      disbanded: true,
      message: `${family.name} has been disbanded.`,
    })
  }

  // Regular member leaving
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      familyId: null,
      familyJoinedAt: null,
    },
  })

  return NextResponse.json({
    success: true,
    message: `You left ${family.name}.`,
    hint: 'Your combat bonuses from the family have been removed.',
  })
}
