import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiKey'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string().min(1).max(500),
  type: z.enum(['public', 'private', 'threat']),
  recipientId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult.error
  }

  const { agent } = authResult

  const body = await request.json()
  const validation = messageSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { content, type, recipientId } = validation.data

  if ((type === 'private' || type === 'threat') && !recipientId) {
    return NextResponse.json(
      { error: 'recipientId required for private/threat messages' },
      { status: 400 }
    )
  }

  const message = await prisma.message.create({
    data: {
      content,
      type,
      senderId: agent.id,
      recipientId,
    },
  })

  return NextResponse.json({
    success: true,
    message: {
      id: message.id,
      content: message.content,
      type: message.type,
      timestamp: message.timestamp,
    },
  })
}
