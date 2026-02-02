import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Seed endpoint - populates database with initial data
 * Call this once after deployment to set up jobs
 */
export async function GET() {
  try {
    // Check if already seeded
    const existingJobs = await prisma.job.count()
    if (existingJobs > 0) {
      return NextResponse.json({ message: 'Already seeded', jobs: existingJobs })
    }

    // Seed Jobs
    const jobs = [
      // Street Jobs (Easy, Low Reward)
      { name: 'Collect Protection Money', description: 'Visit local shops and collect their weekly "insurance"', category: 'Street', energyCost: 5, levelRequired: 1, cashMin: 100, cashMax: 300, respectReward: 1, expReward: 10, baseSuccessRate: 0.9 },
      { name: 'Run Numbers', description: 'Handle betting slips for the neighborhood', category: 'Street', energyCost: 5, levelRequired: 1, cashMin: 150, cashMax: 350, respectReward: 1, expReward: 12, baseSuccessRate: 0.85 },
      { name: 'Steal Car Parts', description: 'Strip parts from parked cars at night', category: 'Street', energyCost: 8, levelRequired: 2, cashMin: 200, cashMax: 500, respectReward: 2, expReward: 15, baseSuccessRate: 0.8 },
      { name: 'Shakedown Street Vendors', description: 'Convince vendors they need your protection', category: 'Street', energyCost: 8, levelRequired: 2, cashMin: 250, cashMax: 600, respectReward: 2, expReward: 18, baseSuccessRate: 0.75 },
      { name: 'Deliver Package', description: 'No questions asked delivery service', category: 'Street', energyCost: 6, levelRequired: 3, cashMin: 300, cashMax: 700, respectReward: 2, expReward: 20, baseSuccessRate: 0.85 },
      { name: 'Run Illegal Poker Game', description: 'Host and protect an underground card game', category: 'Street', energyCost: 10, levelRequired: 4, cashMin: 400, cashMax: 1000, respectReward: 3, expReward: 25, baseSuccessRate: 0.7 },
      { name: 'Hijack Delivery Truck', description: 'Intercept goods before they reach stores', category: 'Street', energyCost: 12, levelRequired: 5, cashMin: 600, cashMax: 1500, respectReward: 4, expReward: 30, baseSuccessRate: 0.65 },
      { name: 'Counterfeit Goods Sales', description: 'Move fake designer merchandise', category: 'Street', energyCost: 10, levelRequired: 5, cashMin: 500, cashMax: 1200, respectReward: 3, expReward: 28, baseSuccessRate: 0.75 },

      // Organized Jobs (Medium, Medium Reward)
      { name: 'Oversee Drug Corner', description: 'Manage street-level distribution operations', category: 'Organized', energyCost: 15, levelRequired: 6, cashMin: 1000, cashMax: 2500, respectReward: 5, expReward: 40, baseSuccessRate: 0.7 },
      { name: 'Collect Gambling Debts', description: 'Persuade debtors to pay what they owe', category: 'Organized', energyCost: 15, levelRequired: 7, cashMin: 1200, cashMax: 3000, respectReward: 6, expReward: 45, baseSuccessRate: 0.65 },
      { name: 'Run Underground Casino', description: 'Operate an illegal gambling establishment', category: 'Organized', energyCost: 18, levelRequired: 8, cashMin: 1500, cashMax: 4000, respectReward: 7, expReward: 50, baseSuccessRate: 0.6 },
      { name: 'Extort Local Business', description: 'Make an offer they cannot refuse', category: 'Organized', energyCost: 20, levelRequired: 9, cashMin: 2000, cashMax: 5000, respectReward: 8, expReward: 55, baseSuccessRate: 0.55 },
      { name: 'Smuggle Contraband', description: 'Move illegal goods across borders', category: 'Organized', energyCost: 20, levelRequired: 10, cashMin: 2500, cashMax: 6000, respectReward: 10, expReward: 60, baseSuccessRate: 0.5 },
      { name: 'Fix Local Election', description: 'Ensure the right candidate wins', category: 'Organized', energyCost: 25, levelRequired: 11, cashMin: 3000, cashMax: 8000, respectReward: 12, expReward: 70, baseSuccessRate: 0.45 },
      { name: 'Corrupt Union Official', description: 'Get unions working for your interests', category: 'Organized', energyCost: 25, levelRequired: 12, cashMin: 4000, cashMax: 10000, respectReward: 15, expReward: 80, baseSuccessRate: 0.4 },
      { name: 'Launder Money', description: 'Clean dirty money through legitimate businesses', category: 'Organized', energyCost: 22, levelRequired: 12, cashMin: 3500, cashMax: 9000, respectReward: 12, expReward: 75, baseSuccessRate: 0.5 },

      // High Stakes Jobs (Hard, High Reward)
      { name: 'Rob Armored Truck', description: 'Hit a cash transport in broad daylight', category: 'HighStakes', energyCost: 35, levelRequired: 15, cashMin: 10000, cashMax: 30000, respectReward: 25, expReward: 120, baseSuccessRate: 0.35 },
      { name: 'Kidnap for Ransom', description: 'Grab a high-value target for payment', category: 'HighStakes', energyCost: 40, levelRequired: 16, cashMin: 15000, cashMax: 40000, respectReward: 30, expReward: 140, baseSuccessRate: 0.3 },
      { name: 'Hit Rival Boss', description: 'Take out competition permanently', category: 'HighStakes', energyCost: 45, levelRequired: 18, cashMin: 20000, cashMax: 50000, respectReward: 40, expReward: 160, baseSuccessRate: 0.25 },
      { name: 'Raid Federal Evidence', description: 'Break into a federal building for incriminating evidence', category: 'HighStakes', energyCost: 50, levelRequired: 20, cashMin: 25000, cashMax: 60000, respectReward: 50, expReward: 180, baseSuccessRate: 0.2 },
      { name: 'Casino Vault Job', description: 'Empty the vault of a major casino', category: 'HighStakes', energyCost: 60, levelRequired: 26, cashMin: 50000, cashMax: 150000, respectReward: 80, expReward: 300, baseSuccessRate: 0.1 },
    ]

    for (const job of jobs) {
      await prisma.job.create({ data: job })
    }

    // Seed a few starter families
    const families = [
      { name: 'The Corleones', description: 'Old school, honor above all', leaderId: 'system', level: 1, respect: 0, attackBonus: 5, defenseBonus: 5 },
      { name: 'The Sopranos', description: 'New Jersey\'s finest', leaderId: 'system', level: 1, respect: 0, attackBonus: 8, defenseBonus: 3 },
      { name: 'The Gambinos', description: 'Business is business', leaderId: 'system', level: 1, respect: 0, attackBonus: 3, defenseBonus: 8 },
    ]

    for (const family of families) {
      const existing = await prisma.family.findUnique({ where: { name: family.name } })
      if (!existing) {
        await prisma.family.create({ data: family })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      jobs: jobs.length,
      families: families.length,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seeding failed' }, { status: 500 })
  }
}
