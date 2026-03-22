import { supabase } from './supabase'
import type { MonitorConnection } from '../types'

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

// Create an invite — returns the token
export async function createMonitorInvite(userId: string): Promise<string> {
  const token = generateToken()
  const { error } = await supabase.from('monitors').insert({
    user_id: userId,
    invite_token: token,
  })
  if (error) throw error
  return token
}

// Accept an invite via RPC (bypasses RLS since accepting user isn't on the row yet)
// monitorUserId is kept for backward compat but the RPC uses auth.uid() directly
export async function acceptMonitorInvite(
  token: string,
  ...args: string[]
): Promise<{ success: boolean; error?: string }> {
  void args
  const { data, error } = await supabase.rpc('accept_monitor_invite', {
    invite_token_param: token,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  const result = data as { success: boolean; error?: string }
  return result
}

// Send invite email via Edge Function, falls back to mailto
export async function sendInviteEmail(
  to: string,
  inviteLink: string,
  fromName?: string
): Promise<{ success: boolean; method: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-invite-email', {
      body: { to, inviteLink, fromName },
    })

    if (error) throw error
    return { success: true, method: data?.method ?? 'edge-function' }
  } catch {
    // Fallback: open mailto
    const subject = encodeURIComponent('Join me on Motivate Me!')
    const body = encodeURIComponent(
      `Hey! I'd love for you to be my accountability monitor on Motivate Me.\n\nClick this link to accept the invite:\n${inviteLink}\n\nThanks!`
    )
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self')
    return { success: true, method: 'mailto-fallback' }
  }
}

// Get monitors for a user (people monitoring me)
export async function getMyMonitors(userId: string): Promise<MonitorConnection[]> {
  const { data, error } = await supabase
    .from('monitors')
    .select('*')
    .eq('user_id', userId)
    .not('accepted_at', 'is', null)

  if (error) throw error
  return (data ?? []).map(toConnection)
}

// Get users I'm monitoring
export async function getMonitoringOthers(monitorUserId: string): Promise<MonitorConnection[]> {
  const { data, error } = await supabase
    .from('monitors')
    .select('*')
    .eq('monitor_user_id', monitorUserId)
    .not('accepted_at', 'is', null)

  if (error) throw error
  return (data ?? []).map(toConnection)
}

// Get pending (unaccepted) invites I've sent
export async function getPendingInvites(userId: string): Promise<MonitorConnection[]> {
  const { data, error } = await supabase
    .from('monitors')
    .select('*')
    .eq('user_id', userId)
    .is('accepted_at', null)
    .not('invite_token', 'is', null)

  if (error) throw error
  return (data ?? []).map(toConnection)
}

// Revoke a monitor connection
export async function revokeMonitor(connectionId: string): Promise<void> {
  const { error } = await supabase.from('monitors').delete().eq('id', connectionId)
  if (error) throw error
}

// Get monitored user's data (for monitor dashboard)
export async function fetchMonitoredUserData(userId: string) {
  const [habits, logs, ledger, rewards] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', userId).eq('is_active', true),
    supabase.from('action_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false }).limit(20),
    supabase.from('point_ledger').select('*').eq('user_id', userId),
    supabase.from('rewards').select('*').eq('user_id', userId).eq('status', 'wishlist'),
  ])

  return {
    habits: habits.data ?? [],
    recentLogs: logs.data ?? [],
    balance: (ledger.data ?? []).reduce((sum: number, e: { delta: number }) => sum + e.delta, 0),
    wishlistRewards: rewards.data ?? [],
  }
}

// Update a monitor's permissions
export async function updateMonitorPermissions(
  connectionId: string,
  permissions: { can_edit_habits: boolean; can_edit_rewards: boolean }
): Promise<void> {
  const { error } = await supabase
    .from('monitors')
    .update({ permissions })
    .eq('id', connectionId)
  if (error) throw error
}

// ── Helper ──

interface MonitorRow {
  id: string; user_id: string; monitor_user_id: string | null
  monitor_email: string | null
  permissions: { can_edit_habits: boolean; can_edit_rewards: boolean }
  invite_token: string | null; accepted_at: string | null; created_at: string
}

function toConnection(r: MonitorRow): MonitorConnection {
  return {
    id: r.id,
    userId: r.user_id,
    monitorUserId: r.monitor_user_id ?? '',
    monitorEmail: r.monitor_email ?? undefined,
    permissions: r.permissions,
    inviteToken: r.invite_token ?? undefined,
    acceptedAt: r.accepted_at ?? undefined,
    createdAt: r.created_at,
  }
}
