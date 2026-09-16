import React, { useState } from 'react';
import { GroupedBarChart } from '../components/charts/Charts';
import {
  FlaskConical, CheckCircle2, Clock, XCircle, RefreshCw,
  TrendingUp, Sparkles, Play, HardDrive, Cpu,
  Download, FileSpreadsheet, Share2, FileText, ChevronRight,
  BarChart3, Copy, MoreHorizontal, ArrowUpRight
} from 'lucide-react';

interface Experiment {
  id: number;
  name: string;
  modelType: string;
  dataset: string;
  status: 'Completed' | 'Running' | 'Queued' | 'Failed';
  startedOn: string;
  duration: string;
}

const INITIAL_EXPERIMENTS: Experiment[] = [
  { id: 1, name: 'RAG + QLoRA (Proposed)', modelType: 'RAG + QLoRA', dataset: 'SupportQA v1', status: 'Completed', startedOn: '11 Sep 2026', duration: '2h 14m' },
  { id: 2, name: 'RAG + LoRA', modelType: 'RAG + LoRA', dataset: 'SupportQA v1', status: 'Completed', startedOn: '9 Sep 2026', duration: '2h 37m' },
  { id: 3, name: 'QLoRA (Fine-tuned)', modelType: 'QLoRA', dataset: 'SupportQA v1', status: 'Completed', startedOn: '7 Sep 2026', duration: '1h 56m' },
  { id: 4, name: 'LoRA (Fine-tuned)', modelType: 'LoRA', dataset: 'SupportQA v1', status: 'Completed', startedOn: '5 Sep 2026', duration: '2h 03m' },
  { id: 5, name: 'RAG (Base)', modelType: 'RAG', dataset: 'SupportQA v1', status: 'Completed', startedOn: '3 Sep 2026', duration: '1h 42m' },
  { id: 6, name: 'Base LLM', modelType: 'Base', dataset: 'SupportQA v1', status: 'Completed', startedOn: '1 Sep 2026', duration: '1h 18m' },
];

export const ExperimentCenter: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [experiments, setExperiments] = useState<Experiment[]>(INITIAL_EXPERIMENTS);
  const [activeTab, setActiveTab] = useState<'overview' | 'create'>('overview');

  // New experiment form state
  const [expName, setExpName] = useState('RAG + QLoRA (Customer Support v2)');
  const [modelType, setModelType] = useState('RAG + QLoRA (Fine-tuned)');
  const [baseModel, setBaseModel] = useState('Llama-3-8B-Instruct');
  const [dataset, setDataset] = useState('Customer Support QA Dataset');
  const [metrics, setMetrics] = useState(['Accuracy', 'Faithfulness', 'Recall@5', 'MRR']);
  const [isStarting, setIsStarting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  // Model comparison data matching Image 7 chart
  const comparisonSeries = [
    { name: 'Base LLM', color: '#475569', data: [52, 48, 41, 42, 18, 21] },
    { name: 'RAG (Base)', color: '#3b82f6', data: [68, 72, 67, 66, 12, 19] },
    { name: 'LoRA', color: '#a855f7', data: [71, 76, 70, 71, 10, 17] },
    { name: 'QLoRA', color: '#f59e0b', data: [78, 82, 79, 78, 8, 15] },
    { name: 'RAG + LoRA', color: '#10b981', data: [84, 88, 86, 84, 6, 18] },
    { name: 'RAG + QLoRA (Proposed)', color: '#06b6d4', data: [92, 94, 91, 89, 4.6, 18] },
  ];

  const categories = ['Accuracy (%)', 'Faithfulness (%)', 'Recall@5 (%)', 'MRR (x100)', 'Hallucination (%)', 'Response Time (0.1s)'];

  const handleStartExperiment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsStarting(true);
    setTimeout(() => {
      setIsStarting(false);
      setSuccessBanner(true);
      const newExp: Experiment = {
        id: experiments.length + 1,
        name: expName,
        modelType: modelType.includes('QLoRA') ? 'RAG + QLoRA' : 'LoRA',
        dataset: 'SupportQA v2',
        status: 'Running',
        startedOn: 'Just now',
        duration: '1m',
      };
      setExperiments([newExp, ...experiments]);
      setTimeout(() => setSuccessBanner(false), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Header matching Image 7 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Experiment Center</h1>
            <p className="text-sm text-slate-400">
              Run experiments, compare models, and evaluate performance to build a better support assistant.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center gap-2 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Experiment Guide
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'create' ? 'overview' : 'create')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            + New Experiment
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Experiment <strong>"{expName}"</strong> has been queued and started training on GPU cluster node-02.</span>
          </div>
          <button onClick={() => setSuccessBanner(false)} className="text-slate-400 hover:text-slate-200">Dismiss</button>
        </div>
      )}

      {/* 5 Stats Cards matching Image 7 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Total Experiments</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <FlaskConical className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">12</div>
          <div className="text-[11px] text-cyan-400 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            +3 this month
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">8</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">66.7% success rate</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Running</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 animate-spin">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-400">2</div>
          <div className="text-[11px] text-cyan-400/80 mt-1">In progress</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Queued</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400">1</div>
          <div className="text-[11px] text-slate-400 mt-1">Waiting to start</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Failed</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400">1</div>
          <div className="text-[11px] text-rose-400/80 mt-1">8.3% failure rate</div>
        </div>
      </div>

      {/* Main Grid: Performance Comparison & Create Form / Current Run */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Compare Model Performance Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-100">Compare Model Performance</h2>
                <p className="text-xs text-slate-400">Evaluate different models and configurations on customer support dataset.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Metric:</span>
                <select 
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Metrics</option>
                  <option value="accuracy">Accuracy & Faithfulness</option>
                  <option value="recall">Recall & MRR</option>
                  <option value="latency">Hallucination & Response Time</option>
                </select>
              </div>
            </div>

            {/* Custom SVG Grouped Bar Chart */}
            <div className="h-64 my-2">
              <GroupedBarChart 
                categories={categories}
                series={comparisonSeries}
                height={240}
              />
            </div>
          </div>

          {/* Chart Legend matching Image 7 */}
          <div className="pt-4 border-t border-slate-800/60 grid grid-cols-3 sm:grid-cols-6 gap-2 text-[11px]">
            {comparisonSeries.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-slate-300 truncate">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Create New Experiment or Current Run Monitor */}
        <div className="space-y-6">
          {/* Create New Experiment Card */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Create New Experiment</h3>
                <p className="text-[11px] text-slate-400">Configure and run a new model experiment.</p>
              </div>
            </div>

            <form onSubmit={handleStartExperiment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Experiment Name</label>
                <input
                  type="text"
                  value={expName}
                  onChange={(e) => setExpName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                  placeholder="e.g. RAG + QLoRA (Customer Support v1)"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Model Type</label>
                  <select
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option>RAG + QLoRA (Fine-tuned)</option>
                    <option>RAG + LoRA</option>
                    <option>QLoRA Only</option>
                    <option>LoRA Only</option>
                    <option>RAG Baseline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Base Model</label>
                  <select
                    value={baseModel}
                    onChange={(e) => setBaseModel(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option>Llama-3-8B-Instruct</option>
                    <option>Mistral-7B-Instruct-v0.3</option>
                    <option>Qwen2.5-7B-Instruct</option>
                    <option>Gemma-2-9B-IT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Dataset</label>
                <select
                  value={dataset}
                  onChange={(e) => setDataset(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option>Customer Support QA Dataset (SupportQA v1)</option>
                  <option>E-Commerce Telemetry & Refunds (v2.1)</option>
                  <option>Technical IT Tickets Benchmark (v1.0)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Evaluation Metrics</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Accuracy', 'Faithfulness', 'Recall@5', 'MRR', 'BLEU', 'ROUGE-L'].map((metric) => {
                    const active = metrics.includes(metric);
                    return (
                      <button
                        key={metric}
                        type="button"
                        onClick={() => {
                          if (active) setMetrics(metrics.filter(m => m !== metric));
                          else setMetrics([...metrics, metric]);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                          active 
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {metric} {active ? '×' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isStarting}
                  className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isStarting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Provisioning Cluster & Dataset...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Start Experiment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Current Experiment Run Monitor matching Image 7 */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">Current Experiment Run</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                  Running
                </span>
              </div>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5">
                View Details <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            <div className="text-xs text-slate-300 font-medium mb-1">RAG + QLoRA (Customer Support v1)</div>
            <div className="text-[11px] text-slate-500 mb-2">Epoch 2/3 · Step 1,200/1,800</div>

            {/* Progress Bar with 68% */}
            <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden relative">
              <div 
                className="bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500" 
                style={{ width: '68%' }} 
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-4 -mt-2">
              <span>Progress</span>
              <span className="font-semibold text-cyan-400">68%</span>
            </div>

            {/* Step Progression Checklist */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Loading dataset</span>
                </div>
                <span className="text-[11px] text-slate-500">2 min</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preprocessing & chunking</span>
                </div>
                <span className="text-[11px] text-slate-500">5 min</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Training (LoRA/QLoRA)</span>
                </div>
                <span className="text-[11px] text-slate-500">1h 12m</span>
              </div>

              <div className="flex items-center justify-between text-cyan-300">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span>Evaluating on test set</span>
                </div>
                <span className="text-[11px] text-cyan-400 font-medium">In progress</span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px]">5</div>
                  <span>Generating results</span>
                </div>
                <span className="text-[11px] text-slate-600">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Row 1: Recent Experiments Table matching Image 7 */}
      <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Recent Experiments</h3>
            <p className="text-xs text-slate-400">Historical runs and benchmark evaluations across model variants.</p>
          </div>
          <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2.5 font-medium">#</th>
                <th className="pb-2.5 font-medium">Experiment Name</th>
                <th className="pb-2.5 font-medium">Model Type</th>
                <th className="pb-2.5 font-medium">Dataset</th>
                <th className="pb-2.5 font-medium">Status</th>
                <th className="pb-2.5 font-medium">Started On</th>
                <th className="pb-2.5 font-medium">Duration</th>
                <th className="pb-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {experiments.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 text-slate-500 font-mono text-[11px]">{exp.id}</td>
                  <td className="py-3 font-medium text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    {exp.name}
                  </td>
                  <td className="py-3 text-slate-300 font-mono text-[11px]">{exp.modelType}</td>
                  <td className="py-3 text-slate-400">{exp.dataset}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      exp.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                      exp.status === 'Running' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 animate-pulse' :
                      exp.status === 'Queued' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                      'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">{exp.startedOn}</td>
                  <td className="py-3 text-slate-400 font-mono text-[11px]">{exp.duration}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2 text-slate-400">
                      <button title="View Performance Metrics" className="p-1 hover:text-cyan-400 transition-colors">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                      <button title="Clone Configuration" className="p-1 hover:text-purple-400 transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button title="More Options" className="p-1 hover:text-slate-200 transition-colors">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lower Row 2: Insights, Resource Usage & Export Cards matching Image 7 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Key Insights Card */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center gap-2 mb-3 text-amber-400">
            <span className="text-sm">💡</span>
            <h3 className="text-sm font-semibold text-slate-100">Key Insights</h3>
          </div>
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span><strong>RAG + QLoRA</strong> achieves 40% higher accuracy compared to base LLM.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>Hallucination rate reduced by <strong>74%</strong> (18% → 4.6%).</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>Response time remains under 2 seconds for optimized configurations.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>QLoRA reduces GPU memory usage by <strong>41%</strong> compared to full fine-tuning.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>RAG significantly improves faithfulness and factual consistency.</span>
            </div>
          </div>
        </div>

        {/* Resource Usage Card (RAG + QLoRA) */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-100">Resource Usage (RAG + QLoRA)</h3>
            <span className="text-[10px] text-cyan-400 font-mono">PEFT 4-bit</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>GPU Memory</span>
              </div>
              <div className="text-base font-bold text-slate-100">4.5 GB</div>
              <div className="text-[10px] text-emerald-400 font-medium">-41% vs LoRA</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <Clock className="w-3 h-3 text-purple-400" />
                <span>Training Time</span>
              </div>
              <div className="text-base font-bold text-slate-100">1h 48m</div>
              <div className="text-[10px] text-emerald-400 font-medium">-32% vs LoRA</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <HardDrive className="w-3 h-3 text-blue-400" />
                <span>Storage Used</span>
              </div>
              <div className="text-base font-bold text-slate-100">2.1 GB</div>
              <div className="text-[10px] text-slate-400">Adapters + Cache</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Inference Latency</span>
              </div>
              <div className="text-base font-bold text-slate-100">1.8 s</div>
              <div className="text-[10px] text-emerald-400 font-medium">-28% vs base</div>
            </div>
          </div>
        </div>

        {/* Export & Share Card */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1">Export & Share</h3>
            <p className="text-xs text-slate-400 mb-3">Distribute experimental telemetry and scientific findings.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => alert('Exporting raw experimental metrics to CSV...')}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2 text-xs text-slate-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-medium text-[11px]">Download Results</div>
                <div className="text-[9px] text-slate-400">(Excel/CSV)</div>
              </div>
            </button>

            <button 
              onClick={() => alert('Exporting high-resolution vector charts...')}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2 text-xs text-slate-200"
            >
              <Download className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="font-medium text-[11px]">Export Charts</div>
                <div className="text-[9px] text-slate-400">(PNG/PDF)</div>
              </div>
            </button>

            <button 
              onClick={() => alert('Generating academic research preprint report...')}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2 text-xs text-slate-200"
            >
              <FileText className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="font-medium text-[11px]">Generate Report</div>
                <div className="text-[9px] text-slate-400">(Research Paper)</div>
              </div>
            </button>

            <button 
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Experiment permalink copied to clipboard!');
              }}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2 text-xs text-slate-200"
            >
              <Share2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="font-medium text-[11px]">Share Experiment</div>
                <div className="text-[9px] text-slate-400">(Team/Link)</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
