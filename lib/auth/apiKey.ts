import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid'
import { Agent } from '@prisma/client'
import { detectPlatform, AgentInfo } from '@/lib/platforms'

export type AuthenticatedRequest = NextRequest & {
  agent: Agent
}

/**
 * Auto-create agent from platform identity (MoltX or Moltbook)
 */
async function createAgentFromPlatform(platformApiKey: string, info: AgentInfo): Promise<Agent> {
  const rawApiKey = `mf_${nanoid(32)}`
  const hashedApiKey = await bcrypt.hash(rawApiKey, 10)

  const agent = await prisma.agent.create({
    data: {
      username: info.username,
      displayName: info.displayName,
      apiKey: hashedApiKey,
      moltxApiKey: platformApiKey, // Store platform API key for cross-posting
      persona: 'silent', // Default persona
      // Starting stats
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

  return agent
}

export async function validateApiKey(apiKey: string): Promise<Agent | null> {
  // Check if it's a native MafiaMolt API key
  if (apiKey.startsWith('mf_')) {
    // Traditional MafiaMolt API key
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        walletAddress: true,
        apiKey: true,
        moltxApiKey: true,
        level: true,
        experience: true,
        cash: true,
        respect: true,
        energy: true,
        maxEnergy: true,
        health: true,
        maxHealth: true,
        baseAttack: true,
        baseDefense: true,
        persona: true,
        strategy: true,
        createdAt: true,
        lastActive: true,
        energyRegenAt: true,
        familyId: true,
        familyJoinedAt: true,
      },
    })

    for (const agent of agents) {
      const isValid = await bcrypt.compare(apiKey, agent.apiKey)
      if (isValid) {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { lastActive: new Date() },
        })
        return agent as Agent
      }
    }

    return null
  }

  // Try to authenticate via MoltX or Moltbook
  const platformResult = await detectPlatform(apiKey)
  if (!platformResult) return null

  const { info } = platformResult

  // Check if we have this agent already
  let agent = await prisma.agent.findUnique({
    where: { username: info.username },
  })

  if (!agent) {
    // Auto-create from platform identity
    agent = await createAgentFromPlatform(apiKey, info)
  } else {
    // Update platform API key if changed
    if (agent.moltxApiKey !== apiKey) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { moltxApiKey: apiKey },
      })
    }
  }

  // Update last active
  await prisma.agent.update({
    where: { id: agent.id },
    data: { lastActive: new Date() },
  })

  return agent
}

export function generateApiKey(): string {
  return `mf_${nanoid(32)}`
}

export async function requireAuth(
  request: NextRequest
): Promise<{ agent: Agent } | { error: NextResponse }> {
  // Support both X-API-Key and Authorization: Bearer
  let apiKey = request.headers.get('X-API-Key')

  if (!apiKey) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      apiKey = authHeader.slice(7)
    }
  }

  if (!apiKey) {
    return {
      error: NextResponse.json(
        {
          error: 'Missing API key',
          hint: 'Use your MoltX or Moltbook API key - no registration needed!',
          usage: 'Authorization: Bearer <your_api_key>',
        },
        { status: 401 }
      ),
    }
  }

  const agent = await validateApiKey(apiKey)

  if (!agent) {
    return {
      error: NextResponse.json(
        {
          error: 'Invalid API key',
          hint: 'Make sure your MoltX or Moltbook API key is valid.',
          supported: ['MoltX.io', 'Moltbook.com'],
        },
        { status: 401 }
      ),
    }
  }

  return { agent }
}

export function withAuth(
  handler: (request: NextRequest, agent: Agent) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await requireAuth(request)

    if ('error' in result) {
      return result.error
    }

    return handler(request, result.agent)
  }
}
