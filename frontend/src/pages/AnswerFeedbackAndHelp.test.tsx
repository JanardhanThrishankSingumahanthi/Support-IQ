import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Chat } from './Chat'
import { HowToUse } from './HowToUse'

function makeSession() {
  localStorage.setItem(
    'supportiq_auth_session',
    JSON.stringify({
      token: 'test-token',
      user: {
        id: 1,
        email: 'janardhan@supportiq.com',
        full_name: 'Janardhan',
        role: 'Administrator',
        permissions: ['read_documents', 'view_reports'],
        is_active: true,
      },
    }),
  )
}

describe('How to Use SupportIQ Guide Page', () => {
  it('renders Help page with all 12 operational sections and 7-step visual workflow', () => {
    render(
      <MemoryRouter>
        <HowToUse />
      </MemoryRouter>,
    )

    expect(screen.getByText(/How to Use SupportIQ/i)).toBeInTheDocument()
    expect(screen.getByText(/The SupportIQ Verification Pipeline/i)).toBeInTheDocument()

    // 7-step visual workflow nodes
    expect(screen.getByText('Upload')).toBeInTheDocument()
    expect(screen.getByText('Index')).toBeInTheDocument()
    expect(screen.getByText('Ask')).toBeInTheDocument()
    expect(screen.getByText('Retrieve')).toBeInTheDocument()
    expect(screen.getByText('Verify')).toBeInTheDocument()
    expect(screen.getByText('Answer')).toBeInTheDocument()
    expect(screen.getByText('Feedback')).toBeInTheDocument()

    // Core topics
    expect(screen.getByText(/1\. What is SupportIQ\?/i)).toBeInTheDocument()
    expect(screen.getByText(/2\. Asking Questions/i)).toBeInTheDocument()
    expect(screen.getByText(/3\. Uploading Documents/i)).toBeInTheDocument()
    expect(screen.getByText(/4\. Chunking & Indexing/i)).toBeInTheDocument()
    expect(screen.getByText(/5\. Hybrid Retrieval & RRF/i)).toBeInTheDocument()
    expect(screen.getByText(/6\. Grounding & Claims/i)).toBeInTheDocument()
    expect(screen.getByText(/7\. Source Citations/i)).toBeInTheDocument()
    expect(screen.getByText(/8\. Reliability Scores/i)).toBeInTheDocument()
    expect(screen.getByText(/9\. Safe Abstention/i)).toBeInTheDocument()
    expect(screen.getByText(/10\. Like & Dislike Feedback/i)).toBeInTheDocument()
    expect(screen.getByText(/11\. Escalations & Tickets/i)).toBeInTheDocument()
    expect(screen.getByText(/12\. Troubleshooting & FAQs/i)).toBeInTheDocument()
  })

  it('allows filtering sections via the search guide input', () => {
    render(
      <MemoryRouter>
        <HowToUse />
      </MemoryRouter>,
    )

    const searchInput = screen.getByPlaceholderText(/Search help topics/i)
    fireEvent.change(searchInput, { target: { value: 'Hybrid Retrieval' } })

    expect(screen.getByText(/Hybrid Retrieval & RRF/i)).toBeInTheDocument()
  })
})

describe('Chat Answer Feedback & Action Controls', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    makeSession()

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    })
  })

  const mockExistingConversation = {
    id: 101,
    title: 'Refund Inquiry',
    created_at: '2026-10-05T08:00:00Z',
    messages: [
      {
        id: 1,
        conversation_id: 101,
        role: 'user',
        content: 'What is the refund policy?',
        created_at: '2026-10-05T08:00:01Z',
      },
      {
        id: 2,
        conversation_id: 101,
        role: 'assistant',
        content: 'Annual subscriptions may be refunded within 30 days of purchase upon written request.',
        created_at: '2026-10-05T08:00:03Z',
        metadata_json: {
          model: 'SupportIQ QLoRA (4-bit NF4)',
          status: 'grounded',
          grounding_status: 'supported',
          generation_latency_ms: 320,
          reliability: { score: 0.94, label: 'high' },
          citations: [
            {
              document_title: 'Billing & Refund Terms.pdf',
              page: 3,
              match_percent: 94,
              quote: 'Annual subscriptions are eligible for full refund within 30 days of initial transaction.',
            },
          ],
        },
      },
    ],
  }

  it('renders Like and Dislike feedback buttons and message actions on assistant answer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/v1/conversations/101') || url.includes('/api/v1/conversations?')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockExistingConversation,
          } as unknown as Response)
        }
        if (url.includes('/api/v1/feedback/my')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          } as unknown as Response)
        }
        if (url.includes('/api/v1/documents') || url.includes('/api/v1/health') || url.includes('/api/v1/chat/models')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ items: [], status: 'ok', models: [] }),
          } as unknown as Response)
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as unknown as Response)
      }),
    )

    localStorage.setItem('supportiq_active_conversation_id', '101')

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Annual subscriptions may be refunded/i)).toBeInTheDocument()
    })

    // Feedback buttons
    expect(screen.getByRole('button', { name: /Mark answer as helpful/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mark answer as not helpful/i })).toBeInTheDocument()

    // Action buttons
    expect(screen.getByRole('button', { name: /Copy answer to clipboard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Copy citation to clipboard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View document evidence/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Regenerate assistant response/i })).toBeInTheDocument()
  })

  it('submits positive feedback when Like button is clicked', async () => {
    let submittedPayload: any = null

    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('/api/v1/conversations/101') || url.includes('/api/v1/conversations?')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockExistingConversation,
          } as unknown as Response)
        }
        if (url.includes('/api/v1/feedback/my')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          } as unknown as Response)
        }
        if (url.endsWith('/api/v1/feedback') && init?.method === 'POST') {
          submittedPayload = JSON.parse(String(init.body))
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 1,
              user_id: 1,
              conversation_id: 101,
              message_id: 2,
              feedback_type: 'positive',
              reason: null,
              comment: null,
            }),
          } as unknown as Response)
        }
        return Promise.resolve({ ok: true, json: async () => ({ items: [], status: 'ok', models: [] }) } as unknown as Response)
      }),
    )

    localStorage.setItem('supportiq_active_conversation_id', '101')

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Annual subscriptions may be refunded/i)).toBeInTheDocument()
    })

    const likeBtn = screen.getByRole('button', { name: /Mark answer as helpful/i })
    fireEvent.click(likeBtn)

    await waitFor(() => {
      expect(submittedPayload).toEqual({
        message_id: 2,
        feedback_type: 'positive',
      })
    })
  })

  it('opens reason selector on Dislike button click and submits negative feedback with reason and comment', async () => {
    let submittedPayload: any = null

    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('/api/v1/conversations/101') || url.includes('/api/v1/conversations?')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockExistingConversation,
          } as unknown as Response)
        }
        if (url.includes('/api/v1/feedback/my')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          } as unknown as Response)
        }
        if (url.endsWith('/api/v1/feedback') && init?.method === 'POST') {
          submittedPayload = JSON.parse(String(init.body))
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 2,
              user_id: 1,
              conversation_id: 101,
              message_id: 2,
              feedback_type: 'negative',
              reason: 'Answer is incomplete',
              comment: 'Did not state the processing fee.',
            }),
          } as unknown as Response)
        }
        return Promise.resolve({ ok: true, json: async () => ({ items: [], status: 'ok', models: [] }) } as unknown as Response)
      }),
    )

    localStorage.setItem('supportiq_active_conversation_id', '101')

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Annual subscriptions may be refunded/i)).toBeInTheDocument()
    })

    const dislikeBtn = screen.getByRole('button', { name: /Mark answer as not helpful/i })
    fireEvent.click(dislikeBtn)

    // Reason choices should appear
    expect(screen.getByText(/Why was this answer not helpful\?/i)).toBeInTheDocument()
    expect(screen.getByText('Answer is incorrect')).toBeInTheDocument()
    expect(screen.getByText('Answer is incomplete')).toBeInTheDocument()
    expect(screen.getByText('Evidence is not relevant')).toBeInTheDocument()
    expect(screen.getByText('Citation is incorrect')).toBeInTheDocument()
    expect(screen.getByText('Answer was unclear')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()

    // Select reason
    fireEvent.click(screen.getByText('Answer is incomplete'))

    // Optional comment
    const commentInput = screen.getByPlaceholderText(/Explain what information was inaccurate/i)
    fireEvent.change(commentInput, { target: { value: 'Did not state the processing fee.' } })

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Feedback/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(submittedPayload).toEqual({
        message_id: 2,
        feedback_type: 'negative',
        reason: 'Answer is incomplete',
        comment: 'Did not state the processing fee.',
      })
    })
  })

  it('copies answer text to clipboard when Copy button is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/v1/conversations/101') || url.includes('/api/v1/conversations?')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockExistingConversation,
          } as unknown as Response)
        }
        return Promise.resolve({ ok: true, json: async () => ({ items: [], status: 'ok', models: [] }) } as unknown as Response)
      }),
    )

    localStorage.setItem('supportiq_active_conversation_id', '101')

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Annual subscriptions may be refunded/i)).toBeInTheDocument()
    })

    const copyBtn = screen.getByRole('button', { name: /Copy answer to clipboard/i })
    fireEvent.click(copyBtn)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Annual subscriptions may be refunded within 30 days of purchase upon written request.',
    )
    expect(await screen.findByText('Copied!')).toBeInTheDocument()
  })

  it('copies citation and evidence passage when Copy Citation button is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/v1/conversations/101') || url.includes('/api/v1/conversations?')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockExistingConversation,
          } as unknown as Response)
        }
        return Promise.resolve({ ok: true, json: async () => ({ items: [], status: 'ok', models: [] }) } as unknown as Response)
      }),
    )

    localStorage.setItem('supportiq_active_conversation_id', '101')

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Annual subscriptions may be refunded/i)).toBeInTheDocument()
    })

    const copyCitationBtn = screen.getByRole('button', { name: /Copy citation to clipboard/i })
    fireEvent.click(copyCitationBtn)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Billing & Refund Terms.pdf'),
    )
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Annual subscriptions are eligible for full refund'),
    )
    expect(await screen.findByText('Citation Copied!')).toBeInTheDocument()
  })

  it('triggers regenerate response API call when Regenerate button is clicked', async () => {
    let regeneratePayload: any = null

    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('/api/v1/conversations/101') || url.includes('/api/v1/conversations?')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockExistingConversation,
          } as unknown as Response)
        }
        if (url.includes('/api/v1/chat/regenerate') && init?.method === 'POST') {
          regeneratePayload = JSON.parse(String(init.body))
          return Promise.resolve({
            ok: true,
            json: async () => ({
              conversation: { id: 101 },
              assistant_message: {
                id: 3,
                conversation_id: 101,
                role: 'assistant',
                content: 'Regenerated refund answer with revised citations.',
                created_at: new Date().toISOString(),
                metadata_json: { model: 'SupportIQ QLoRA (4-bit NF4)', citations: [] },
              },
            }),
          } as unknown as Response)
        }
        return Promise.resolve({ ok: true, json: async () => ({ items: [], status: 'ok', models: [] }) } as unknown as Response)
      }),
    )

    localStorage.setItem('supportiq_active_conversation_id', '101')

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Annual subscriptions may be refunded/i)).toBeInTheDocument()
    })

    const regenBtn = screen.getByRole('button', { name: /Regenerate assistant response/i })
    fireEvent.click(regenBtn)

    await waitFor(() => {
      expect(regeneratePayload).toEqual({
        conversation_id: 101,
        message_id: 2,
        model_name: 'SupportIQ QLoRA (4-bit NF4)',
        use_knowledge_base: true,
      })
    })

    expect(await screen.findByText(/Regenerated refund answer with revised citations/i)).toBeInTheDocument()
  })

  it('displays graceful error message if feedback submission fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('/api/v1/conversations/101') || url.includes('/api/v1/conversations?')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockExistingConversation,
          } as unknown as Response)
        }
        if (url.endsWith('/api/v1/feedback') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ detail: 'Invalid feedback submission request' }),
          } as unknown as Response)
        }
        return Promise.resolve({ ok: true, json: async () => ({ items: [], status: 'ok', models: [] }) } as unknown as Response)
      }),
    )

    localStorage.setItem('supportiq_active_conversation_id', '101')

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Annual subscriptions may be refunded/i)).toBeInTheDocument()
    })

    const dislikeBtn = screen.getByRole('button', { name: /Mark answer as not helpful/i })
    fireEvent.click(dislikeBtn)

    const submitBtn = screen.getByRole('button', { name: /Submit Feedback/i })
    fireEvent.click(submitBtn)

    expect(await screen.findByText(/Invalid feedback submission request/i)).toBeInTheDocument()
  })
})
