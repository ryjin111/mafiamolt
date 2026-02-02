import { NextResponse } from 'next/server'
import { prisma, regenerateEnergy, calculateLevelFromExp, calculateTotalPower, AgentWithRelations } from '@/lib/db/prisma'
import { nanoid } from 'nanoid'
import bcrypt from 'bcrypt'
import { getRecentMoltxPosts, getRecentMoltbookPosts, PostResult } from '@/lib/platforms'
import { Agent } from '@prisma/client'



type GameAction = {
  agent: string
  action: string
  result: string
  rewards?: Record<string, string>
}

/**
 * Parse post content for game commands
 * No hashtag required - any post can trigger actions
 * Keywords trigger specific actions, otherwise default to work
 */
function parseCommand(content: string): { action: string; target?: string } {
  const lower = content.toLowerCase()

  // Fight/attack command (looks for "fight @name" or "attack @name" anywhere)
  const fightMatch = content.match(/(?:fight|attack|hit|vs)\s+@?(\w+)/i)
  if (fightMatch) {
    return { action: 'fight', target: fightMatch[1] }
  }

  // Join family command
  const joinMatch = content.match(/join\s+(?:family\s+)?["']?([^"'\n]+?)["']?(?:\s|$|\.)/i)
  if (joinMatch && !lower.includes('create')) {
    return { action: 'join', target: joinMatch[1].trim() }
  }

  // Create family command
  const createMatch = content.match(/(?:create|start|found)\s+(?:family\s+)?["']?([^"'\n]+?)["']?(?:\s|$|\.)/i)
  if (createMatch) {
    return { action: 'create', target: createMatch[1].trim() }
  }

  // Default - any activity = do work/hustle
  return { action: 'work' }
}

/**
 * Execute a job for an agent
 */
async function executeJob(agent: Agent): Promise<GameAction> {
  // Regenerate energy
  const currentEnergy = await regenerateEnergy(agent)

  // Get random available job
  const jobs = await prisma.job.findMany({
    where: { levelRequired: { lte: agent.level } },
  })

  if (jobs.length === 0) {
    return { agent: agent.displayName, action: 'work', result: 'No jobs available' }
  }

  const job = jobs[Math.floor(Math.random() * jobs.length)]

  // Check energy
  if (currentEnergy < job.energyCost) {
    return {
      agent: agent.displayName,
      action: 'work',
      result: `Too tired to work (need ${job.energyCost} energy, have ${currentEnergy})`
    }
  }

  // Calculate success
  const levelBonus = (agent.level - job.levelRequired) * 0.05
  const successRate = Math.min(0.95, job.baseSuccessRate + levelBonus)
  const success = Math.random() < successRate

  let cashEarned = 0
  let respectEarned = 0
  let expEarned = 0

  if (success) {
    cashEarned = Math.floor(Math.random() * (job.cashMax - job.cashMin + 1)) + job.cashMin
    respectEarned = job.respectReward
    expEarned = job.expReward
  } else {
    expEarned = Math.floor(job.expReward * 0.25)
  }

  // Update agent
  const newExp = agent.experience + expEarned
  const newLevel = calculateLevelFromExp(newExp)

  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      energy: currentEnergy - job.energyCost,
      cash: { increment: cashEarned },
      respect: { increment: respectEarned },
      experience: newExp,
      level: newLevel,
      lastActive: new Date(),
    },
  })

  // Record history
  await prisma.jobHistory.create({
    data: {
      agentId: agent.id,
      jobId: job.id,
      success,
      cashEarned,
      respectEarned,
      expEarned,
    },
  })

  return {
    agent: agent.displayName,
    action: 'work',
    result: success ? `Completed "${job.name}"` : `Failed "${job.name}"`,
    rewards: success ? {
      cash: `+$${cashEarned}`,
      respect: `+${respectEarned}`,
      exp: `+${expEarned}`,
    } : { exp: `+${expEarned}` },
  }
}

/**
 * Execute a fight for an agent
 */
async function executeFight(attacker: Agent, targetUsername: string): Promise<GameAction> {
  // Find target
  const defender = await prisma.agent.findUnique({
    where: { username: targetUsername },
    include: { family: true, equipment: true, crew: true },
  })

  if (!defender) {
    return { agent: attacker.displayName, action: 'fight', result: `Target @${targetUsername} not found` }
  }

  if (defender.id === attacker.id) {
    return { agent: attacker.displayName, action: 'fight', result: 'Cannot fight yourself' }
  }

  if (attacker.health < 20) {
    return { agent: attacker.displayName, action: 'fight', result: 'Too injured to fight' }
  }

  // Check cooldown
  const cooldown = await prisma.cooldown.findFirst({
    where: {
      agentId: attacker.id,
      targetId: defender.id,
      type: 'attack',
      expiresAt: { gt: new Date() },
    },
  })

  if (cooldown) {
    return { agent: attacker.displayName, action: 'fight', result: `Already fought @${targetUsername} recently` }
  }

  // Get full attacker
  const fullAttacker = await prisma.agent.findUnique({
    where: { id: attacker.id },
    include: { family: true, equipment: true, crew: true },
  })

  if (!fullAttacker) {
    return { agent: attacker.displayName, action: 'fight', result: 'Error loading stats' }
  }

  // Calculate power
  const attackerPower = calculateTotalPower(fullAttacker as AgentWithRelations)
  const defenderPower = calculateTotalPower(defender as AgentWithRelations)

  const attackerRoll = (attackerPower.attack * 0.7) + (Math.random() * attackerPower.attack * 0.3)
  const defenderRoll = (defenderPower.defense * 0.7) + (Math.random() * defenderPower.defense * 0.3)

  const attackerWins = attackerRoll > defenderRoll
  const winnerId = attackerWins ? attacker.id : defender.id

  // Calculate rewards
  const loserCash = attackerWins ? Number(defender.cash) : Number(attacker.cash)
  const stealPercent = 0.05 + Math.random() * 0.10
  const cashStolen = Math.floor(loserCash * stealPercent)
  const respectChange = attackerWins ? 5 + Math.floor(defender.level / 2) : -3

  // Damage
  const damageToAttacker = attackerWins ? Math.floor(Math.random() * 10) : 15 + Math.floor(Math.random() * 15)
  const damageToDefender = attackerWins ? 15 + Math.floor(Math.random() * 15) : Math.floor(Math.random() * 10)

  // Update both
  if (attackerWins) {
    await prisma.agent.update({
      where: { id: attacker.id },
      data: {
        cash: { increment: cashStolen },
        respect: { increment: respectChange },
        health: Math.max(1, attacker.health - damageToAttacker),
        lastActive: new Date(),
      },
    })
    await prisma.agent.update({
      where: { id: defender.id },
      data: {
        cash: { decrement: cashStolen },
        health: Math.max(1, defender.health - damageToDefender),
      },
    })
  } else {
    await prisma.agent.update({
      where: { id: attacker.id },
      data: {
        cash: { decrement: cashStolen },
        respect: { increment: respectChange },
        health: Math.max(1, attacker.health - damageToAttacker),
        lastActive: new Date(),
      },
    })
    await prisma.agent.update({
      where: { id: defender.id },
      data: {
        cash: { increment: cashStolen },
        health: Math.max(1, defender.health - damageToDefender),
      },
    })
  }

  // Record combat
  await prisma.combat.create({
    data: {
      attackerId: attacker.id,
      defenderId: defender.id,
      attackerPower: attackerPower.attack,
      defenderPower: defenderPower.defense,
      winner: winnerId,
      cashStolen,
      respectChange: attackerWins ? respectChange : 0,
    },
  })

  // Set cooldown
  await prisma.cooldown.upsert({
    where: {
      agentId_targetId_type: {
        agentId: attacker.id,
        targetId: defender.id,
        type: 'attack',
      },
    },
    update: { expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    create: {
      agentId: attacker.id,
      targetId: defender.id,
      type: 'attack',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  })

  return {
    agent: attacker.displayName,
    action: 'fight',
    result: attackerWins
      ? `Defeated @${defender.username}!`
      : `Lost to @${defender.username}`,
    rewards: attackerWins
      ? { cash: `+$${cashStolen}`, respect: `+${respectChange}` }
      : { cash: `-$${cashStolen}`, respect: `${respectChange}` },
  }
}

/**
 * Sync endpoint - pulls posts from MoltX/Moltbook and auto-executes game actions
 */
export async function GET() {
  try {
    // Get recent posts from both platforms (no hashtag required)
    const [moltxPosts, moltbookPosts] = await Promise.all([
      getRecentMoltxPosts(50),
      getRecentMoltbookPosts(50),
    ])

    const allPosts: PostResult[] = [...moltxPosts, ...moltbookPosts]
    const actions: GameAction[] = []
    let synced = 0

    // Process each post
    for (const post of allPosts) {
      // Find or create agent
      let agent = await prisma.agent.findUnique({
        where: { username: post.username },
      })

      if (!agent) {
        // Auto-create agent
        const rawApiKey = `mf_${nanoid(32)}`
        const hashedApiKey = await bcrypt.hash(rawApiKey, 10)

        agent = await prisma.agent.create({
          data: {
            username: post.username,
            displayName: post.displayName || post.username,
            apiKey: hashedApiKey,
            persona: 'silent',
            level: 1,
            experience: 0,
            cash: BigInt(5000),
            respect: 0,
            energy: 100,
            maxEnergy: 100,
            health: 100,
            maxHealth: 100,
            baseAttack: 10,
            baseDefense: 10,
          },
        })
        synced++
      }

      // Parse and execute command
      const command = parseCommand(post.content)

      switch (command.action) {
        case 'work':
          actions.push(await executeJob(agent))
          break

        case 'fight':
          if (command.target) {
            actions.push(await executeFight(agent, command.target))
          }
          break

        case 'join':
          if (command.target) {
            const family = await prisma.family.findFirst({
              where: { name: { contains: command.target, mode: 'insensitive' } },
              include: { members: { select: { id: true } } },
            })
            if (family && family.members.length < 10 && !agent.familyId) {
              await prisma.agent.update({
                where: { id: agent.id },
                data: { familyId: family.id, familyJoinedAt: new Date() },
              })
              actions.push({
                agent: agent.displayName,
                action: 'join',
                result: `Joined ${family.name}!`,
              })
            }
          }
          break

        case 'create':
          if (command.target && agent.level >= 5 && Number(agent.cash) >= 10000 && !agent.familyId) {
            const existing = await prisma.family.findUnique({ where: { name: command.target } })
            if (!existing) {
              const family = await prisma.family.create({
                data: {
                  name: command.target,
                  leaderId: agent.id,
                  level: 1,
                  respect: 0,
                  attackBonus: 5,
                  defenseBonus: 5,
                },
              })
              await prisma.agent.update({
                where: { id: agent.id },
                data: {
                  familyId: family.id,
                  familyJoinedAt: new Date(),
                  cash: { decrement: 10000 },
                },
              })
              actions.push({
                agent: agent.displayName,
                action: 'create',
                result: `Founded ${family.name}!`,
              })
            }
          }
          break
      }
    }

    return NextResponse.json({
      processed: allPosts.length,
      synced,
      actions,
      sources: {
        moltx: moltxPosts.length,
        moltbook: moltbookPosts.length,
      },
    })
  } catch (error) {
    console.error('Platform sync error:', error)
    return NextResponse.json({ processed: 0, synced: 0, actions: [], error: 'Sync failed' })
  }
}
