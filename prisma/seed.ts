import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🦞 Seeding MafiaMolt database...')

  // Seed Cities
  const cities = [
    {
      name: 'New York',
      description: 'The Big Apple - Where empires are built and destroyed',
      levelRequired: 1,
      unlockCost: 0,
      jobs: JSON.stringify(['street-1', 'street-2', 'street-3', 'organized-1']),
      properties: JSON.stringify(['bodega', 'laundromat', 'parking-lot']),
      bonuses: JSON.stringify({ respectMultiplier: 1.0 }),
    },
    {
      name: 'Miami',
      description: 'Sun, sand, and serious business opportunities',
      levelRequired: 5,
      unlockCost: 10000,
      jobs: JSON.stringify(['street-4', 'street-5', 'organized-2', 'organized-3']),
      properties: JSON.stringify(['nightclub', 'car-wash', 'restaurant']),
      bonuses: JSON.stringify({ cashMultiplier: 1.1 }),
    },
    {
      name: 'Las Vegas',
      description: 'What happens here... makes you rich or broke',
      levelRequired: 10,
      unlockCost: 50000,
      jobs: JSON.stringify(['organized-4', 'organized-5', 'highstakes-1', 'highstakes-2']),
      properties: JSON.stringify(['casino', 'hotel', 'pawn-shop']),
      bonuses: JSON.stringify({ jobSuccessBonus: 0.05 }),
    },
    {
      name: 'Chicago',
      description: 'The Windy City - Old school meets new opportunities',
      levelRequired: 15,
      unlockCost: 100000,
      jobs: JSON.stringify(['organized-6', 'organized-7', 'highstakes-3', 'highstakes-4']),
      properties: JSON.stringify(['warehouse', 'steakhouse', 'union-hall']),
      bonuses: JSON.stringify({ attackBonus: 5 }),
    },
    {
      name: 'Los Angeles',
      description: 'Hollywood dreams and underground schemes',
      levelRequired: 20,
      unlockCost: 250000,
      jobs: JSON.stringify(['highstakes-5', 'highstakes-6', 'highstakes-7', 'highstakes-8']),
      properties: JSON.stringify(['movie-studio', 'record-label', 'talent-agency']),
      bonuses: JSON.stringify({ expMultiplier: 1.2 }),
    },
  ]

  for (const city of cities) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: city,
      create: city,
    })
  }
  console.log('✅ Cities seeded')

  // Seed Jobs - 25 jobs across 3 categories
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
    { name: 'Bribe Police Captain', description: 'Get law enforcement on your payroll', category: 'Organized', energyCost: 28, levelRequired: 13, cashMin: 5000, cashMax: 12000, respectReward: 18, expReward: 90, baseSuccessRate: 0.35 },

    // High Stakes Jobs (Hard, High Reward)
    { name: 'Rob Armored Truck', description: 'Hit a cash transport in broad daylight', category: 'HighStakes', energyCost: 35, levelRequired: 15, cashMin: 10000, cashMax: 30000, respectReward: 25, expReward: 120, baseSuccessRate: 0.35 },
    { name: 'Kidnap for Ransom', description: 'Grab a high-value target for payment', category: 'HighStakes', energyCost: 40, levelRequired: 16, cashMin: 15000, cashMax: 40000, respectReward: 30, expReward: 140, baseSuccessRate: 0.3 },
    { name: 'Hit Rival Boss', description: 'Take out competition permanently', category: 'HighStakes', energyCost: 45, levelRequired: 18, cashMin: 20000, cashMax: 50000, respectReward: 40, expReward: 160, baseSuccessRate: 0.25 },
    { name: 'Raid Federal Evidence', description: 'Break into a federal building for incriminating evidence', category: 'HighStakes', energyCost: 50, levelRequired: 20, cashMin: 25000, cashMax: 60000, respectReward: 50, expReward: 180, baseSuccessRate: 0.2 },
    { name: 'Insider Trading Ring', description: 'Run a sophisticated stock manipulation scheme', category: 'HighStakes', energyCost: 45, levelRequired: 22, cashMin: 30000, cashMax: 80000, respectReward: 45, expReward: 200, baseSuccessRate: 0.25 },
    { name: 'Art Museum Heist', description: 'Steal priceless art from a heavily guarded museum', category: 'HighStakes', energyCost: 55, levelRequired: 24, cashMin: 40000, cashMax: 100000, respectReward: 60, expReward: 250, baseSuccessRate: 0.15 },
    { name: 'Casino Vault Job', description: 'Empty the vault of a major casino', category: 'HighStakes', energyCost: 60, levelRequired: 26, cashMin: 50000, cashMax: 150000, respectReward: 80, expReward: 300, baseSuccessRate: 0.1 },
    { name: 'Take Over Crime Family', description: 'Orchestrate a hostile takeover of a rival family', category: 'HighStakes', energyCost: 70, levelRequired: 30, cashMin: 100000, cashMax: 300000, respectReward: 150, expReward: 500, baseSuccessRate: 0.08 },
  ]

  for (const job of jobs) {
    const existing = await prisma.job.findFirst({ where: { name: job.name } })
    if (!existing) {
      await prisma.job.create({ data: job })
    }
  }
  console.log('✅ Jobs seeded')

  console.log('🎉 MafiaMolt database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
