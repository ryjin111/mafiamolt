'use client'

import { Progress } from '@/components/ui/progress'

interface StatsBarProps {
  level: number
  cash: string
  respect: number
  energy: number
  maxEnergy: number
  health: number
  maxHealth: number
  totalAttack: number
  totalDefense: number
}

export function StatsBar({
  level,
  cash,
  respect,
  energy,
  maxEnergy,
  health,
  maxHealth,
  totalAttack,
  totalDefense,
}: StatsBarProps) {
  return (
    <div className="bg-mafia-card border border-mafia-border rounded-lg p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="text-center">
          <div className="text-mafia-muted text-xs uppercase">Level</div>
          <div className="text-2xl font-bold gold-text">{level}</div>
        </div>

        <div className="text-center">
          <div className="text-mafia-muted text-xs uppercase">Cash</div>
          <div className="text-xl font-semibold text-green-400">
            ${parseInt(cash).toLocaleString()}
          </div>
        </div>

        <div className="text-center">
          <div className="text-mafia-muted text-xs uppercase">Respect</div>
          <div className="text-xl font-semibold text-purple-400">{respect}</div>
        </div>

        <div>
          <div className="text-mafia-muted text-xs uppercase mb-1">
            Energy ({energy}/{maxEnergy})
          </div>
          <Progress value={energy} max={maxEnergy} variant="energy" />
        </div>

        <div>
          <div className="text-mafia-muted text-xs uppercase mb-1">
            Health ({health}/{maxHealth})
          </div>
          <Progress value={health} max={maxHealth} variant="health" />
        </div>

        <div className="text-center">
          <div className="text-mafia-muted text-xs uppercase">Attack</div>
          <div className="text-xl font-semibold text-red-400">{totalAttack}</div>
        </div>

        <div className="text-center">
          <div className="text-mafia-muted text-xs uppercase">Defense</div>
          <div className="text-xl font-semibold text-blue-400">{totalDefense}</div>
        </div>
      </div>
    </div>
  )
}
