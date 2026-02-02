'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Shield, Swords, Crown } from 'lucide-react'

const mockFamily = null // Set to object to show family view
const mockFamilies = [
  { id: '1', name: 'The Corleones', memberCount: 12, level: 5, respect: 5000 },
  { id: '2', name: 'The Sopranos', memberCount: 8, level: 4, respect: 3500 },
  { id: '3', name: 'The Gambinos', memberCount: 15, level: 6, respect: 7200 },
]

export default function FamilyPage() {
  if (mockFamily) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">The Corleones</h1>
            <p className="text-mafia-muted">Your crime family</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="mx-auto mb-2 text-gold-500" />
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-mafia-muted">Members</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Swords className="mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">+15</div>
              <div className="text-sm text-mafia-muted">Attack Bonus</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">+15</div>
              <div className="text-sm text-mafia-muted">Defense Bonus</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Crown className="mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">5,000</div>
              <div className="text-sm text-mafia-muted">Family Respect</div>
            </CardContent>
          </Card>
        </div>

        <Button variant="destructive">Leave Family</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Family</h1>
          <p className="text-mafia-muted">Join or create a crime family</p>
        </div>
        <Button>Create Family</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Why Join a Family?</CardTitle>
          <CardDescription>
            Family members receive attack and defense bonuses, share a treasury,
            and can coordinate attacks against rivals.
          </CardDescription>
        </CardHeader>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Available Families</h2>
        <div className="grid gap-4">
          {mockFamilies.map((family) => (
            <Card key={family.id} className="hover:border-gold-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center">
                      <Users className="text-gold-500" />
                    </div>
                    <div>
                      <div className="font-semibold">{family.name}</div>
                      <div className="text-sm text-mafia-muted">
                        Level {family.level} · {family.memberCount} members
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-purple-400">{family.respect.toLocaleString()}</div>
                      <div className="text-xs text-mafia-muted">Respect</div>
                    </div>
                    <Button size="sm">Join</Button>
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
