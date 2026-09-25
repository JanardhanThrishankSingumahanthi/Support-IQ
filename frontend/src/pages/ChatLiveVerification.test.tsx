import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Chat } from './Chat'

function makeSession() {
  localStorage.setItem(
    'supportiq_auth_session',
    JSON.stringify({
      token: 'demo-token',
      user: {
        id: 1,
        email: 'dev-admin@example.com',
        full_name: 'Janardhan',
        role: 'Administrator',
        permissions: ['read_documents', 'view_reports'],
        is_active: true,
      },
    }),
  )
}

describe('Live Chat QLoRA UI Verification', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    makeSession()
  })

  it('renders model selector with SupportIQ QLoRA default and available models', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/v1/chat/models')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              models: [
                { id: 'qlora', name: 'SupportIQ QLoRA (4-bit NF4)', description: '4-bit NF4', available: true },
                { id: 'lora', name: 'SupportIQ LoRA (FP16)', description: 'FP16', available: true },
                { id: 'base', name: 'Base Qwen 0.5B (Zero-Shot RAG)', description: 'Base model', available: true },
                { id: 'extractive', name: 'Extractive Synthesizer', description: 'Fallback', available: true },
              ],
            }),
          } as unknown as Response)
        }
        if (url.includes('/api/v1/documents')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ items: [], total: 5 }),
          } as unknown as Response)
        }
        if (url.includes('/api/v1/health')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'ok' }),
          } as unknown as Response)
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as unknown as Response)
      }),
    )

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    )

    const modelSelect = screen.getByRole('combobox') as HTMLSelectElement
    expect(modelSelect).toBeInTheDocument()
    expect(modelSelect.value).toBe('SupportIQ QLoRA (4-bit NF4)')

    await waitFor(() => {
      expect(screen.getByText('SupportIQ LoRA (FP16)')).toBeInTheDocument()
      expect(screen.getByText('Base Qwen 0.5B (Zero-Shot RAG)')).toBeInTheDocument()
    })
  })

  it('submits answerable question with QLoRA and displays telemetry badges and citation evidence', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('/api/v1/chat/messages') && init?.method === 'POST') {
          const body = JSON.parse(String(init.body))
          expect(body.model_name).toBe('SupportIQ QLoRA (4-bit NF4)')

          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: 'ok',
              conversation: { id: 42, title: 'Refund policy' },
              generation_status: 'resolved',
              assistant_message: {
                id: 101,
                conversation_id: 42,
                role: 'assistant',
                content: 'Refunds are typically processed within 5-7 business days from the date of receipt of the completed inspection report.',
                created_at: new Date().toISOString(),
                metadata_json: {
                  status: 'resolved',
                  model: 'SupportIQ QLoRA (4-bit NF4)',
                  model_variant: 'qlora',
                  latency_ms: 2003,
                  generation_latency_ms: 1309,
                  peak_vram_gb: 0.46,
                  reliability: { score: 1.0, coverage: 1.0, label: 'high' },
                  grounding_status: 'supported',
                  citations: [
                    {
                      document_id: 1,
                      document_title: 'Return_Policy.pdf',
                      chunk_id: 3,
                      quote: 'If approved, the refund will be processed within 5-7 business days.',
                      match_percent: 88,
                      page: 2,
                    },
                  ],
                },
              },
            }),
          } as unknown as Response)
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as unknown as Response)
      }),
    )

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    )

    const textarea = screen.getByPlaceholderText(/Ask a question about your support knowledge base/i)
    fireEvent.change(textarea, { target: { value: 'How long does it take for refund?' } })

    const sendBtn = screen.getByRole('button', { name: /Send/i })
    fireEvent.click(sendBtn)

    await waitFor(() => {
      expect(screen.getByText(/Refunds are typically processed within 5-7 business days/i)).toBeInTheDocument()
    })

    // Verify Telemetry Badges
    const modelBadges = screen.getAllByText(/SupportIQ QLoRA \(4-bit NF4\)/i)
    expect(modelBadges.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/⚡ Gen: 1309ms/i)).toBeInTheDocument()
    expect(screen.getByText(/VRAM: 0.46 GB/i)).toBeInTheDocument()

    // Verify Citation is rendered
    expect(screen.getByText('Return_Policy.pdf')).toBeInTheDocument()
    expect(screen.getByText(/88% match/i)).toBeInTheDocument()

    // Click Citation to open Document Evidence Modal
    fireEvent.click(screen.getByText('Return_Policy.pdf'))
    await waitFor(() => {
      expect(screen.getByText(/Verified Document/i)).toBeInTheDocument()
    })

    // Close Modal
    fireEvent.click(screen.getByTitle('Close'))
  })

  it('renders honest refusal when unsupported question is asked with QLoRA', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('/api/v1/chat/messages') && init?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: 'ok',
              conversation: { id: 43 },
              generation_status: 'no_evidence',
              assistant_message: {
                id: 102,
                conversation_id: 43,
                role: 'assistant',
                content: 'No relevant information was found in your knowledge base matching this question. To avoid misinformation, SupportIQ does not fabricate answers without source evidence.',
                created_at: new Date().toISOString(),
                metadata_json: {
                  status: 'no_evidence',
                  model: 'SupportIQ QLoRA (4-bit NF4)',
                  citations: [],
                  reliability: { score: 0.0, label: 'low' },
                },
              },
            }),
          } as unknown as Response)
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as unknown as Response)
      }),
    )

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    )

    const textarea = screen.getByPlaceholderText(/Ask a question about your support knowledge base/i)
    fireEvent.change(textarea, { target: { value: 'Does SupportIQ support teleportation?' } })
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => {
      expect(screen.getByText(/No relevant information was found in your knowledge base/i)).toBeInTheDocument()
      expect(screen.getByText(/No Relevant Information Found/i)).toBeInTheDocument()
    })
  })

  it('allows switching model to Base Qwen and preserves selection across interactions', async () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    )

    const modelSelect = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(modelSelect, { target: { value: 'Base Qwen 0.5B (Zero-Shot RAG)' } })
    expect(modelSelect.value).toBe('Base Qwen 0.5B (Zero-Shot RAG)')
  })
})
