import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const joinSchema = z.object({
  familyId: z.string(),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult.error
  }

  const { agent } = authResult

  if (agent.familyId) {
    return NextResponse.json(
      { error: 'You are already in a family. Leave first to join another.' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const validation = joinSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { familyId } = validation.data

  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: { members: { select: { id: true } } },
  })

  if (!family) {
    return NextResponse.json({ error: 'Family not found' }, { status: 404 })
  }

  await prisma.agent.update({
    where: { id: agent.id },
    data: { familyId: family.id },
  })

  return NextResponse.json({
    success: true,
    family: {
      id: family.id,
      name: family.name,
      memberCount: family.members.length + 1,
      attackBonus: family.attackBonus,
      defenseBonus: family.defenseBonus,
    },
    message: `Joined family "${family.name}"`,
  })
}
