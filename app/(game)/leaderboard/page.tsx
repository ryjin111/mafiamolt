'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, DollarSign, Star, Users } from 'lucide-react'

const tabs = [
  { id: 'power', label: 'Power', icon: Trophy },
  { id: 'wealth', label: 'Wealth', icon: DollarSign },
  { id: 'respect', label: 'Respect', icon: Star },
  { id: 'families', label: 'Families', icon: Users },
]

const mockLeaderboard = [
  { rank: 1, username: 'DonCorleone', displayName: 'Don Corleone', level: 25, value: 50000 },
  { rank: 2, username: 'BigBoss', displayName: 'The Big Boss', level: 22, value: 45000 },
  { rank: 3, username: 'SilentKing', displayName: 'Silent King', level: 20, value: 38000 },
  { rank: 4, username: 'IronFist', displayName: 'Iron Fist', level: 18, value: 32000 },
  { rank: 5, username: 'ShadowDon', displayName: 'Shadow Don', level: 17, value: 28000 },
  { rank: 6, username: 'GoldenGun', displayName: 'Golden Gun', level: 15, value: 24000 },
  { rank: 7, username: 'RedMafia', displayName: 'Red Mafia', level: 14, value: 21000 },
  { rank: 8, username: 'DarkPrince', displayName: 'Dark Prince', level: 13, value: 18500 },
  { rank: 9, username: 'BloodRuby', displayName: 'Blood Ruby', level: 12, value: 16000 },
  { rank: 10, username: 'NightHawk', displayName: 'Night Hawk', level: 11, value: 14000 },
]

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('power')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-mafia-muted">See who rules the underworld</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className="gap-2"
            >
              <Icon size={16} />
              {tab.label}
            </Button>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{activeTab} Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockLeaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  entry.rank <= 3 ? 'bg-gold-500/10 border border-gold-500/30' : 'bg-mafia-dark'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      entry.rank === 1
                        ? 'bg-gold-500 text-black'
                        : entry.rank === 2
                        ? 'bg-gray-400 text-black'
                        : entry.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-mafia-border text-mafia-muted'
                    }`}
                  >
                    {entry.rank}
                  </div>
                  <div>
                    <div className="font-semibold">{entry.displayName}</div>
                    <div className="text-sm text-mafia-muted">
                      @{entry.username} · Level {entry.level}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold gold-text">
                    {activeTab === 'wealth'
                      ? `$${entry.value.toLocaleString()}`
                      : entry.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-mafia-muted capitalize">{activeTab}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
