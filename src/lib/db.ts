import { supabase } from './supabase'
import type { Habit, ActionLog, PointLedgerEntry, Reward, AppNotification } from '../types'

// ── Row types (snake_case from Postgres) ──

interface HabitRow {
  id: string; user_id: string; name: string; description: string | null
  points_per_completion: number; requires_photo: boolean; requires_approval: boolean
  frequency_target: string; frequency_count: number | null; is_active: boolean; created_at: string
}

interface ActionLogRow {
  id: string; habit_id: string; user_id: string; logged_at: string
  photo_url: string | null; note: string | null; status: string; points_awarded: number
}

interface LedgerRow {
  id: string; user_id: string; delta: number; reason: string
  reference_id: string; reference_type: string; created_at: string
}

interface RewardRow {
  id: string; user_id: string; title: string; type: string; point_cost: number
  photo_url: string | null; url: string | null; description: string | null
  requires_approval: boolean; status: string; created_at: string
}

interface NotifRow {
  id: string; user_id: string; type: string; message: string; timestamp: string; read: boolean
}

// ── Row → App type mappers ──

function toHabit(r: HabitRow): Habit {
  return {
    id: r.id, userId: r.user_id, name: r.name,
    description: r.description ?? undefined,
    pointsPerCompletion: r.points_per_completion,
    requiresPhoto: r.requires_photo, requiresApproval: r.requires_approval,
    frequencyTarget: r.frequency_target as Habit['frequencyTarget'],
    frequencyCount: r.frequency_count ?? undefined,
    isActive: r.is_active, createdAt: r.created_at,
  }
}

function toActionLog(r: ActionLogRow): ActionLog {
  return {
    id: r.id, habitId: r.habit_id, userId: r.user_id, loggedAt: r.logged_at,
    photoUrl: r.photo_url ?? undefined, note: r.note ?? undefined,
    status: r.status as ActionLog['status'], pointsAwarded: r.points_awarded,
  }
}

function toLedger(r: LedgerRow): PointLedgerEntry {
  return {
    id: r.id, userId: r.user_id, delta: r.delta, reason: r.reason,
    referenceId: r.reference_id,
    referenceType: r.reference_type as PointLedgerEntry['referenceType'],
    createdAt: r.created_at,
  }
}

function toReward(r: RewardRow): Reward {
  return {
    id: r.id, userId: r.user_id, title: r.title,
    type: r.type as Reward['type'], pointCost: r.point_cost,
    photoUrl: r.photo_url ?? undefined, url: r.url ?? undefined,
    description: r.description ?? undefined,
    requiresApproval: r.requires_approval,
    status: r.status as Reward['status'], createdAt: r.created_at,
  }
}

function toNotification(r: NotifRow): AppNotification {
  return {
    id: r.id, type: r.type as AppNotification['type'],
    message: r.message, timestamp: r.timestamp, read: r.read,
  }
}

// ── Fetch operations ──

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as HabitRow[]).map(toHabit)
}

export async function fetchActionLogs(userId: string): Promise<ActionLog[]> {
  const { data, error } = await supabase
    .from('action_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as ActionLogRow[]).map(toActionLog)
}

export async function fetchPointLedger(userId: string): Promise<PointLedgerEntry[]> {
  const { data, error } = await supabase
    .from('point_ledger').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as LedgerRow[]).map(toLedger)
}

export async function fetchRewards(userId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as RewardRow[]).map(toReward)
}

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications').select('*').eq('user_id', userId).order('timestamp', { ascending: false })
  if (error) throw error
  return ((data ?? []) as NotifRow[]).map(toNotification)
}

// ── Write operations ──

export async function insertHabit(userId: string, habit: Habit) {
  const { error } = await supabase.from('habits').insert({
    id: habit.id, user_id: userId, name: habit.name,
    description: habit.description ?? null,
    points_per_completion: habit.pointsPerCompletion,
    requires_photo: habit.requiresPhoto, requires_approval: habit.requiresApproval,
    frequency_target: habit.frequencyTarget,
    frequency_count: habit.frequencyCount ?? null,
    is_active: habit.isActive,
  })
  if (error) console.error('insertHabit:', error)
}

export async function updateHabitRow(id: string, data: Partial<Habit>) {
  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.description !== undefined) updates.description = data.description ?? null
  if (data.pointsPerCompletion !== undefined) updates.points_per_completion = data.pointsPerCompletion
  if (data.requiresPhoto !== undefined) updates.requires_photo = data.requiresPhoto
  if (data.requiresApproval !== undefined) updates.requires_approval = data.requiresApproval
  if (data.frequencyTarget !== undefined) updates.frequency_target = data.frequencyTarget
  if (data.frequencyCount !== undefined) updates.frequency_count = data.frequencyCount ?? null
  if (data.isActive !== undefined) updates.is_active = data.isActive
  const { error } = await supabase.from('habits').update(updates).eq('id', id)
  if (error) console.error('updateHabit:', error)
}

export async function insertActionLog(userId: string, log: ActionLog) {
  const { error } = await supabase.from('action_logs').insert({
    id: log.id, habit_id: log.habitId, user_id: userId,
    logged_at: log.loggedAt, photo_url: log.photoUrl ?? null,
    note: log.note ?? null, status: log.status, points_awarded: log.pointsAwarded,
  })
  if (error) console.error('insertActionLog:', error)
}

export async function insertLedgerEntry(userId: string, entry: PointLedgerEntry) {
  const { error } = await supabase.from('point_ledger').insert({
    id: entry.id, user_id: userId, delta: entry.delta, reason: entry.reason,
    reference_id: entry.referenceId, reference_type: entry.referenceType,
  })
  if (error) console.error('insertLedger:', error)
}

export async function insertReward(userId: string, reward: Reward) {
  const { error } = await supabase.from('rewards').insert({
    id: reward.id, user_id: userId, title: reward.title, type: reward.type,
    point_cost: reward.pointCost, photo_url: reward.photoUrl ?? null,
    url: reward.url ?? null, description: reward.description ?? null,
    requires_approval: reward.requiresApproval, status: reward.status,
  })
  if (error) console.error('insertReward:', error)
}

export async function updateRewardRow(id: string, data: Partial<Reward>) {
  const updates: Record<string, unknown> = {}
  if (data.title !== undefined) updates.title = data.title
  if (data.type !== undefined) updates.type = data.type
  if (data.pointCost !== undefined) updates.point_cost = data.pointCost
  if (data.photoUrl !== undefined) updates.photo_url = data.photoUrl ?? null
  if (data.url !== undefined) updates.url = data.url ?? null
  if (data.description !== undefined) updates.description = data.description ?? null
  if (data.requiresApproval !== undefined) updates.requires_approval = data.requiresApproval
  if (data.status !== undefined) updates.status = data.status
  const { error } = await supabase.from('rewards').update(updates).eq('id', id)
  if (error) console.error('updateReward:', error)
}

export async function insertNotification(userId: string, notif: AppNotification) {
  const { error } = await supabase.from('notifications').insert({
    id: notif.id, user_id: userId, type: notif.type,
    message: notif.message, read: notif.read,
  })
  if (error) console.error('insertNotification:', error)
}

export async function updateNotificationRead(id: string, read: boolean) {
  const { error } = await supabase.from('notifications').update({ read }).eq('id', id)
  if (error) console.error('updateNotificationRead:', error)
}

export async function markAllNotificationsReadDb(userId: string) {
  const { error } = await supabase
    .from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
  if (error) console.error('markAllRead:', error)
}

export async function deleteAllUserData(userId: string) {
  await supabase.from('notifications').delete().eq('user_id', userId)
  await supabase.from('point_ledger').delete().eq('user_id', userId)
  await supabase.from('action_logs').delete().eq('user_id', userId)
  await supabase.from('rewards').delete().eq('user_id', userId)
  await supabase.from('habits').delete().eq('user_id', userId)
}

export async function deleteAccountAndData(userId: string) {
  // Delete all user data from every table
  await supabase.from('notifications').delete().eq('user_id', userId)
  await supabase.from('point_ledger').delete().eq('user_id', userId)
  await supabase.from('action_logs').delete().eq('user_id', userId)
  await supabase.from('rewards').delete().eq('user_id', userId)
  await supabase.from('habits').delete().eq('user_id', userId)
  await supabase.from('monitors').delete().eq('user_id', userId)
  await supabase.from('monitors').delete().eq('monitor_user_id', userId)
  await supabase.from('profiles').delete().eq('id', userId)

  // Delete the auth user via RPC (requires the delete_own_account function in Supabase)
  const { error } = await supabase.rpc('delete_own_account')
  if (error) console.error('Failed to delete auth account:', error)
}
