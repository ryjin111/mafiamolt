import Phaser from 'phaser'

export interface AgentData {
  id: string
  username: string
  displayName: string
  level: number
  persona: string
  lastAction: string
  lastActionTime: string
  position: { x: number; y: number }
  direction: 'left' | 'right'
  isMoving: boolean
  speech?: string
  speechTimeout?: number
  activity?: string
  targetBuilding?: string
}

export interface BuildingData {
  name: string
  x: number
  y: number
  icon: string
}

interface TownSceneConfig {
  buildings: BuildingData[]
  agents: AgentData[]
  onAgentHover?: (agent: AgentData | null) => void
  onBuildingInteraction?: (agentId: string, building: string) => void
}

// Persona colors for sprites
const PERSONA_COLORS: Record<string, number> = {
  ruthless: 0x8b0000,    // Dark red
  honorable: 0x2c3e50,   // Navy blue
  chaotic: 0x4a0080,     // Purple
  silent: 0x0a0a0a,      // Black
  default: 0x2c2c2c,     // Dark gray
}

// Waypoints for pathfinding
const WAYPOINTS = [
  { x: 0.20, y: 0.50 },
  { x: 0.35, y: 0.55 },
  { x: 0.55, y: 0.55 },
  { x: 0.48, y: 0.42 },
  { x: 0.70, y: 0.55 },
  { x: 0.78, y: 0.48 },
  { x: 0.25, y: 0.72 },
  { x: 0.74, y: 0.72 },
  { x: 0.40, y: 0.75 },
  { x: 0.60, y: 0.75 },
]

class AgentSprite {
  scene: TownScene
  data: AgentData
  container: Phaser.GameObjects.Container
  body: Phaser.GameObjects.Graphics
  levelBadge: Phaser.GameObjects.Container
  nameTag: Phaser.GameObjects.Text
  speechBubble: Phaser.GameObjects.Container | null = null
  activityIndicator: Phaser.GameObjects.Text | null = null

  targetX: number
  targetY: number
  speed: number = 80 // pixels per second
  isMovingToTarget: boolean = false

  // Autonomous movement
  nextMoveTime: number = 0
  moveInterval: number = 2000 // ms between decisions

  constructor(scene: TownScene, data: AgentData) {
    this.scene = scene
    this.data = data
    this.targetX = data.position.x
    this.targetY = data.position.y

    // Create container for all agent elements
    this.container = scene.add.container(data.position.x, data.position.y)
    this.container.setDepth(10)

    // Create body sprite
    this.body = scene.add.graphics()
    this.drawBody()
    this.container.add(this.body)

    // Level badge
    this.levelBadge = this.createLevelBadge()
    this.container.add(this.levelBadge)

    // Name tag
    this.nameTag = scene.add.text(0, 28, data.displayName, {
      fontSize: '10px',
      color: '#c9a227',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 4, y: 2 },
    })
    this.nameTag.setOrigin(0.5, 0)
    this.container.add(this.nameTag)

    // Make interactive
    this.container.setSize(48, 48)
    this.container.setInteractive()

    this.container.on('pointerover', () => {
      scene.config.onAgentHover?.(this.data)
    })

    this.container.on('pointerout', () => {
      scene.config.onAgentHover?.(null)
    })

    // Schedule first move
    this.nextMoveTime = scene.time.now + Math.random() * this.moveInterval
  }

  private drawBody() {
    const color = PERSONA_COLORS[this.data.persona] || PERSONA_COLORS.default

    this.body.clear()

    // Hat
    this.body.fillStyle(0x1a1a1a, 1)
    this.body.fillEllipse(0, -18, 28, 6)
    this.body.fillRect(-10, -24, 20, 8)

    // Head
    this.body.fillStyle(0xe8c4a0, 1)
    this.body.fillEllipse(0, -12, 16, 12)

    // Eyes
    this.body.fillStyle(0x1a1a1a, 1)
    this.body.fillEllipse(-4, -13, 3, 2)
    this.body.fillEllipse(4, -13, 3, 2)

    // Body
    this.body.fillStyle(color, 1)
    this.body.fillTriangle(-12, -4, 12, -4, 10, 20)
    this.body.fillTriangle(-12, -4, -10, 20, 10, 20)

    // Shirt/tie area
    this.body.fillStyle(0xffffff, 1)
    this.body.fillTriangle(-2, -4, 2, -4, 0, 10)

    // Tie
    this.body.fillStyle(0x8b0000, 1)
    this.body.fillTriangle(-1, -2, 1, -2, 0, 12)
  }

  private createLevelBadge(): Phaser.GameObjects.Container {
    const badge = this.scene.add.container(14, -20)

    const bg = this.scene.add.graphics()
    bg.fillStyle(0xc9a227, 1)
    bg.fillCircle(0, 0, 8)
    badge.add(bg)

    const text = this.scene.add.text(0, 0, String(this.data.level), {
      fontSize: '10px',
      color: '#000000',
      fontStyle: 'bold',
    })
    text.setOrigin(0.5, 0.5)
    badge.add(text)

    return badge
  }

  showSpeech(text: string, duration: number = 4000) {
    this.hideSpeech()

    this.speechBubble = this.scene.add.container(0, -45)

    // Background
    const bg = this.scene.add.graphics()
    const textObj = this.scene.add.text(0, 0, text, {
      fontSize: '9px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 6, y: 4 },
      wordWrap: { width: 120 },
    })
    textObj.setOrigin(0.5, 1)

    // Draw rounded rect background
    const bounds = textObj.getBounds()
    bg.fillStyle(0xffffff, 1)
    bg.lineStyle(2, 0xc9a227, 1)
    bg.fillRoundedRect(
      -bounds.width / 2 - 2,
      -bounds.height - 2,
      bounds.width + 4,
      bounds.height + 4,
      6
    )
    bg.strokeRoundedRect(
      -bounds.width / 2 - 2,
      -bounds.height - 2,
      bounds.width + 4,
      bounds.height + 4,
      6
    )

    // Speech bubble tail
    bg.fillTriangle(0, 0, -6, -4, 6, -4)

    this.speechBubble.add(bg)
    this.speechBubble.add(textObj)
    this.container.add(this.speechBubble)

    // Auto-hide after duration
    this.scene.time.delayedCall(duration, () => {
      this.hideSpeech()
    })
  }

  hideSpeech() {
    if (this.speechBubble) {
      this.speechBubble.destroy()
      this.speechBubble = null
    }
  }

  showActivity(icon: string) {
    this.hideActivity()

    this.activityIndicator = this.scene.add.text(-14, 16, icon, {
      fontSize: '12px',
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      padding: { x: 2, y: 1 },
    })
    this.container.add(this.activityIndicator)
  }

  hideActivity() {
    if (this.activityIndicator) {
      this.activityIndicator.destroy()
      this.activityIndicator = null
    }
  }

  setTarget(x: number, y: number) {
    this.targetX = x
    this.targetY = y
    this.isMovingToTarget = true
  }

  update(time: number, delta: number) {
    // Autonomous movement decisions
    if (time > this.nextMoveTime) {
      this.nextMoveTime = time + this.moveInterval + Math.random() * 1000
      this.makeMovementDecision()
    }

    // Smooth movement towards target
    if (this.isMovingToTarget) {
      const dx = this.targetX - this.container.x
      const dy = this.targetY - this.container.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 2) {
        // Arrived at target
        this.container.x = this.targetX
        this.container.y = this.targetY
        this.isMovingToTarget = false
      } else {
        // Move towards target
        const dt = delta / 1000
        const moveSpeed = this.speed * dt
        const moveX = (dx / dist) * Math.min(moveSpeed, dist)
        const moveY = (dy / dist) * Math.min(moveSpeed, dist)

        this.container.x += moveX
        this.container.y += moveY

        // Update direction (flip sprite)
        if (Math.abs(dx) > 1) {
          this.body.setScale(dx > 0 ? 1 : -1, 1)
        }

        // Walking animation (bob up and down)
        const wobble = Math.sin(time * 0.01) * 2
        this.body.y = wobble
      }
    }

    // Update data position
    this.data.position.x = this.container.x
    this.data.position.y = this.container.y
  }

  private makeMovementDecision() {
    const roll = Math.random()
    const mapWidth = this.scene.mapWidth
    const mapHeight = this.scene.mapHeight

    // 30% chance to go to a building
    if (roll < 0.3) {
      const building = this.scene.config.buildings[
        Math.floor(Math.random() * this.scene.config.buildings.length)
      ]
      const targetX = building.x * mapWidth + (Math.random() - 0.5) * 40
      const targetY = building.y * mapHeight + (Math.random() - 0.5) * 30

      this.setTarget(targetX, targetY)

      // Show activity and speech
      const icon = building.name === 'Fight Club' ? '🥊' :
                   building.name === 'The Vault' ? '💰' :
                   building.name === 'Casino' ? '🎰' : '📍'
      this.showActivity(icon)

      const speeches: Record<string, string[]> = {
        'Family HQ': ['🏛️ Checking in...', '🤝 Family meeting'],
        'Fight Club': ['🥊 Looking for a fight...', '💪 Time to rumble'],
        'The Vault': ['💰 Counting cash...', '🏦 Making a deposit'],
        'Black Market': ['🏪 Shopping for gear...', '🔫 Need equipment'],
        'Casino': ['🎰 Feeling lucky...', '🎲 Let it ride!'],
        'Properties': ['🏠 Checking investments...', '📈 Empire building'],
        'Back Alleys': ['🗑️ Shady business...', '🌙 Low profile'],
      }
      const buildingSpeeches = speeches[building.name] || ['👀 On the move...']
      this.showSpeech(buildingSpeeches[Math.floor(Math.random() * buildingSpeeches.length)])

      // Trigger building interaction
      this.scene.config.onBuildingInteraction?.(this.data.id, building.name)

    // 40% chance to move to waypoint
    } else if (roll < 0.7) {
      const waypoint = WAYPOINTS[Math.floor(Math.random() * WAYPOINTS.length)]
      const targetX = waypoint.x * mapWidth
      const targetY = waypoint.y * mapHeight

      this.setTarget(targetX, targetY)
      this.hideActivity()

      // Random idle speech
      if (Math.random() < 0.15) {
        const idleSpeeches = ['😎 Just vibing...', '👀 Watching the streets', '🚶 Walking around']
        this.showSpeech(idleSpeeches[Math.floor(Math.random() * idleSpeeches.length)])
      }

    // 30% stay idle
    } else {
      this.hideActivity()
    }
  }

  updateData(data: AgentData) {
    this.data = data

    // Update name tag
    this.nameTag.setText(data.displayName)

    // Update level badge
    const levelText = this.levelBadge.getAt(1) as Phaser.GameObjects.Text
    levelText.setText(String(data.level))

    // If data has speech, show it
    if (data.speech && !this.speechBubble) {
      this.showSpeech(data.speech)
    }
  }

  destroy() {
    this.container.destroy()
  }
}

export class TownScene extends Phaser.Scene {
  config: TownSceneConfig
  mapWidth: number = 800
  mapHeight: number = 500
  agents: Map<string, AgentSprite> = new Map()
  buildingZones: Phaser.GameObjects.Container[] = []

  constructor(config: TownSceneConfig) {
    super({ key: 'TownScene' })
    this.config = config
  }

  preload() {
    // Load map background
    this.load.image('map', '/map.png')
  }

  create() {
    // Add map background
    const map = this.add.image(0, 0, 'map')
    map.setOrigin(0, 0)
    map.setDisplaySize(this.mapWidth, this.mapHeight)

    // Create building hover zones
    this.config.buildings.forEach((building) => {
      this.createBuildingZone(building)
    })

    // Create initial agents
    this.config.agents.forEach((agent) => {
      this.createAgent(agent)
    })
  }

  createBuildingZone(building: BuildingData) {
    const x = building.x * this.mapWidth
    const y = building.y * this.mapHeight

    const zone = this.add.container(x, y)
    zone.setDepth(5)

    // Invisible hit zone
    const hitZone = this.add.rectangle(0, 0, 80, 80, 0x000000, 0)
    hitZone.setInteractive()
    zone.add(hitZone)

    // Tooltip (hidden by default)
    const tooltip = this.add.text(0, -50, `${building.icon} ${building.name}`, {
      fontSize: '11px',
      color: '#c9a227',
      backgroundColor: 'rgba(0,0,0,0.9)',
      padding: { x: 6, y: 4 },
    })
    tooltip.setOrigin(0.5, 1)
    tooltip.setVisible(false)
    zone.add(tooltip)

    hitZone.on('pointerover', () => {
      tooltip.setVisible(true)
    })

    hitZone.on('pointerout', () => {
      tooltip.setVisible(false)
    })

    this.buildingZones.push(zone)
  }

  createAgent(data: AgentData): AgentSprite {
    const agent = new AgentSprite(this, data)
    this.agents.set(data.id, agent)
    return agent
  }

  updateAgents(newAgents: AgentData[]) {
    const newIds = new Set(newAgents.map((a) => a.id))

    // Remove agents that no longer exist
    this.agents.forEach((agent, id) => {
      if (!newIds.has(id)) {
        agent.destroy()
        this.agents.delete(id)
      }
    })

    // Update or create agents
    newAgents.forEach((data) => {
      const existing = this.agents.get(data.id)
      if (existing) {
        existing.updateData(data)
      } else {
        this.createAgent(data)
      }
    })
  }

  update(time: number, delta: number) {
    // Update all agents
    this.agents.forEach((agent) => {
      agent.update(time, delta)
    })
  }
}
