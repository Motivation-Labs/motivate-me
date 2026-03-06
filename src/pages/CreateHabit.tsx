import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useApp } from '../lib/store'
import { getMyMonitors } from '../lib/monitors'

const isTestMode = import.meta.env.MODE === 'test'

export default function CreateHabit() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createHabit } = useApp()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [points, setPoints] = useState(15)
  const [requiresPhoto, setRequiresPhoto] = useState(false)
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [frequencyTarget, setFrequencyTarget] = useState<'none' | 'daily' | 'custom'>('daily')
  const [hasMonitors, setHasMonitors] = useState(false)

  useEffect(() => {
    if (!user || isTestMode) return
    let active = true
    getMyMonitors(user.id).then((monitors) => {
      if (active) setHasMonitors(monitors.length > 0)
    }).catch(() => {})
    return () => { active = false }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createHabit({
      name: name.trim(),
      description: description.trim() || undefined,
      pointsPerCompletion: points,
      requiresPhoto,
      requiresApproval: hasMonitors ? requiresApproval : false,
      frequencyTarget,
      isActive: true,
    })
    navigate('/habits')
  }

  return (
    <div className="relative w-full min-h-dvh bg-slate-200 flex flex-col justify-end">
      <div className="absolute inset-0 p-6 opacity-40 pointer-events-none">
        <div className="space-y-4 mt-16">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-full rounded-xl bg-white/80" />
          ))}
        </div>
      </div>

      <div className="relative w-full bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] flex flex-col pt-2 pb-10">
        <div className="flex justify-center py-3">
          <div className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>

        <div className="px-8 pt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[#D35400] font-semibold text-sm tracking-wider uppercase">
              Motivate Me
            </span>
            <button
              onClick={() => navigate(-1)}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <h2 className="text-slate-900 text-3xl font-bold tracking-tight">Create Habit</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-8 mt-8 space-y-8">
          {/* Habit Name */}
          <div className="space-y-2">
            <label
              htmlFor="habit-name"
              className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
            >
              Habit Title
            </label>
            <input
              id="habit-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Morning Run"
              className="w-full bg-transparent border-none p-0 text-3xl font-bold text-slate-900 placeholder:text-slate-200 focus:ring-0 focus:outline-none"
            />
            <div className="h-px w-full bg-slate-100" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="habit-desc"
              className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
            >
              Description (optional)
            </label>
            <textarea
              id="habit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]/30 resize-none"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              Frequency
            </label>
            <div className="flex gap-2">
              {(['none', 'daily', 'custom'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequencyTarget(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                    frequencyTarget === f
                      ? 'bg-[#D35400] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {f === 'none' ? 'No Target' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Point Stepper */}
          <div className="flex items-center justify-between p-5 bg-[#FFFAF5] rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="size-12 flex items-center justify-center bg-[#D35400]/10 rounded-xl">
                <span className="material-symbols-outlined text-[#D35400] text-2xl">stars</span>
              </div>
              <div>
                <p className="text-slate-900 font-bold">Goal Points</p>
                <p className="text-slate-500 text-sm">Reward per completion</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setPoints((p) => Math.max(1, p - 1))}
                aria-label="Decrease points"
                className="size-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-xl">remove</span>
              </button>
              <span
                aria-live="polite"
                aria-label={`${points} points`}
                className="text-2xl font-bold text-slate-900 w-8 text-center"
              >
                {points}
              </span>
              <button
                type="button"
                onClick={() => setPoints((p) => p + 1)}
                aria-label="Increase points"
                className="size-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-xl">add</span>
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <Toggle
              id="requires-photo"
              icon="photo_camera"
              label="Requires Photo Proof"
              checked={requiresPhoto}
              onChange={setRequiresPhoto}
            />
            <div>
              <Toggle
                id="requires-approval"
                icon="how_to_reg"
                label="Requires Monitor Approval"
                checked={requiresApproval}
                onChange={setRequiresApproval}
                disabled={!hasMonitors}
              />
              {!hasMonitors && (
                <p className="text-xs text-slate-400 ml-14 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">info</span>
                  Invite at least one monitor to enable this
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-[#D35400] py-5 rounded-2xl text-white font-bold text-lg disabled:opacity-40 hover:bg-[#B84700] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              style={{ boxShadow: '0 8px 24px rgba(211,84,0,0.3)' }}
            >
              <span>Create Habit</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
          </div>
        </form>

        <div className="flex justify-center mt-8">
          <div className="h-1.5 w-32 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  )
}

interface ToggleProps {
  id: string
  icon: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

function Toggle({ id, icon, label, checked, onChange, disabled }: ToggleProps) {
  return (
    <div className={`flex items-center justify-between py-2 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-4">
        <div className="size-10 flex items-center justify-center bg-slate-100 rounded-lg">
          <span className="material-symbols-outlined text-slate-500">{icon}</span>
        </div>
        <label htmlFor={id} className="text-slate-900 font-medium cursor-pointer">
          {label}
        </label>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-[#D35400]' : 'bg-slate-200'
        } ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
