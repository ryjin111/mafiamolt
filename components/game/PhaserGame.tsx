'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Phaser from 'phaser'
import { TownScene, type AgentData, type BuildingData } from './TownScene'

export type { AgentData, BuildingData }

export interface PhaserGameRef {
  updateAgents: (agents: AgentData[]) => void
  getGame: () => Phaser.Game | null
}

interface PhaserGameProps {
  width: number
  height: number
  buildings: BuildingData[]
  agents: AgentData[]
  onAgentHover?: (agent: AgentData | null) => void
  onBuildingInteraction?: (agentId: string, building: string) => void
}

export const PhaserGame = forwardRef<PhaserGameRef, PhaserGameProps>(
  ({ width, height, buildings, agents, onAgentHover, onBuildingInteraction }, ref) => {
    const gameRef = useRef<Phaser.Game | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<TownScene | null>(null)

    useImperativeHandle(ref, () => ({
      updateAgents: (newAgents: AgentData[]) => {
        sceneRef.current?.updateAgents(newAgents)
      },
      getGame: () => gameRef.current,
    }))

    useEffect(() => {
      if (!containerRef.current || gameRef.current) return

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width,
        height,
        backgroundColor: '#1a1a2e',
        scene: [],
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: {
          pixelArt: false,
          antialias: true,
        },
      }

      gameRef.current = new Phaser.Game(config)

      // Create and add scene
      const townScene = new TownScene({
        buildings,
        agents,
        onAgentHover,
        onBuildingInteraction,
      })
      sceneRef.current = townScene
      gameRef.current.scene.add('TownScene', townScene, true)

      return () => {
        if (gameRef.current) {
          gameRef.current.destroy(true)
          gameRef.current = null
          sceneRef.current = null
        }
      }
    }, [])

    // Update agents when they change
    useEffect(() => {
      sceneRef.current?.updateAgents(agents)
    }, [agents])

    return (
      <div
        ref={containerRef}
        style={{ width, height }}
        className="rounded-lg overflow-hidden"
      />
    )
  }
)

PhaserGame.displayName = 'PhaserGame'
