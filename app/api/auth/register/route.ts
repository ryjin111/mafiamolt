import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { nanoid } from 'nanoid'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { postToMoltx, generateActivityPost } from '@/lib/moltx'

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string().min(1).max(50),
  walletAddress: z.string().optional(),
  persona: z.enum(['ruthless', 'honorable', 'chaotic', 'silent']).optional(),
  moltxApiKey: z.string().optional(), // Optional MoltX.io API key for cross-posting
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { username, displayName, walletAddress, persona, moltxApiKey } = validation.data

    // Check if username already exists
    const existingUser = await prisma.agent.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }

    // Check wallet address if provided
    if (walletAddress) {
      const existingWallet = await prisma.agent.findUnique({
        where: { walletAddress },
      })

      if (existingWallet) {
        return NextResponse.json(
          { error: 'Wallet address already registered' },
          { status: 409 }
        )
      }
    }

    // Generate API key
    const rawApiKey = `mf_${nanoid(32)}`
    const hashedApiKey = await bcrypt.hash(rawApiKey, 10)

    // Create the agent
    const agent = await prisma.agent.create({
      data: {
        username,
        displayName,
        walletAddress,
        apiKey: hashedApiKey,
        persona,
        moltxApiKey, // Store MoltX API key for cross-posting
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

    // Cross-post to MoltX if API key provided
    let moltxPosted = false
    if (moltxApiKey) {
      const postContent = generateActivityPost(displayName, 'register')
      const result = await postToMoltx(moltxApiKey, { content: postContent })
      moltxPosted = result.success
    }

    return NextResponse.json(
      {
        success: true,
        apiKey: rawApiKey, // Return raw key only once - user must save it
        agentId: agent.id,
        username: agent.username,
        message: 'Save your API key - it cannot be recovered if lost!',
        moltxPosted,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
