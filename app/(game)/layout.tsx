import { Navigation } from '@/components/game/Navigation'

export default function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
