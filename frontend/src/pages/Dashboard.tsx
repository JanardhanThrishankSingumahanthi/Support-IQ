import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DonutGauge, HorizontalBarList, LineTrendChart } from '../components/charts/Charts'
import { getStoredSession } from '../lib/auth'

const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export function Dashboard() {
  const navigate = useNavigate()
  const session = getStoredSession()
  const userName = session?.user?.full_name?.split(' ')[0] || 'Janardhan'

  const [stats] = useState({
    queriesResolved: 42,
    documentsUsed: 18,
    accuracy: 96,
    activeUsers: 28,
  })

  const [recentChats, setRecentChats] = useState<any[]>([
    {
      id: 1,
      title: 'How to reset my account password?',
      preview: 'Here are the steps to reset your password...',
      time: '10:24 AM',
      status: 'Resolved',
    },
    {
      id: 2,
      title: 'Refund policy for annual subscription',
      preview: 'According to our policy, annual subscriptions...',
      time: 'Yesterday',
      status: 'Resolved',
    },
    {
      id: 3,
      title: 'System not working after update',
      preview: 'This issue can be fixed by clearing the cache...',
      time: '9 Sep 2026',
      status: 'Resolved',
    },
    {
      id: 4,
      title: 'Data privacy and security',
      preview: 'We follow industry-standard security practices...',
      time: '8 Sep 2026',
      status: 'Resolved',
    },
    {
      id: 5,
      title: 'How to integrate with third-party tools?',
      preview: 'You can integrate using our REST API...',
      time: '7 Sep 2026',
      status: 'In Progress',
    },
  ])

  useEffect(() => {
    if (!session?.token) return

    // Fetch live conversations from API
    fetch(`${apiBase}/api/v1/conversations?page=1&page_size=5`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
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
  }, [session?.token])

  // Trend line data matching Image 3 (Sep 5 to Sep 11)
  const trendLabels = ['Sep 5', 'Sep 6', 'Sep 7', 'Sep 8', 'Sep 9', 'Sep 10', 'Sep 11']
  const trendSeries = [
    {
      name: 'Resolved Queries',
      color: '#06b6d4',
      values: [4, 11, 10, 16, 11, 17, 16],
    },
  ]

  // Top query categories matching Image 3
  const queryCategories = [
    { label: 'Account Access', percentage: 32, color: '#06b6d4' },
    { label: 'Billing & Payments', percentage: 24, color: '#0ea5e9' },
    { label: 'Product Usage', percentage: 18, color: '#10b981' },
    { label: 'Technical Issues', percentage: 16, color: '#a855f7' },
    { label: 'Others', percentage: 10, color: '#64748b' },
  ]

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
          <p className="font-semibold text-slate-300">Thursday, 11 Sep 2026</p>
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
              ↑ 12% <span className="text-slate-500 font-normal">vs last week</span>
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
              ↑ 8% <span className="text-slate-500 font-normal">vs last week</span>
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
              ↑ 4% <span className="text-slate-500 font-normal">vs last week</span>
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
              ↑ 17% <span className="text-slate-500 font-normal">vs last week</span>
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
            {recentChats.map((chat) => (
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
            ))}
          </div>
        </div>

        {/* Knowledge Sources (1 col) */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-white">Knowledge Sources</h3>
            <Link to="/knowledge" className="text-xs text-cyan-400 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Company Policies', count: '24 documents', icon: '📄', color: 'bg-sky-500/10 text-sky-400' },
              { title: 'Product Manuals', count: '18 documents', icon: '📗', color: 'bg-emerald-500/10 text-emerald-400' },
              { title: 'FAQs', count: '32 documents', icon: '❓', color: 'bg-purple-500/10 text-purple-400' },
              { title: 'Support Tickets', count: '12,450 records', icon: '🗄', color: 'bg-amber-500/10 text-amber-400' },
            ].map((source) => (
              <div
                key={source.title}
                onClick={() => navigate('/knowledge')}
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
            <select className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300 focus:outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <LineTrendChart series={trendSeries} labels={trendLabels} height={160} />
        </div>

        {/* Resolution Rate Donut */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Resolution Rate</h3>
          </div>
          <div className="my-auto py-2">
            <DonutGauge percentage={78} size={140} color="#06b6d4" valueText="78%" subtitle="" />
          </div>
          <div className="flex items-center justify-around text-xs border-t border-slate-800/80 pt-3 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Resolved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-600" />
              <span>Escalated</span>
            </div>
          </div>
        </div>

        {/* Top Query Categories */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-4">Top Query Categories</h3>
          <HorizontalBarList items={queryCategories} />
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
