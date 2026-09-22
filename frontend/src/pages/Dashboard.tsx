import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DonutGauge, HorizontalBarList, LineTrendChart } from '../components/charts/Charts'
import { getStoredSession } from '../lib/auth'

const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export function Dashboard() {
  const navigate = useNavigate()
  const session = getStoredSession()
  const userName = session?.user?.full_name?.split(' ')[0] || 'User'

  const [stats, setStats] = useState({
    queriesResolved: 0,
    documentsUsed: 0,
    accuracy: 0,
    activeUsers: 1,
    ticketsCount: 0,
    chunksCount: 0,
  })

  const [recentChats, setRecentChats] = useState<any[]>([])
  const [trendLabels, setTrendLabels] = useState<string[]>([])
  const [trendSeries, setTrendSeries] = useState<any[]>([
    {
      name: 'Resolved Queries',
      color: '#06b6d4',
      values: [],
    },
  ])
  const [queryCategories, setQueryCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session?.token) return
    setIsLoading(true)

    // 1. Fetch live conversations from API
    fetch(`${apiBase}/api/v1/conversations?page=1&page_size=5`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          const mapped = data.items.map((c: any) => ({
            id: c.id,
            title: c.title || 'Support Query',
            preview: c.messages?.[0]?.content?.slice(0, 50) || 'Verified support interaction...',
            time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: c.state === 'open' ? 'In Progress' : 'Resolved',
          }))
          setRecentChats(mapped)
        }
      })
      .catch(() => {})

    // 2. Fetch live dashboard metrics
    Promise.all([
      fetch(`${apiBase}/api/v1/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${session.token}` },
      }),
      fetch(`${apiBase}/api/v1/analytics/overview`, {
        headers: { Authorization: `Bearer ${session.token}` },
      }),
    ])
      .then(async ([dashRes, overRes]) => {
        const dData = dashRes.ok ? await dashRes.json() : null
        const oData = overRes.ok ? await overRes.json() : null

        if (dData) {
          setStats((prev) => ({
            ...prev,
            queriesResolved: dData.queries_resolved || 0,
            documentsUsed: dData.documents_used || 0,
            accuracy: dData.accuracy_percent || 0,
            activeUsers: dData.active_users || 1,
          }))

          if (dData.trend_labels && dData.trend_values) {
            setTrendLabels(dData.trend_labels)
            setTrendSeries([
              {
                name: 'Resolved Queries',
                color: '#06b6d4',
                values: dData.trend_values,
              },
            ])
          }

          if (dData.categories && dData.categories.length > 0) {
            setQueryCategories(dData.categories)
          }
        }

        if (oData) {
          setStats((prev) => ({
            ...prev,
            ticketsCount: oData.total_tickets || 0,
            chunksCount: (oData.top_documents || []).reduce((acc: number, d: any) => acc + (d.chunk_count || 0), 0),
          }))
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [session?.token])

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome back, {userName}!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Get instant, reliable answers from your knowledge base using AI.
          </p>
        </div>
        <div className="text-left md:text-right text-xs text-slate-400">
          <p className="font-semibold text-slate-300">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-[11px] text-cyan-400 mt-0.5">Let's make support smarter today!</p>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Queries Resolved */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg transition hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              💬
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              Live DB
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">{stats.queriesResolved}</div>
            <div className="text-xs text-slate-400 mt-0.5">Queries Resolved</div>
          </div>
        </div>

        {/* Card 2: Documents Used */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg transition hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              📄
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              Verified
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">{stats.documentsUsed}</div>
            <div className="text-xs text-slate-400 mt-0.5">Documents Used</div>
          </div>
        </div>

        {/* Card 3: Answer Accuracy */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg transition hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              ⏱
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              Reliability
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">{stats.accuracy}%</div>
            <div className="text-xs text-slate-400 mt-0.5">Answer Accuracy</div>
          </div>
        </div>

        {/* Card 4: Active Users */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg transition hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              👥
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              Active
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">{stats.activeUsers}</div>
            <div className="text-xs text-slate-400 mt-0.5">Active Users</div>
          </div>
        </div>
      </div>

      {/* Hero Banner: Ask. Retrieve. Verify. Resolve. */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0a1528] via-[#091830] to-[#0d2238] p-6 shadow-xl">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ask. Retrieve. Verify. <span className="text-cyan-400">Resolve.</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Use our AI-powered assistant to get accurate answers from your trusted documentation.
            </p>
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-400 transition"
            >
              <span>Start a New Chat</span>
              <span>→</span>
            </button>
          </div>

          {/* Right Features Badge Stack */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 sm:w-80">
            <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-950/40 p-2.5 backdrop-blur-sm">
              <span className="text-cyan-400">⚙</span>
              <span>Powered by RAG</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-950/40 p-2.5 backdrop-blur-sm">
              <span className="text-cyan-400">🗄</span>
              <span>Fine-tuned QLoRA</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-950/40 p-2.5 backdrop-blur-sm">
              <span className="text-emerald-400">🛡</span>
              <span>Grounded in Knowledge</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-950/40 p-2.5 backdrop-blur-sm">
              <span className="text-emerald-400">📄</span>
              <span>Reliable & Transparent</span>
            </div>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* Middle Section: Recent Conversations & Knowledge Sources */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Conversations (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Conversations</h3>
            <Link to="/chat" className="text-xs text-cyan-400 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {recentChats.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                {isLoading ? 'Loading conversations...' : 'No conversations yet. Start a chat to begin.'}
              </div>
            ) : (
              recentChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => navigate('/chat')}
                  className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 hover:border-slate-700 hover:bg-slate-900/60 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">
                      💬
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-100 truncate">{chat.title}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{chat.preview}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] text-slate-500">{chat.time}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        chat.status === 'Resolved'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {chat.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Knowledge Sources (1 col) */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-white">Knowledge Sources</h3>
            <Link to="/documents" className="text-xs text-cyan-400 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Verified Documents', count: `${stats.documentsUsed} documents`, icon: '📄', color: 'bg-sky-500/10 text-sky-400', link: '/documents' },
              { title: 'Indexed Chunks', count: `${stats.chunksCount} chunks`, icon: '📗', color: 'bg-emerald-500/10 text-emerald-400', link: '/documents' },
              { title: 'Support Tickets', count: `${stats.ticketsCount} tickets`, icon: '🗄', color: 'bg-amber-500/10 text-amber-400', link: '/tickets' },
              { title: 'Evaluation Datasets', count: '6 model variants', icon: '⚙', color: 'bg-purple-500/10 text-purple-400', link: '/model-evaluation' },
            ].map((source) => (
              <div
                key={source.title}
                onClick={() => navigate(source.link)}
                className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 hover:border-slate-700 hover:bg-slate-900/60 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg ${source.color} flex items-center justify-center text-sm`}>
                    {source.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-100">{source.title}</p>
                    <p className="text-[10px] text-slate-400">{source.count}</p>
                  </div>
                </div>
                <span className="text-slate-500 text-xs">›</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Query Trends, Resolution Rate, Top Query Categories */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Query Trends Line Chart */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Query Trends</h3>
            <span className="text-[11px] text-slate-400">Last 7 days</span>
          </div>
          {trendLabels.length > 0 ? (
            <LineTrendChart series={trendSeries} labels={trendLabels} height={160} />
          ) : (
            <div className="flex h-40 items-center justify-center text-xs text-slate-500">
              No query trend data recorded yet
            </div>
          )}
        </div>

        {/* Resolution Rate Donut */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Resolution Rate</h3>
          </div>
          <div className="my-auto py-2">
            <DonutGauge
              percentage={stats.accuracy || 0}
              size={140}
              color="#06b6d4"
              valueText={stats.accuracy > 0 ? `${stats.accuracy}%` : 'N/A'}
              subtitle=""
            />
          </div>
          <div className="flex items-center justify-around text-xs border-t border-slate-800/80 pt-3 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Resolved ({stats.accuracy}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-600" />
              <span>Escalated / Review</span>
            </div>
          </div>
        </div>

        {/* Top Query Categories */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-4">Top Query Categories</h3>
          {queryCategories.length > 0 ? (
            <HorizontalBarList items={queryCategories} />
          ) : (
            <div className="flex h-40 items-center justify-center text-xs text-slate-500">
              No category data available
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tip Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-5 py-3 text-xs text-cyan-200">
        <div className="flex items-center gap-2.5">
          <span className="text-base">💡</span>
          <span>Tip: Upload updated documents to keep your answers accurate.</span>
        </div>
        <Link to="/knowledge" className="font-semibold text-cyan-400 hover:underline">
          Go to Knowledge Base →
        </Link>
      </div>
    </div>
  )
}
