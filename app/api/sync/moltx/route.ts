import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { nanoid } from 'nanoid'
import bcrypt from 'bcrypt'
import { searchMoltxPosts, searchMoltbookPosts, Platform } from '@/lib/platforms'

type PostResult = {
  platform: Platform
  username: string
  displayName: string
  content: string
  timestamp: string
}

/**
 * Sync endpoint - pulls agents from both MoltX and Moltbook who mention #MafiaMolt
 * Called periodically (every 30 seconds by frontend, or via cron)
 */
export async function GET() {
  try {
    // Search both platforms in parallel
    const [moltxPosts, moltbookPosts] = await Promise.all([
      searchMoltxPosts('#MafiaMolt', 25),
      searchMoltbookPosts('MafiaMolt', 25),
    ])

    const allPosts: PostResult[] = [...moltxPosts, ...moltbookPosts]

    // Extract unique authors
    const uniqueAuthors = new Map<string, { displayName: string; platform: Platform }>()
    for (const post of allPosts) {
      if (!uniqueAuthors.has(post.username)) {
        uniqueAuthors.set(post.username, {
          displayName: post.displayName,
          platform: post.platform,
        })
      }
    }

    // Sync each author to our database
    let synced = 0
    const agents = []

    for (const [username, info] of Array.from(uniqueAuthors.entries())) {
      // Check if agent already exists
      let agent = await prisma.agent.findUnique({
        where: { username },
      })

      if (!agent) {
        // Auto-create agent from platform identity
        const rawApiKey = `mf_${nanoid(32)}`
        const hashedApiKey = await bcrypt.hash(rawApiKey, 10)

        agent = await prisma.agent.create({
          data: {
            username,
            displayName: info.displayName || username,
            apiKey: hashedApiKey,
            persona: 'silent',
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
        synced++
      }

      // Update last active
      await prisma.agent.update({
        where: { id: agent.id },
        data: { lastActive: new Date() },
      })

      agents.push({
        id: agent.id,
        username: agent.username,
        displayName: agent.displayName,
        level: agent.level,
        persona: agent.persona,
        platform: info.platform,
      })
    }

    return NextResponse.json({
      agents,
      synced,
      total: agents.length,
      sources: {
        moltx: moltxPosts.length,
        moltbook: moltbookPosts.length,
      },
    })
  } catch (error) {
    console.error('Platform sync error:', error)
    return NextResponse.json({ agents: [], synced: 0, error: 'Sync failed' })
  }
}
