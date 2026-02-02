import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'

const EQUIPMENT_CATALOG = [
  // Weapons
  { name: 'Brass Knuckles', type: 'Weapon', rarity: 'Common', attackBonus: 5, defenseBonus: 0, jobBonus: 0, price: 500 },
  { name: 'Switchblade', type: 'Weapon', rarity: 'Common', attackBonus: 8, defenseBonus: 0, jobBonus: 0.02, price: 1000 },
  { name: 'Baseball Bat', type: 'Weapon', rarity: 'Common', attackBonus: 12, defenseBonus: 2, jobBonus: 0, price: 2000 },
  { name: 'Revolver', type: 'Weapon', rarity: 'Rare', attackBonus: 20, defenseBonus: 0, jobBonus: 0.05, price: 5000 },
  { name: 'Shotgun', type: 'Weapon', rarity: 'Rare', attackBonus: 30, defenseBonus: 0, jobBonus: 0.03, price: 10000 },
  { name: 'Tommy Gun', type: 'Weapon', rarity: 'Legendary', attackBonus: 50, defenseBonus: 0, jobBonus: 0.1, price: 50000 },

  // Armor
  { name: 'Leather Jacket', type: 'Armor', rarity: 'Common', attackBonus: 0, defenseBonus: 5, jobBonus: 0, price: 800 },
  { name: 'Kevlar Vest', type: 'Armor', rarity: 'Rare', attackBonus: 0, defenseBonus: 20, jobBonus: 0, price: 8000 },
  { name: 'Custom Suit', type: 'Armor', rarity: 'Rare', attackBonus: 5, defenseBonus: 15, jobBonus: 0.05, price: 15000 },
  { name: 'Armored Suit', type: 'Armor', rarity: 'Legendary', attackBonus: 10, defenseBonus: 40, jobBonus: 0.08, price: 75000 },

  // Vehicles
  { name: 'Motorcycle', type: 'Vehicle', rarity: 'Common', attackBonus: 3, defenseBonus: 3, jobBonus: 0.05, price: 3000 },
  { name: 'Sedan', type: 'Vehicle', rarity: 'Common', attackBonus: 5, defenseBonus: 5, jobBonus: 0.08, price: 8000 },
  { name: 'Sports Car', type: 'Vehicle', rarity: 'Rare', attackBonus: 10, defenseBonus: 10, jobBonus: 0.12, price: 25000 },
  { name: 'Armored SUV', type: 'Vehicle', rarity: 'Rare', attackBonus: 15, defenseBonus: 25, jobBonus: 0.1, price: 60000 },
  { name: 'Helicopter', type: 'Vehicle', rarity: 'Legendary', attackBonus: 25, defenseBonus: 20, jobBonus: 0.2, price: 200000 },
]

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult.error
  }

  const { agent } = authResult

  const equipment = EQUIPMENT_CATALOG.map((e) => ({
    ...e,
    canAfford: Number(agent.cash) >= e.price,
  }))

  const grouped = {
    Weapon: equipment.filter((e) => e.type === 'Weapon'),
    Armor: equipment.filter((e) => e.type === 'Armor'),
    Vehicle: equipment.filter((e) => e.type === 'Vehicle'),
  }

  return NextResponse.json({
    equipment: grouped,
    agentCash: agent.cash.toString(),
  })
}
