import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '../test/wrapper'
import Monitors from './Monitors'

// Mock the monitors module
vi.mock('../lib/monitors', () => ({
  getMyMonitors: vi.fn().mockResolvedValue([]),
  getMonitoringOthers: vi.fn().mockResolvedValue([]),
  getPendingInvites: vi.fn().mockResolvedValue([]),
  createMonitorInvite: vi.fn().mockResolvedValue('test-token-abc123'),
  revokeMonitor: vi.fn().mockResolvedValue(undefined),
}))

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

  it('renders send invite button (disabled when email empty)', () => {
    renderMonitors()
    const sendButtons = screen.getAllByRole('button', { name: /Send Invite/i })
    expect(sendButtons.length).toBeGreaterThan(0)
    // The one visible before invite link is created should be disabled
    expect(sendButtons[0]).toBeDisabled()
  })

  it('creates invite link on button click and shows copy/email options', async () => {
    renderMonitors()
    const inviteBtn = screen.getByRole('button', { name: /Invite a Monitor/i })
    fireEvent.click(inviteBtn)

    await waitFor(() => {
      expect(screen.getByText(/Invite link created/i)).toBeInTheDocument()
    })

    // Should show the generated link
    const linkInput = screen.getByDisplayValue(/\/invite\/test-token-abc123/)
    expect(linkInput).toBeInTheDocument()

    // Copy button should be visible
    expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument()
  })

  it('copies link to clipboard', async () => {
    // Mock clipboard
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    renderMonitors()
    fireEvent.click(screen.getByRole('button', { name: /Invite a Monitor/i }))

    await waitFor(() => {
      expect(screen.getByText(/Invite link created/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Copy/i }))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/invite/test-token-abc123'))
  })

  it('shows email input after invite link is created', async () => {
    renderMonitors()
    fireEvent.click(screen.getByRole('button', { name: /Invite a Monitor/i }))

    await waitFor(() => {
      expect(screen.getByText(/send via email/i)).toBeInTheDocument()
    })
  })

  it('enables send button when email is entered', async () => {
    const user = userEvent.setup()
    renderMonitors()
    fireEvent.click(screen.getByRole('button', { name: /Invite a Monitor/i }))

    await waitFor(() => {
      expect(screen.getByText(/Invite link created/i)).toBeInTheDocument()
    })

    // Find the email input in the post-invite section
    const emailInputs = screen.getAllByPlaceholderText(/friend's email/i)
    const emailInput = emailInputs[emailInputs.length - 1]
    await user.type(emailInput, 'friend@example.com')

    // The send button next to this input should be enabled
    const sendButtons = screen.getAllByRole('button', { name: /Send Invite/i })
    const enabledSend = sendButtons.find(btn => !btn.hasAttribute('disabled'))
    expect(enabledSend).toBeTruthy()
  })

  it('opens mailto link when send email is clicked', async () => {
    const user = userEvent.setup()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    renderMonitors()
    fireEvent.click(screen.getByRole('button', { name: /Invite a Monitor/i }))

    await waitFor(() => {
      expect(screen.getByText(/Invite link created/i)).toBeInTheDocument()
    })

    const emailInputs = screen.getAllByPlaceholderText(/friend's email/i)
    const emailInput = emailInputs[emailInputs.length - 1]
    await user.type(emailInput, 'friend@example.com')

    const sendButtons = screen.getAllByRole('button', { name: /Send Invite/i })
    const enabledSend = sendButtons.find(btn => !btn.hasAttribute('disabled'))
    fireEvent.click(enabledSend!)

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('mailto:friend@example.com'),
      '_self'
    )
    openSpy.mockRestore()
  })
})
