import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { loginSchema, registerSchema } from '@/lib/schemas'
import { AuthProvider, useAuth } from '@/hooks/useAuth'

// ─── Zod schema tests ──────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'short' })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    expect(loginSchema.safeParse({}).success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    confirmPassword: 'password123',
  }

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'different123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('confirmPassword')
  })

  it('rejects name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...valid, name: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'bad-email' })
    expect(result.success).toBe(false)
  })

  it('rejects weak password', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'weak', confirmPassword: 'weak' })
    expect(result.success).toBe(false)
  })
})

// ─── useAuth hook tests ────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('useAuth', () => {
  it('starts in a loading state and resolves to no user when no session exists', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    // should eventually settle
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.profile).toBeNull()
  })

  it('exposes signOut and updateProfile functions', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(typeof result.current.signOut).toBe('function')
    expect(typeof result.current.updateProfile).toBe('function')
  })

  it('throws when used outside AuthProvider', () => {
    // Suppress the expected React error boundary console output
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used inside <AuthProvider>'
    )
  })
})
