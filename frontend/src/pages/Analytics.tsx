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
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  MessageCircle,
} from 'lucide-react'
import { getStoredSession } from '../lib/auth'

const apiBase = import.meta.env.VITE_API_URL ?? ''

interface FeedbackMetrics {
  has_data: boolean
  total_feedback: number
  positive_feedback: number
  negative_feedback: number
  positive_percentage: number | null
  negative_percentage: number | null
  feedback_rate_percent: number
  reason_breakdown: Record<string, number>
}

interface RecentFeedbackItem {
  id: number
  date: string
  user_id: number
  user_email?: string
  question: string
  answer_snippet: string
  feedback_type: 'positive' | 'negative'
  reason?: string | null
  comment?: string | null
}

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
  feedback_summary?: FeedbackMetrics
}

export const Analytics: React.FC = () => {
  const session = getStoredSession()
  const isPrivileged = session?.user?.role === 'Administrator' || session?.user?.role === 'Support Agent'
  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<{
    metrics: FeedbackMetrics
    recent_feedback: RecentFeedbackItem[]
  } | null>(null)

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

    Promise.all([
      fetch(`${apiBase}/api/v1/analytics/overview`, {
        headers: { Authorization: `Bearer ${session.token}` },
      }).then((res) => (res.ok ? res.json() : null)),
      isPrivileged
        ? fetch(`${apiBase}/api/v1/feedback/analytics`, {
            headers: { Authorization: `Bearer ${session.token}` },
          }).then((res) => (res.ok ? res.json() : null))
        : Promise.resolve(null),
    ])
      .then(([overviewData, fbData]) => {
        setData(overviewData)
        if (fbData) {
          const breakdown: Record<string, number> = fbData.metrics?.reason_breakdown || {}
          if (Array.isArray(fbData.reasons)) {
            fbData.reasons.forEach((r: any) => {
              if (r.reason) breakdown[r.reason] = r.count
            })
          }
          setFeedbackAnalytics({
            metrics: {
              has_data: fbData.has_data ?? (fbData.total_feedback > 0),
              total_feedback: fbData.total_feedback ?? (fbData.metrics?.total_feedback ?? 0),
              positive_feedback: fbData.positive_count ?? (fbData.metrics?.positive_feedback ?? 0),
              negative_feedback: fbData.negative_count ?? (fbData.metrics?.negative_feedback ?? 0),
              positive_percentage: fbData.positive_percentage ?? (fbData.metrics?.positive_percentage ?? null),
              negative_percentage: fbData.negative_percentage ?? (fbData.metrics?.negative_percentage ?? null),
              feedback_rate_percent: fbData.feedback_rate ?? (fbData.metrics?.feedback_rate_percent ?? 0),
              reason_breakdown: breakdown,
            },
            recent_feedback: fbData.recent_feedback || [],
          })
        } else if (overviewData?.feedback_summary) {
          setFeedbackAnalytics({
            metrics: overviewData.feedback_summary,
            recent_feedback: [],
          })
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [session?.token, isPrivileged])

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
              Traceable metrics derived from real database messages, support tickets, answer feedback, and knowledge citations.
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
        {['Overview', 'Answer Feedback', 'Query Analytics', 'Resolution Analytics', 'Knowledge Base Usage'].map((tab) => (
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
          {/* 6 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
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
                Live from messages
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
                  {data.total_queries > 0 ? `${Math.round((data.resolved_by_ai / data.total_queries) * 100)}%` : '0%'}
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
              <div className="text-[11px] text-slate-400 mt-1">From support_tickets</div>
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
              <div className="text-[11px] text-slate-400 mt-1">Inference pipeline</div>
            </div>

            {/* 6th Card: Real Answer Feedback */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Answer Feedback</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ThumbsUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-slate-100">
                  {feedbackAnalytics?.metrics?.total_feedback ?? 0}
                </div>
                {feedbackAnalytics?.metrics?.has_data && feedbackAnalytics?.metrics?.positive_percentage !== null && feedbackAnalytics?.metrics?.positive_percentage !== undefined ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {feedbackAnalytics.metrics.positive_percentage}% 👍
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium">No feedback yet</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {feedbackAnalytics?.metrics?.has_data
                  ? `${feedbackAnalytics.metrics.negative_feedback} negative (${feedbackAnalytics.metrics.negative_percentage}%)`
                  : 'Truthful database metric'}
              </div>
            </div>
          </div>

          {/* TAB 1: Answer Feedback Dedicated Section */}
          {activeTab === 'Answer Feedback' && (
            <div className="space-y-6">
              {/* Research Integrity & Separation Notice */}
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-xs text-slate-300 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-cyan-300">
                    Product Feedback & Operational Satisfaction Metrics
                  </p>
                  <p className="text-slate-400 leading-relaxed text-[11.5px]">
                    User feedback measures subjective satisfaction and perceived answer completeness directly from end users. In accordance with SupportIQ research integrity guidelines, user feedback rates are tracked separately from offline scientific grounding and claim verification benchmarks.
                  </p>
                </div>
              </div>

              {/* Feedback Summary KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">Total Feedback Submissions</span>
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {feedbackAnalytics?.metrics?.total_feedback ?? 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Recorded in answer_feedback
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">Positive Feedback (👍)</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold text-emerald-400">
                      {feedbackAnalytics?.metrics?.positive_feedback ?? 0}
                    </div>
                    {feedbackAnalytics?.metrics?.positive_percentage !== null && feedbackAnalytics?.metrics?.positive_percentage !== undefined ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {feedbackAnalytics.metrics.positive_percentage}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">No feedback data available</span>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-400/80 mt-1">Helpful answers</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">Negative Feedback (👎)</span>
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold text-rose-400">
                      {feedbackAnalytics?.metrics?.negative_feedback ?? 0}
                    </div>
                    {feedbackAnalytics?.metrics?.negative_percentage !== null && feedbackAnalytics?.metrics?.negative_percentage !== undefined ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {feedbackAnalytics.metrics.negative_percentage}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">No feedback data available</span>
                    )}
                  </div>
                  <div className="text-[11px] text-rose-400/80 mt-1">Needs improvement</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">Response Evaluation Rate</span>
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-100">
                    {feedbackAnalytics?.metrics?.feedback_rate_percent ?? 0}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Evaluated assistant answers
                  </div>
                </div>
              </div>

              {/* Reasons Breakdown */}
              <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Negative Feedback Reasons</h2>
                    <p className="text-xs text-slate-400">Root cause distribution reported when answers are rated Not Helpful</p>
                  </div>
                  <span className="text-xs text-cyan-400 font-mono">
                    {feedbackAnalytics?.metrics?.negative_feedback ?? 0} issues reported
                  </span>
                </div>

                {!feedbackAnalytics?.metrics?.has_data || feedbackAnalytics?.metrics?.total_feedback === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800/60 my-2">
                    No feedback data available yet.
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {[
                      'Answer is incorrect',
                      'Answer is incomplete',
                      'Evidence is not relevant',
                      'Citation is incorrect',
                      'Answer was unclear',
                      'Other',
                    ].map((reasonKey) => {
                      const count = feedbackAnalytics?.metrics?.reason_breakdown?.[reasonKey] ?? 0
                      const totalNeg = feedbackAnalytics?.metrics?.negative_feedback || 1
                      const pct = Math.round((count / totalNeg) * 100)
                      return (
                        <div key={reasonKey} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">{reasonKey}</span>
                            <span className="text-slate-400 font-mono">
                              {count} {count === 1 ? 'report' : 'reports'} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-rose-500/80 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recent Feedback Submissions Table */}
              <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Recent Answer Feedback Submissions</h2>
                    <p className="text-xs text-slate-400">Submissions from answer_feedback with user question context and optional comments</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {feedbackAnalytics?.recent_feedback?.length ?? 0} recent entries
                  </span>
                </div>

                {!isPrivileged ? (
                  <div className="py-6 text-center text-xs text-amber-300/80 bg-amber-950/30 rounded-lg border border-amber-800/40">
                    Individual feedback entries are restricted to Administrators and Support Specialists.
                  </div>
                ) : !feedbackAnalytics?.recent_feedback || feedbackAnalytics.recent_feedback.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800/60">
                    No feedback submissions recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">User</th>
                          <th className="py-2.5 px-3">Question</th>
                          <th className="py-2.5 px-3">Answer Snippet</th>
                          <th className="py-2.5 px-3">Rating</th>
                          <th className="py-2.5 px-3">Reason</th>
                          <th className="py-2.5 px-3">Comment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {feedbackAnalytics.recent_feedback.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-2.5 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                              {item.date ? new Date(item.date).toLocaleDateString() : 'Recent'}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] font-medium text-slate-200 whitespace-nowrap">
                              {item.user_email || `User #${item.user_id}`}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-300 max-w-[180px] truncate" title={item.question}>
                              {item.question || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-[200px] truncate" title={item.answer_snippet}>
                              {item.answer_snippet || '—'}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {item.feedback_type === 'positive' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  👍 Helpful
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  👎 Not Helpful
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-300 whitespace-nowrap">
                              {item.reason || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-400 italic max-w-[200px] truncate" title={item.comment || ''}>
                              {item.comment ? `"${item.comment}"` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2, 3, 4, 5: Overview and other specific operational charts */}
          {activeTab !== 'Answer Feedback' && (
            <>
              {/* Middle Row: Trend, Categories, Resolution Rate */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Query Volume Trend */}
                {(activeTab === 'Overview' || activeTab === 'Query Analytics') && (
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
                )}

                {/* Query Categories Donut */}
                {(activeTab === 'Overview' || activeTab === 'Knowledge Base Usage' || activeTab === 'Query Analytics') && (
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
                )}

                {/* Resolution Rate */}
                {(activeTab === 'Overview' || activeTab === 'Resolution Analytics') && (
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
                )}
              </div>

              {/* Bottom Row: Top Documents & Channels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Documents */}
                {(activeTab === 'Overview' || activeTab === 'Knowledge Base Usage') && (
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
                )}

                {/* Channels & Sources */}
                {(activeTab === 'Overview' || activeTab === 'Query Analytics') && (
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
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
