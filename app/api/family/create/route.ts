import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(3).max(30),
  description: z.string().max(200).optional(),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult.error
  }

  const { agent } = authResult

  // Check if already in a family
  if (agent.familyId) {
    return NextResponse.json(
      { error: 'You are already in a family. Leave first to create a new one.' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const validation = createSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { name, description } = validation.data

  // Check if name is taken
  const existing = await prisma.family.findUnique({ where: { name } })
  if (existing) {
    return NextResponse.json({ error: 'Family name already taken' }, { status: 409 })
  }

  // Create family and update agent
  const family = await prisma.family.create({
    data: {
      name,
      description,
      leaderId: agent.id,
      attackBonus: 5,
      defenseBonus: 5,
    },
  })

  await prisma.agent.update({
    where: { id: agent.id },
    data: { familyId: family.id },
  })

  return NextResponse.json({
    success: true,
    family: {
      id: family.id,
      name: family.name,
      description: family.description,
      leaderId: family.leaderId,
      attackBonus: family.attackBonus,
      defenseBonus: family.defenseBonus,
    },
    message: `Created family "${name}". You are now the leader!`,
  })
}
