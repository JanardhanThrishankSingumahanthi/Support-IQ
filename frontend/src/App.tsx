import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthGate } from './components/AuthGate'
import { Badge, Button, Card, DataTable, ProgressIndicator, SearchBar, StatCard, StatusBadge, Tabs } from './components/design-system'
import { Layout } from './components/Layout'
import { getStoredSession } from './lib/auth'

const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

type DashboardSummary = {
  metrics: Array<{ label: string; value: string | number; delta?: string; note?: string; tone: 'cyan' | 'purple' | 'teal' | 'amber' }>
  queue: Array<{ customer: string; issue: string; severity: string; owner: string; eta: string }>
  serviceHealth: Array<{ name: string; value: string; status: 'online' | 'warning' | 'offline' | 'processing' | 'success' }>
  documents: Array<{ title: string; status: string; updated: string; owner: string }>
  conversations: Array<{ title: string; status: string; participants: string; updated: string }>
  queries: Array<{ label: string; value: string; trend?: string }>
}

function noDataState() {
  return <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-400">No data available yet</div>
}

async function fetchDashboard(): Promise<DashboardSummary> {
  const response = await fetch(`${apiBase}/api/v1/health`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Dashboard unavailable')
  }

  const backend = await response.json()

  return {
    metrics: backend.metrics ?? [],
    queue: backend.queue ?? [],
    serviceHealth: backend.serviceHealth ?? [],
    documents: backend.documents ?? [],
    conversations: backend.conversations ?? [],
    queries: backend.queries ?? [],
  }
}

function DashboardHome() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchDashboard()
      .then((data) => {
        if (isMounted) {
          setDashboard(data)
          setError(null)
        }
      })
      .catch((err: Error) => {
        if (isMounted) setError(err.message)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const metricCards = dashboard?.metrics ?? []
  const queueRows = (dashboard?.queue ?? []).map((entry) => ({
    customer: entry.customer,
    issue: entry.issue,
    severity: <Badge tone={entry.severity === 'Urgent' ? 'danger' : entry.severity === 'High' ? 'warning' : entry.severity === 'Medium' ? 'info' : 'success'}>{entry.severity}</Badge>,
    owner: entry.owner,
    eta: entry.eta,
  }))
  const hasDashboardData = Boolean(dashboard && (dashboard.metrics.length || dashboard.queue.length || dashboard.serviceHealth.length || dashboard.documents.length || dashboard.conversations.length || dashboard.queries.length))

  const overviewColumns = useMemo(
    () => [
      { key: 'customer', label: 'Customer' },
      { key: 'issue', label: 'Issue' },
      { key: 'severity', label: 'Severity' },
      { key: 'owner', label: 'Owner' },
      { key: 'eta', label: 'ETA', align: 'right' as const },
    ],
    [],
  )

  if (loading) {
    return (
      <Layout>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center text-slate-300">Loading support data...</div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Card>
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300">Dashboard error</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Unable to load dashboard</h2>
          <p className="mt-3 text-sm text-slate-300">{error}</p>
        </Card>
      </Layout>
    )
  }

  if (!hasDashboardData) {
    return (
      <Layout>
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-16 text-center">
          <p className="text-sm text-slate-400">No data available yet</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-[28px] border border-slate-800 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.7)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-cyan-300/80">Support status</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Operations overview</h2>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status="online" />
              <Button variant="primary" size="sm">Create ticket</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <Tabs items={['Overview', 'Queue', 'Automation', 'Insights']} active={activeTab} onChange={setActiveTab} />
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1">{dashboard?.documents?.length ? 'Live data' : 'Awaiting data'}</span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          {metricCards.length ? metricCards.map((metric) => (
            <StatCard key={metric.label} label={metric.label} value={String(metric.value)} delta={metric.delta} note={metric.note} tone={metric.tone} />
          )) : noDataState()}
        </section>

        <section className="grid gap-6 2xl:grid-cols-[1.6fr_0.9fr]">
          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Priority queue</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Support escalations</h3>
              </div>
              <Button variant="secondary" size="sm">View all</Button>
            </div>
            <div className="p-5">
              {queueRows.length ? <DataTable columns={overviewColumns} rows={queueRows} /> : noDataState()}
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Resolution health</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Current SLA</h3>
                </div>
                <Badge tone="success">{dashboard?.serviceHealth?.length ? 'On track' : 'Awaiting data'}</Badge>
              </div>
              <div className="mt-6 space-y-5">
                {dashboard?.serviceHealth?.length ? dashboard.serviceHealth.map((item) => (
                  <ProgressIndicator key={item.name} value={Number(item.value.replace(/%|\D/g, '')) || 0} label={item.name} tone={item.status === 'warning' ? 'amber' : 'cyan'} />
                )) : noDataState()}
              </div>
            </Card>

            <Card>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Automation</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Smart routing</h3>
              <div className="mt-5 space-y-4">
                {(dashboard?.queries ?? []).length ? dashboard?.queries.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{item.label}</span>
                      <StatusBadge status={item.value.toString().includes('%') ? 'success' : 'processing'} />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
                    {item.trend ? <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-400">{item.trend}</p> : null}
                  </div>
                )) : noDataState()}
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Recent documents</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Library health</h3>
              </div>
              <Button variant="ghost" size="sm">Review</Button>
            </div>
            <div className="mt-5 space-y-3">
              {(dashboard?.documents ?? []).length ? (dashboard?.documents ?? []).map((document) => (
                <div key={document.title} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{document.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{document.owner} • {document.updated}</p>
                  </div>
                  <Badge tone={document.status === 'Published' ? 'success' : 'info'}>{document.status}</Badge>
                </div>
              )) : noDataState()}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Recent conversations</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Customer touchpoints</h3>
              </div>
              <Button variant="ghost" size="sm">Open</Button>
            </div>
            <div className="mt-5 space-y-3">
              {(dashboard?.conversations ?? []).length ? (dashboard?.conversations ?? []).map((conversation) => (
                <div key={conversation.title} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-white">{conversation.title}</p>
                    <Badge tone={conversation.status === 'Resolved' ? 'success' : conversation.status === 'Escalated' ? 'warning' : 'info'}>{conversation.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{conversation.participants} • {conversation.updated}</p>
                </div>
              )) : noDataState()}
            </div>
          </Card>
        </section>
      </div>
    </Layout>
  )
}

type MessageRecord = {
  id: number
  conversation_id: number
  role: 'user' | 'assistant'
  content: string
  metadata_json?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

type ConversationRecord = {
  id: number
  user_id: number | null
  title: string | null
  state: string
  created_at: string
  updated_at: string
  messages: MessageRecord[]
}

function ConversationsPage() {
  const session = getStoredSession()
  const [conversations, setConversations] = useState<ConversationRecord[]>([])
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

  useEffect(() => {
    if (!session?.token) return

    fetch(`${apiBase}/api/v1/conversations?page=1&page_size=20`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load conversations')
        const payload = await response.json()
        const items = Array.isArray(payload.items) ? payload.items : []
        setConversations(items)
        setActiveConversationId(items[0]?.id ?? null)
      })
      .catch(() => {
        setConversations([])
        setActiveConversationId(null)
      })
      .finally(() => setLoading(false))
  }, [apiBase, session?.token])

  const filteredConversations = conversations.filter((conversation) => {
    const messages = Array.isArray(conversation.messages) ? conversation.messages : []
    const haystack = `${conversation.title ?? ''} ${messages.map((message) => message.content).join(' ')}`.toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  const activeConversation = filteredConversations.find((conversation) => conversation.id === activeConversationId)
    ?? conversations.find((conversation) => conversation.id === activeConversationId)
    ?? filteredConversations[0]
    ?? conversations[0]
    ?? null

  const handleCreateConversation = async () => {
    if (!session?.token) return

    const response = await fetch(`${apiBase}/api/v1/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ title: 'New chat' }),
    })

    if (!response.ok) return
    const nextConversation = await response.json()
    setConversations((current) => [nextConversation, ...current])
    setActiveConversationId(nextConversation.id)
  }

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.token || !draft.trim()) return

    setSubmitting(true)
    const response = await fetch(`${apiBase}/api/v1/chat/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        conversation_id: activeConversation?.id ?? null,
        title: activeConversation?.title ?? 'New chat',
        content: draft.trim(),
      }),
    })

    if (response.ok) {
      const payload = await response.json()
      const nextConversation = payload.conversation as ConversationRecord
      setConversations((current) => {
        const existing = current.find((item) => item.id === nextConversation.id)
        if (existing) {
          return current.map((item) => (item.id === nextConversation.id ? nextConversation : item))
        }
        return [nextConversation, ...current]
      })
      setActiveConversationId(nextConversation.id)
      setDraft('')
    }
    setSubmitting(false)
  }

  return (
    <Layout activeItem="Conversations" title="Conversations">
      <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 shadow-[0_24px_80px_rgba(2,6,23,0.7)]">
        <div className="flex min-h-[760px] flex-col xl:flex-row">
          <aside className="w-full border-b border-slate-800 bg-slate-950/60 p-4 xl:w-[340px] xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Workspace</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Support chat</h2>
              </div>
              <Button variant="primary" size="sm" onClick={handleCreateConversation}>New chat</Button>
            </div>

            <div className="mt-4">
              <SearchBar value={search} onChange={setSearch} placeholder="Search conversations" />
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">Loading conversations…</div>
              ) : filteredConversations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">No conversations yet</div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${conversation.id === activeConversation?.id ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-white">{conversation.title || 'New conversation'}</span>
                      <Badge tone={conversation.state === 'open' ? 'info' : 'neutral'}>{conversation.state}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{(conversation.messages ?? []).at(-1)?.content ?? 'No messages yet'}</p>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="flex min-h-[420px] flex-1 flex-col bg-slate-900/50">
            {activeConversation ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Conversation</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{activeConversation.title || 'Untitled chat'}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm">View case</Button>
                    <Button variant="ghost" size="sm">Escalate</Button>
                  </div>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    AI response unavailable. The retrieval pipeline is not yet enabled for this division.
                  </div>

                  {((activeConversation.messages ?? []).length === 0) ? (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400">
                      Start the conversation with a customer support question.
                    </div>
                  ) : (
                    (activeConversation.messages ?? []).map((message) => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] rounded-2xl border px-4 py-3 text-sm ${message.role === 'user' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-50' : 'border-slate-700 bg-slate-950/80 text-slate-100'}`}>
                          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">{message.role}</p>
                          <p className="mt-2 whitespace-pre-wrap leading-6">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-slate-800 p-4">
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={4}
                      placeholder="Ask about billing, account access, or product issues…"
                      className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-400">
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">Knowledge base</span>
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">Model: SupportIQ</span>
                      </div>
                      <Button type="submit" size="sm" disabled={submitting || !draft.trim()}>{submitting ? 'Sending…' : 'Send message'}</Button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-10 text-slate-400">No conversation selected</div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  )
}

type DocumentRecord = {
  id: number
  title: string
  filename: string
  file_type: string
  size: number
  category: string
  version: number
  status: string
  uploaded_at: string
  updated_at: string
  indexed_at?: string | null
  chunk_count: number
  preview?: string
  error?: string | null
}

function DocumentsPage() {
  const session = getStoredSession()
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchDocuments = async () => {
    if (!session?.token) return

    setLoading(true)
    const response = await fetch(`${apiBase}/api/v1/documents?page=1&page_size=20`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
    })

    if (!response.ok) {
      setDocuments([])
      setLoading(false)
      return
    }

    const payload = await response.json()
    setDocuments(Array.isArray(payload.items) ? payload.items : [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDocuments()
  }, [session?.token])

  const filteredDocuments = documents.filter((document) => {
    const matchesSearch = `${document.title} ${document.filename} ${document.category}`.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || document.category === category
    return matchesSearch && matchesCategory
  })

  const categories = ['All', ...Array.from(new Set(documents.map((document) => document.category).filter(Boolean)))]

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !session?.token) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category === 'All' ? 'General' : category)

    try {
      const response = await fetch(`${apiBase}/api/v1/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: formData,
      })

      if (response.ok) {
        const nextDocument = await response.json()
        setDocuments((current) => [nextDocument, ...current])
      }
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <Layout activeItem="Documents" title="Document library">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.7)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Knowledge base</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Document library</h2>
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]">
                <input type="file" className="hidden" accept=".pdf,.docx,.txt,.csv" onChange={handleUpload} />
                {uploading ? 'Uploading…' : 'Upload documents'}
              </label>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_2.3fr]">
          <Card className="h-fit">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Manage</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Document settings</h3>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">Search</label>
                <SearchBar value={search} onChange={setSearch} placeholder="Search documents" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">Category</label>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none">
                  {categories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Allowed types</p>
                <p className="mt-2">PDF, DOCX, TXT, CSV</p>
                <p className="mt-2 text-xs text-slate-400">Maximum file size: 10 MB</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Library</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Indexed knowledge</h3>
              </div>
              <Badge tone="info">{filteredDocuments.length} files</Badge>
            </div>

            <div className="mt-6 space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">Loading documents…</div>
              ) : filteredDocuments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center text-sm text-slate-400">No documents uploaded yet</div>
              ) : (
                filteredDocuments.map((document) => {
                  const badgeTone = document.status === 'COMPLETED' ? 'success' : document.status === 'FAILED' ? 'danger' : document.status === 'INDEXING' ? 'warning' : 'info'
                  return (
                    <div key={document.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-base font-medium text-white">{document.title}</p>
                          <p className="mt-1 text-xs text-slate-400">{document.filename} • {document.file_type.toUpperCase()} • {(document.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Badge tone={badgeTone}>{document.status}</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">{document.category}</span>
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">v{document.version}</span>
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">{document.chunk_count} chunks</span>
                      </div>
                      <p className="mt-4 text-sm text-slate-300">{document.preview || 'Document uploaded successfully.'}</p>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </section>
      </div>
    </Layout>
  )
}

function LoginPage() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-[10px] uppercase tracking-[0.26em] text-cyan-300">SupportIQ</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">Access the support dashboard and knowledge tools.</p>

        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
            Demo account required to continue.
          </div>
          <Button fullWidth onClick={() => {
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
            window.location.href = from
          }}>
            Continue as admin
          </Button>
        </div>
      </div>
    </div>
  )
}

type ExperimentResult = {
  id?: number
  name?: string
  status?: string
  model_variant?: string
  latest_metrics?: Record<string, number | string | null>
  runs?: Array<{ id: number; status: string; metrics: Record<string, number | string | null>; config_json?: Record<string, unknown> }>
}

function ExperimentsPage() {
  const session = getStoredSession()
  const [experiments, setExperiments] = useState<ExperimentResult[]>([])
  const [selectedExperimentId, setSelectedExperimentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

  const fetchExperiments = async () => {
    if (!session?.token) return
    setLoading(true)
    const response = await fetch(`${apiBase}/api/v1/experiments?page=1&page_size=20`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
    })
    if (response.ok) {
      const payload = await response.json()
      const items = Array.isArray(payload.items) ? payload.items : []
      setExperiments(items)
      setSelectedExperimentId((current) => current ?? items[0]?.id ?? null)
    } else {
      setExperiments([])
      setSelectedExperimentId(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchExperiments()
  }, [session?.token])

  const selectedExperiment = experiments.find((experiment) => experiment.id === selectedExperimentId) ?? experiments[0] ?? null
  const selectedRunConfig = selectedExperiment?.runs?.[0]?.config_json as Record<string, unknown> | undefined
  const selectedDatasetName = typeof selectedRunConfig?.dataset_name === 'string' ? selectedRunConfig.dataset_name : 'Not set'

  const metrics = [
    'accuracy',
    'faithfulness',
    'recall_at_5',
    'mrr',
    'hallucination_rate',
    'response_time',
    'gpu_memory',
    'parameter_count',
    'precision_at_k',
    'ndcg',
    'answer_relevance',
    'evidence_coverage',
  ]

  const modelVariants = ['Base LLM', 'RAG Base', 'LoRA', 'QLoRA', 'RAG + LoRA', 'RAG + QLoRA']

  const metricRows = metrics.map((key) => {
    const value = selectedExperiment?.latest_metrics?.[key]
    return {
      key,
      value: value == null || value === '' ? 'Not evaluated yet' : String(value),
    }
  })

  const createExperiment = async () => {
    if (!session?.token) return
    setCreating(true)
    const response = await fetch(`${apiBase}/api/v1/experiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({
        name: `Experiment ${Date.now()}`,
        description: 'Model evaluation and experiment comparison',
        model_name: 'SupportIQ baseline',
        dataset_name: 'support-demo',
        model_variant: 'RAG + QLoRA',
        configuration: { retrieval: { top_k: 5 }, embedding: { model: 'text-embedding-3-small' } },
        status: 'QUEUED',
      }),
    })
    if (response.ok) {
      await fetchExperiments()
    }
    setCreating(false)
  }

  const filteredExperiments = experiments.filter((experiment) => {
    const haystack = `${experiment.name ?? ''} ${experiment.model_variant ?? ''} ${experiment.status ?? ''}`.toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  return (
    <Layout activeItem="Experiment Center" title="Model Evaluation & Experiment Center">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.7)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Research</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Model evaluation</h2>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={createExperiment} disabled={creating}>{creating ? 'Creating…' : 'Create experiment'}</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_2.2fr]">
          <Card className="h-fit">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Experiments</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Runs</h3>
              </div>
              <Badge tone="info">{filteredExperiments.length}</Badge>
            </div>
            <div className="mt-5">
              <SearchBar value={search} onChange={setSearch} placeholder="Search experiments" />
            </div>
            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">Loading experiments…</div>
              ) : filteredExperiments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center text-sm text-slate-400">No experiment data yet</div>
              ) : (
                filteredExperiments.map((experiment) => (
                  <button
                    type="button"
                    key={experiment.id}
                    onClick={() => setSelectedExperimentId(experiment.id ?? null)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selectedExperiment?.id === experiment.id ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{experiment.name ?? 'Experiment'}</p>
                      <Badge tone={experiment.status === 'COMPLETED' ? 'success' : experiment.status === 'FAILED' ? 'danger' : experiment.status === 'RUNNING' ? 'warning' : 'info'}>{experiment.status ?? 'QUEUED'}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{experiment.model_variant ?? 'Base LLM'} • {experiment.latest_metrics ? 'Results available' : 'Not evaluated yet'}</p>
                  </button>
                ))
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Overview</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{selectedExperiment?.name ?? 'No experiment selected'}</h3>
                </div>
                <Badge tone="info">{selectedExperiment?.model_variant ?? 'Base LLM'}</Badge>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Dataset</p>
                  <p className="mt-3 text-xl font-semibold text-white">{selectedDatasetName}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                  <p className="mt-3 text-xl font-semibold text-white">{selectedExperiment?.status ?? 'QUEUED'}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Conclusion</p>
                  <p className="mt-3 text-xl font-semibold text-white">{selectedExperiment?.latest_metrics ? 'Results available' : 'Not evaluated yet'}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Comparison</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Model variants</h3>
                </div>
                <Badge tone="warning">RAG + QLoRA proposed</Badge>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {modelVariants.map((variant) => (
                  <div key={variant} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{variant}</p>
                      <Badge tone={variant === 'RAG + QLoRA' ? 'warning' : 'neutral'}>{variant === 'RAG + QLoRA' ? 'Proposed' : 'Baseline'}</Badge>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">{selectedExperiment?.latest_metrics ? 'Evaluation available' : 'Not evaluated yet'}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Metrics</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Evaluation results</h3>
              </div>
              <Badge tone="success">Real metrics only</Badge>
            </div>

            <div className="mt-6 space-y-3">
              {metricRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <span className="text-sm font-medium capitalize text-slate-200">{row.key.replace(/_/g, ' ')}</span>
                  <span className="text-sm text-slate-300">{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Lifecycle</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Experiment center</h3>
            </div>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Configuration</p>
                <p className="mt-2">Model selection, dataset configuration, retrieval, embedding, reranker, LoRA, QLoRA, and evaluation settings are stored with each run.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">State tracking</p>
                <p className="mt-2">QUEUED, RUNNING, COMPLETED, FAILED, and CANCELLED are tracked by the backend lifecycle endpoints.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Integrity</p>
                <p className="mt-2">If no experiment exists, the UI shows “Not evaluated yet” and never invents conclusions or charts.</p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </Layout>
  )
}

function SupportTicketsPage() {
  const session = getStoredSession()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const fetchTickets = async () => {
    if (!session?.token) return
    setLoading(true)
    const response = await fetch(`${apiBase}/api/v1/support-tickets?page=1&page_size=20`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
    })

    if (response.ok) {
      const payload = await response.json()
      setTickets(Array.isArray(payload.items) ? payload.items : [])
    } else {
      setTickets([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTickets()
  }, [session?.token])

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = `${ticket.subject ?? ''} ${ticket.customer_name ?? ''} ${ticket.description ?? ''}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Layout activeItem="Support Tickets" title="Support tickets">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.7)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Operations</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Customer support</h2>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm">New ticket</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_2.2fr]">
          <Card className="h-fit">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Filters</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Queue</h3>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">Search</label>
                <SearchBar value={search} onChange={setSearch} placeholder="Search tickets" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">Status</label>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none">
                  {['All', 'Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Tickets</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Support queue</h3>
              </div>
              <Badge tone="info">{filteredTickets.length} active</Badge>
            </div>

            <div className="mt-6 space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">Loading support tickets…</div>
              ) : filteredTickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center text-sm text-slate-400">No tickets in queue</div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-medium text-white">#{ticket.id} • {ticket.subject}</p>
                          <Badge tone={ticket.status === 'Resolved' ? 'success' : ticket.status === 'Escalated' ? 'warning' : ticket.status === 'Closed' ? 'neutral' : 'info'}>{ticket.status}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">{ticket.customer_name ?? 'Customer'} • {ticket.category ?? 'General'} • {ticket.priority ?? 'Medium'} priority</p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <p>{ticket.source ?? 'web'}</p>
                        <p>{new Date(ticket.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-300">{ticket.description}</p>
                    {ticket.escalation_reason ? <p className="mt-3 text-xs uppercase tracking-[0.12em] text-amber-300">Escalation: {ticket.escalation_reason}</p> : null}
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>
      </div>
    </Layout>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <AuthGate>
            <DashboardHome />
          </AuthGate>
        }
      />
      <Route path="/health" element={<HealthPage />} />
      <Route path="/documents" element={<AuthGate><DocumentsPage /></AuthGate>} />
      <Route path="/conversations" element={<AuthGate><ConversationsPage /></AuthGate>} />
      <Route path="/support-tickets" element={<AuthGate><SupportTicketsPage /></AuthGate>} />
      <Route path="/experiments" element={<AuthGate><ExperimentsPage /></AuthGate>} />
      <Route path="/knowledge" element={<AuthGate><Layout><div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-16 text-center text-slate-400">No data available yet</div></Layout></AuthGate>} />
      <Route path="/analytics" element={<AuthGate><Layout><div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-16 text-center text-slate-400">No data available yet</div></Layout></AuthGate>} />
    </Routes>
  )
}

function HealthPage() {
  const [health, setHealth] = useState<{ status: string; service: string; environment: string; debug: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${apiBase}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Health check failed with status ${response.status}`)
        return response.json()
      })
      .then(setHealth)
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">System health</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Runtime status</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Service</p>
              <p className="mt-3 text-2xl font-semibold text-white">{health?.service ?? 'Loading...'}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Environment</p>
              <p className="mt-3 text-2xl font-semibold text-white">{health?.environment ?? 'Loading...'}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Status</p>
              <p className="mt-3 text-2xl font-semibold text-emerald-300">{error ? 'Unavailable' : health?.status ?? 'Loading...'}</p>
            </div>
          </div>
          {error ? <p className="mt-4 text-sm text-amber-300">{error}</p> : null}
        </Card>
      </div>
    </Layout>
  )
}

export function App() {
  return <AppRoutes />
}

export default App
