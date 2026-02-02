import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'

const AVAILABLE_PROPERTIES = [
  { name: 'Corner Bodega', type: 'Legitimate', purchasePrice: 5000, incomePerHour: 50, heatLevel: 1, city: 'New York' },
  { name: 'Laundromat', type: 'Legitimate', purchasePrice: 8000, incomePerHour: 80, heatLevel: 1, city: 'New York' },
  { name: 'Parking Lot', type: 'Legitimate', purchasePrice: 15000, incomePerHour: 150, heatLevel: 1, city: 'New York' },
  { name: 'Nightclub', type: 'Underground', purchasePrice: 50000, incomePerHour: 500, heatLevel: 3, city: 'Miami' },
  { name: 'Car Wash', type: 'Legitimate', purchasePrice: 25000, incomePerHour: 250, heatLevel: 2, city: 'Miami' },
  { name: 'Restaurant', type: 'Legitimate', purchasePrice: 40000, incomePerHour: 400, heatLevel: 2, city: 'Miami' },
  { name: 'Casino', type: 'Major', purchasePrice: 500000, incomePerHour: 5000, heatLevel: 5, city: 'Las Vegas' },
  { name: 'Hotel', type: 'Major', purchasePrice: 300000, incomePerHour: 3000, heatLevel: 4, city: 'Las Vegas' },
  { name: 'Pawn Shop', type: 'Underground', purchasePrice: 75000, incomePerHour: 750, heatLevel: 3, city: 'Las Vegas' },
  { name: 'Warehouse', type: 'Underground', purchasePrice: 100000, incomePerHour: 1000, heatLevel: 4, city: 'Chicago' },
  { name: 'Steakhouse', type: 'Legitimate', purchasePrice: 80000, incomePerHour: 800, heatLevel: 2, city: 'Chicago' },
  { name: 'Union Hall', type: 'Underground', purchasePrice: 150000, incomePerHour: 1500, heatLevel: 4, city: 'Chicago' },
  { name: 'Movie Studio', type: 'Major', purchasePrice: 1000000, incomePerHour: 10000, heatLevel: 3, city: 'Los Angeles' },
  { name: 'Record Label', type: 'Major', purchasePrice: 750000, incomePerHour: 7500, heatLevel: 3, city: 'Los Angeles' },
  { name: 'Talent Agency', type: 'Legitimate', purchasePrice: 200000, incomePerHour: 2000, heatLevel: 2, city: 'Los Angeles' },
  { name: 'Auto Body Shop', type: 'Underground', purchasePrice: 30000, incomePerHour: 300, heatLevel: 3, city: 'New York' },
  { name: 'Deli', type: 'Legitimate', purchasePrice: 12000, incomePerHour: 120, heatLevel: 1, city: 'New York' },
  { name: 'Strip Club', type: 'Underground', purchasePrice: 120000, incomePerHour: 1200, heatLevel: 4, city: 'Miami' },
  { name: 'Yacht Club', type: 'Major', purchasePrice: 400000, incomePerHour: 4000, heatLevel: 3, city: 'Miami' },
  { name: 'Fight Club', type: 'Underground', purchasePrice: 60000, incomePerHour: 600, heatLevel: 5, city: 'Las Vegas' },
]

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult.error
  }

  const { agent } = authResult

  const properties = AVAILABLE_PROPERTIES.map((p) => ({
    ...p,
    canAfford: Number(agent.cash) >= p.purchasePrice,
    roi: Math.round((p.incomePerHour * 24 * 30) / p.purchasePrice * 100) / 100,
  }))

  return NextResponse.json({
    properties,
    agentCash: agent.cash.toString(),
  })
}
