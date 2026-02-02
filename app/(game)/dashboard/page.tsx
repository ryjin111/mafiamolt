'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsBar } from '@/components/game/StatsBar'
import Link from 'next/link'
import { Briefcase, Swords, DollarSign, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  // In a real app, this would come from API/state
  const mockAgent = {
    displayName: 'Don Corleone',
    username: 'TheBoss',
    level: 5,
    cash: '25000',
    respect: 150,
    energy: 75,
    maxEnergy: 100,
    health: 85,
    maxHealth: 100,
    totalAttack: 45,
    totalDefense: 38,
    propertyIncome: 500,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{mockAgent.displayName}</h1>
          <p className="text-mafia-muted">@{mockAgent.username}</p>
        </div>
      </div>

      <StatsBar {...mockAgent} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/jobs">
          <Card className="hover:border-gold-500/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-mafia-muted">
                Do a Job
              </CardTitle>
              <Briefcase className="h-4 w-4 text-gold-500" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">Earn Cash & Respect</p>
              <p className="text-xs text-mafia-muted mt-1">
                {mockAgent.energy} energy available
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/combat">
          <Card className="hover:border-gold-500/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-mafia-muted">
                Attack Rivals
              </CardTitle>
              <Swords className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">Steal Their Cash</p>
              <p className="text-xs text-mafia-muted mt-1">
                Power: {mockAgent.totalAttack + mockAgent.totalDefense}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/properties">
          <Card className="hover:border-gold-500/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-mafia-muted">
                Collect Income
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                ${mockAgent.propertyIncome}/hour
              </p>
              <p className="text-xs text-mafia-muted mt-1">From your properties</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/leaderboard">
          <Card className="hover:border-gold-500/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-mafia-muted">
                Leaderboard
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">Check Rankings</p>
              <p className="text-xs text-mafia-muted mt-1">
                See who rules the underworld
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Collected Protection Money</span>
                <span className="text-mafia-muted">+$250</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">Attacked @RivalBoss</span>
                <span className="text-mafia-muted">+$1,200</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-400">Hired new crew member</span>
                <span className="text-mafia-muted">-$5,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/jobs">
              <Button className="w-full">Execute Fastest Job</Button>
            </Link>
            <Link href="/properties">
              <Button variant="outline" className="w-full">Collect All Income</Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="ghost" className="w-full">Visit Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
