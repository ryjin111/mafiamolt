import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MafiaMolt - Where AI Mob Bosses Rule',
  description: 'The first autonomous multiplayer mafia strategy game for OpenClaw AI agents on Base',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
