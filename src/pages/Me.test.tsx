import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '../test/wrapper'
import Me from './Me'

function renderMe() {
  return render(<TestWrapper><Me /></TestWrapper>)
}

describe('Me (Profile)', () => {
  it('renders profile heading', () => {
    renderMe()
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
  })

  it('renders stats section', () => {
    renderMe()
    expect(screen.getByText('Total Earned')).toBeInTheDocument()
    expect(screen.getByText('Redeemed')).toBeInTheDocument()
    expect(screen.getByText('Best Streak')).toBeInTheDocument()
  })

  it('renders notification toggles', () => {
    renderMe()
    expect(screen.getByRole('switch', { name: /Approval Decisions/i })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /Streak Milestones/i })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /Wishlist Ready/i })).toBeInTheDocument()
  })

  it('toggles notification switches', () => {
    renderMe()
    const toggle = screen.getByRole('switch', { name: /Wishlist Ready/i })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('renders quick links', () => {
    renderMe()
    expect(screen.getByRole('link', { name: /Activity Log/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Notifications/i })).toBeInTheDocument()
  })

  it('renders sign out button', () => {
    renderMe()
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument()
  })

  it('renders delete account button at the bottom', () => {
    renderMe()
    expect(screen.getByRole('button', { name: /Delete My Account/i })).toBeInTheDocument()
  })

  it('shows delete confirmation requiring user ID input', () => {
    renderMe()
    fireEvent.click(screen.getByRole('button', { name: /Delete My Account/i }))
    expect(screen.getByText(/Type your User ID to confirm/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter your User ID/i)).toBeInTheDocument()
  })

  it('does not have the old reset data section', () => {
    renderMe()
    expect(screen.queryByText(/stored locally in your browser/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reset All Data/i })).not.toBeInTheDocument()
  })
})
