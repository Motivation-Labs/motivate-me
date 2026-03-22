import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../lib/auth'
import { AppProvider } from '../lib/store'
import MonitorDashboard from './MonitorDashboard'
import type { User } from '@supabase/supabase-js'

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

function renderMonitorDashboard(userId = 'u1') {
  return render(
    <MemoryRouter initialEntries={[`/monitor/${userId}`]}>
      <AuthContext.Provider value={mockAuth}>
        <AppProvider>
          <Routes>
            <Route path="/monitor/:userId" element={<MonitorDashboard />} />
          </Routes>
        </AppProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('MonitorDashboard — pending redemptions', () => {
  it('renders Pending Redemptions section', () => {
    renderMonitorDashboard()
    expect(screen.getByText('Pending Redemptions')).toBeInTheDocument()
  })

  it('renders redemption approve/reject buttons for pending redemptions', () => {
    renderMonitorDashboard()
    // Mock has a pending redemption "Spa Day"
    expect(screen.getByText('Spa Day')).toBeInTheDocument()
    // Should have approve and reject buttons (multiple sets for action logs + redemptions)
    const approveButtons = screen.getAllByRole('button', { name: /Approve/i })
    const rejectButtons = screen.getAllByRole('button', { name: /Reject/i })
    expect(approveButtons.length).toBeGreaterThanOrEqual(2) // 1 for action log + 1 for redemption
    expect(rejectButtons.length).toBeGreaterThanOrEqual(2)
  })
})
