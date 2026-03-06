import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '../test/wrapper'
import CreateHabit from './CreateHabit'

function renderCreateHabit() {
  return render(<TestWrapper><CreateHabit /></TestWrapper>)
}

describe('CreateHabit', () => {
  it('renders the form', () => {
    renderCreateHabit()
    expect(screen.getByRole('heading', { name: 'Create Habit' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Morning Run')).toBeInTheDocument()
  })

  it('submit button is disabled when name is empty', () => {
    renderCreateHabit()
    expect(screen.getByRole('button', { name: /Create Habit/i })).toBeDisabled()
  })

  it('submit button is enabled when name is filled', () => {
    renderCreateHabit()
    fireEvent.change(screen.getByPlaceholderText('Morning Run'), { target: { value: 'Evening Walk' } })
    expect(screen.getByRole('button', { name: /Create Habit/i })).not.toBeDisabled()
  })

  it('point stepper starts at 15', () => {
    renderCreateHabit()
    expect(screen.getByLabelText('15 points')).toBeInTheDocument()
  })

  it('increments points', () => {
    renderCreateHabit()
    fireEvent.click(screen.getByRole('button', { name: /Increase points/i }))
    expect(screen.getByLabelText('16 points')).toBeInTheDocument()
  })

  it('decrements points', () => {
    renderCreateHabit()
    fireEvent.click(screen.getByRole('button', { name: /Decrease points/i }))
    expect(screen.getByLabelText('14 points')).toBeInTheDocument()
  })

  it('does not go below 1', () => {
    renderCreateHabit()
    const btn = screen.getByRole('button', { name: /Decrease points/i })
    for (let i = 0; i < 20; i++) fireEvent.click(btn)
    expect(screen.getByLabelText('1 points')).toBeInTheDocument()
  })

  it('toggles photo switch', () => {
    renderCreateHabit()
    const toggle = screen.getByRole('switch', { name: /Requires Photo Proof/i })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('approval toggle is disabled when no monitors connected', () => {
    renderCreateHabit()
    const toggle = screen.getByRole('switch', { name: /Requires Monitor Approval/i })
    expect(toggle).toBeDisabled()
  })

  it('shows tooltip hint when approval toggle is disabled', () => {
    renderCreateHabit()
    expect(screen.getByText(/Invite at least one monitor/i)).toBeInTheDocument()
  })
})
