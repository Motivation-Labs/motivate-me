import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useApp } from '../lib/store'
import { deleteAccountAndData } from '../lib/db'

export default function Me() {
  const { user, signOut } = useAuth()
  const { totalEarned, totalRedeemed, getBestStreak } = useApp()
  const [notifyApprovals, setNotifyApprovals] = useState(true)
  const [notifyStreaks, setNotifyStreaks] = useState(true)
  const [notifyWishlist, setNotifyWishlist] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const bestStreak = getBestStreak()
  const userId = user?.id ?? ''
  const idMatch = deleteInput.trim() === userId

  async function handleDeleteAccount() {
    if (!user || !idMatch) return
    setDeleting(true)
    try {
      await deleteAccountAndData(user.id)
      await signOut()
    } catch (err) {
      console.error('Failed to delete account:', err)
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 pt-8 pb-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#D35400]/10 p-2 rounded-lg">
            <span className="material-symbols-outlined text-[#D35400]">person</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight">Motivate Me</h2>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-6">Profile</h1>
      </header>

      <main className="px-6 space-y-6 pb-8">
        {/* Profile Card */}
        <Link to="/profile/edit" className="block bg-white p-6 rounded-2xl border border-slate-100 hover:border-[#D35400]/20 transition-colors">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-[#D35400] to-[#E87A2A] flex items-center justify-center text-white text-2xl font-bold">
              {(user?.email?.[0] ?? 'M').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900">{user?.user_metadata?.display_name ?? 'Motivator'}</h3>
              <p className="text-sm text-slate-500 truncate">{user?.email ?? 'No email'}</p>
            </div>
            <span className="material-symbols-outlined text-slate-300">chevron_right</span>
          </div>
        </Link>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Earned', value: totalEarned.toLocaleString(), icon: 'stars', color: 'text-[#FFB800]', bg: 'bg-[#FFB800]/10' },
            { label: 'Redeemed', value: totalRedeemed.toLocaleString(), icon: 'redeem', color: 'text-[#D35400]', bg: 'bg-[#D35400]/10' },
            { label: 'Best Streak', value: `${bestStreak}d`, icon: 'local_fire_department', color: 'text-orange-500', bg: 'bg-orange-100' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
              <div className={`size-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{stat.value}</span>
              <span className="text-[11px] text-slate-400 font-medium text-center">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-2 gap-3">
          <Link to="/history" className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 hover:border-[#D35400]/20 transition-colors">
            <span className="material-symbols-outlined text-[#D35400]">history</span>
            <span className="text-sm font-semibold text-slate-900">Activity Log</span>
          </Link>
          <Link to="/notifications" className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 hover:border-[#D35400]/20 transition-colors">
            <span className="material-symbols-outlined text-[#D35400]">notifications</span>
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
          </Link>
          <Link to="/monitors" className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 hover:border-[#D35400]/20 transition-colors col-span-2">
            <span className="material-symbols-outlined text-[#D35400]">supervisor_account</span>
            <span className="text-sm font-semibold text-slate-900">Monitors</span>
            <span className="material-symbols-outlined text-slate-300 ml-auto">chevron_right</span>
          </Link>
        </section>

        {/* Notification Preferences */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
            <NotifToggle id="notif-approvals" icon="how_to_reg" label="Approval Decisions" checked={notifyApprovals} onChange={setNotifyApprovals} />
            <NotifToggle id="notif-streaks" icon="local_fire_department" label="Streak Milestones" checked={notifyStreaks} onChange={setNotifyStreaks} />
            <NotifToggle id="notif-wishlist" icon="favorite" label="Wishlist Ready" checked={notifyWishlist} onChange={setNotifyWishlist} />
          </div>
        </section>

        {/* Sign Out */}
        <button
          onClick={signOut}
          className="w-full py-3 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors rounded-xl"
        >
          Sign Out
        </button>

        {/* Account Deletion — at the very bottom */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Danger Zone</h3>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 text-red-500 font-semibold text-sm border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              Delete My Account
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-500 mt-0.5">warning</span>
                <div>
                  <p className="text-sm font-semibold text-red-800">This action is permanent</p>
                  <p className="text-xs text-red-600 mt-1">
                    All your data will be permanently deleted: habits, action logs, points, rewards, notifications, profile, and monitor connections. A confirmation email will be sent.
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-red-700 mb-2">Type your User ID to confirm:</p>
                <p className="text-[10px] font-mono text-slate-500 mb-2 break-all">{userId}</p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="Enter your User ID"
                  className="w-full px-4 py-3 rounded-xl border border-red-200 text-sm font-mono focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                  className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={!idMatch || deleting}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm disabled:opacity-40"
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

interface NotifToggleProps { id: string; icon: string; label: string; checked: boolean; onChange: (v: boolean) => void }

function NotifToggle({ id, icon, label, checked, onChange }: NotifToggleProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-slate-400 text-xl">{icon}</span>
        <label htmlFor={id} className="text-sm text-slate-900 font-medium cursor-pointer">{label}</label>
      </div>
      <button id={id} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#D35400]' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}
