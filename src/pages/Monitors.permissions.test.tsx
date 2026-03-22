import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../lib/auth'
import { AppProvider } from '../lib/store'
import Monitors from './Monitors'
import type { User } from '@supabase/supabase-js'

vi.mock('../lib/monitors', () => ({
  getMyMonitors: vi.fn().mockResolvedValue([
    {
      id: 'mon-1',
      userId: 'test-user-id',
      monitorUserId: 'monitor-1',
      monitorEmail: 'monitor@test.com',
      permissions: { can_edit_habits: false, can_edit_rewards: true },
      acceptedAt: '2026-03-01T00:00:00Z',
      createdAt: '2026-02-28T00:00:00Z',
    },
  ]),
  getMonitoringOthers: vi.fn().mockResolvedValue([]),
  getPendingInvites: vi.fn().mockResolvedValue([]),
  createMonitorInvite: vi.fn(),
  revokeMonitor: vi.fn(),
  sendInviteEmail: vi.fn(),
  updateMonitorPermissions: vi.fn(),
}))

vi.mock('../lib/profile', () => ({
  fetchProfiles: vi.fn().mockResolvedValue(new Map()),
}))

vi.mock('../lib/supabase', () => ({
  siteUrl: 'http://localhost',
  supabase: { from: vi.fn() },
}))

const mockAuth = {
  user: { id: 'test-user-id', email: 'test@example.com' } as User,
  session: null,
  loading: false,
  signUp: async () => ({ error: null }),
  signInWithPassword: async () => ({ error: null }),
  signInWithMagicLink: async () => ({ error: null }),
  changePassword: async () => ({ error: null }),
  signOut: async () => {},
}

function renderMonitors() {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={mockAuth}>
        <AppProvider>
          <Monitors />
        </AppProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('Monitors — permissions display', () => {
  it('renders permission labels in expanded monitor card', async () => {
    renderMonitors()
    // Wait for data to load — monitor card shows "Since" date when loaded
    const sinceText = await screen.findByText(/Since/)
    expect(sinceText).toBeInTheDocument()

    // Click the monitor card to expand it
    const { fireEvent } = await import('@testing-library/react')
    const expandButtons = screen.getAllByRole('button')
    const monitorCardButton = expandButtons.find((btn) => btn.textContent?.includes('Since'))
    expect(monitorCardButton).toBeTruthy()
    fireEvent.click(monitorCardButton!)

    // Permissions should now show in expanded card
    expect(screen.getByText(/Can edit habits/i)).toBeInTheDocument()
    expect(screen.getByText(/Can edit rewards/i)).toBeInTheDocument()
  })
})
