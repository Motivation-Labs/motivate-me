import { describe, it, expect, vi, beforeEach } from 'vitest'
import { approveActionLog, rejectActionLog } from './approvals'

// Mock supabase
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'action_logs') {
        return {
          select: () => ({
            eq: () => ({
              single: mockSingle,
            }),
          }),
          update: mockUpdate,
          delete: () => ({
            eq: mockEq,
          }),
        }
      }
      if (table === 'point_ledger') return { insert: mockInsert }
      if (table === 'notifications') return { insert: mockInsert }
      return { select: mockSelect, update: mockUpdate, insert: mockInsert }
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'monitor-user-123' } },
      }),
    },
  },
}))

describe('approveActionLog — permission checks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when action log not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const result = await approveActionLog('nonexistent')
    expect(result.error).toBeTruthy()
  })

  it('returns error when already processed', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'log-1', status: 'approved', habits: null },
      error: null,
    })
    const result = await approveActionLog('log-1')
    expect(result.error).toBe('Already processed')
  })

  it('returns error when monitor is not authorized approver', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'log-1',
        status: 'pending_approval',
        user_id: 'user-1',
        habits: {
          name: 'Test Habit',
          points_per_completion: 10,
          approver_monitor_ids: ['other-monitor-456'], // not monitor-user-123
        },
      },
      error: null,
    })
    const result = await approveActionLog('log-1')
    expect(result.error).toBe('Not authorized to approve this action')
  })
})

describe('rejectActionLog — permission checks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when monitor is not authorized approver', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'log-1',
        status: 'pending_approval',
        user_id: 'user-1',
        habits: {
          name: 'Test Habit',
          approver_monitor_ids: ['other-monitor-456'],
        },
      },
      error: null,
    })
    const result = await rejectActionLog('log-1')
    expect(result.error).toBe('Not authorized to approve this action')
  })
})
