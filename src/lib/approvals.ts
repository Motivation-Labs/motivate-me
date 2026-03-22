import { supabase } from './supabase'

// Check if the current user is an authorized approver for the habit
async function checkApproverAuth(habit: { approver_monitor_ids?: string[] | null } | null): Promise<string | null> {
  if (!habit?.approver_monitor_ids || habit.approver_monitor_ids.length === 0) return null // no restriction
  const { data } = await supabase.auth.getUser()
  const currentUserId = data?.user?.id
  if (!currentUserId || !habit.approver_monitor_ids.includes(currentUserId)) {
    return 'Not authorized to approve this action'
  }
  return null
}

// Approve an action log — update status and credit points
export async function approveActionLog(logId: string): Promise<{ error?: string }> {
  // Get the log
  const { data: log, error: fetchErr } = await supabase
    .from('action_logs')
    .select('*, habits(name, points_per_completion, approver_monitor_ids)')
    .eq('id', logId)
    .single()

  if (fetchErr || !log) return { error: 'Action log not found' }
  if (log.status !== 'pending_approval') return { error: 'Already processed' }

  const habit = log.habits as { name: string; points_per_completion: number; approver_monitor_ids?: string[] | null } | null

  // Verify the current user is an authorized approver
  const authError = await checkApproverAuth(habit)
  if (authError) return { error: authError }

  const pts = habit?.points_per_completion ?? 0

  // Update log status
  const { error: updateErr } = await supabase
    .from('action_logs')
    .update({
      status: 'approved',
      points_awarded: pts,
      approved_at: new Date().toISOString(),
    })
    .eq('id', logId)

  if (updateErr) return { error: updateErr.message }

  // Credit points via ledger
  if (pts > 0) {
    await supabase.from('point_ledger').insert({
      user_id: log.user_id,
      delta: pts,
      reason: `Approved: ${habit?.name ?? 'Habit'}`,
      reference_id: logId,
      reference_type: 'action_log',
    })
  }

  // Notify user
  await supabase.from('notifications').insert({
    user_id: log.user_id,
    type: 'approval',
    message: `Your ${habit?.name ?? 'habit'} log was approved! +${pts} pts`,
    read: false,
  })

  return {}
}

// Reject an action log
export async function rejectActionLog(logId: string): Promise<{ error?: string }> {
  const { data: log, error: fetchErr } = await supabase
    .from('action_logs')
    .select('*, habits(name, approver_monitor_ids)')
    .eq('id', logId)
    .single()

  if (fetchErr || !log) return { error: 'Action log not found' }
  if (log.status !== 'pending_approval') return { error: 'Already processed' }

  const habit = log.habits as { name: string; approver_monitor_ids?: string[] | null } | null

  // Verify the current user is an authorized approver
  const authError = await checkApproverAuth(habit)
  if (authError) return { error: authError }

  // We don't have a 'rejected' status in the schema, so delete the log
  const { error: deleteErr } = await supabase
    .from('action_logs')
    .delete()
    .eq('id', logId)

  if (deleteErr) return { error: deleteErr.message }

  // Notify user
  await supabase.from('notifications').insert({
    user_id: log.user_id,
    type: 'approval',
    message: `Your ${habit?.name ?? 'habit'} log was rejected.`,
    read: false,
  })

  return {}
}

// Approve a reward redemption — deduct points and mark redeemed
export async function approveRedemption(rewardId: string): Promise<{ error?: string }> {
  const { data: reward, error: fetchErr } = await supabase
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .single()

  if (fetchErr || !reward) return { error: 'Reward not found' }
  if (reward.status !== 'pending_approval') return { error: 'Already processed' }

  // Deduct points via ledger
  await supabase.from('point_ledger').insert({
    user_id: reward.user_id,
    delta: -reward.point_cost,
    reason: `Redeemed: ${reward.title}`,
    reference_id: rewardId,
    reference_type: 'redemption',
  })

  // Mark reward as redeemed
  const { error: updateErr } = await supabase
    .from('rewards')
    .update({ status: 'redeemed' })
    .eq('id', rewardId)

  if (updateErr) return { error: updateErr.message }

  // Notify user
  await supabase.from('notifications').insert({
    user_id: reward.user_id,
    type: 'redemption',
    message: `Your ${reward.title} redemption was approved! -${reward.point_cost} pts`,
    read: false,
  })

  return {}
}

// Reject a reward redemption — set status back to available
export async function rejectRedemption(rewardId: string): Promise<{ error?: string }> {
  const { data: reward, error: fetchErr } = await supabase
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .single()

  if (fetchErr || !reward) return { error: 'Reward not found' }
  if (reward.status !== 'pending_approval') return { error: 'Already processed' }

  // Set status back to available
  const { error: updateErr } = await supabase
    .from('rewards')
    .update({ status: 'available' })
    .eq('id', rewardId)

  if (updateErr) return { error: updateErr.message }

  // Notify user
  await supabase.from('notifications').insert({
    user_id: reward.user_id,
    type: 'redemption',
    message: `Your ${reward.title} redemption was rejected.`,
    read: false,
  })

  return {}
}

// Fetch pending reward redemptions for a monitored user
export async function fetchPendingRedemptions(userId: string) {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: { id: string; title: string; point_cost: number; created_at: string }) => ({
    id: row.id,
    title: row.title,
    pointCost: row.point_cost,
    createdAt: row.created_at,
  }))
}

// Fetch pending action logs for a monitored user
export async function fetchPendingApprovals(userId: string) {
  const { data, error } = await supabase
    .from('action_logs')
    .select('*, habits(name)')
    .eq('user_id', userId)
    .eq('status', 'pending_approval')
    .order('logged_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: { id: string; logged_at: string; habits: { name: string } | null; note: string | null }) => ({
    id: row.id,
    habitName: (row.habits as { name: string } | null)?.name ?? 'Unknown',
    loggedAt: row.logged_at,
    note: row.note,
  }))
}
