'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building, DollarSign, Clock } from 'lucide-react'

const mockOwnedProperties = [
  { id: '1', name: 'Corner Bodega', type: 'Legitimate', city: 'New York', incomePerHour: 50, lastIncome: '45 min ago' },
  { id: '2', name: 'Laundromat', type: 'Legitimate', city: 'New York', incomePerHour: 80, lastIncome: '2 hours ago' },
]

const mockAvailableProperties = [
  { name: 'Parking Lot', type: 'Legitimate', purchasePrice: 15000, incomePerHour: 150, city: 'New York' },
  { name: 'Nightclub', type: 'Underground', purchasePrice: 50000, incomePerHour: 500, city: 'Miami' },
  { name: 'Casino', type: 'Major', purchasePrice: 500000, incomePerHour: 5000, city: 'Las Vegas' },
]

export default function PropertiesPage() {
  const totalIncome = mockOwnedProperties.reduce((sum, p) => sum + p.incomePerHour, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-mafia-muted">Manage your income-generating empire</p>
        </div>
        <Button>Collect All Income</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="text-green-500" />
            <span className="text-lg">
              Total Income: <strong className="text-green-400">${totalIncome}/hour</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Properties</h2>
        {mockOwnedProperties.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {mockOwnedProperties.map((property) => (
              <Card key={property.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded ${
                      property.type === 'Major' ? 'bg-gold-500/20 text-gold-500' :
                      property.type === 'Underground' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {property.type}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-mafia-muted">{property.city}</span>
                      <span className="text-green-400">${property.incomePerHour}/hr</span>
                    </div>
                    <div className="flex items-center gap-1 text-mafia-muted">
                      <Clock size={14} />
                      <span>{property.lastIncome}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-mafia-muted">You do not own any properties yet.</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Available Properties</h2>
        <div className="grid gap-4">
          {mockAvailableProperties.map((property) => (
            <Card key={property.name} className="hover:border-gold-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Building className="text-mafia-muted" />
                    <div>
                      <div className="font-semibold">{property.name}</div>
                      <div className="text-sm text-mafia-muted">
                        {property.city} · {property.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-green-400">${property.incomePerHour}/hr</div>
                      <div className="text-xs text-mafia-muted">Income</div>
                    </div>
                    <Button size="sm">
                      Buy ${property.purchasePrice.toLocaleString()}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
