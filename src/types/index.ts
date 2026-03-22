export interface User {
  id: string
  displayName: string
  email: string
  avatarUrl?: string
}

export interface Habit {
  id: string
  userId: string
  name: string
  description?: string
  pointsPerCompletion: number
  requiresPhoto: boolean
  requiresApproval: boolean
  approverMonitorIds?: string[]
  frequencyTarget: 'none' | 'daily' | 'custom'
  frequencyCount?: number
  isActive: boolean
  createdAt: string
}

export interface ActionLog {
  id: string
  habitId: string
  userId: string
  loggedAt: string
  photoUrl?: string
  note?: string
  status: 'pending_approval' | 'approved' | 'self_approved'
  pointsAwarded: number
}

export interface PointLedgerEntry {
  id: string
  userId: string
  delta: number
  reason: string
  referenceId: string
  referenceType: 'action_log' | 'redemption' | 'streak_bonus'
  createdAt: string
}

export interface Reward {
  id: string
  userId: string
  title: string
  type: 'offline' | 'online'
  pointCost: number
  photoUrl?: string
  url?: string
  description?: string
  requiresApproval: boolean
  status: 'available' | 'wishlist' | 'redeemed' | 'pending_approval'
  createdAt: string
}

export interface Redemption {
  id: string
  rewardId: string
  userId: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: string
}

export interface AppNotification {
  id: string
  type: 'streak' | 'approval' | 'redemption' | 'wishlist'
  message: string
  timestamp: string
  read: boolean
}

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'

export interface Profile {
  id: string
  displayName: string | null
  avatarUrl: string | null
  gender: Gender | null
  createdAt: string
  updatedAt: string
}

export interface MonitorConnection {
  id: string
  userId: string
  monitorUserId: string
  monitorEmail?: string
  userEmail?: string
  permissions: { can_edit_habits: boolean; can_edit_rewards: boolean }
  inviteToken?: string
  acceptedAt?: string
  createdAt: string
}

export interface NavTab {
  path: string
  label: string
  icon: string
  isFab?: boolean
}
