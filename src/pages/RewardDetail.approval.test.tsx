import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../lib/auth'
import { AppProvider } from '../lib/store'
import RewardDetail from './RewardDetail'
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

function renderRewardDetail(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/rewards/${id}`]}>
      <AuthContext.Provider value={mockAuth}>
        <AppProvider>
          <Routes>
            <Route path="/rewards/:id" element={<RewardDetail />} />
          </Routes>
        </AppProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('RewardDetail — approval flow', () => {
  it('shows approval badge for rewards requiring approval', () => {
    renderRewardDetail('r5') // Spa Day, requiresApproval: true
    expect(screen.getByText('Requires monitor approval')).toBeInTheDocument()
  })

  it('shows pending state after requesting approval-required redemption', () => {
    renderRewardDetail('r5') // Spa Day costs 100, balance > 100
    fireEvent.click(screen.getByRole('button', { name: /Request Approval/i }))
    expect(screen.getByText(/Approval Requested/i)).toBeInTheDocument()
  })

  it('shows Redeem Now for rewards not requiring approval', () => {
    renderRewardDetail('r1') // Movie Night, requiresApproval: false
    expect(screen.getByRole('button', { name: /Redeem Now/i })).toBeInTheDocument()
  })

  it('shows Request Approval button for approval-required reward', () => {
    renderRewardDetail('r5')
    expect(screen.getByRole('button', { name: /Request Approval/i })).toBeInTheDocument()
  })
})
