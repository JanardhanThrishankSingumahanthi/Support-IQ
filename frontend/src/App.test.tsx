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
        email: 'admin@supportiq.com',
        full_name: 'Janardhan',
        role: 'Administrator',
        permissions: ['read_documents', 'view_reports'],
        is_active: true,
      },
    }),
  )
}

describe('SupportIQ app routes and core interfaces', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()

    // Default mock fetch for tests
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/v1/health')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'ok', service: 'SupportIQ', environment: 'production' }),
          } as unknown as Response)
        }
        if (url.includes('/api/v1/conversations')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              items: [{ id: 1, title: 'How to reset password?', state: 'closed', created_at: '2026-09-11T10:24:00Z' }],
              meta: { page: 1, page_size: 20, total: 1 },
            }),
          } as unknown as Response)
        }
        if (url.includes('/api/v1/knowledge-base/stats')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              total_documents: 248,
              indexed_documents: 242,
              indexed_percentage: 97.6,
              total_chunks: 18436,
              storage_used_gb: 1.2,
              storage_quota_gb: 5.0,
              storage_percentage: 24,
              categories: { Billing: 28, Account: 18 },
            }),
          } as unknown as Response)
        }
        if (url.includes('/api/v1/documents')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              items: [{
                id: 1,
                title: 'Return_Policy.pdf',
                filename: 'Return_Policy.pdf',
                file_type: 'pdf',
                size: 24198,
                category: 'Policies',
                version: 1,
                status: 'COMPLETED',
                uploaded_at: '2026-09-11T00:00:00Z',
                chunk_count: 16,
              }],
              meta: { page: 1, page_size: 20, total: 1 },
            }),
          } as unknown as Response)
        }
        if (url.includes('/api/v1/users')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              users: [{ id: 1, full_name: 'Rahul Kumar', email: 'rahul@example.com', role: 'Customer', is_active: true }],
            }),
          } as unknown as Response)
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        } as unknown as Response)
      }),
    )
  })

  it('redirects to login when a protected route is accessed without a session', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0)
    })
  })

  it('renders the authenticated dashboard with KPI stats and SupportIQ hero', async () => {
    makeSession()
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
      expect(screen.getByText(/queries resolved/i)).toBeInTheDocument()
      expect(screen.getByText(/powered by rag/i)).toBeInTheDocument()
    })
  })

  it('renders enterprise navigation items on the sidebar', () => {
    makeSession()
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/knowledge base/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/analytics/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/experiments/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/security/i).length).toBeGreaterThan(0)
  })

  it('renders the chat interface with retrieval pipeline and grounding evidence on /chat', async () => {
    makeSession()
    render(
      <MemoryRouter initialEntries={['/chat']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/ai-powered customer support assistant/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/ask a question about your support knowledge base/i)).toBeInTheDocument()
    })
  })

  it('renders the knowledge base workspace on /knowledge', async () => {
    makeSession()
    render(
      <MemoryRouter initialEntries={['/knowledge']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText(/knowledge base/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/upload document/i)).toBeInTheDocument()
    })
  })

  it('renders model evaluation and experiment center', async () => {
    makeSession()
    render(
      <MemoryRouter initialEntries={['/experiments']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/experiment center/i)).toBeInTheDocument()
      expect(screen.getByText(/compare model performance/i)).toBeInTheDocument()
      expect(screen.getByText(/create new experiment/i)).toBeInTheDocument()
    })
  })

  it('renders admin security center on /security', async () => {
    makeSession()
    render(
      <MemoryRouter initialEntries={['/security']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/protect your data, users, and systems/i)).toBeInTheDocument()
      expect(screen.getByText(/multi-factor authentication/i)).toBeInTheDocument()
      expect(screen.getByText(/all systems secure/i)).toBeInTheDocument()
    })
  })
})
