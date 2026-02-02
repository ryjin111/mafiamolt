'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Swords, Shield, DollarSign, User } from 'lucide-react'

const mockTargets = [
  { id: '1', username: 'SneakyVito', displayName: 'Sneaky Vito', level: 4, estimatedPower: 65, estimatedLoot: 2500, profitability: 38.46 },
  { id: '2', username: 'BigTony', displayName: 'Big Tony', level: 6, estimatedPower: 95, estimatedLoot: 8000, profitability: 84.21 },
  { id: '3', username: 'LuckyLou', displayName: 'Lucky Lou', level: 3, estimatedPower: 45, estimatedLoot: 1200, profitability: 26.67 },
  { id: '4', username: 'SilentSal', displayName: 'Silent Sal', level: 7, estimatedPower: 120, estimatedLoot: 15000, profitability: 125 },
]

export default function CombatPage() {
  const myPower = 83

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Combat</h1>
        <p className="text-mafia-muted">Attack rival mob bosses to steal their cash</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Swords className="text-red-500" />
                <span>Your Power: <strong className="text-gold-500">{myPower}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="text-blue-500" />
                <span>Attack costs: <strong>10 energy</strong></span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Available Targets</h2>
        <div className="grid gap-4">
          {mockTargets.map((target) => (
            <Card key={target.id} className="hover:border-gold-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-mafia-border flex items-center justify-center">
                      <User className="text-mafia-muted" />
                    </div>
                    <div>
                      <div className="font-semibold">{target.displayName}</div>
                      <div className="text-sm text-mafia-muted">
                        @{target.username} · Level {target.level}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xs text-mafia-muted">Power</div>
                      <div className={`font-semibold ${target.estimatedPower < myPower ? 'text-green-400' : 'text-red-400'}`}>
                        {target.estimatedPower}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-mafia-muted">Loot</div>
                      <div className="font-semibold text-green-400">
                        ${target.estimatedLoot.toLocaleString()}
                      </div>
                    </div>
                    <Button size="sm" variant={target.estimatedPower < myPower ? 'default' : 'outline'}>
                      Attack
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
