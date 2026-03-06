import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getMyMonitors, getMonitoringOthers, getPendingInvites, createMonitorInvite, revokeMonitor } from '../lib/monitors'
import type { MonitorConnection } from '../types'

export default function Monitors() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [myMonitors, setMyMonitors] = useState<MonitorConnection[]>([])
  const [monitoring, setMonitoring] = useState<MonitorConnection[]>([])
  const [pendingInvites, setPendingInvites] = useState<MonitorConnection[]>([])
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [friendEmail, setFriendEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const [monitors, others, pending] = await Promise.all([
        getMyMonitors(user.id),
        getMonitoringOthers(user.id),
        getPendingInvites(user.id),
      ])
      setMyMonitors(monitors)
      setMonitoring(others)
      setPendingInvites(pending)
    } catch (err) {
      console.error('Failed to load monitors:', err)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    let active = true
    if (!user) return
    getMyMonitors(user.id).then((m) => { if (active) setMyMonitors(m) }).catch(() => {})
    getMonitoringOthers(user.id).then((m) => { if (active) setMonitoring(m) }).catch(() => {})
    getPendingInvites(user.id).then((p) => { if (active) setPendingInvites(p); setLoading(false) }).catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])

  async function handleCreateInvite() {
    if (!user) return
    setCreating(true)
    setCopied(false)
    setEmailSent(false)
    try {
      const token = await createMonitorInvite(user.id)
      const link = `${window.location.origin}/invite/${token}`
      setInviteLink(link)
      await loadData()
    } catch (err) {
      console.error('Failed to create invite:', err)
    }
    setCreating(false)
  }

  async function handleRevoke(id: string) {
    try {
      await revokeMonitor(id)
      await loadData()
    } catch (err) {
      console.error('Failed to revoke:', err)
    }
  }

  function copyLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleSendEmail() {
    if (!inviteLink || !friendEmail.trim()) return
    const subject = encodeURIComponent('Join me on Motivate Me!')
    const body = encodeURIComponent(
      `Hey! I'd love for you to be my accountability monitor on Motivate Me.\n\nClick this link to accept the invite:\n${inviteLink}\n\nThanks!`
    )
    window.open(`mailto:${friendEmail.trim()}?subject=${subject}&body=${body}`, '_self')
    setEmailSent(true)
    setTimeout(() => setEmailSent(false), 3000)
  }

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
        <h1 className="text-4xl font-bold tracking-tight mb-6">Monitors</h1>
      </header>

      <main className="px-6 space-y-6 pb-8">
        {/* Invite Section */}
        <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <button
            onClick={handleCreateInvite}
            disabled={creating}
            className="w-full py-3 bg-[#D35400] text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ boxShadow: '0 4px 12px rgba(211,84,0,0.3)' }}
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            {creating ? 'Creating...' : 'Invite a Monitor'}
          </button>

          {/* Invite Link Actions */}
          {inviteLink && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-green-700">Invite link created! Share it:</p>

              {/* Copy Link */}
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600"
                />
                <button
                  onClick={copyLink}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Email Invite */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500 font-medium mb-2">Or send via email:</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    placeholder="Friend's email address"
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/20 outline-none"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={!friendEmail.trim()}
                    className="px-4 py-2 bg-[#D35400] text-white rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    Send Invite
                  </button>
                </div>
                {emailSent && (
                  <p className="text-xs text-green-600 font-medium mt-2">
                    Email client opened! Invite ready to send.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Email input always visible for quick access */}
          {!inviteLink && (
            <div className="flex gap-2">
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Friend's email address"
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/20 outline-none"
              />
              <button
                onClick={handleCreateInvite}
                disabled={creating || !friendEmail.trim()}
                className="px-4 py-2 bg-[#D35400] text-white rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                Send Invite
              </button>
            </div>
          )}
        </section>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pending Invites</h3>
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="bg-white p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600">hourglass_top</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Waiting for acceptance</p>
                    <p className="text-xs text-slate-400">Created {new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  className="text-xs text-red-500 font-semibold"
                >
                  Cancel
                </button>
              </div>
            ))}
          </section>
        )}

        {/* My Monitors */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">People Monitoring Me</h3>
          {loading ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
              <p className="text-sm text-slate-400">Loading...</p>
            </div>
          ) : myMonitors.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
              <p className="text-sm text-slate-400">No monitors yet. Invite someone to get started.</p>
            </div>
          ) : (
            myMonitors.map((mon) => (
              <div key={mon.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600">visibility</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{mon.monitorEmail ?? mon.monitorUserId.slice(0, 8)}</p>
                    <p className="text-xs text-slate-400">
                      Since {mon.acceptedAt ? new Date(mon.acceptedAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(mon.id)}
                  className="text-xs text-red-500 font-semibold"
                >
                  Revoke
                </button>
              </div>
            ))
          )}
        </section>

        {/* Monitoring Others */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">I'm Monitoring</h3>
          {loading ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
              <p className="text-sm text-slate-400">Loading...</p>
            </div>
          ) : monitoring.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
              <p className="text-sm text-slate-400">You're not monitoring anyone yet.</p>
            </div>
          ) : (
            monitoring.map((mon) => (
              <Link
                key={mon.id}
                to={`/monitor/${mon.userId}`}
                className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 block hover:border-[#D35400]/20 transition-colors"
              >
                <div className="size-10 rounded-xl bg-[#D35400]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#D35400]">monitoring</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{mon.userEmail ?? mon.userId.slice(0, 8)}</p>
                  <p className="text-xs text-slate-400">Tap to view dashboard</p>
                </div>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </Link>
            ))
          )}
        </section>
      </main>
    </div>
  )
}
