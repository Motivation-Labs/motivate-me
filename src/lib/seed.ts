import type { Habit, ActionLog, PointLedgerEntry, Reward, AppNotification } from '../types'

const USER_ID = 'local-user'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(8, 0, 0, 0)
  return d.toISOString()
}

export const SEED_HABITS: Habit[] = [
  {
    id: 'h1',
    userId: USER_ID,
    name: 'Morning Meditation',
    description: '10 minutes of mindfulness',
    pointsPerCompletion: 20,
    requiresPhoto: false,
    requiresApproval: false,
    frequencyTarget: 'daily',
    isActive: true,
    createdAt: daysAgo(30),
  },
  {
    id: 'h2',
    userId: USER_ID,
    name: 'Hydrate 2L Water',
    description: 'Drink at least 2 liters throughout the day',
    pointsPerCompletion: 10,
    requiresPhoto: false,
    requiresApproval: false,
    frequencyTarget: 'daily',
    isActive: true,
    createdAt: daysAgo(20),
  },
  {
    id: 'h3',
    userId: USER_ID,
    name: 'Read 20 Pages',
    description: 'Read from current book',
    pointsPerCompletion: 15,
    requiresPhoto: false,
    requiresApproval: false,
    frequencyTarget: 'daily',
    isActive: true,
    createdAt: daysAgo(15),
  },
  {
    id: 'h4',
    userId: USER_ID,
    name: 'Daily Workout',
    description: '30 min exercise session',
    pointsPerCompletion: 30,
    requiresPhoto: true,
    requiresApproval: false,
    frequencyTarget: 'daily',
    isActive: true,
    createdAt: daysAgo(10),
  },
]

// Generate logs for the past few days to show streaks
function generateLogs(): ActionLog[] {
  const logs: ActionLog[] = []
  let logId = 1

  // h1: logged every day for past 7 days
  for (let i = 0; i < 7; i++) {
    logs.push({
      id: `log-${logId++}`,
      habitId: 'h1',
      userId: USER_ID,
      loggedAt: daysAgo(i),
      status: 'self_approved',
      pointsAwarded: 20,
    })
  }

  // h2: logged every day for past 3 days
  for (let i = 0; i < 3; i++) {
    logs.push({
      id: `log-${logId++}`,
      habitId: 'h2',
      userId: USER_ID,
      loggedAt: daysAgo(i),
      status: 'self_approved',
      pointsAwarded: 10,
    })
  }

  // h3: logged 2 days ago and yesterday (2 day streak, not today yet)
  for (let i = 1; i <= 2; i++) {
    logs.push({
      id: `log-${logId++}`,
      habitId: 'h3',
      userId: USER_ID,
      loggedAt: daysAgo(i),
      status: 'self_approved',
      pointsAwarded: 15,
    })
  }

  return logs
}

function generateLedger(logs: ActionLog[]): PointLedgerEntry[] {
  const entries: PointLedgerEntry[] = logs
    .filter((l) => l.pointsAwarded > 0)
    .map((l, i) => ({
      id: `ledger-${i + 1}`,
      userId: USER_ID,
      delta: l.pointsAwarded,
      reason: `Logged habit`,
      referenceId: l.id,
      referenceType: 'action_log' as const,
      createdAt: l.loggedAt,
    }))

  // Add a 7-day streak bonus for h1
  entries.push({
    id: 'ledger-streak-1',
    userId: USER_ID,
    delta: 10,
    reason: '7-day streak bonus: Morning Meditation',
    referenceId: 'h1',
    referenceType: 'streak_bonus',
    createdAt: daysAgo(0),
  })

  return entries
}

export const SEED_LOGS = generateLogs()
export const SEED_LEDGER = generateLedger(SEED_LOGS)

export const SEED_REWARDS: Reward[] = [
  {
    id: 'r1',
    userId: USER_ID,
    title: 'Movie Night',
    type: 'offline',
    pointCost: 200,
    description: 'Pick any movie + popcorn',
    requiresApproval: false,
    status: 'available',
    createdAt: daysAgo(10),
  },
  {
    id: 'r2',
    userId: USER_ID,
    title: 'Kindle Book',
    type: 'online',
    pointCost: 150,
    description: 'Any ebook on Amazon Kindle',
    url: 'https://amazon.com/kindle',
    requiresApproval: false,
    status: 'available',
    createdAt: daysAgo(8),
  },
  {
    id: 'r3',
    userId: USER_ID,
    title: 'New Running Shoes',
    type: 'offline',
    pointCost: 1000,
    description: 'Nike Pegasus in your favorite color',
    requiresApproval: false,
    status: 'wishlist',
    createdAt: daysAgo(5),
  },
  {
    id: 'r4',
    userId: USER_ID,
    title: 'Weekend Trip',
    type: 'offline',
    pointCost: 2000,
    description: 'A weekend getaway to the mountains',
    requiresApproval: false,
    status: 'wishlist',
    createdAt: daysAgo(3),
  },
  {
    id: 'r5',
    userId: USER_ID,
    title: 'Spa Day',
    type: 'offline',
    pointCost: 100,
    description: 'A relaxing spa session',
    requiresApproval: true,
    status: 'available',
    createdAt: daysAgo(2),
  },
]

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'streak',
    message: 'You hit a 7-day streak on Morning Meditation! +10 bonus pts',
    timestamp: daysAgo(0),
    read: false,
  },
]
