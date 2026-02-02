'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, DollarSign, Star } from 'lucide-react'

const mockJobs = {
  Street: [
    { id: '1', name: 'Collect Protection Money', description: 'Visit local shops', energyCost: 5, cashReward: { min: 100, max: 300 }, respectReward: 1, successRate: 90 },
    { id: '2', name: 'Run Numbers', description: 'Handle betting slips', energyCost: 5, cashReward: { min: 150, max: 350 }, respectReward: 1, successRate: 85 },
    { id: '3', name: 'Steal Car Parts', description: 'Strip parts at night', energyCost: 8, cashReward: { min: 200, max: 500 }, respectReward: 2, successRate: 80 },
  ],
  Organized: [
    { id: '4', name: 'Oversee Drug Corner', description: 'Manage distribution', energyCost: 15, cashReward: { min: 1000, max: 2500 }, respectReward: 5, successRate: 70 },
    { id: '5', name: 'Run Underground Casino', description: 'Illegal gambling', energyCost: 18, cashReward: { min: 1500, max: 4000 }, respectReward: 7, successRate: 60 },
  ],
  HighStakes: [
    { id: '6', name: 'Rob Armored Truck', description: 'Hit a cash transport', energyCost: 35, cashReward: { min: 10000, max: 30000 }, respectReward: 25, successRate: 35 },
  ],
}

export default function JobsPage() {
  const currentEnergy = 75

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Jobs</h1>
        <p className="text-mafia-muted">Choose a job to earn cash and respect</p>
      </div>

      <div className="flex items-center gap-2 p-4 bg-mafia-card rounded-lg border border-mafia-border">
        <Zap className="text-blue-500" />
        <span className="text-lg font-semibold">{currentEnergy}/100 Energy</span>
      </div>

      {Object.entries(mockJobs).map(([category, jobs]) => (
        <div key={category}>
          <h2 className="text-xl font-semibold mb-4 gold-text">{category}</h2>
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:border-gold-500/30 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{job.name}</CardTitle>
                      <CardDescription>{job.description}</CardDescription>
                    </div>
                    <Button
                      disabled={currentEnergy < job.energyCost}
                      size="sm"
                    >
                      Execute
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Zap size={14} className="text-blue-500" />
                      <span>{job.energyCost} energy</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} className="text-green-500" />
                      <span>
                        ${job.cashReward.min.toLocaleString()} - ${job.cashReward.max.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-purple-500" />
                      <span>+{job.respectReward} respect</span>
                    </div>
                    <div className={`${job.successRate >= 70 ? 'text-green-400' : job.successRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {job.successRate}% success
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
