import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HelpCircle,
  UploadCloud,
  FileText,
  Search,
  Layers,
  ShieldCheck,
  CheckCircle2,
  FileSearch,
  MessageSquareQuote,
  ThumbsUp,
  AlertTriangle,
  LifeBuoy,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export const HowToUse: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true
    return text.toLowerCase().includes(searchQuery.toLowerCase())
  }

  const workflowSteps = [
    {
      step: '1',
      title: 'Upload',
      subtitle: 'Knowledge Ingestion',
      icon: UploadCloud,
      desc: 'Upload organization support policies, PDFs, and documentation into the secure repository.',
      details: 'Files are validated, encrypted, and isolated by organization and role permissions.',
    },
    {
      step: '2',
      title: 'Index',
      subtitle: 'Recursive Chunking',
      icon: Layers,
      desc: 'Documents are structured into semantic chunks with lexical terms and page coordinates.',
      details: 'Generates searchable BM25 token indices and dense vector embeddings simultaneously.',
    },
    {
      step: '3',
      title: 'Ask',
      subtitle: 'Customer Inquiry',
      icon: MessageSquareQuote,
      desc: 'Users type natural questions or attach specific documents in the AI Assistant chat.',
      details: 'Queries are normalized and analyzed for user intent, topics, and domain vocabulary.',
    },
    {
      step: '4',
      title: 'Retrieve',
      subtitle: 'Hybrid RRF Search',
      icon: FileSearch,
      desc: 'Combines exact keyword search and semantic retrieval fused via Reciprocal Rank Fusion.',
      details: 'Retrieves the top 4 highest-relevance evidence passages without fabricating context.',
    },
    {
      step: '5',
      title: 'Verify',
      subtitle: 'Intent & Evidence Check',
      icon: ShieldCheck,
      desc: 'Confirms that candidate passages actually match query intent before generating tokens.',
      details: 'If no relevant evidence exists, the system safely abstains with 0 false citations.',
    },
    {
      step: '6',
      title: 'Answer',
      subtitle: 'Grounded Generation',
      icon: Sparkles,
      desc: 'LoRA/QLoRA adapted neural model generates concise answers restricted to verified evidence.',
      details: 'Claims are audited post-generation to compute real mathematical reliability scores.',
    },
    {
      step: '7',
      title: 'Feedback',
      subtitle: 'Continuous QA',
      icon: ThumbsUp,
      desc: 'Users mark answers as Helpful (👍) or Not Helpful (👎) with structured reasons.',
      details: 'Stored in SQLite and surfaced in operational analytics for continuous quality monitoring.',
    },
  ]

  const faqs = [
    {
      q: 'Why does SupportIQ sometimes refuse to answer?',
      a: 'SupportIQ enforces a strict "Safe Abstention" policy. If your query asks about a topic not covered by uploaded support documents, the system refuses to guess or invent facts. Instead, it provides an honest refusal and allows 1-click escalation to human support agents.',
    },
    {
      q: 'What is the difference between LoRA and QLoRA models in the chat selector?',
      a: 'Both models are fine-tuned versions of Qwen2.5-0.5B-Instruct adapted to customer support documents. SupportIQ LoRA operates in FP16 precision for ultra-low latency. SupportIQ QLoRA uses 4-bit NormalFloat4 (NF4) double quantization, requiring under 1.4 GB VRAM while maintaining identical answer accuracy.',
    },
    {
      q: 'How are citations and match percentages calculated?',
      a: 'Each citation displays the source document, page number, and similarity score. SupportIQ isolates exact passage quotes and maps verified claims back to the specific document chunk where the facts originate.',
    },
    {
      q: 'What does the Reliability badge mean?',
      a: 'The Reliability badge reflects the percentage of claims in the generated answer that are directly verified by retrieved document evidence. High reliability (>=70%) means all primary statements have direct evidence backing. Low reliability triggers an option to escalate to a human agent.',
    },
    {
      q: 'How do I submit feedback for an answer?',
      a: 'At the bottom of every completed assistant answer, click 👍 (Helpful) or 👎 (Not Helpful). For negative feedback, select a reason (e.g., "Answer is incomplete" or "Citation is incorrect") and optionally provide details to help support leads audit model responses.',
    },
    {
      q: 'Can other users see my private documents or conversations?',
      a: 'No. SupportIQ implements strict tenant document isolation and role-based access control. Private documents and conversations are only accessible to their owner and designated administrators.',
    },
  ]

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">How to Use SupportIQ</h1>
            <p className="text-sm text-slate-400">
              Guide to the Retrieval-Augmented Generation workflow, answer verification, citations, and feedback.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/chat"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition"
          >
            <span>Open AI Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/documents"
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition"
          >
            Upload Documents
          </Link>
        </div>
      </div>

      {/* Visual Workflow Stepper */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              The SupportIQ Verification Pipeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every customer query follows a closed-loop verified lifecycle from document ingestion to continuous feedback.
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
            Retrieve → Verify → Resolve
          </span>
        </div>

        {/* Horizontal Step Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
          {workflowSteps.map((ws, idx) => {
            const Icon = ws.icon
            const isSelected = activeWorkflowStep === idx
            return (
              <button
                key={ws.step}
                type="button"
                onClick={() => setActiveWorkflowStep(idx)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/40 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    0{ws.step}
                  </span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {ws.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{ws.subtitle}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Step Explanation Card */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-900/40 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-cyan-400 uppercase tracking-wider text-[11px]">
                Stage {activeWorkflowStep + 1}: {workflowSteps[activeWorkflowStep].title} — {workflowSteps[activeWorkflowStep].subtitle}
              </span>
            </div>
            <p className="text-slate-300">{workflowSteps[activeWorkflowStep].desc}</p>
            <p className="text-slate-400 text-[11px]">{workflowSteps[activeWorkflowStep].details}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={activeWorkflowStep === 0}
              onClick={() => setActiveWorkflowStep((prev) => Math.max(0, prev - 1))}
              className="px-2.5 py-1 text-[11px] rounded bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={activeWorkflowStep === workflowSteps.length - 1}
              onClick={() => setActiveWorkflowStep((prev) => Math.min(workflowSteps.length - 1, prev + 1))}
              className="px-2.5 py-1 text-[11px] rounded bg-cyan-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-500"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Operating Guide Header & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-lg font-bold text-slate-100">SupportIQ Knowledge & Operating Guide</h2>
          <p className="text-xs text-slate-400">Detailed reference for all 12 key operations and system behaviors</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help topics..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* 12 Detailed Topic Cards in 3x4 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          {
            title: '1. What is SupportIQ?',
            icon: HelpCircle,
            color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
            desc: 'SupportIQ is an enterprise customer support intelligence platform. It uses Retrieval-Augmented Generation (RAG) combined with domain-adapted parameter-efficient fine-tuning (PEFT LoRA and QLoRA on Qwen2.5-0.5B-Instruct) to deliver truthful answers directly grounded in approved organizational documentation.',
            tag: 'Truthful AI • Zero Fabrications',
          },
          {
            title: '2. Asking Questions',
            icon: MessageSquareQuote,
            color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            desc: 'Open the AI Assistant from the sidebar. Enter your inquiry in plain English (e.g., "What is the annual subscription refund window?"). You can also attach a specific PDF or document directly to the message to limit retrieval specifically to that document.',
            tag: 'Natural Language • Attachment Support',
          },
          {
            title: '3. Uploading Documents',
            icon: UploadCloud,
            color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
            desc: 'Navigate to Documents or Knowledge Base. Click "Upload Document" and select PDF, TXT, or markdown files. Assign a relevant category (Policy, Technical, Billing, etc.). SupportIQ extracts and parses all text while retaining page numbers.',
            tag: 'PDF & Text Parsing • Metadata Tagging',
          },
          {
            title: '4. Chunking & Indexing',
            icon: Layers,
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            desc: 'Documents are partitioned into overlapping 400-token chunks with 50-token sliding windows. This preserves contextual boundary sentences. Each chunk is indexed with BM25 lexical frequencies, token n-grams, and semantic embeddings for fast retrieval.',
            tag: 'Recursive Chunking • BM25 + Embeddings',
          },
          {
            title: '5. Hybrid Retrieval & RRF',
            icon: Search,
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            desc: 'Standard search relies solely on keywords or semantic similarity. SupportIQ executes both in parallel and reconciles results using Reciprocal Rank Fusion (RRF). This guarantees that exact policy names, clauses, and synonyms are all retrieved accurately.',
            tag: 'Lexical + Semantic • Reciprocal Rank Fusion',
          },
          {
            title: '6. Grounding & Claims',
            icon: ShieldCheck,
            color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
            desc: 'SupportIQ decomposes generated responses into individual factual claims. Each claim is verified against retrieved source passages. If an answer contains unsupported assertions, its confidence score is degraded and the user is warned.',
            tag: 'Factual Decomposition • Claim Verification',
          },
          {
            title: '7. Source Citations',
            icon: FileText,
            color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
            desc: 'Every factual answer displays citation cards indicating the document name, page number, and similarity score. Click "Open Evidence Viewer" to inspect the exact highlighted paragraph within the original document context.',
            tag: 'Document Name • Page Coordinate • Quote',
          },
          {
            title: '8. Reliability Scores',
            icon: CheckCircle2,
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            desc: 'Each response features a live Reliability badge: High (70%+): Full evidence alignment across all claims; Medium (40-69%): Partial evidence coverage; Low (<40%): Incomplete evidence; review before sharing.',
            tag: 'Traceable Metrics • Visual Confidence',
          },
          {
            title: '9. Safe Abstention',
            icon: AlertTriangle,
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            desc: 'When documents do not contain evidence for a question, SupportIQ safely refuses: "No relevant information was found in your knowledge base." This prevents hallucinations. You can click "Escalate to Human Agent" to automatically create a support ticket.',
            tag: 'Zero Hallucinations • Ticket Escalation',
          },
          {
            title: '10. Like & Dislike Feedback',
            icon: ThumbsUp,
            color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
            desc: 'Rate answers directly with 👍 (Helpful) or 👎 (Not Helpful). For unhelpful answers, select a reason (e.g., "Answer is incomplete" or "Citation is incorrect"). Feedback is stored in the database to help administrators identify documentation gaps.',
            tag: 'Message-Level Ratings • Categorized Reasons',
          },
          {
            title: '11. Escalations & Tickets',
            icon: LifeBuoy,
            color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
            desc: 'If an answer is unclear or your question requires human review, click "Escalate to Agent". SupportIQ bundles the customer question, AI response, retrieved passages, and failure status directly into a tracked ticket in the Support Tickets queue.',
            tag: 'Seamless Handoff • Full Context History',
          },
          {
            title: '12. Troubleshooting & FAQs',
            icon: AlertTriangle,
            color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            desc: 'If you receive unexpected results, check that your document has finished indexing. Use specific keywords rather than single generic words. You can also switch models using the model selector dropdown in the chat header to test different generation speeds.',
            tag: 'Model Switching • Query Refinement',
          },
        ]
          .filter((t) => matchesSearch(t.title + ' ' + t.desc + ' ' + t.tag))
          .map((topic) => {
            const Icon = topic.icon
            return (
              <div
                key={topic.title}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${topic.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">{topic.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{topic.desc}</p>
                </div>
                <div className="text-[11px] text-cyan-400/90 font-medium pt-2 border-t border-slate-800/60">
                  {topic.tag}
                </div>
              </div>
            )
          })}
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <h2 className="text-base font-bold text-slate-100">Frequently Asked Questions</h2>
        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-900/60 transition"
                  aria-expanded={isOpen}
                >
                  <span className="text-xs font-semibold text-slate-200">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default HowToUse
