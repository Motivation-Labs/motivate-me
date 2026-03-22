import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getMyMonitors, getMonitoringOthers, getPendingInvites, createMonitorInvite, revokeMonitor, sendInviteEmail, updateMonitorPermissions } from '../lib/monitors'
import { fetchProfiles } from '../lib/profile'
import { getAvatarText, AVATAR_COLORS } from '../lib/avatar'
import { siteUrl } from '../lib/supabase'
import type { MonitorConnection, Profile } from '../types'

const isTestMode = import.meta.env.MODE === 'test'

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
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)
  const [localPermissions, setLocalPermissions] = useState<Map<string, { can_edit_habits: boolean; can_edit_rewards: boolean }>>(new Map())

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

      // Fetch profiles for all connected users
      if (!isTestMode) {
        const userIds = [
          ...monitors.map((m) => m.monitorUserId),
          ...others.map((m) => m.userId),
        ].filter(Boolean)
        if (userIds.length > 0) {
          const profileMap = await fetchProfiles(userIds)
          setProfiles(profileMap)
        }
      }
    } catch (err) {
      console.error('Failed to load monitors:', err)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    let active = true
    if (!user) return
    loadData().then(() => { if (!active) return })
    return () => { active = false }
  }, [user, loadData])

  // Summary stats
  const totalInvites = pendingInvites.length + myMonitors.length
  const totalAccepted = myMonitors.length

  async function handleCreateInvite() {
    if (!user) return
    setCreating(true)
    setCopied(false)
    setEmailSent(false)
    setInviteError(null)
    try {
      const token = await createMonitorInvite(user.id)
      const link = `${siteUrl}/invite/${token}`
      setInviteLink(link)
      await loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Failed to create invite:', msg)
      setInviteError(`Failed to create invite: ${msg}`)
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

  async function handleSendEmail() {
    if (!inviteLink || !friendEmail.trim()) return
    setSendingEmail(true)
    setEmailError(null)
    try {
      const result = await sendInviteEmail(friendEmail.trim(), inviteLink, 'A friend')
      if (result.success) {
        setEmailSent(true)
        setFriendEmail('')
        setTimeout(() => setEmailSent(false), 3000)
      }
    } catch {
      setEmailError('Failed to send email. Try copying the link instead.')
    }
    setSendingEmail(false)
  }

  async function handleQuickEmailInvite() {
    if (!user || !friendEmail.trim()) return
    setCreating(true)
    setEmailError(null)
    try {
      const token = await createMonitorInvite(user.id)
      const link = `${siteUrl}/invite/${token}`
      setInviteLink(link)
      await loadData()
      const result = await sendInviteEmail(friendEmail.trim(), link, 'A friend')
      if (result.success) {
        setEmailSent(true)
        setFriendEmail('')
        setTimeout(() => setEmailSent(false), 3000)
      }
    } catch {
      setEmailError('Failed to create invite. Please try again.')
    }
    setCreating(false)
  }

  function copyInviteLink(inv: MonitorConnection) {
    if (!inv.inviteToken) return
    const link = `${siteUrl}/invite/${inv.inviteToken}`
    navigator.clipboard.writeText(link)
    setCopiedInviteId(inv.id)
    setTimeout(() => setCopiedInviteId(null), 2000)
  }

  async function handleTogglePermission(
    monId: string,
    current: { can_edit_habits: boolean; can_edit_rewards: boolean },
    field: 'can_edit_habits' | 'can_edit_rewards'
  ) {
    const updated = { ...current, [field]: !current[field] }
    setLocalPermissions((prev) => new Map(prev).set(monId, updated))
    setMyMonitors((prev) =>
      prev.map((m) => (m.id === monId ? { ...m, permissions: updated } : m))
    )
    if (!isTestMode) {
      try {
        await updateMonitorPermissions(monId, updated)
      } catch (err) {
        console.error('Failed to update permissions:', err)
        // Revert on failure
        setMyMonitors((prev) =>
          prev.map((m) => (m.id === monId ? { ...m, permissions: current } : m))
        )
      }
    }
  }

  function getProfileAvatar(userId: string, fallbackEmail?: string) {
    const profile = profiles.get(userId)
    const displayName = profile?.displayName
    const avatarUrl = profile?.avatarUrl
    const text = getAvatarText(displayName, fallbackEmail ?? userId.slice(0, 8))
    // Deterministic color from userId
    const colorIndex = userId.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_COLORS.length
    const bgColor = AVATAR_COLORS[colorIndex]
    return { displayName, avatarUrl, text, bgColor }
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
        {/* Invite Summary Stats */}
        {totalInvites > 0 && (
          <div className={`rounded-2xl p-4 flex items-center gap-4 border ${
            totalAccepted > 0
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className={`size-10 rounded-xl flex items-center justify-center ${
              totalAccepted > 0 ? 'bg-emerald-100' : 'bg-amber-100'
            }`}>
              <span className={`material-symbols-outlined ${
                totalAccepted > 0 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {totalAccepted > 0 ? 'check_circle' : 'hourglass_top'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {totalInvites} invite{totalInvites !== 1 ? 's' : ''} sent
              </p>
              <p className={`text-xs font-medium ${
                totalAccepted > 0 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {totalAccepted} accepted{pendingInvites.length > 0 ? ` · ${pendingInvites.length} pending` : ''}
              </p>
            </div>
          </div>
        )}

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

          {inviteError && (
            <p className="text-xs text-red-600 font-medium">{inviteError}</p>
          )}

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
                    disabled={!friendEmail.trim() || sendingEmail}
                    className="px-4 py-2 bg-[#D35400] text-white rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    {sendingEmail ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
                {emailSent && (
                  <p className="text-xs text-green-600 font-medium mt-2">
                    Invite sent successfully!
                  </p>
                )}
                {emailError && (
                  <p className="text-xs text-red-600 font-medium mt-2">{emailError}</p>
                )}
              </div>
            </div>
          )}

          {/* Email input always visible for quick access */}
          {!inviteLink && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="Friend's email address"
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/20 outline-none"
                />
                <button
                  onClick={handleQuickEmailInvite}
                  disabled={creating || !friendEmail.trim()}
                  className="px-4 py-2 bg-[#D35400] text-white rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  {creating ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
              {emailSent && (
                <p className="text-xs text-green-600 font-medium">Invite sent successfully!</p>
              )}
              {emailError && (
                <p className="text-xs text-red-600 font-medium">{emailError}</p>
              )}
            </div>
          )}
        </section>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pending Invites</h3>
            {pendingInvites.map((inv) => {
              const justCopied = copiedInviteId === inv.id
              return (
                <div
                  key={inv.id}
                  className={`relative bg-white p-4 rounded-2xl border flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all ${
                    justCopied ? 'border-emerald-300 bg-emerald-50' : 'border-amber-200'
                  }`}
                  onClick={() => copyInviteLink(inv)}
                  role="button"
                  aria-label="Copy invite link"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${
                      justCopied ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}>
                      <span className={`material-symbols-outlined transition-colors ${
                        justCopied ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {justCopied ? 'check' : 'hourglass_top'}
                      </span>
                    </div>
                    <div>
                      <p className={`text-sm font-medium transition-colors ${
                        justCopied ? 'text-emerald-700' : 'text-slate-900'
                      }`}>
                        {justCopied ? 'Link copied!' : 'Waiting for acceptance'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {justCopied
                          ? 'Share it with your friend'
                          : `Created ${new Date(inv.createdAt).toLocaleDateString()} · ${timeAgo(inv.createdAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm transition-colors ${
                      justCopied ? 'text-emerald-500' : 'text-slate-300'
                    }`}>
                      {justCopied ? 'check_circle' : 'content_copy'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRevoke(inv.id) }}
                      className="text-xs text-red-500 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* My Monitors (People Monitoring Me) */}
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
            myMonitors.map((mon) => {
              const avatar = getProfileAvatar(mon.monitorUserId, mon.monitorEmail)
              const isExpanded = expandedId === `my-${mon.id}`
              return (
                <div key={mon.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : `my-${mon.id}`)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      {avatar.avatarUrl ? (
                        <img src={avatar.avatarUrl} alt="" className="size-10 rounded-full object-cover" />
                      ) : (
                        <div
                          className="size-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: avatar.bgColor }}
                        >
                          {avatar.text}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {avatar.displayName ?? mon.monitorEmail ?? mon.monitorUserId.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-400">
                          Since {mon.acceptedAt ? new Date(mon.acceptedAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-slate-50 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-sm">person</span>
                        <span>{avatar.displayName ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-sm">email</span>
                        <span>{mon.monitorEmail ?? '—'}</span>
                      </div>
                      {/* Permissions */}
                      <div className="pt-1 space-y-2">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Permissions</p>
                        {([
                          { key: 'can_edit_habits' as const, label: 'Can edit habits', icon: 'edit_note' },
                          { key: 'can_edit_rewards' as const, label: 'Can edit rewards', icon: 'redeem' },
                        ]).map((perm) => (
                          <div key={perm.key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="material-symbols-outlined text-sm text-slate-400">{perm.icon}</span>
                              <span>{perm.label}</span>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={mon.permissions[perm.key]}
                              aria-label={perm.label}
                              onClick={() => handleTogglePermission(mon.id, mon.permissions, perm.key)}
                              className={`relative w-9 h-5 rounded-full transition-colors ${
                                mon.permissions[perm.key] ? 'bg-[#D35400]' : 'bg-slate-200'
                              }`}
                            >
                              <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${
                                mon.permissions[perm.key] ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleRevoke(mon.id)}
                        className="mt-1 text-xs text-red-500 font-semibold"
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>

        {/* Monitoring Others (I'm Monitoring) */}
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
            monitoring.map((mon) => {
              const avatar = getProfileAvatar(mon.userId, mon.userEmail)
              const isExpanded = expandedId === `other-${mon.id}`
              return (
                <div key={mon.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : `other-${mon.id}`)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      {avatar.avatarUrl ? (
                        <img src={avatar.avatarUrl} alt="" className="size-10 rounded-full object-cover" />
                      ) : (
                        <div
                          className="size-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: avatar.bgColor }}
                        >
                          {avatar.text}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {avatar.displayName ?? mon.userEmail ?? mon.userId.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-400">Tap to view details</p>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-slate-50 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-sm">person</span>
                        <span>{avatar.displayName ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-sm">email</span>
                        <span>{mon.userEmail ?? '—'}</span>
                      </div>
                      <Link
                        to={`/monitor/${mon.userId}`}
                        className="inline-flex items-center gap-1 mt-2 text-xs text-[#D35400] font-semibold"
                      >
                        <span className="material-symbols-outlined text-sm">monitoring</span>
                        View Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>
      </main>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
