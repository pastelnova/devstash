import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/auth
const authMock = vi.fn()
vi.mock('@/auth', () => ({
  auth: () => authMock(),
}))

// Mock db query
const updateEditorPreferencesQueryMock = vi.fn()
vi.mock('@/lib/db/profile', () => ({
  updateEditorPreferences: (...args: unknown[]) => updateEditorPreferencesQueryMock(...args),
}))

const validInput = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: 'vs-dark' as const,
}

describe('updateEditorPreferences', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  async function callAction(input: unknown) {
    const { updateEditorPreferences } = await import('./editor-preferences')
    return updateEditorPreferences(input as Parameters<typeof updateEditorPreferences>[0])
  }

  it('returns error when not authenticated', async () => {
    authMock.mockResolvedValue(null)
    const result = await callAction(validInput)
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(updateEditorPreferencesQueryMock).not.toHaveBeenCalled()
  })

  it('returns error for invalid fontSize', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const result = await callAction({ ...validInput, fontSize: 50 })
    expect(result.success).toBe(false)
  })

  it('returns error for invalid tabSize', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const result = await callAction({ ...validInput, tabSize: 3 })
    expect(result.success).toBe(false)
  })

  it('returns error for invalid theme', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const result = await callAction({ ...validInput, theme: 'solarized' })
    expect(result.success).toBe(false)
  })

  it('saves preferences on valid input', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    updateEditorPreferencesQueryMock.mockResolvedValue(validInput)
    const result = await callAction(validInput)
    expect(result).toEqual({ success: true, data: validInput })
    expect(updateEditorPreferencesQueryMock).toHaveBeenCalledWith('u1', validInput)
  })

  it('returns error when query throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    updateEditorPreferencesQueryMock.mockRejectedValue(new Error('DB error'))
    const result = await callAction(validInput)
    expect(result).toEqual({ success: false, error: 'Failed to update editor preferences' })
  })
})
