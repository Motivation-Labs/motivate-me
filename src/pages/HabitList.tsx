import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store'

type Tab = 'active' | 'archived'

export default function HabitList() {
  const { habits, isLoggedToday, getStreak } = useApp()
  const [tab, setTab] = useState<Tab>('active')

  const filtered = habits.filter((h) =>
    tab === 'active' ? h.isActive : !h.isActive
  )

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-[#FFFAF5]/90 backdrop-blur-md px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#D35400]/10 p-2 rounded-lg">
              <span className="material-symbols-outlined text-[#D35400]">bolt</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight">Motivate Me</h2>
          </div>
          <Link
            to="/habits/new"
            className="bg-[#D35400] text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-1"
            style={{ boxShadow: '0 4px 12px rgba(211,84,0,0.3)' }}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Habit
          </Link>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-6">My Habits</h1>

        {/* Segmented Control */}
        <div className="flex p-1 bg-slate-200/50 rounded-xl">
          {(['active', 'archived'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                tab === t
                  ? 'bg-white shadow-sm text-[#D35400]'
                  : 'text-slate-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* Habit List */}
      <main className="px-6 space-y-4 mt-4 pb-4">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="material-symbols-outlined text-5xl text-slate-300">
              {tab === 'active' ? 'bolt' : 'archive'}
            </span>
            <p className="text-slate-400 font-medium text-center">
              {tab === 'active'
                ? 'No active habits yet.'
                : 'No archived habits.'}
            </p>
            {tab === 'active' && (
              <Link
                to="/habits/new"
                className="bg-[#D35400] text-white px-6 py-3 rounded-full text-sm font-semibold"
              >
                Create your first habit
              </Link>
            )}
          </div>
        )}

        {filtered.map((habit) => {
          const done = isLoggedToday(habit.id)
          const streak = getStreak(habit.id)
          return (
            <div
              key={habit.id}
              className={`bg-white p-5 rounded-xl shadow-sm border flex items-center justify-between transition-opacity ${
                done ? 'opacity-60 border-slate-100' : 'border-slate-100'
              }`}
            >
              <Link
                to={`/habits/${habit.id}/edit`}
                className="flex flex-col gap-1 flex-1 min-w-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      done
                        ? 'text-slate-400 bg-slate-100'
                        : 'text-[#D35400] bg-[#D35400]/10'
                    }`}
                  >
                    +{habit.pointsPerCompletion} PTS
                  </span>
                  {habit.requiresApproval && (
                    <span className="text-amber-600 text-xs font-medium flex items-center gap-1" title="Requires monitor approval">
                      <span className="material-symbols-outlined text-sm text-amber-500">lock</span>
                      Approval
                    </span>
                  )}
                  {streak > 0 && (
                    <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-orange-400">
                        local_fire_department
                      </span>
                      {streak} day streak
                    </span>
                  )}
                </div>
                <h3
                  className={`text-lg font-semibold mt-1 ${
                    done ? 'text-slate-400 line-through' : 'text-slate-900'
                  }`}
                >
                  {habit.name}
                </h3>
              </Link>

              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                {done ? (
                  <div className="size-12 rounded-full bg-[#D35400] flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">done_all</span>
                  </div>
                ) : (
                  <Link
                    to="/log"
                    aria-label={`Log ${habit.name}`}
                    className="size-12 rounded-full border-2 border-[#D35400]/20 flex items-center justify-center text-[#D35400] hover:bg-[#D35400]/5 transition-colors"
                  >
                    <span className="material-symbols-outlined">check</span>
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}
