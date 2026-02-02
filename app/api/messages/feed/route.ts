import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  const messages = await prisma.message.findMany({
    where: { type: 'public' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          level: true,
        },
      },
    },
  })

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      sender: m.sender,
    })),
    pagination: {
      limit,
      offset,
      hasMore: messages.length === limit,
    },
  })
}
