import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '../test/wrapper'
import Monitors from './Monitors'

function renderMonitors() {
  return render(<TestWrapper><Monitors /></TestWrapper>)
}

describe('Monitors', () => {
  it('renders page title', () => {
    renderMonitors()
    expect(screen.getByRole('heading', { name: /Monitors/i })).toBeInTheDocument()
  })

  it('renders My Monitors section', () => {
    renderMonitors()
    expect(screen.getByText('People Monitoring Me')).toBeInTheDocument()
  })

  it('renders Monitoring Others section', () => {
    renderMonitors()
    expect(screen.getByText("I'm Monitoring")).toBeInTheDocument()
  })

  it('renders invite button', () => {
    renderMonitors()
    expect(screen.getByRole('button', { name: /Invite a Monitor/i })).toBeInTheDocument()
  })

  it('renders email invite input', () => {
    renderMonitors()
    expect(screen.getByPlaceholderText(/friend's email/i)).toBeInTheDocument()
  })

  it('renders send email button', () => {
    renderMonitors()
    expect(screen.getByRole('button', { name: /Send Invite/i })).toBeInTheDocument()
  })
})
