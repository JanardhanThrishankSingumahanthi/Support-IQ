import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from './App'

function makeSession() {
  localStorage.setItem(
    'supportiq_auth_session',
    JSON.stringify({
      token: 'demo-token',
      user: {
        id: 1,
        email: 'admin@example.com',
        full_name: 'Demo Admin',
        role: 'Administrator',
        permissions: ['read_documents', 'view_reports'],
        is_active: true,
      },
    }),
  )
}

describe('SupportIQ app routes and dashboard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('redirects to login when a protected route is accessed without a session', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })
  })

  it('renders the dashboard and empty state when backend data is missing', async () => {
    makeSession()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/v1/health')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'ok', service: 'SupportIQ', environment: 'development', debug: true }),
          } as unknown as Response)
        }
        return Promise.resolve({
          ok: false,
          status: 501,
          json: async () => ({ status: 'not_implemented', message: 'Not implemented yet.' }),
        } as unknown as Response)
      }),
    )

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/no data available yet/i)).toBeInTheDocument()
    })
  })

  it('shows a loading state while dashboard data is being fetched', async () => {
    makeSession()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ status: 'ok', service: 'SupportIQ', environment: 'development', debug: true }),
              } as Response)
            }, 100)
          }),
      ),
    )

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(screen.getByText(/loading support data/i)).toBeInTheDocument()
  })

  it('renders navigation items on the dashboard shell', () => {
    makeSession()
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/knowledge/i)).toBeInTheDocument()
    expect(screen.getByText(/documents/i)).toBeInTheDocument()
    expect(screen.getByText(/conversations/i)).toBeInTheDocument()
  })

  it('renders the chat workspace on the conversations route', async () => {
    makeSession()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/v1/conversations')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              items: [{ id: 1, title: 'Billing question', state: 'open', updated_at: '2025-01-01T00:00:00Z' }],
              meta: { page: 1, page_size: 20, total: 1, has_next: false, has_previous: false },
            }),
          } as unknown as Response)
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ok', service: 'SupportIQ', environment: 'development', debug: true }),
        } as unknown as Response)
      }),
    )

    render(
      <MemoryRouter initialEntries={['/conversations']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/new chat/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/ai response unavailable/i)).toBeInTheDocument()
  })

  it('renders the knowledge base and document management workspace', async () => {
    makeSession()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/v1/documents')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              items: [{
                id: 1,
                title: 'Product guide.pdf',
                filename: 'Product guide.pdf',
                file_type: 'pdf',
                size: 24198,
                category: 'Policies',
                version: 1,
                status: 'COMPLETED',
                uploaded_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
                indexed_at: '2025-01-01T00:00:00Z',
                chunk_count: 16,
              }],
              meta: { page: 1, page_size: 20, total: 1, has_next: false, has_previous: false },
            }),
          } as unknown as Response)
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ok', service: 'SupportIQ', environment: 'development', debug: true }),
        } as unknown as Response)
      }),
    )

    render(
      <MemoryRouter initialEntries={['/documents']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText(/document library/i).length).toBeGreaterThan(0)
    })
    expect(screen.getByText(/upload documents/i)).toBeInTheDocument()
  })
})
