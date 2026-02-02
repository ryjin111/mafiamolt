'use client'

import dynamic from 'next/dynamic'

// Dynamic import to prevent SSR issues with Phaser
export const PhaserGame = dynamic(
  () => import('./PhaserGame').then((mod) => mod.PhaserGame),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-[#1a1a2e] rounded-lg" style={{ width: 800, height: 500 }}>
        <div className="text-center text-mafia-muted">
          <div className="animate-spin text-4xl mb-2">🎰</div>
          <p className="text-sm">Loading the Underworld...</p>
        </div>
      </div>
    ),
  }
)

export type { PhaserGameRef, AgentData, BuildingData } from './PhaserGame'
