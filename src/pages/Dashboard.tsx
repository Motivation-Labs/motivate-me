import { Link } from 'react-router-dom'
import { useApp } from '../lib/store'

export default function Dashboard() {
  const { habits, pointBalance, isLoggedToday, getStreak, getBestStreak, todayLogs, notifications } = useApp()

  const activeHabits = habits.filter((h) => h.isActive)
  const todayDone = activeHabits.filter((h) => isLoggedToday(h.id))
  const allDone = activeHabits.length > 0 && todayDone.length === activeHabits.length
  const todayPoints = todayLogs.reduce((sum, l) => sum + l.pointsAwarded, 0)
  const bestStreak = getBestStreak()
  const completionPct = activeHabits.length > 0 ? Math.round((todayDone.length / activeHabits.length) * 100) : 0
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-[#D35400]/10 flex items-center justify-center border-2 border-[#D35400]/20 overflow-hidden">
            <span className="material-symbols-outlined text-[#D35400]">person</span>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">Welcome back,</p>
            <h1 className="text-lg font-bold">Motivator</h1>
          </div>
        </div>
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="size-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 relative"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-5 bg-[#D35400] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
      </header>

      <main className="flex-1 px-6 space-y-6">
        {/* Points Hero Card */}
        <section
          className="relative overflow-hidden rounded-2xl bg-[#D35400] p-8 text-white custom-shadow"
          aria-label="Point balance"
        >
          <div className="absolute -right-10 -top-10 size-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-10 -bottom-10 size-32 bg-[#FFB800]/20 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-white/80 text-sm font-medium uppercase tracking-wider">Total Balance</p>
                <h2 className="text-6xl font-bold mt-1 tracking-tight" aria-live="polite">
                  {pointBalance.toLocaleString()}
                </h2>
                {todayPoints > 0 && (
                  <p className="text-[#FFB800] text-sm font-semibold mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    +{todayPoints} pts today
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="text-white/70 text-xs">
                {todayDone.length} of {activeHabits.length} done today
              </div>
              <Link
                to="/rewards"
                className="bg-[#FFB800] text-slate-900 px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Claim Rewards
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100">
            <div className="size-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-3">
              <span className="material-symbols-outlined">local_fire_department</span>
            </div>
            <p className="text-slate-500 text-xs font-medium">Best Streak</p>
            <p className="text-xl font-bold">{bestStreak} Days</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100">
            <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-3">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <p className="text-slate-500 text-xs font-medium">Today</p>
            <p className="text-xl font-bold">{completionPct}%</p>
          </div>
        </section>

        {/* Celebration Banner */}
        {allDone && (
          <div className="bg-green-500 text-white rounded-2xl p-4 text-center font-bold animate-pulse">
            All done today! +{todayPoints} pts earned
          </div>
        )}

        {/* Today's Habits */}
        <section className="space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight">Today's Habits</h3>
            <Link to="/habits" className="text-[#D35400] text-sm font-semibold">
              View All
            </Link>
          </div>

          {activeHabits.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-4">
              <span className="material-symbols-outlined text-5xl text-slate-200">bolt</span>
              <p className="text-slate-400 text-sm">No habits yet. Create your first one!</p>
              <Link
                to="/habits/new"
                className="bg-[#D35400] text-white px-6 py-3 rounded-full text-sm font-semibold"
              >
                Create Habit
              </Link>
            </div>
          )}

          <div className="space-y-3">
            {activeHabits.map((habit) => {
              const done = isLoggedToday(habit.id)
              const streak = getStreak(habit.id)
              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 transition-all hover:border-[#D35400]/30"
                >
                  {done ? (
                    <div className="size-7 rounded-lg bg-[#D35400] flex items-center justify-center text-white flex-shrink-0">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </div>
                  ) : (
                    <Link
                      to="/log"
                      className="size-7 rounded-lg border-2 border-slate-200 flex items-center justify-center text-transparent hover:border-[#D35400]/40 transition-colors flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                    </Link>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-semibold text-slate-800 truncate ${
                        done ? 'line-through opacity-50' : ''
                      }`}
                    >
                      {habit.name}
                    </h4>
                    <p className="text-xs text-slate-500">{habit.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {done ? (
                      <span className="material-symbols-outlined text-[#D35400] text-lg">verified</span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#FFB800] px-2 py-0.5 bg-[#FFB800]/10 rounded-full">
                        +{habit.pointsPerCompletion} pts
                      </span>
                    )}
                    {habit.requiresApproval && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5" title="Requires monitor approval">
                        <span className="material-symbols-outlined text-xs text-amber-500">lock</span>
                        Approval
                      </span>
                    )}
                    {streak > 0 && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs text-orange-400">local_fire_department</span>
                        {streak}d
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* History link */}
        <div className="pb-4">
          <Link
            to="/history"
            className="flex items-center justify-center gap-2 text-sm text-slate-400 font-medium py-3"
          >
            <span className="material-symbols-outlined text-lg">history</span>
            View Activity History
          </Link>
        </div>
      </main>
    </div>
  )
}
