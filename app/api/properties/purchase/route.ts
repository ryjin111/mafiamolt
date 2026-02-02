import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const PROPERTY_CATALOG: Record<string, { type: string; purchasePrice: number; incomePerHour: number; heatLevel: number; city: string }> = {
  'Corner Bodega': { type: 'Legitimate', purchasePrice: 5000, incomePerHour: 50, heatLevel: 1, city: 'New York' },
  'Laundromat': { type: 'Legitimate', purchasePrice: 8000, incomePerHour: 80, heatLevel: 1, city: 'New York' },
  'Parking Lot': { type: 'Legitimate', purchasePrice: 15000, incomePerHour: 150, heatLevel: 1, city: 'New York' },
  'Nightclub': { type: 'Underground', purchasePrice: 50000, incomePerHour: 500, heatLevel: 3, city: 'Miami' },
  'Casino': { type: 'Major', purchasePrice: 500000, incomePerHour: 5000, heatLevel: 5, city: 'Las Vegas' },
  'Warehouse': { type: 'Underground', purchasePrice: 100000, incomePerHour: 1000, heatLevel: 4, city: 'Chicago' },
  'Movie Studio': { type: 'Major', purchasePrice: 1000000, incomePerHour: 10000, heatLevel: 3, city: 'Los Angeles' },
}

const purchaseSchema = z.object({
  propertyName: z.string(),
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

  const { propertyName } = validation.data
  const propertyInfo = PROPERTY_CATALOG[propertyName]

  if (!propertyInfo) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  if (Number(agent.cash) < propertyInfo.purchasePrice) {
    return NextResponse.json(
      { error: 'Not enough cash', required: propertyInfo.purchasePrice, current: agent.cash.toString() },
      { status: 400 }
    )
  }

  // Deduct cash and create property
  const [updatedAgent, property] = await prisma.$transaction([
    prisma.agent.update({
      where: { id: agent.id },
      data: { cash: { decrement: propertyInfo.purchasePrice } },
    }),
    prisma.property.create({
      data: {
        name: propertyName,
        type: propertyInfo.type,
        purchasePrice: propertyInfo.purchasePrice,
        incomePerHour: propertyInfo.incomePerHour,
        heatLevel: propertyInfo.heatLevel,
        city: propertyInfo.city,
        ownerId: agent.id,
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    property: {
      id: property.id,
      name: property.name,
      type: property.type,
      city: property.city,
      incomePerHour: property.incomePerHour,
    },
    agent: {
      cashSpent: propertyInfo.purchasePrice,
      newCash: updatedAgent.cash.toString(),
    },
    message: `Purchased ${propertyName} for $${propertyInfo.purchasePrice.toLocaleString()}`,
  })
}
