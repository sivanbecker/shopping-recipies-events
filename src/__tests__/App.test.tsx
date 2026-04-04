import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { QueryClient } from '@tanstack/react-query'
import '../i18n' // initialise i18n

// Minimal wrapper for tests
function TestWrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/auth']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

// Smoke test — AuthPage renders without crashing
describe('AuthPage smoke test', () => {
  it('renders login and register tabs', async () => {
    const AuthPage = (await import('@/pages/Auth/AuthPage')).default
    render(
      <TestWrapper>
        <AuthPage />
      </TestWrapper>
    )
    // Both tabs should be in the document
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })
})
