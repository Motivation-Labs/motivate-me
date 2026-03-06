import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchMonitoredUserData } from '../lib/monitors'
import { fetchPendingApprovals, approveActionLog, rejectActionLog } from '../lib/approvals'

interface UserData {
  name: string
  initial: string
  balance: number
  bestStreak: number
  habits: { name: string; icon?: string }[]
  recentLogs: { id: string; habitName: string; loggedAt: string; status: string; points: number }[]
}

// Mock data for tests (no Supabase in test env)
const MOCK_USERS: Record<string, UserData> = {
  'u1': {
    name: 'Casey Lee', initial: 'C', balance: 2450, bestStreak: 21,
    habits: [{ name: 'Morning Meditation' }, { name: 'Hydrate 2L' }],
    recentLogs: [
      { id: 'a1', habitName: 'Morning Meditation', loggedAt: '2026-03-05T08:15:00Z', status: 'self_approved', points: 20 },
    ],
  },
}

const isTestMode = import.meta.env.MODE === 'test'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  self_approved: { label: 'Self Approved', color: 'text-blue-600 bg-blue-50' },
  approved: { label: 'Approved', color: 'text-green-600 bg-green-50' },
  pending_approval: { label: 'Pending', color: 'text-amber-600 bg-amber-50' },
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// Mock pending approvals for tests
const MOCK_PENDING: { id: string; habitName: string; loggedAt: string; note: string | null }[] = [
  { id: 'r1', habitName: 'Weekend Trip', loggedAt: '2026-03-05T10:00:00Z', note: null },
]

interface PendingApproval {
  id: string
  habitName: string
  loggedAt: string
  note: string | null
}

export default function MonitorDashboard() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()

  // Compute initial state synchronously to avoid setState in effects
  const testMock = isTestMode && userId ? MOCK_USERS[userId] ?? null : undefined
  const skipFetch = !userId || isTestMode

  const [userData, setUserData] = useState<UserData | null>(testMock ?? null)
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(!skipFetch)
  const [notFound, setNotFound] = useState(!userId || (isTestMode && !!userId && !testMock))

  useEffect(() => {
    if (skipFetch) return

    let active = true
    Promise.all([
      fetchMonitoredUserData(userId),
      fetchPendingApprovals(userId),
    ]).then(([data, pending]) => {
        if (!active) return
        if (data.habits.length === 0 && data.recentLogs.length === 0) {
          setNotFound(true)
        } else {
          setUserData({
            name: userId.slice(0, 8),
            initial: 'U',
            balance: data.balance,
            bestStreak: 0,
            habits: (data.habits as { name: string }[]).map((h) => ({ name: h.name })),
            recentLogs: (data.recentLogs as { id: string; logged_at: string; status: string; points_awarded: number; habit_id: string }[]).map((l) => ({
              id: l.id,
              habitName: (data.habits as { id: string; name: string }[]).find((h) => h.id === l.habit_id)?.name ?? 'Unknown',
              loggedAt: l.logged_at,
              status: l.status,
              points: l.points_awarded,
            })),
          })
          setPendingApprovals(pending)
        }
        setLoading(false)
      })
      .catch(() => {
        if (active) { setNotFound(true); setLoading(false) }
      })

    return () => { active = false }
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-10 h-10 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6">
        <span className="material-symbols-outlined text-5xl text-slate-300">error</span>
        <p className="text-slate-500 font-medium">User not found</p>
        <button
          onClick={() => navigate('/me')}
          className="bg-[#D35400] text-white px-6 py-3 rounded-full text-sm font-semibold"
        >
          Go Back
        </button>
      </div>
    )
  }

  async function handleApprove(logId: string) {
    const { error } = await approveActionLog(logId)
    if (!error) setPendingApprovals((prev) => prev.filter((p) => p.id !== logId))
  }

  async function handleReject(logId: string) {
    const { error } = await rejectActionLog(logId)
    if (!error) setPendingApprovals((prev) => prev.filter((p) => p.id !== logId))
  }

  const pending = !isTestMode ? pendingApprovals : MOCK_PENDING

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 pt-8 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-[#D35400] font-semibold text-sm mb-4"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>
        <div className="flex items-center gap-4 mb-6">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {userData.initial}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Monitoring</p>
            <h1 className="text-2xl font-bold tracking-tight">{userData.name}</h1>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-6 pb-8">
        {/* Stats Cards */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-1">
            <div className="size-9 rounded-lg bg-[#FFB800]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#FFB800] text-lg">stars</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{userData.balance.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 font-medium">Balance</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-1">
            <div className="size-9 rounded-lg bg-orange-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-500 text-lg">local_fire_department</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{userData.bestStreak}d</span>
            <span className="text-[10px] text-slate-400 font-medium">Best Streak</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-1">
            <div className="size-9 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-lg">bolt</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{userData.habits.length}</span>
            <span className="text-[10px] text-slate-400 font-medium">Habits</span>
          </div>
        </section>

        {/* Pending Approvals */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Pending Approvals
            {pending.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </h3>
          {pending.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
              <p className="text-sm text-slate-400">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((req) => (
                <div key={req.id} className="bg-white p-5 rounded-2xl border border-amber-200 space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900">{req.habitName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Logged {formatTime(req.loggedAt)}
                    </p>
                    {req.note && <p className="text-sm text-slate-500 mt-1">"{req.note}"</p>}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(req.id)}
                      className="flex-1 py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="flex-1 py-3 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
          {userData.recentLogs.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
              <p className="text-sm text-slate-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userData.recentLogs.map((entry) => {
                const status = STATUS_CONFIG[entry.status] ?? { label: entry.status, color: 'text-slate-600 bg-slate-50' }
                return (
                  <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-[#D35400]/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#D35400] text-lg">check_circle</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm">{entry.habitName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">{formatTime(entry.loggedAt)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                    {entry.points > 0 && (
                      <span className="text-sm font-bold text-[#FFB800] flex items-center gap-0.5 flex-shrink-0">
                        <span className="material-symbols-outlined text-sm">stars</span>
                        +{entry.points}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
