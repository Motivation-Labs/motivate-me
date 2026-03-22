import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react'
import type { Habit, ActionLog, PointLedgerEntry, Reward, AppNotification } from '../types'
import { SEED_HABITS, SEED_LOGS, SEED_LEDGER, SEED_REWARDS, SEED_NOTIFICATIONS } from './seed'
import { useAuth } from './auth'
import * as db from './db'

const STREAK_BONUSES: Record<number, number> = { 7: 10, 30: 50, 60: 100, 90: 200 }

const isTestMode = import.meta.env.MODE === 'test'

function computeStreak(habitId: string, logs: ActionLog[]): number {
  const habitLogs = logs
    .filter((l) => l.habitId === habitId && (l.status === 'self_approved' || l.status === 'approved'))
    .map((l) => {
      const d = new Date(l.loggedAt)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    })

  const uniqueDays = [...new Set(habitLogs)]
  if (uniqueDays.length === 0) return 0

  let streak = 0
  const now = new Date()
  const check = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  for (let i = 0; i < 365; i++) {
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`
    if (uniqueDays.includes(key)) {
      streak++
      check.setDate(check.getDate() - 1)
    } else if (i === 0) {
      check.setDate(check.getDate() - 1)
      continue
    } else {
      break
    }
  }

  return streak
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

interface AppContextValue {
  habits: Habit[]
  actionLogs: ActionLog[]
  pointLedger: PointLedgerEntry[]
  rewards: Reward[]
  notifications: AppNotification[]
  loading: boolean

  pointBalance: number
  totalEarned: number
  totalRedeemed: number
  getStreak: (habitId: string) => number
  getBestStreak: () => number
  isLoggedToday: (habitId: string) => boolean
  getWeeklyCount: (habitId: string) => number
  todayLogs: ActionLog[]

  createHabit: (data: Omit<Habit, 'id' | 'userId' | 'createdAt'>) => void
  updateHabit: (id: string, data: Partial<Habit>) => void
  archiveHabit: (id: string) => void
  logAction: (habitId: string, note?: string, photoUrl?: string) => void
  createReward: (data: Omit<Reward, 'id' | 'userId' | 'createdAt'>) => void
  updateReward: (id: string, data: Partial<Reward>) => void
  redeemReward: (rewardId: string) => 'redeemed' | 'pending_approval' | false
  addToWishlist: (rewardId: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  resetAllData: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? 'local-user'

  const [habits, setHabits] = useState<Habit[]>(!isTestMode ? [] : SEED_HABITS)
  const [actionLogs, setActionLogs] = useState<ActionLog[]>(!isTestMode ? [] : SEED_LOGS)
  const [pointLedger, setPointLedger] = useState<PointLedgerEntry[]>(!isTestMode ? [] : SEED_LEDGER)
  const [rewards, setRewards] = useState<Reward[]>(!isTestMode ? [] : SEED_REWARDS)
  const [notifications, setNotifications] = useState<AppNotification[]>(!isTestMode ? [] : SEED_NOTIFICATIONS)
  const [loading, setLoading] = useState(!isTestMode)

  // Fetch all data from Supabase on auth change
  useEffect(() => {
    if (isTestMode || !user) return

    let cancelled = false

    Promise.all([
      db.fetchHabits(user.id),
      db.fetchActionLogs(user.id),
      db.fetchPointLedger(user.id),
      db.fetchRewards(user.id),
      db.fetchNotifications(user.id),
    ]).then(([h, a, p, r, n]) => {
      if (cancelled) return
      setHabits(h)
      setActionLogs(a)
      setPointLedger(p)
      setRewards(r)
      setNotifications(n)
      setLoading(false)
    }).catch((err) => {
      console.error('Failed to fetch data:', err)
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [user])

  // ── Derived values ──

  const pointBalance = useMemo(
    () => pointLedger.reduce((sum, e) => sum + e.delta, 0),
    [pointLedger]
  )

  const totalEarned = useMemo(
    () => pointLedger.filter((e) => e.delta > 0).reduce((sum, e) => sum + e.delta, 0),
    [pointLedger]
  )

  const totalRedeemed = useMemo(
    () => Math.abs(pointLedger.filter((e) => e.referenceType === 'redemption').reduce((sum, e) => sum + e.delta, 0)),
    [pointLedger]
  )

  const getStreak = useCallback(
    (habitId: string) => computeStreak(habitId, actionLogs),
    [actionLogs]
  )

  const getBestStreak = useCallback(() => {
    return Math.max(0, ...habits.filter((h) => h.isActive).map((h) => computeStreak(h.id, actionLogs)))
  }, [habits, actionLogs])

  const isLoggedToday = useCallback(
    (habitId: string) => {
      const today = new Date()
      return actionLogs.some(
        (l) =>
          l.habitId === habitId &&
          (l.status === 'self_approved' || l.status === 'approved') &&
          isSameDay(new Date(l.loggedAt), today)
      )
    },
    [actionLogs]
  )

  const getWeeklyCount = useCallback(
    (habitId: string) => {
      const now = new Date()
      const dayOfWeek = now.getDay() // 0=Sun
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
      return actionLogs.filter(
        (l) =>
          l.habitId === habitId &&
          (l.status === 'self_approved' || l.status === 'approved') &&
          new Date(l.loggedAt) >= weekStart
      ).length
    },
    [actionLogs]
  )

  const todayLogs = useMemo(() => {
    const today = new Date()
    return actionLogs.filter((l) => isSameDay(new Date(l.loggedAt), today))
  }, [actionLogs])

  // ── Habit actions ──

  const createHabit = useCallback((data: Omit<Habit, 'id' | 'userId' | 'createdAt'>) => {
    const habit: Habit = {
      ...data,
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
    }
    setHabits((prev) => [habit, ...prev])
    if (!isTestMode) db.insertHabit(userId, habit)
  }, [userId])

  const updateHabit = useCallback((id: string, data: Partial<Habit>) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...data } : h)))
    if (!isTestMode) db.updateHabitRow(id, data)
  }, [])

  const archiveHabit = useCallback((id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, isActive: false } : h)))
    if (!isTestMode) db.updateHabitRow(id, { isActive: false })
  }, [])

  // ── Log action ──

  const logAction = useCallback(
    (habitId: string, note?: string, photoUrl?: string) => {
      const habit = habits.find((h) => h.id === habitId)
      if (!habit) return

      const logId = crypto.randomUUID()
      const now = new Date().toISOString()
      const status = habit.requiresApproval ? 'pending_approval' : 'self_approved'
      const pts = status === 'self_approved' ? habit.pointsPerCompletion : 0

      const log: ActionLog = {
        id: logId,
        habitId,
        userId,
        loggedAt: now,
        note,
        photoUrl,
        status,
        pointsAwarded: pts,
      }
      setActionLogs((prev) => [log, ...prev])
      if (!isTestMode) db.insertActionLog(userId, log)

      // Credit points
      if (pts > 0) {
        const ledgerEntry: PointLedgerEntry = {
          id: crypto.randomUUID(),
          userId,
          delta: pts,
          reason: `Logged: ${habit.name}`,
          referenceId: logId,
          referenceType: 'action_log',
          createdAt: now,
        }
        setPointLedger((prev) => [ledgerEntry, ...prev])
        if (!isTestMode) db.insertLedgerEntry(userId, ledgerEntry)
      }

      // Check streak milestones (after adding the new log)
      setTimeout(() => {
        setActionLogs((currentLogs) => {
          const streak = computeStreak(habitId, currentLogs)
          const bonus = STREAK_BONUSES[streak]
          if (bonus) {
            const bonusEntry: PointLedgerEntry = {
              id: crypto.randomUUID(),
              userId,
              delta: bonus,
              reason: `${streak}-day streak bonus: ${habit.name}`,
              referenceId: habitId,
              referenceType: 'streak_bonus',
              createdAt: now,
            }
            setPointLedger((prev) => [bonusEntry, ...prev])
            if (!isTestMode) db.insertLedgerEntry(userId, bonusEntry)

            const notif: AppNotification = {
              id: crypto.randomUUID(),
              type: 'streak',
              message: `You hit a ${streak}-day streak on ${habit.name}! +${bonus} bonus pts`,
              timestamp: now,
              read: false,
            }
            setNotifications((prev) => [notif, ...prev])
            if (!isTestMode) db.insertNotification(userId, notif)
          }
          return currentLogs
        })
      }, 0)

      // Check wishlist notifications
      setTimeout(() => {
        setPointLedger((currentLedger) => {
          const newBalance = currentLedger.reduce((sum, e) => sum + e.delta, 0)
          setRewards((currentRewards) => {
            for (const r of currentRewards) {
              if (r.status === 'wishlist' && newBalance >= r.pointCost) {
                const notif: AppNotification = {
                  id: crypto.randomUUID(),
                  type: 'wishlist',
                  message: `You can now redeem ${r.title}! You have enough points.`,
                  timestamp: now,
                  read: false,
                }
                setNotifications((prev) => {
                  if (prev.some((n) => n.message === notif.message)) return prev
                  if (!isTestMode) db.insertNotification(userId, notif)
                  return [notif, ...prev]
                })
              }
            }
            return currentRewards
          })
          return currentLedger
        })
      }, 0)
    },
    [userId, habits]
  )

  // ── Reward actions ──

  const createReward = useCallback((data: Omit<Reward, 'id' | 'userId' | 'createdAt'>) => {
    const reward: Reward = {
      ...data,
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
    }
    setRewards((prev) => [reward, ...prev])
    if (!isTestMode) db.insertReward(userId, reward)
  }, [userId])

  const updateReward = useCallback((id: string, data: Partial<Reward>) => {
    setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)))
    if (!isTestMode) db.updateRewardRow(id, data)
  }, [])

  const redeemReward = useCallback(
    (rewardId: string): 'redeemed' | 'pending_approval' | false => {
      const reward = rewards.find((r) => r.id === rewardId)
      if (!reward || pointBalance < reward.pointCost) return false

      const now = new Date().toISOString()

      // If approval required, set to pending — don't deduct points yet
      if (reward.requiresApproval) {
        setRewards((prev) =>
          prev.map((r) => (r.id === rewardId ? { ...r, status: 'pending_approval' as const } : r))
        )
        if (!isTestMode) db.updateRewardRow(rewardId, { status: 'pending_approval' })

        const notif: AppNotification = {
          id: crypto.randomUUID(),
          type: 'redemption',
          message: `Approval requested for ${reward.title} (${reward.pointCost} pts)`,
          timestamp: now,
          read: false,
        }
        setNotifications((prev) => [notif, ...prev])
        if (!isTestMode) db.insertNotification(userId, notif)

        return 'pending_approval'
      }

      // Self-redeem: deduct points immediately
      const ledgerEntry: PointLedgerEntry = {
        id: crypto.randomUUID(),
        userId,
        delta: -reward.pointCost,
        reason: `Redeemed: ${reward.title}`,
        referenceId: rewardId,
        referenceType: 'redemption',
        createdAt: now,
      }
      setPointLedger((prev) => [ledgerEntry, ...prev])
      if (!isTestMode) db.insertLedgerEntry(userId, ledgerEntry)

      setRewards((prev) =>
        prev.map((r) => (r.id === rewardId ? { ...r, status: 'redeemed' as const } : r))
      )
      if (!isTestMode) db.updateRewardRow(rewardId, { status: 'redeemed' })

      const notif: AppNotification = {
        id: crypto.randomUUID(),
        type: 'redemption',
        message: `You redeemed ${reward.title} for ${reward.pointCost} pts!`,
        timestamp: now,
        read: false,
      }
      setNotifications((prev) => [notif, ...prev])
      if (!isTestMode) db.insertNotification(userId, notif)

      return 'redeemed'
    },
    [userId, rewards, pointBalance]
  )

  const addToWishlist = useCallback((rewardId: string) => {
    setRewards((prev) =>
      prev.map((r) => (r.id === rewardId ? { ...r, status: 'wishlist' as const } : r))
    )
    if (!isTestMode) db.updateRewardRow(rewardId, { status: 'wishlist' })
  }, [])

  // ── Notification actions ──

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    if (!isTestMode) db.updateNotificationRead(id, true)
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    if (!isTestMode) db.markAllNotificationsReadDb(userId)
  }, [userId])

  // ── Reset ──

  const resetAllData = useCallback(() => {
    setHabits([])
    setActionLogs([])
    setPointLedger([])
    setRewards([])
    setNotifications([])
    if (!isTestMode) db.deleteAllUserData(userId)
  }, [userId])

  const value: AppContextValue = {
    habits,
    actionLogs,
    pointLedger,
    rewards,
    notifications,
    loading,
    pointBalance,
    totalEarned,
    totalRedeemed,
    getStreak,
    getBestStreak,
    isLoggedToday,
    getWeeklyCount,
    todayLogs,
    createHabit,
    updateHabit,
    archiveHabit,
    logAction,
    createReward,
    updateReward,
    redeemReward,
    addToWishlist,
    markNotificationRead,
    markAllNotificationsRead,
    resetAllData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
