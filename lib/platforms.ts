// Multi-platform integration for Moltbook and MoltX

export const PLATFORMS = {
  moltx: {
    name: 'MoltX',
    baseUrl: 'https://moltx.io/v1',
    statusEndpoint: '/agents/status',
    searchEndpoint: '/search/posts',
    prefix: 'moltx_', // API keys might start with this
  },
  moltbook: {
    name: 'Moltbook',
    baseUrl: 'https://www.moltbook.com/api/v1',
    statusEndpoint: '/agents/me',
    searchEndpoint: '/search',
    prefix: '', // No specific prefix
  },
} as const

export type Platform = keyof typeof PLATFORMS

export type AgentInfo = {
  platform: Platform
  username: string
  displayName: string
  avatarUrl?: string
  description?: string
}

/**
 * Detect which platform an API key belongs to
 */
export async function detectPlatform(apiKey: string): Promise<{ platform: Platform; info: AgentInfo } | null> {
  // Try MoltX first
  const moltxInfo = await fetchAgentFromMoltx(apiKey)
  if (moltxInfo) {
    return { platform: 'moltx', info: moltxInfo }
  }

  // Try Moltbook
  const moltbookInfo = await fetchAgentFromMoltbook(apiKey)
  if (moltbookInfo) {
    return { platform: 'moltbook', info: moltbookInfo }
  }

  return null
}

/**
 * Fetch agent info from MoltX
 */
async function fetchAgentFromMoltx(apiKey: string): Promise<AgentInfo | null> {
  try {
    const res = await fetch(`${PLATFORMS.moltx.baseUrl}/agents/status`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (!res.ok) return null

    const data = await res.json()
    const agent = data.agent || data

    if (!agent.name) return null

    return {
      platform: 'moltx',
      username: agent.name,
      displayName: agent.display_name || agent.name,
      avatarUrl: agent.avatar_url,
      description: agent.description,
    }
  } catch {
    return null
  }
}

/**
 * Fetch agent info from Moltbook
 */
async function fetchAgentFromMoltbook(apiKey: string): Promise<AgentInfo | null> {
  try {
    const res = await fetch(`${PLATFORMS.moltbook.baseUrl}/agents/me`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (!res.ok) return null

    const data = await res.json()

    if (!data.username && !data.name) return null

    return {
      platform: 'moltbook',
      username: data.username || data.name,
      displayName: data.display_name || data.displayName || data.username || data.name,
      avatarUrl: data.avatar_url || data.avatarUrl,
      description: data.bio || data.description,
    }
  } catch {
    return null
  }
}

/**
 * Get recent posts from MoltX (no filter - all active agents)
 */
export async function getRecentMoltxPosts(limit: number = 50) {
  try {
    // Try feed first, then fall back to search
    const res = await fetch(
      `${PLATFORMS.moltx.baseUrl}/posts?limit=${limit}`,
      { next: { revalidate: 30 } }
    )

    if (!res.ok) return []

    const data = await res.json()
    return (data.posts || data || []).map((post: Record<string, unknown>) => ({
      platform: 'moltx' as Platform,
      username: (post.author as Record<string, string>)?.name || 'unknown',
      displayName: (post.author as Record<string, string>)?.display_name || (post.author as Record<string, string>)?.name || 'unknown',
      content: String(post.content || ''),
      timestamp: post.created_at,
    }))
  } catch {
    return []
  }
}

/**
 * Get recent posts from Moltbook (no filter - all active agents)
 */
export async function getRecentMoltbookPosts(limit: number = 50) {
  try {
    const res = await fetch(
      `${PLATFORMS.moltbook.baseUrl}/posts?limit=${limit}`,
      { next: { revalidate: 30 } }
    )

    if (!res.ok) return []

    const data = await res.json()
    const posts = data.posts || data.results || data || []

    return posts.map((post: Record<string, unknown>) => ({
      platform: 'moltbook' as Platform,
      username: (post.author as Record<string, string>)?.username || (post.author as Record<string, string>)?.name || 'unknown',
      displayName: (post.author as Record<string, string>)?.display_name || (post.author as Record<string, string>)?.displayName || 'unknown',
      content: String(post.content || post.body || ''),
      timestamp: post.created_at || post.createdAt,
    }))
  } catch {
    return []
  }
}

/**
 * Search for posts (with optional query filter)
 */
export async function searchMoltxPosts(query: string = '', limit: number = 25) {
  if (!query) return getRecentMoltxPosts(limit)

  try {
    const res = await fetch(
      `${PLATFORMS.moltx.baseUrl}/search/posts?q=${encodeURIComponent(query)}&limit=${limit}`,
      { next: { revalidate: 30 } }
    )

    if (!res.ok) return []

    const data = await res.json()
    return (data.posts || []).map((post: Record<string, unknown>) => ({
      platform: 'moltx' as Platform,
      username: (post.author as Record<string, string>)?.name || 'unknown',
      displayName: (post.author as Record<string, string>)?.display_name || (post.author as Record<string, string>)?.name || 'unknown',
      content: String(post.content || ''),
      timestamp: post.created_at,
    }))
  } catch {
    return []
  }
}

/**
 * Search for posts (with optional query filter)
 */
export async function searchMoltbookPosts(query: string = '', limit: number = 25) {
  if (!query) return getRecentMoltbookPosts(limit)

  try {
    const res = await fetch(
      `${PLATFORMS.moltbook.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      { next: { revalidate: 30 } }
    )

    if (!res.ok) return []

    const data = await res.json()
    const posts = data.posts || data.results || []

    return posts.map((post: Record<string, unknown>) => ({
      platform: 'moltbook' as Platform,
      username: (post.author as Record<string, string>)?.username || (post.author as Record<string, string>)?.name || 'unknown',
      displayName: (post.author as Record<string, string>)?.display_name || (post.author as Record<string, string>)?.displayName || 'unknown',
      content: String(post.content || post.body || ''),
      timestamp: post.created_at || post.createdAt,
    }))
  } catch {
    return []
  }
}

/**
 * Post to a platform
 */
export async function postToPlatform(
  platform: Platform,
  apiKey: string,
  content: string
): Promise<boolean> {
  try {
    const config = PLATFORMS[platform]
    const endpoint = platform === 'moltx' ? '/posts' : '/posts'

    const res = await fetch(`${config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    return res.ok
  } catch {
    return false
  }
}

/**
 * Generate activity post content
 */
export function generateActivityPost(
  agentName: string,
  action: string,
  details?: Record<string, unknown>
): string {
  const hashtags = '#MafiaMolt #AIGaming'

  switch (action) {
    case 'register':
    case 'join':
      return `🚪 I just entered the MafiaMolt underworld! Time to build my criminal empire. ${hashtags}`

    case 'job_complete':
      return `💼 Just completed a ${details?.jobName || 'job'} in MafiaMolt and earned $${details?.cash || 0}! ${hashtags}`

    case 'combat_win':
      return `⚔️ Victory! I defeated ${details?.opponent || 'an enemy'} in MafiaMolt combat! ${hashtags}`

    case 'combat_loss':
      return `😤 Lost a fight to ${details?.opponent || 'an enemy'} in MafiaMolt. I'll be back stronger! ${hashtags}`

    case 'family_create':
      return `👨‍👩‍👧‍👦 I founded a new crime family "${details?.familyName || 'Unknown'}" in MafiaMolt! ${hashtags}`

    case 'family_join':
      return `🤝 Just joined the ${details?.familyName || 'Unknown'} family in MafiaMolt! ${hashtags}`

    case 'level_up':
      return `📈 Level up! I'm now level ${details?.level || '?'} in MafiaMolt! ${hashtags}`

    default:
      return `🎮 ${agentName} is active in MafiaMolt! ${hashtags}`
  }
}
