import React, { useState } from 'react';
import { DonutGauge, LineTrendChart } from '../components/charts/Charts';
import {
  BarChart3, Calendar, Download, MessageSquare, CheckCircle2,
  Users, Star, Clock, ArrowUpRight, TrendingUp,
  FileText, AlertCircle, ChevronRight
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [dateRangeText] = useState('Aug 1, 2026 - Sep 11, 2026');

  // Chart data for Query Volume Trend
  const queryTrendLabels = ['Aug 1', 'Aug 5', 'Aug 8', 'Aug 12', 'Aug 15', 'Aug 19', 'Aug 22', 'Aug 26', 'Aug 29', 'Sep 2', 'Sep 5', 'Sep 8', 'Sep 11'];
  const queryTrendSeries = [
    { name: 'Total Queries', color: '#06b6d4', values: [95, 110, 135, 125, 155, 160, 198, 175, 190, 168, 185, 210, 220] },
    { name: 'Resolved by AI', color: '#10b981', values: [72, 85, 105, 98, 122, 130, 156, 140, 152, 136, 150, 172, 182] },
  ];

  // Category distribution
  const categories = [
    { name: 'Billing & Payments', percent: 28, color: '#06b6d4' },
    { name: 'Account Management', percent: 18, color: '#3b82f6' },
    { name: 'Technical Support', percent: 16, color: '#8b5cf6' },
    { name: 'Product Information', percent: 14, color: '#f59e0b' },
    { name: 'Refunds & Returns', percent: 12, color: '#ec4899' },
    { name: 'Troubleshooting', percent: 8, color: '#10b981' },
    { name: 'Others', percent: 4, color: '#64748b' },
  ];

  // Resolution status
  const resolutionBreakdown = [
    { name: 'AI Resolved', count: '1,452', percent: 79, color: '#10b981' },
    { name: 'Human Resolved', count: '240', percent: 13, color: '#8b5cf6' },
    { name: 'Unresolved', count: '92', percent: 5, color: '#ef4444' },
    { name: 'In Progress', count: '58', percent: 3, color: '#06b6d4' },
  ];

  // Top used documents
  const topDocuments = [
    { rank: 1, name: 'Return_Policy.pdf', uses: 324, percent: 18, color: '#ef4444' },
    { rank: 2, name: 'Terms_of_Service.pdf', uses: 298, percent: 16, color: '#8b5cf6' },
    { rank: 3, name: 'Product_Warranty.pdf', uses: 241, percent: 13, color: '#3b82f6' },
    { rank: 4, name: 'Payment_Guide.pdf', uses: 198, percent: 11, color: '#06b6d4' },
    { rank: 5, name: 'Account_Management.pdf', uses: 176, percent: 10, color: '#10b981' },
  ];

  // Query sources
  const querySources = [
    { name: 'Web Portal', count: 842, color: '#3b82f6', height: '84%' },
    { name: 'Mobile App', count: 412, color: '#8b5cf6', height: '41%' },
    { name: 'Email', count: 284, color: '#10b981', height: '28%' },
    { name: 'Chat Widget', count: 198, color: '#f59e0b', height: '20%' },
    { name: 'Others', count: 106, color: '#64748b', height: '11%' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner matching Image 8 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Analytics</h1>
            <p className="text-sm text-slate-400">
              Gain insights from customer interactions, system performance, and knowledge usage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateRangeText}</span>
          </div>

          <button
            onClick={() => alert('Generating PDF analytics summary report...')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs Row matching Image 8 */}
      <div className="flex items-center gap-1 border-b border-slate-800/80 overflow-x-auto pb-px">
        {[
          'Overview',
          'Query Analytics',
          'Resolution Analytics',
          'Customer Feedback',
          'Knowledge Base Usage',
          'Model Performance',
          'User Analytics'
        ].map((tab) => (
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

      {/* 5 KPI Cards matching Image 8 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Total Queries</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">1,842</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            +12% from last month
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
            <div className="text-2xl font-bold text-emerald-400">1,452</div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              79%
            </span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">↑ 15% from last month</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Escalated to Human</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-100">240</div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              13%
            </span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">↓ 5% from last month</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Customer Satisfaction</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">4.6 <span className="text-sm font-normal text-slate-400">/ 5</span></div>
          <div className="text-[11px] text-emerald-400 mt-1">↑ 0.3 from last month</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Avg. Response Time</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">2.1 s</div>
          <div className="text-[11px] text-emerald-400 mt-1">↓ 32% from last month</div>
        </div>
      </div>

      {/* Middle Row 1: Trend, Categories, Resolution Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Volume Trend */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Query Volume Trend</h2>
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-2 py-1 text-[11px] rounded bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none"
              >
                <option>Last 30 Days</option>
                <option>Last 14 Days</option>
                <option>Last 90 Days</option>
              </select>
            </div>
            <p className="text-xs text-slate-400 mb-4">Daily query count and resolution rate</p>

            {/* Interactive Tooltip Card overlay mockup */}
            <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-[11px] mb-3 flex items-center justify-between">
              <div className="font-semibold text-slate-200">Aug 22, 2026</div>
              <div className="flex items-center gap-3">
                <span className="text-cyan-400">Total: <strong>198</strong></span>
                <span className="text-emerald-400">Resolved: <strong>156</strong></span>
                <span className="text-rose-400">Escalated: <strong>28</strong></span>
              </div>
            </div>

            <LineTrendChart series={queryTrendSeries} labels={queryTrendLabels} height={140} />
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] pt-3 border-t border-slate-800/60 mt-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-0.5 bg-cyan-400" /> Total Queries
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-0.5 bg-emerald-400" /> Resolved by AI
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-0.5 bg-rose-400" /> Escalated to Human
            </span>
          </div>
        </div>

        {/* Query Categories Donut */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Query Categories</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5">
                View Details <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">Distribution of customer queries</p>

            <div className="flex justify-center my-2">
              <DonutGauge 
                value={1842} 
                max={1842} 
                size={140} 
                strokeWidth={14} 
                color="#06b6d4" 
                label="Total Queries" 
              />
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-800/60">
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span>{cat.name}</span>
                </div>
                <span className="font-medium text-slate-200">{cat.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resolution Rate Donut */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Resolution Rate</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5">
                View Details <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">AI vs Human resolution</p>

            <div className="flex justify-center my-2">
              <DonutGauge 
                value={79} 
                size={140} 
                strokeWidth={14} 
                color="#10b981" 
                label="AI Resolved (1,452)" 
              />
            </div>
          </div>

          <div className="space-y-2 text-[11px] pt-2 border-t border-slate-800/60">
            {resolutionBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-[10px]">{item.count}</span>
                  <span className="font-bold text-slate-200 w-8 text-right">{item.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row 2: CSAT, Response Time, Top Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Satisfaction Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Customer Satisfaction</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5">
                View Details <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Feedback from resolved queries</p>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Star className="w-8 h-8 fill-current" />
                <div className="text-3xl font-bold text-slate-100">4.6 <span className="text-sm font-normal text-slate-400">/ 5</span></div>
              </div>
              <div className="text-[11px] text-slate-400">
                <div>Based on <strong>892 ratings</strong></div>
                <div className="text-emerald-400 font-medium">↑ 0.3 from last month</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { stars: 5, percent: 62, color: '#10b981' },
                { stars: 4, percent: 24, color: '#06b6d4' },
                { stars: 3, percent: 9, color: '#f59e0b' },
                { stars: 2, percent: 3, color: '#f97316' },
                { stars: 1, percent: 2, color: '#ef4444' },
              ].map((row) => (
                <div key={row.stars} className="flex items-center gap-3 text-[11px]">
                  <span className="w-6 text-slate-400 flex items-center gap-0.5">
                    {row.stars} <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
                  </span>
                  <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ width: `${row.percent}%`, backgroundColor: row.color }} 
                    />
                  </div>
                  <span className="w-8 text-right font-medium text-slate-300">{row.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Response Time Analytics */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Response Time Analytics</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5">
                View Details <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">Average time to first response</p>

            <div className="text-2xl font-bold text-slate-100 mb-3">
              2.1 <span className="text-xs font-normal text-slate-400">seconds</span>
            </div>

            <LineTrendChart 
              series={[
                { name: 'AI Response Time', color: '#06b6d4', values: [3.2, 2.9, 2.7, 2.4, 2.2, 2.1, 1.8] },
                { name: 'Human Response Time', color: '#a855f7', values: [7.2, 6.8, 6.9, 6.4, 6.5, 6.2, 6.5] }
              ]}
              labels={['Aug 1', 'Aug 8', 'Aug 15', 'Aug 22', 'Aug 29', 'Sep 5', 'Sep 11']}
              height={140}
            />
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] pt-3 border-t border-slate-800/60">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-2.5 h-0.5 bg-cyan-400" /> AI Response Time (~1.8s)
            </span>
            <span className="flex items-center gap-1.5 text-purple-300">
              <span className="w-2.5 h-0.5 bg-purple-400" /> Human Response Time (~6.5s)
            </span>
          </div>
        </div>

        {/* Top Used Documents matching Image 8 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Top Used Documents</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Most referenced knowledge base documents</p>

            <div className="space-y-3 text-xs">
              {topDocuments.map((doc) => (
                <div key={doc.rank} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono">
                      {doc.rank}
                    </span>
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-200 text-xs font-mono">{doc.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-400 text-[11px]">{doc.uses} uses</span>
                    <div className="w-14 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-cyan-400 h-full rounded-full" 
                        style={{ width: `${doc.percent * 4}%` }} 
                      />
                    </div>
                    <span className="text-slate-300 font-medium text-[11px] w-7 text-right">{doc.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: AI vs Human Resolution, Query Sources, Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stacked Resolution Trend */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-100">AI vs Human Resolution Trend</h2>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-sm bg-emerald-400" /> AI
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-2 h-2 rounded-sm bg-purple-500" /> Human
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-4">Daily workload split across channels</p>

          <div className="h-44 flex items-end justify-between gap-1.5 px-2 pt-4">
            {[
              { day: 'Aug 1', ai: 70, human: 30 },
              { day: 'Aug 5', ai: 75, human: 25 },
              { day: 'Aug 8', ai: 80, human: 20 },
              { day: 'Aug 12', ai: 78, human: 22 },
              { day: 'Aug 15', ai: 84, human: 16 },
              { day: 'Aug 19', ai: 88, human: 12 },
              { day: 'Aug 22', ai: 85, human: 15 },
              { day: 'Aug 26', ai: 90, human: 10 },
              { day: 'Aug 29', ai: 92, human: 8 },
              { day: 'Sep 5', ai: 94, human: 6 },
              { day: 'Sep 11', ai: 95, human: 5 },
            ].map((col) => (
              <div key={col.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-32 rounded overflow-hidden bg-slate-800/50">
                  <div className="bg-purple-500/80 w-full" style={{ height: `${col.human}%` }} />
                  <div className="bg-emerald-500 w-full" style={{ height: `${col.ai}%` }} />
                </div>
                <span className="text-[9px] text-slate-500 truncate">{col.day.split(' ')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Query Sources Bar Chart */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-100">Query Sources</h2>
            <span className="text-[11px] text-slate-400">Total: 1,842</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Where queries are coming from</p>

          <div className="h-44 flex items-end justify-between gap-3 px-3 pt-2">
            {querySources.map((src) => (
              <div key={src.name} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[11px] font-semibold text-slate-200">{src.count}</span>
                <div 
                  className="w-full rounded-t transition-all"
                  style={{ height: src.height, backgroundColor: src.color }} 
                />
                <span className="text-[10px] text-slate-400 text-center leading-tight truncate w-full">
                  {src.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Insights matching Image 8 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">💡</span>
              <h2 className="text-sm font-semibold text-slate-100">Key Insights</h2>
            </div>
            <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5">
              View All <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">Telemetry findings and optimization recommendations</p>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span>Query volume increased by <strong>12%</strong> compared to last month.</span>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span>AI resolution rate improved by <strong>15%</strong> with the new model.</span>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span>Most frequent queries are related to <strong>Billing & Payments</strong>.</span>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span>Average response time reduced by <strong>32%</strong>.</span>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span>Customer satisfaction increased to <strong>4.6 / 5</strong>.</span>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-3 h-3" />
              </div>
              <span>Technical support queries show highest escalation rate (<strong>21%</strong>).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
