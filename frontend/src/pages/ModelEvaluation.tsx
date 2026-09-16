import { useState } from 'react'
import { DonutGauge, GroupedBarChart } from '../components/charts/Charts'

export function ModelEvaluation() {
  const [activeTab, setActiveTab] = useState('Overview')

  const comparisonMetrics = [
    {
      category: 'Accuracy',
      values: { base_llm: 52, rag_base: 68, lora: 71, qlora: 78, rag_lora: 84, rag_qlora: 92 },
    },
    {
      category: 'Faithfulness',
      values: { base_llm: 48, rag_base: 72, lora: 76, qlora: 82, rag_lora: 88, rag_qlora: 94 },
    },
    {
      category: 'Recall@5',
      values: { base_llm: 41, rag_base: 67, lora: 70, qlora: 79, rag_lora: 86, rag_qlora: 91 },
    },
    {
      category: 'MRR',
      values: { base_llm: 42, rag_base: 68, lora: 71, qlora: 78, rag_lora: 84, rag_qlora: 89 },
    },
    {
      category: 'Hallucination',
      values: { base_llm: 18, rag_base: 12, lora: 10, qlora: 8, rag_lora: 6, rag_qlora: 4.6 },
    },
    {
      category: 'Latency (s)',
      values: { base_llm: 12, rag_base: 19, lora: 21, qlora: 17, rag_lora: 18, rag_qlora: 18 },
    },
  ]

  const leaderboard = [
    {
      rank: 1,
      name: 'RAG + QLoRA (Proposed)',
      score: '92%',
      desc: 'Our fine-tuned model with retrieval and 4-bit quantization',
      color: 'bg-cyan-500',
    },
    {
      rank: 2,
      name: 'RAG + LoRA',
      score: '84%',
      desc: 'Retrieval with LoRA fine-tuning',
      color: 'bg-emerald-500',
    },
    {
      rank: 3,
      name: 'QLoRA',
      score: '78%',
      desc: '4-bit quantized fine-tuned model',
      color: 'bg-amber-500',
    },
    {
      rank: 4,
      name: 'LoRA',
      score: '71%',
      desc: 'Fine-tuned model (standard)',
      color: 'bg-purple-500',
    },
    {
      rank: 5,
      name: 'RAG (Base)',
      score: '68%',
      desc: 'Retrieval with base model',
      color: 'bg-sky-500',
    },
    {
      rank: 6,
      name: 'Base LLM',
      score: '52%',
      desc: 'Original pre-trained model without retrieval',
      color: 'bg-slate-600',
    },
  ]

  const tableResults = [
    {
      model: 'Base LLM',
      acc: '52%',
      faith: '48%',
      recall: '41%',
      mrr: '0.42',
      halluc: '18%',
      resp: '1.2s',
      gpu: '7.1 GB',
      params: '7B',
      isProposed: false,
    },
    {
      model: 'RAG (Base)',
      acc: '68%',
      faith: '72%',
      recall: '67%',
      mrr: '0.68',
      halluc: '12%',
      resp: '1.9s',
      gpu: '7.3 GB',
      params: '7B',
      isProposed: false,
    },
    {
      model: 'LoRA',
      acc: '71%',
      faith: '76%',
      recall: '70%',
      mrr: '0.71',
      halluc: '10%',
      resp: '2.1s',
      gpu: '7.5 GB',
      params: '7B + 8M',
      isProposed: false,
    },
    {
      model: 'QLoRA',
      acc: '78%',
      faith: '82%',
      recall: '79%',
      mrr: '0.78',
      halluc: '8%',
      resp: '1.7s',
      gpu: '4.2 GB',
      params: '7B + 8M (4-bit)',
      isProposed: false,
    },
    {
      model: 'RAG + LoRA',
      acc: '84%',
      faith: '88%',
      recall: '86%',
      mrr: '0.84',
      halluc: '6%',
      resp: '1.8s',
      gpu: '7.6 GB',
      params: '7B + 8M',
      isProposed: false,
    },
    {
      model: 'RAG + QLoRA (Proposed)',
      acc: '92%',
      faith: '94%',
      recall: '91%',
      mrr: '0.89',
      halluc: '4.6%',
      resp: '1.8s',
      gpu: '4.5 GB',
      params: '7B + 8M (4-bit)',
      isProposed: true,
    },
  ]

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title and Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 text-xl font-bold">
            ⚙
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Model Evaluation & Research</h1>
            <p className="text-xs text-slate-400">
              Analyze, compare, and measure the performance of different models and configurations for reliable customer support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
            Aug 1, 2026 - Sep 11, 2026
          </div>
          <button
            type="button"
            className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
          >
            Export Report
          </button>
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:brightness-110 transition"
          >
            + New Experiment
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        {['Overview', 'Model Comparison', 'Evaluation Results', 'Experiments', 'Ablation Study', 'Error Analysis', 'Reports'].map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-3.5 py-1.5 font-medium transition ${
                activeTab === tab
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* 6 Metric KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Test Queries</span>
            <span className="text-cyan-400">💬</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">500</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Customer support queries</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Accuracy</span>
            <span className="text-emerald-400">🛡</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">87.4%</div>
          <span className="text-[10px] text-emerald-400 mt-1 block">↑ 18.2% over base model</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hallucination Rate</span>
            <span className="text-rose-400">🎯</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-300">4.6%</div>
          <span className="text-[10px] text-emerald-400 mt-1 block">↓ 12.8% reduction</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg. Response Time</span>
            <span className="text-purple-400">⏱</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">1.8 s</div>
          <span className="text-[10px] text-slate-500 mt-1 block">+0.3s vs base model</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Documents Used</span>
            <span className="text-amber-400">📄</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">248</div>
          <span className="text-[10px] text-slate-500 mt-1 block">From knowledge base</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Experiments Run</span>
            <span className="text-sky-400">🧪</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">12</div>
          <span className="text-[10px] text-slate-500 mt-1 block">6 completed, 6 ongoing</span>
        </div>
      </div>

      {/* Performance Comparison & Model Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Performance Comparison Grouped Bars (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Performance Comparison</h3>
              <p className="text-[11px] text-slate-400">Comparison of different model configurations on key metrics</p>
            </div>
            <span className="text-xs text-cyan-400">Metric: Accuracy</span>
          </div>
          <GroupedBarChart metrics={comparisonMetrics} />
        </div>

        {/* Model Performance Leaderboard (1 col) */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h3 className="text-sm font-semibold text-white">🏆 Model Performance Summary</h3>
            <span className="text-xs text-cyan-400 cursor-pointer">View Details</span>
          </div>

          <div className="space-y-3 pt-1">
            {leaderboard.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    {item.rank}. {item.name}
                  </span>
                  <span className="font-bold text-white">{item.score}</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: item.score }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Evaluation Table & Experiment Status Donut */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Evaluation Table (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0c1424] overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Detailed Evaluation Results</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3 pl-4">Model</th>
                  <th className="p-3">Accuracy ↑</th>
                  <th className="p-3">Faithfulness ↑</th>
                  <th className="p-3">Recall@5 ↑</th>
                  <th className="p-3">MRR ↑</th>
                  <th className="p-3">Hallucination ↓</th>
                  <th className="p-3">Response Time ↓</th>
                  <th className="p-3">GPU Memory</th>
                  <th className="p-3 pr-4">Parameters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {tableResults.map((row) => (
                  <tr
                    key={row.model}
                    className={`hover:bg-slate-900/60 transition ${
                      row.isProposed ? 'bg-cyan-500/10 font-semibold border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <td className="p-3 pl-4 font-sans font-medium text-white">{row.model}</td>
                    <td className="p-3 text-cyan-300">{row.acc}</td>
                    <td className="p-3 text-emerald-300">{row.faith}</td>
                    <td className="p-3">{row.recall}</td>
                    <td className="p-3">{row.mrr}</td>
                    <td className="p-3 text-rose-300">{row.halluc}</td>
                    <td className="p-3">{row.resp}</td>
                    <td className="p-3">{row.gpu}</td>
                    <td className="p-3 pr-4 font-sans text-slate-400">{row.params}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Experiment Status Donut (1 col) */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Experiment Status</h3>
            <span className="text-xs text-cyan-400">View All</span>
          </div>
          <div className="my-auto py-2">
            <DonutGauge percentage={50} size={130} color="#10b981" valueText="12" label="Total" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800 pt-3 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>6 Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>3 Running</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              <span>2 Queued</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <span>1 Failed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Insights & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Key Insights (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-400 text-sm">💡</span>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Key Insights</h4>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>RAG + QLoRA achieves 40% higher accuracy compared to base LLM.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>Hallucination rate reduced by 74% (18% → 4.6%).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>QLoRA reduces GPU memory usage by 41% compared to full fine-tuning.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-400">•</span>
              <span>Retrieval significantly improves faithfulness and factual consistency.</span>
            </li>
          </ul>
        </div>

        {/* Quick Actions (1 col) */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 hover:border-cyan-500/40 text-left transition"
            >
              <span className="text-cyan-400 block mb-1">➕</span>
              <span className="font-semibold text-slate-200">New Experiment</span>
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 hover:border-cyan-500/40 text-left transition"
            >
              <span className="text-purple-400 block mb-1">⚖</span>
              <span className="font-semibold text-slate-200">Compare Models</span>
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 hover:border-cyan-500/40 text-left transition"
            >
              <span className="text-emerald-400 block mb-1">⬇</span>
              <span className="font-semibold text-slate-200">Export Results</span>
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 hover:border-cyan-500/40 text-left transition"
            >
              <span className="text-sky-400 block mb-1">📖</span>
              <span className="font-semibold text-slate-200">Research Paper</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
