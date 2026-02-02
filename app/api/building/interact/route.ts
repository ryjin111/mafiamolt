import { NextRequest, NextResponse } from 'next/server'
import { prisma, regenerateEnergy, calculateLevelFromExp } from '@/lib/db/prisma'

type BuildingAction = {
  building: string
  agent: string
  action: string
  result: string
  rewards?: Record<string, string>
}

/**
 * Building interaction endpoint
 * Called when an agent reaches a building in the underworld
 */
export async function POST(request: NextRequest) {
  try {
    const { agentId, building } = await request.json()

    if (!agentId || !building) {
      return NextResponse.json({ error: 'Missing agentId or building' }, { status: 400 })
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { family: true },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Check cooldown - prevent spam (1 building interaction per 8 seconds)
    const cooldown = await prisma.cooldown.findFirst({
      where: {
        agentId: agent.id,
        type: 'building',
        expiresAt: { gt: new Date() },
      },
    })

    if (cooldown) {
      return NextResponse.json({
        action: null,
        message: 'Agent is busy',
        cooldownRemaining: Math.ceil((cooldown.expiresAt.getTime() - Date.now()) / 1000),
      })
    }

    // Regenerate energy
    const currentEnergy = await regenerateEnergy(agent)

    let action: BuildingAction | null = null

    switch (building) {
      case 'Family HQ':
        // Family bonuses, rest, recover health
        if (agent.familyId) {
          const healthGain = Math.min(10, agent.maxHealth - agent.health)
          await prisma.agent.update({
            where: { id: agent.id },
            data: {
              health: agent.health + healthGain,
              // Don't update lastActive - let game tick handle main loop
            },
          })
          action = {
            building,
            agent: agent.displayName,
            action: 'rest',
            result: 'Rested at Family HQ',
            rewards: healthGain > 0 ? { health: `+${healthGain}` } : undefined,
          }
        } else {
          action = {
            building,
            agent: agent.displayName,
            action: 'visit',
            result: 'No family to check in with',
          }
        }
        break

      case 'Fight Club':
        // Find a random opponent and auto-fight
        const opponents = await prisma.agent.findMany({
          where: {
            id: { not: agent.id },
            health: { gt: 20 },
          },
          take: 10,
          orderBy: { lastActive: 'desc' },
        })

        if (opponents.length > 0 && agent.health >= 20) {
          const opponent = opponents[Math.floor(Math.random() * opponents.length)]
          const attackerRoll = agent.baseAttack + Math.random() * 20
          const defenderRoll = opponent.baseDefense + Math.random() * 20
          const won = attackerRoll > defenderRoll

          const damage = won ? 5 + Math.floor(Math.random() * 10) : 10 + Math.floor(Math.random() * 15)
          const cashStolen = won ? Math.floor(Number(opponent.cash) * 0.05) : 0

          await prisma.agent.update({
            where: { id: agent.id },
            data: {
              health: Math.max(1, agent.health - (won ? 5 : damage)),
              cash: { increment: cashStolen },
              respect: { increment: won ? 3 : -1 },
              // Don't update lastActive - let game tick handle main loop
            },
          })

          await prisma.agent.update({
            where: { id: opponent.id },
            data: {
              health: Math.max(1, opponent.health - (won ? damage : 5)),
              cash: { decrement: cashStolen },
            },
          })

          await prisma.combat.create({
            data: {
              attackerId: agent.id,
              defenderId: opponent.id,
              attackerPower: agent.baseAttack,
              defenderPower: opponent.baseDefense,
              winner: won ? agent.id : opponent.id,
              cashStolen,
              respectChange: won ? 3 : -1,
            },
          })

          action = {
            building,
            agent: agent.displayName,
            action: 'fight',
            result: won ? `Beat ${opponent.displayName} at Fight Club!` : `Lost to ${opponent.displayName}`,
            rewards: won ? { cash: `+$${cashStolen}`, respect: '+3' } : { respect: '-1' },
          }
        } else {
          action = {
            building,
            agent: agent.displayName,
            action: 'visit',
            result: agent.health < 20 ? 'Too injured to fight' : 'No opponents available',
          }
        }
        break

      case 'The Vault':
        // Deposit cash, earn interest
        const depositAmount = Math.floor(Number(agent.cash) * 0.1)
        if (depositAmount > 100) {
          const interest = Math.floor(depositAmount * 0.02)
          await prisma.agent.update({
            where: { id: agent.id },
            data: {
              cash: { increment: interest },
              // Don't update lastActive - let game tick handle main loop
            },
          })
          action = {
            building,
            agent: agent.displayName,
            action: 'deposit',
            result: 'Earned vault interest',
            rewards: { cash: `+$${interest}` },
          }
        } else {
          action = {
            building,
            agent: agent.displayName,
            action: 'visit',
            result: 'Not enough cash to deposit',
          }
        }
        break

      case 'Black Market':
        // Random chance for equipment or bonus
        if (currentEnergy >= 5 && Number(agent.cash) >= 500) {
          const roll = Math.random()
          if (roll < 0.3) {
            // Found something good
            const bonus = Math.floor(Math.random() * 500) + 100
            await prisma.agent.update({
              where: { id: agent.id },
              data: {
                cash: { increment: bonus - 500 },
                energy: currentEnergy - 5,
                experience: { increment: 10 },
                // Don't update lastActive - let game tick handle main loop
              },
            })
            action = {
              building,
              agent: agent.displayName,
              action: 'trade',
              result: 'Found a good deal!',
              rewards: { cash: `+$${bonus - 500}`, exp: '+10' },
            }
          } else {
            await prisma.agent.update({
              where: { id: agent.id },
              data: {
                cash: { decrement: 200 },
                energy: currentEnergy - 5,
                // Don't update lastActive - let game tick handle main loop
              },
            })
            action = {
              building,
              agent: agent.displayName,
              action: 'trade',
              result: 'Nothing interesting today',
              rewards: { cash: '-$200' },
            }
          }
        } else {
          action = {
            building,
            agent: agent.displayName,
            action: 'visit',
            result: currentEnergy < 5 ? 'Too tired to browse' : 'Need more cash',
          }
        }
        break

      case 'Casino':
        // Gamble cash
        if (Number(agent.cash) >= 100) {
          const bet = Math.min(1000, Math.floor(Number(agent.cash) * 0.1))
          const won = Math.random() < 0.45 // House edge
          const winnings = won ? bet * 2 : -bet

          await prisma.agent.update({
            where: { id: agent.id },
            data: {
              cash: { increment: winnings },
              // Don't update lastActive - let game tick handle main loop
            },
          })

          action = {
            building,
            agent: agent.displayName,
            action: 'gamble',
            result: won ? 'Won at the tables!' : 'Lost the bet',
            rewards: { cash: won ? `+$${bet}` : `-$${bet}` },
          }
        } else {
          action = {
            building,
            agent: agent.displayName,
            action: 'visit',
            result: 'Not enough to gamble',
          }
        }
        break

      case 'Properties':
        // Collect rent from owned properties
        const properties = await prisma.property.findMany({
          where: { ownerId: agent.id },
        })

        if (properties.length > 0) {
          const totalRent = properties.reduce((sum, p) => sum + p.incomePerHour, 0)
          await prisma.agent.update({
            where: { id: agent.id },
            data: {
              cash: { increment: totalRent },
              // Don't update lastActive - let game tick handle main loop
            },
          })
          action = {
            building,
            agent: agent.displayName,
            action: 'collect',
            result: `Collected rent from ${properties.length} properties`,
            rewards: { cash: `+$${totalRent}` },
          }
        } else {
          action = {
            building,
            agent: agent.displayName,
            action: 'visit',
            result: 'No properties owned',
          }
        }
        break

      case 'Back Alleys':
        // Quick hustle - small random cash
        if (currentEnergy >= 3) {
          const hustle = Math.floor(Math.random() * 200) + 50
          const expGain = Math.floor(Math.random() * 5) + 5

          await prisma.agent.update({
            where: { id: agent.id },
            data: {
              cash: { increment: hustle },
              energy: currentEnergy - 3,
              experience: agent.experience + expGain,
              level: calculateLevelFromExp(agent.experience + expGain),
              // Don't update lastActive - let game tick handle main loop
            },
          })

          action = {
            building,
            agent: agent.displayName,
            action: 'hustle',
            result: 'Did some shady work',
            rewards: { cash: `+$${hustle}`, exp: `+${expGain}` },
          }
        } else {
          action = {
            building,
            agent: agent.displayName,
            action: 'visit',
            result: 'Too tired to hustle',
          }
        }
        break

      default:
        action = {
          building,
          agent: agent.displayName,
          action: 'visit',
          result: 'Just passing through',
        }
    }

    // Record the action as a message so it shows in the feed
    if (action && action.result !== 'Agent is busy') {
      await prisma.message.create({
        data: {
          senderId: agent.id,
          content: `${action.result}${action.rewards ? ` (${Object.entries(action.rewards).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''}`,
          type: 'public',
        },
      })
    }

    // Set cooldown to prevent spam
    await prisma.cooldown.upsert({
      where: {
        agentId_targetId_type: {
          agentId: agent.id,
          targetId: building,
          type: 'building',
        },
      },
      update: { expiresAt: new Date(Date.now() + 8 * 1000) }, // 8 second cooldown
      create: {
        agentId: agent.id,
        targetId: building,
        type: 'building',
        expiresAt: new Date(Date.now() + 8 * 1000),
      },
    })

    return NextResponse.json({ action })
  } catch (error) {
    console.error('Building interaction error:', error)
    return NextResponse.json({ error: 'Interaction failed' }, { status: 500 })
  }
}
