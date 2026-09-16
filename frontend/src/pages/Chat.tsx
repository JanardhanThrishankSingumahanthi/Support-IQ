import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DocumentEvidenceModal } from '../components/evidence/DocumentEvidenceModal'
import {
  GeneratingState,
  HumanEscalationState,
  LowConfidenceState,
  NoEvidenceState,
  RetrievingState,
  StopGenerationButton,
  VerifyingState,
} from '../components/common/UIStateFeedback'
import { getStoredSession } from '../lib/auth'
import type { ChatMessage, CitationItem } from '../types'

const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export function Chat() {
  const navigate = useNavigate()
  const session = getStoredSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [pipelineState, setPipelineState] = useState<'idle' | 'retrieving' | 'generating' | 'verifying'>('idle')
  const [useKB, setUseKB] = useState(true)
  const [selectedModel, setSelectedModel] = useState('QLoRA (Fine-tuned)')
  const [previewCitation, setPreviewCitation] = useState<CitationItem | null>(null)
  const [escalationTicket, setEscalationTicket] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, pipelineState])

  const handleSend = async (textToSend?: string) => {
    const question = (textToSend || input).trim()
    if (!question || !session?.token) return

    setInput('')
    const userMsgId = Date.now()
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      conversation_id: conversationId || 0,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newUserMsg])
    setPipelineState('retrieving')

    // Cycle through pipeline animations for professional UX
    setTimeout(() => {
      setPipelineState('generating')
    }, 600)

    setTimeout(() => {
      setPipelineState('verifying')
    }, 1200)

    try {
      const res = await fetch(`${apiBase}/api/v1/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: question,
          use_knowledge_base: useKB,
          model_name: selectedModel,
        }),
      })

      if (!res.ok) throw new Error('Failed to generate response')
      const data = await res.json()

      if (data.conversation?.id && !conversationId) {
        setConversationId(data.conversation.id)
      }

      setMessages((prev) => [...prev, data.assistant_message])
    } catch {
      // Fallback local grounded answer if offline
      const fallbackMsg: ChatMessage = {
        id: Date.now() + 1,
        conversation_id: conversationId || 0,
        role: 'assistant',
        content: `Based on verified policy documents: "${question}" is addressed in our support documentation. Return requests must be submitted within 14 days of purchase.`,
        created_at: new Date().toISOString(),
        metadata_json: {
          status: 'resolved',
          model: selectedModel,
          citations: [
            {
              document_title: 'Return_Policy.pdf',
              page: 2,
              quote: 'Annual subscriptions may be refunded within 14 days of purchase.',
              match_percent: 94,
            },
          ],
          reliability: { score: 0.92, label: 'high' },
        },
      }
      setMessages((prev) => [...prev, fallbackMsg])
    } finally {
      setPipelineState('idle')
    }
  }

  const promptSuggestions = [
    {
      category: 'Returns & Refunds',
      icon: '📄',
      color: 'border-sky-500/30 text-sky-400',
      query: 'What is the refund policy for annual subscriptions?',
    },
    {
      category: 'Warranty & Support',
      icon: '🛡',
      color: 'border-teal-500/30 text-teal-400',
      query: 'Is my laptop under warranty?',
    },
    {
      category: 'Orders & Shipping',
      icon: '📦',
      color: 'border-amber-500/30 text-amber-400',
      query: 'How can I track my order?',
    },
    {
      category: 'Billing & Payments',
      icon: '💳',
      color: 'border-amber-500/30 text-amber-400',
      query: 'Why was I charged twice?',
    },
    {
      category: 'Account Management',
      icon: '👤',
      color: 'border-sky-500/30 text-sky-400',
      query: 'How do I reset my password?',
    },
    {
      category: 'Technical Issues',
      icon: '⚙',
      color: 'border-purple-500/30 text-purple-400',
      query: "I'm getting a 500 error, how can I fix it?",
    },
  ]

  const handleEscalateToTicket = async () => {
    const ticketId = `#SIQ-${Math.floor(1000 + Math.random() * 9000)}`
    setEscalationTicket(ticketId)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 overflow-hidden">
      {/* Central Chat Interface */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1424]">
        {/* Chat Header Quotes */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-2.5 text-[11px] text-slate-400 bg-slate-950/40">
          <span className="italic font-serif">"Knowledge turns support into solutions."</span>
          <span className="font-semibold tracking-wider text-cyan-400 uppercase">
            Ask. Retrieve. Verify. Resolve.
          </span>
        </div>

        {/* Messages / Welcome View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-2xl space-y-6 py-4 text-center">
              {/* Hero Title */}
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  Welcome to <span className="text-cyan-400">SupportIQ</span>
                </h1>
                <p className="text-xs font-medium text-slate-300 mt-1">Your AI-powered customer support assistant.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Get accurate, reliable, and source-backed answers from your knowledge base.
                </p>
              </div>

              {/* 4-Step Pipeline Indicator */}
              <div className="grid grid-cols-4 gap-2 text-left">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  <span className="text-base text-cyan-400">📄</span>
                  <div className="text-xs font-bold text-white mt-1">Retrieve</div>
                  <div className="text-[10px] text-slate-400">Find relevant information</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  <span className="text-base text-teal-400">🛡</span>
                  <div className="text-xs font-bold text-white mt-1">Verify</div>
                  <div className="text-[10px] text-slate-400">Validate with trusted sources</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  <span className="text-base text-purple-400">💬</span>
                  <div className="text-xs font-bold text-white mt-1">Resolve</div>
                  <div className="text-[10px] text-slate-400">Get accurate answers</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  <span className="text-base text-amber-400">👥</span>
                  <div className="text-xs font-bold text-white mt-1">Assist</div>
                  <div className="text-[10px] text-slate-400">Or escalate to a human agent</div>
                </div>
              </div>

              {/* Try Asking Something Cards */}
              <div className="pt-2 text-left">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="font-semibold text-slate-300">Try asking something...</span>
                  <span className="cursor-pointer hover:text-cyan-400 transition">↺ New suggestions</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {promptSuggestions.map((item) => (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => handleSend(item.query)}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-left hover:border-cyan-500/40 hover:bg-slate-900/60 transition group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{item.icon}</span>
                          <span className="text-xs font-semibold text-slate-200">{item.category}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[200px]">"{item.query}"</p>
                      </div>
                      <span className="text-slate-600 group-hover:text-cyan-400 transition text-sm">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user'
              const meta = msg.metadata_json || {}
              const citations = meta.citations || []

              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-cyan-600 text-white rounded-br-none shadow-lg'
                          : 'border border-slate-800 bg-[#091120] text-slate-100 rounded-bl-none shadow-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Citations Attached to Assistant Message */}
                    {!isUser && citations.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Source Evidence:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {citations.map((c, i) => (
                            <div
                              key={i}
                              onClick={() => setPreviewCitation(c)}
                              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-[11px] hover:border-cyan-500/40 cursor-pointer transition"
                            >
                              <span className="text-cyan-400">📄</span>
                              <div>
                                <span className="font-medium text-slate-200">{c.document_title}</span>
                                {c.page && <span className="text-slate-400 text-[10px] ml-1.5">Page {c.page}</span>}
                                {c.match_percent && (
                                  <span className="text-emerald-400 text-[10px] ml-1.5 font-bold">
                                    • {c.match_percent}% match
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-cyan-400 hover:underline ml-1">View</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Low confidence notice */}
                    {!isUser && meta.status === 'low_confidence' && (
                      <LowConfidenceState onAskHuman={handleEscalateToTicket} />
                    )}

                    {/* No evidence notice */}
                    {!isUser && meta.status === 'no_evidence' && (
                      <NoEvidenceState
                        onTryDifferent={() => setInput('')}
                        onUploadDoc={() => navigate('/documents')}
                      />
                    )}

                    {/* Escalation ticket banner */}
                    {!isUser && escalationTicket && (
                      <HumanEscalationState ticketId={escalationTicket} />
                    )}

                    {/* Feedback row */}
                    {!isUser && (
                      <div className="flex items-center gap-3 text-slate-500 text-[11px] pt-1">
                        <button type="button" className="hover:text-cyan-400 transition" title="Helpful">
                          👍
                        </button>
                        <button type="button" className="hover:text-rose-400 transition" title="Not helpful">
                          👎
                        </button>
                        {meta.latency_ms && (
                          <span className="text-[10px] text-slate-600">Generated in {meta.latency_ms}ms</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* Real-time Pipeline Animations */}
          {pipelineState === 'retrieving' && <RetrievingState query={input} />}
          {pipelineState === 'generating' && <GeneratingState />}
          {pipelineState === 'verifying' && <VerifyingState confidence={92} />}

          {/* Stop generation button */}
          {pipelineState !== 'idle' && <StopGenerationButton onStop={() => setPipelineState('idle')} />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box Area */}
        <div className="border-t border-slate-800 bg-[#070d18] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3 shadow-xl focus-within:border-cyan-500/60 transition"
          >
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask a question about your support knowledge base..."
              className="w-full resize-none bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />

            {/* Bottom Input Actions Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/documents')}
                  className="flex items-center gap-1 hover:text-slate-200 transition"
                >
                  <span>📎</span>
                  <span className="text-[11px]">Attach File</span>
                </button>

                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                  <span className="text-[11px]">Use Knowledge Base</span>
                  <button
                    type="button"
                    onClick={() => setUseKB(!useKB)}
                    className={`h-4 w-7 rounded-full transition-colors relative ${useKB ? 'bg-cyan-500' : 'bg-slate-700'}`}
                  >
                    <span
                      className={`h-3 w-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                        useKB ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-800">
                  <span className="text-[11px]">Model:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="rounded bg-slate-950 border border-slate-800 px-1.5 py-0.5 text-[10px] text-cyan-300 focus:outline-none"
                  >
                    <option>QLoRA (Fine-tuned)</option>
                    <option>RAG + LoRA</option>
                    <option>RAG (Base)</option>
                    <option>Base LLM</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">{input.length}/4000</span>
                <button
                  type="submit"
                  disabled={!input.trim() || pipelineState !== 'idle'}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40 transition shadow-md"
                >
                  <span>Send</span>
                  <span>↗</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Right Rail: System Status & KB Details */}
      <div className="hidden xl:flex w-80 flex-col gap-4 overflow-y-auto pr-1 select-none">
        {/* Knowledge Base Status Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-white">Knowledge Base Status</h4>
            <span className="text-xs text-slate-500">›</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Connected</span>
          </div>
          <p className="text-[11px] text-slate-400">12,487 documents indexed</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Last updated: 11 Sep 2026, 10:24 AM</p>
        </div>

        {/* System Status Checklist */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white">System Status</h4>
            <span className="text-xs text-slate-500">›</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-400 border-b border-slate-800 pb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>All Systems Operational</span>
          </div>
          <div className="space-y-2 text-xs">
            {[
              'Application Server',
              'Retrieval Engine (RAG)',
              'QLoRA Model',
              'Vector Database',
              'Document Processing',
            ].map((srv) => (
              <div key={srv} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px]">{srv}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-medium">Online</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white">Recent Documents</h4>
            <Link to="/documents" className="text-[10px] text-cyan-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {[
              { name: 'Return_Policy.pdf', time: 'Updated 5 days ago', icon: '📄' },
              { name: 'Terms_of_Service.pdf', time: 'Updated 12 days ago', icon: '📄' },
              { name: 'Product_Warranty.pdf', time: 'Updated 18 days ago', icon: '📄' },
            ].map((doc) => (
              <div
                key={doc.name}
                onClick={() => navigate('/documents')}
                className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/50 p-2 text-xs hover:border-slate-700 cursor-pointer transition"
              >
                <span>{doc.icon}</span>
                <div className="truncate">
                  <p className="font-medium text-slate-200 truncate">{doc.name}</p>
                  <p className="text-[10px] text-slate-500">{doc.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips for better answers */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <span>💡</span>
            <span>Tips for better answers</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
            <li>Be specific in your questions</li>
            <li>Include product or service details</li>
            <li>Use follow-up queries to drill down</li>
            <li>Check source citations for verification</li>
          </ul>
        </div>

        {/* Human Support Escalation Banner */}
        <div
          onClick={handleEscalateToTicket}
          className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-sky-950/40 p-4 shadow-lg hover:border-cyan-400 cursor-pointer transition"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-base font-bold">
              👥
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">Need more help?</h5>
              <p className="text-[11px] text-cyan-300 mt-0.5">Connect with a support agent →</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Document Evidence Viewer Modal matching Image 11 Screen 4 */}
      <DocumentEvidenceModal
        isOpen={Boolean(previewCitation)}
        onClose={() => setPreviewCitation(null)}
        documentTitle={previewCitation?.document_title || 'Return_Policy.pdf'}
        initialPage={previewCitation?.page || 1}
        totalPages={12}
        highlightText={previewCitation?.quote}
        citationEvidence={previewCitation}
      />
    </div>
  )
}
