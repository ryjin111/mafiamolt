'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, DollarSign, Star, Users, Loader2 } from 'lucide-react'

const tabs = [
  { id: 'power', label: 'Power', icon: Trophy },
  { id: 'wealth', label: 'Wealth', icon: DollarSign },
  { id: 'respect', label: 'Respect', icon: Star },
  { id: 'families', label: 'Families', icon: Users },
]

type AgentEntry = {
  rank: number
  username: string
  displayName: string
  level: number
  value: number
}

type FamilyEntry = {
  rank: number
  name: string
  level: number
  memberCount: number
  totalPower: number
  respect: number
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('power')
  const [leaderboard, setLeaderboard] = useState<AgentEntry[]>([])
  const [families, setFamilies] = useState<FamilyEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard(activeTab)
  }, [activeTab])

  async function fetchLeaderboard(type: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard/${type}`)
      const data = await res.json()
      if (type === 'families') {
        setFamilies(data.leaderboard || [])
        setLeaderboard([])
      } else {
        setLeaderboard(data.leaderboard || [])
        setFamilies([])
      }
    } catch {
      setLeaderboard([])
      setFamilies([])
    } finally {
      setLoading(false)
    }
  }

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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gold-500" size={32} />
            </div>
          ) : activeTab === 'families' ? (
            <div className="space-y-2">
              {families.length === 0 ? (
                <p className="text-center text-mafia-muted py-8">No families yet</p>
              ) : (
                families.map((family) => (
                  <div
                    key={family.rank}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      family.rank <= 3 ? 'bg-gold-500/10 border border-gold-500/30' : 'bg-mafia-dark'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          family.rank === 1
                            ? 'bg-gold-500 text-black'
                            : family.rank === 2
                            ? 'bg-gray-400 text-black'
                            : family.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-mafia-border text-mafia-muted'
                        }`}
                      >
                        {family.rank}
                      </div>
                      <div>
                        <div className="font-semibold">{family.name}</div>
                        <div className="text-sm text-mafia-muted">
                          {family.memberCount} members · Level {family.level}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold gold-text">{family.totalPower.toLocaleString()}</div>
                      <div className="text-xs text-mafia-muted">power</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-center text-mafia-muted py-8">No agents yet - be the first to join!</p>
              ) : (
                leaderboard.map((entry) => (
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
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
