import React, { useEffect, useState } from 'react'
import { DonutGauge, LineTrendChart } from '../components/charts/Charts'
import {
  BarChart3,
  Calendar,
  Download,
  MessageSquare,
  CheckCircle2,
  Users,
  Star,
  Clock,
  TrendingUp,
  FileText,
} from 'lucide-react'
import { getStoredSession } from '../lib/auth'

const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

interface AnalyticsData {
  has_data: boolean
  total_queries: number
  resolved_by_ai: number
  total_tickets: number
  tickets_resolved: number
  total_documents: number
  average_accuracy: number
  average_latency_s: number
  categories: { name: string; count: number; percent: number }[]
  resolution_breakdown: { name: string; count: number; color: string }[]
  sources: { name: string; count: number; percent: number }[]
  top_documents: { id: number; name: string; category: string; uses: number; chunk_count: number }[]
  trend: {
    labels: string[]
    total_queries: number[]
    resolved_queries: number[]
  }
}

export const Analytics: React.FC = () => {
  const session = getStoredSession()
  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)

  const currentDateString = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  useEffect(() => {
    if (!session?.token) {
      setLoading(false)
      return
    }

    fetch(`${apiBase}/api/v1/analytics/overview`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        setData(resData)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [session?.token])

  const handleExport = async () => {
    if (!session?.token) return
    try {
      const res = await fetch(`${apiBase}/api/v1/analytics/export`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `supportiq_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch {
      // Ignore network errors
    }
  }

  // Chart data for Query Volume Trend
  const queryTrendLabels = data?.trend?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const queryTrendSeries = [
    {
      name: 'Total Queries',
      color: '#06b6d4',
      values: data?.trend?.total_queries || [0, 0, 0, 0, 0, 0, 0],
    },
    {
      name: 'Resolved by AI',
      color: '#10b981',
      values: data?.trend?.resolved_queries || [0, 0, 0, 0, 0, 0, 0],
    },
  ]

  const categoryColors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#64748b']

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Analytics & Operational Intelligence</h1>
            <p className="text-sm text-slate-400">
              Traceable metrics derived from real database messages, support tickets, and knowledge citations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Active Window: {currentDateString}</span>
          </div>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Report (CSV)
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1 border-b border-slate-800/80 overflow-x-auto pb-px">
        {['Overview', 'Query Analytics', 'Resolution Analytics', 'Knowledge Base Usage'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading live operational analytics from database...</div>
      ) : !data ? (
        <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
          No data available.
        </div>
      ) : (
        <>
          {/* 5 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Total User Queries</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{data.total_queries}</div>
              <div className="text-[11px] text-cyan-400 flex items-center gap-1 mt-1 font-medium">
                <TrendingUp className="w-3 h-3" />
                Live from messages table
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Resolved by AI</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-emerald-400">{data.resolved_by_ai}</div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {data.total_queries > 0 ? Math.round((data.resolved_by_ai / data.total_queries) * 100) : 100}%
                </span>
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-1">Grounding verified</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Support Tickets</span>
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-slate-100">{data.total_tickets}</div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {data.tickets_resolved} resolved
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">From support_tickets table</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Average Grounding</span>
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-100">
                {data.average_accuracy} <span className="text-sm font-normal text-slate-400">%</span>
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">RAG claim verification</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Avg. Response Time</span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-100">{data.average_latency_s} s</div>
              <div className="text-[11px] text-slate-400 mt-1">Inference pipeline latency</div>
            </div>
          </div>

          {/* Middle Row: Trend, Categories, Resolution Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Query Volume Trend */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-slate-100">Query Volume Trend (Last 7 Days)</h2>
                  <span className="text-[11px] text-cyan-400 font-mono">Real-time</span>
                </div>
                <p className="text-xs text-slate-400 mb-4">Recorded daily query activity</p>

                <LineTrendChart series={queryTrendSeries} labels={queryTrendLabels} height={140} />
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] pt-3 border-t border-slate-800/60 mt-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-0.5 bg-cyan-400" /> Total Queries
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-0.5 bg-emerald-400" /> Resolved by AI
                </span>
              </div>
            </div>

            {/* Query Categories Donut */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-slate-100">Category Breakdown</h2>
                  <span className="text-[11px] text-cyan-400">Knowledge & Tickets</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">Distribution of stored content</p>

                <div className="flex justify-center my-2">
                  <DonutGauge
                    percentage={data.categories.length > 0 ? 100 : 0}
                    size={140}
                    color="#06b6d4"
                    valueText={String(data.categories.length)}
                    label="Categories"
                  />
                </div>

                <div className="space-y-1.5 mt-3">
                  {data.categories.length === 0 ? (
                    <div className="text-center text-xs text-slate-500 py-2">No categories recorded yet.</div>
                  ) : (
                    data.categories.slice(0, 5).map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-300">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: categoryColors[i % categoryColors.length] }}
                          />
                          {cat.name}
                        </span>
                        <span className="font-semibold text-slate-200">{cat.count} items</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Resolution Rate */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-slate-100">Resolution Status</h2>
                  <span className="text-[11px] text-cyan-400">Workflow State</span>
                </div>
                <p className="text-xs text-slate-400 mb-4">AI automated vs human specialist handoffs</p>

                <div className="space-y-3">
                  {data.resolution_breakdown.map((res) => (
                    <div key={res.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{res.name}</span>
                        <span className="font-semibold text-slate-200">{res.count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: res.color,
                            width: `${Math.min(100, (res.count / (data.total_queries + data.total_tickets || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Top Documents & Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Documents */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">Top Knowledge Base Documents</h2>
                  <p className="text-xs text-slate-400">Most frequently indexed and retrieved documents</p>
                </div>
                <span className="text-xs text-cyan-400">{data.total_documents} total in KB</span>
              </div>

              <div className="space-y-2">
                {data.top_documents.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">No documents indexed yet.</div>
                ) : (
                  data.top_documents.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="font-mono text-cyan-400 font-bold">#{idx + 1}</span>
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-200 font-medium truncate">{doc.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                          {doc.category}
                        </span>
                      </div>
                      <span className="text-slate-400 shrink-0">{doc.chunk_count} chunks</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Channels & Sources */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">Inquiry Sources & Channels</h2>
                  <p className="text-xs text-slate-400">Customer origin channels recorded in ticket intake</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {data.sources.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">No inquiry sources recorded yet.</div>
                ) : (
                  data.sources.map((src) => (
                    <div key={src.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{src.name}</span>
                        <span className="font-semibold text-slate-200">{src.count} inquiries</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-cyan-500" style={{ width: `${src.percent}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
