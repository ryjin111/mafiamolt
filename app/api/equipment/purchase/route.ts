import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const EQUIPMENT_CATALOG: Record<string, { type: string; rarity: string; attackBonus: number; defenseBonus: number; jobBonus: number; price: number }> = {
  'Brass Knuckles': { type: 'Weapon', rarity: 'Common', attackBonus: 5, defenseBonus: 0, jobBonus: 0, price: 500 },
  'Switchblade': { type: 'Weapon', rarity: 'Common', attackBonus: 8, defenseBonus: 0, jobBonus: 0.02, price: 1000 },
  'Revolver': { type: 'Weapon', rarity: 'Rare', attackBonus: 20, defenseBonus: 0, jobBonus: 0.05, price: 5000 },
  'Tommy Gun': { type: 'Weapon', rarity: 'Legendary', attackBonus: 50, defenseBonus: 0, jobBonus: 0.1, price: 50000 },
  'Leather Jacket': { type: 'Armor', rarity: 'Common', attackBonus: 0, defenseBonus: 5, jobBonus: 0, price: 800 },
  'Kevlar Vest': { type: 'Armor', rarity: 'Rare', attackBonus: 0, defenseBonus: 20, jobBonus: 0, price: 8000 },
  'Motorcycle': { type: 'Vehicle', rarity: 'Common', attackBonus: 3, defenseBonus: 3, jobBonus: 0.05, price: 3000 },
  'Sports Car': { type: 'Vehicle', rarity: 'Rare', attackBonus: 10, defenseBonus: 10, jobBonus: 0.12, price: 25000 },
}

const purchaseSchema = z.object({
  equipmentName: z.string(),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult.error
  }

  const { agent } = authResult

  const body = await request.json()
  const validation = purchaseSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { equipmentName } = validation.data
  const equipInfo = EQUIPMENT_CATALOG[equipmentName]

  if (!equipInfo) {
    return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
  }

  if (Number(agent.cash) < equipInfo.price) {
    return NextResponse.json(
      { error: 'Not enough cash', required: equipInfo.price, current: agent.cash.toString() },
      { status: 400 }
    )
  }

  const [updatedAgent, equipment] = await prisma.$transaction([
    prisma.agent.update({
      where: { id: agent.id },
      data: { cash: { decrement: equipInfo.price } },
    }),
    prisma.equipment.create({
      data: {
        name: equipmentName,
        type: equipInfo.type,
        rarity: equipInfo.rarity,
        attackBonus: equipInfo.attackBonus,
        defenseBonus: equipInfo.defenseBonus,
        jobBonus: equipInfo.jobBonus,
        ownerId: agent.id,
        equipped: false,
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    equipment: {
      id: equipment.id,
      name: equipment.name,
      type: equipment.type,
      rarity: equipment.rarity,
      attackBonus: equipment.attackBonus,
      defenseBonus: equipment.defenseBonus,
    },
    agent: {
      cashSpent: equipInfo.price,
      newCash: updatedAgent.cash.toString(),
    },
    message: `Purchased ${equipmentName} for $${equipInfo.price.toLocaleString()}`,
  })
}
