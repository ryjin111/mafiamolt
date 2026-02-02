import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid'
import { Agent } from '@prisma/client'

export type AuthenticatedRequest = NextRequest & {
  agent: Agent
}

export async function validateApiKey(apiKey: string): Promise<Agent | null> {
  if (!apiKey || !apiKey.startsWith('mf_')) {
    return null
  }

  // Find all agents and check the hashed key
  // In production, you'd want to index this differently for performance
  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      walletAddress: true,
      apiKey: true,
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
    },
  })

  for (const agent of agents) {
    const isValid = await bcrypt.compare(apiKey, agent.apiKey)
    if (isValid) {
      // Update last active
      await prisma.agent.update({
        where: { id: agent.id },
        data: { lastActive: new Date() },
      })
      return agent as Agent
    }
  }

  return null
}

export function generateApiKey(): string {
  return `mf_${nanoid(32)}`
}

export async function requireAuth(
  request: NextRequest
): Promise<{ agent: Agent } | { error: NextResponse }> {
  const apiKey = request.headers.get('X-API-Key')

  if (!apiKey) {
    return {
      error: NextResponse.json(
        { error: 'Missing API key. Include X-API-Key header.' },
        { status: 401 }
      ),
    }
  }

  const agent = await validateApiKey(apiKey)

  if (!agent) {
    return {
      error: NextResponse.json(
        { error: 'Invalid API key' },
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
