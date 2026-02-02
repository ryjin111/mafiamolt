'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sword, Shield, Car, Users } from 'lucide-react'

const tabs = ['Weapons', 'Armor', 'Vehicles', 'Crew']

const mockEquipment = {
  Weapons: [
    { name: 'Brass Knuckles', rarity: 'Common', attackBonus: 5, defenseBonus: 0, price: 500 },
    { name: 'Revolver', rarity: 'Rare', attackBonus: 20, defenseBonus: 0, price: 5000 },
    { name: 'Tommy Gun', rarity: 'Legendary', attackBonus: 50, defenseBonus: 0, price: 50000 },
  ],
  Armor: [
    { name: 'Leather Jacket', rarity: 'Common', attackBonus: 0, defenseBonus: 5, price: 800 },
    { name: 'Kevlar Vest', rarity: 'Rare', attackBonus: 0, defenseBonus: 20, price: 8000 },
  ],
  Vehicles: [
    { name: 'Motorcycle', rarity: 'Common', attackBonus: 3, defenseBonus: 3, price: 3000 },
    { name: 'Sports Car', rarity: 'Rare', attackBonus: 10, defenseBonus: 10, price: 25000 },
  ],
  Crew: [
    { name: 'Street Muscle', specialty: 'Muscle', attackBonus: 8, defenseBonus: 5, hireCost: 2000, upkeep: 100 },
    { name: 'Expert Driver', specialty: 'Driver', attackBonus: 3, defenseBonus: 3, hireCost: 3500, upkeep: 150 },
  ],
}

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState('Weapons')

  const getIcon = (tab: string) => {
    switch (tab) {
      case 'Weapons': return Sword
      case 'Armor': return Shield
      case 'Vehicles': return Car
      case 'Crew': return Users
      default: return Sword
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-mafia-muted">Buy equipment and hire crew to grow your power</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const Icon = getIcon(tab)
          return (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab)}
              className="gap-2"
            >
              <Icon size={16} />
              {tab}
            </Button>
          )
        })}
      </div>

      <div className="grid gap-4">
        {(mockEquipment[activeTab as keyof typeof mockEquipment] || []).map((item: Record<string, unknown>) => (
          <Card key={item.name as string} className="hover:border-gold-500/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.name as string}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.rarity === 'Legendary' ? 'bg-gold-500/20 text-gold-500' :
                      item.rarity === 'Rare' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-mafia-border text-mafia-muted'
                    }`}>
                      {(item.rarity as string) || (item.specialty as string)}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm mt-1">
                    {(item.attackBonus as number) > 0 && (
                      <span className="text-red-400">+{item.attackBonus as number} ATK</span>
                    )}
                    {(item.defenseBonus as number) > 0 && (
                      <span className="text-blue-400">+{item.defenseBonus as number} DEF</span>
                    )}
                    {(item.upkeep as number | undefined) && (
                      <span className="text-mafia-muted">${item.upkeep as number}/day upkeep</span>
                    )}
                  </div>
                </div>
                <Button size="sm">
                  Buy ${((item.price as number) || (item.hireCost as number) || 0).toLocaleString()}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
