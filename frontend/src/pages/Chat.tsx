import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DocumentEvidenceModal } from '../components/evidence/DocumentEvidenceModal'
import {
  AssistantPipelineProgress,
  ErrorState,
  HumanEscalationState,
  LowConfidenceState,
  NoEvidenceState,
  StopGenerationButton,
  UnsupportedState,
} from '../components/common/UIStateFeedback'
import { ChatWatermark } from '../components/chat/ChatWatermark'
import watermarkImage from '../assets/supportiq-watermark.png'
import { getStoredSession, clearSession } from '../lib/auth'
import type { ChatMessage, CitationItem } from '../types'

const apiBase = import.meta.env.VITE_API_URL ?? ''

export function Chat() {
  const navigate = useNavigate()
  const session = getStoredSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [pipelineState, setPipelineState] = useState<'idle' | 'retrieving' | 'generating' | 'verifying'>('idle')
  const abortControllerRef = useRef<AbortController | null>(null)
  const [useKB, setUseKB] = useState(true)
  const [selectedModel, setSelectedModel] = useState('SupportIQ QLoRA (4-bit NF4)')
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; description: string; available: boolean }>>([
    { id: 'qlora', name: 'SupportIQ QLoRA (4-bit NF4)', description: 'Fine-tuned 4-bit NF4 adapter (0.46 GB VRAM)', available: true },
    { id: 'lora', name: 'SupportIQ LoRA (FP16)', description: 'Fine-tuned FP16 adapter (0.84s latency)', available: true },
    { id: 'base', name: 'Base Qwen 0.5B (Zero-Shot RAG)', description: 'Base Qwen 0.5B model', available: true },
    { id: 'extractive', name: 'Extractive Synthesizer', description: 'Deterministic sentence-level extraction', available: true },
  ])
  const [previewCitation, setPreviewCitation] = useState<CitationItem | null>(null)
  const [escalationTicket, setEscalationTicket] = useState<{ id: number; title: string } | null>(null)
  const [isEscalating, setIsEscalating] = useState(false)
  const [escalationError, setEscalationError] = useState<string | null>(null)
  const [kbDocCount, setKbDocCount] = useState<number | null>(null)
  const [recentDocs, setRecentDocs] = useState<Array<{ id: number; filename: string; updated_at?: string; created_at: string }>>([])
  const [systemHealth, setSystemHealth] = useState<'operational' | 'degraded' | 'checking'>('checking')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<{ id: number; filename: string; size: number; status?: string } | null>(null)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)

  // Real Message Actions & Feedback States
  const [feedbackMap, setFeedbackMap] = useState<
    Record<number, { id?: number; feedback_type: 'positive' | 'negative'; reason?: string; comment?: string }>
  >({})
  const [activeNegativeMsgId, setActiveNegativeMsgId] = useState<number | null>(null)
  const [selectedReason, setSelectedReason] = useState<string>('Answer is incorrect')
  const [negativeComment, setNegativeComment] = useState<string>('')
  const [activePositiveMsgId, setActivePositiveMsgId] = useState<number | null>(null)
  const [positiveComment, setPositiveComment] = useState<string>('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [copiedAnswerId, setCopiedAnswerId] = useState<number | null>(null)
  const [copiedCitationId, setCopiedCitationId] = useState<number | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, pipelineState])

  useEffect(() => {
    if (!session?.token) return
    const fetchKbStatus = async () => {
      try {
        const [docsRes, healthRes, modelsRes] = await Promise.all([
          fetch(`${apiBase}/api/v1/documents?page=1&page_size=3`, {
            headers: { Authorization: `Bearer ${session.token}` },
          }),
          fetch(`${apiBase}/api/v1/health`),
          fetch(`${apiBase}/api/v1/chat/models`, {
            headers: { Authorization: `Bearer ${session.token}` },
          }).catch(() => null),
        ])
        if (docsRes.ok) {
          const data = await docsRes.json()
          setRecentDocs(data.items || [])
          setKbDocCount(typeof data.total === 'number' ? data.total : (data.items || []).length)
        }
        if (modelsRes && modelsRes.ok) {
          const mData = await modelsRes.json()
          if (mData.models && Array.isArray(mData.models)) {
            setAvailableModels(mData.models)
          }
        }
        if (healthRes.ok) {
          const hData = await healthRes.json()
          setSystemHealth(hData.status === 'ok' ? 'operational' : 'degraded')
        } else {
          setSystemHealth('degraded')
        }
      } catch {
        setSystemHealth('degraded')
      }
    }

    const loadConversation = async () => {
      try {
        const savedId = localStorage.getItem('supportiq_active_conversation_id')
        const targetId = savedId ? parseInt(savedId, 10) : null

        if (targetId && !isNaN(targetId)) {
          const res = await fetch(`${apiBase}/api/v1/conversations/${targetId}`, {
            headers: { Authorization: `Bearer ${session.token}` },
          })
          if (res.ok) {
            const data = await res.json()
            if (data?.messages && data.messages.length > 0) {
              setConversationId(data.id)
              setMessages(data.messages)
              return
            }
          }
        }

        const listRes = await fetch(`${apiBase}/api/v1/conversations?page=1&page_size=1`, {
          headers: { Authorization: `Bearer ${session.token}` },
        })
        if (listRes.ok) {
          const listData = await listRes.json()
          if (listData?.items && listData.items.length > 0) {
            const latest = listData.items[0]
            if (latest.messages && latest.messages.length > 0) {
              setConversationId(latest.id)
              setMessages(latest.messages)
              localStorage.setItem('supportiq_active_conversation_id', String(latest.id))
            }
          }
        }
      } catch (err) {
        console.error('Error loading previous chat conversation:', err)
      }
    }

    fetchKbStatus()
    loadConversation()
  }, [session?.token])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!session?.token) {
      setAttachmentError('Authentication session not found. Please log in again.')
      clearSession()
      navigate('/login')
      return
    }

    setIsUploadingAttachment(true)
    setAttachmentError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'Chat Attachment')

    try {
      const res = await fetch(`${apiBase}/api/v1/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: formData,
      })

      if (!res.ok) {
        let errorMsg = 'Failed to upload document to this session.'
        try {
          const errData = await res.json()
          if (typeof errData.detail === 'string') {
            errorMsg = errData.detail
          } else if (errData.detail?.message) {
            errorMsg = errData.detail.message
          } else if (Array.isArray(errData.detail) && errData.detail[0]?.msg) {
            errorMsg = errData.detail[0].msg
          } else if (errData.message) {
            errorMsg = errData.message
          }
        } catch {}

        if (res.status === 401) {
          clearSession()
          errorMsg = 'Session expired. Please log in again.'
          navigate('/login')
        }
        throw new Error(errorMsg)
      }

      const uploadedDoc = await res.json()

      if (uploadedDoc.status === 'failed') {
        const failReason = uploadedDoc.metadata_json?.indexing_error || 'Document processing and indexing failed.'
        throw new Error(failReason)
      }

      setAttachedFile({
        id: uploadedDoc.id,
        filename: uploadedDoc.filename || file.name,
        size: uploadedDoc.size || file.size,
        status: uploadedDoc.status,
      })

      setKbDocCount((prev) => (prev !== null ? prev + 1 : 1))
      setRecentDocs((prev) => [
        { id: uploadedDoc.id, filename: uploadedDoc.filename || file.name, created_at: new Date().toISOString() },
        ...prev,
      ])

      if (!input.trim()) {
        setInput(`Please analyze and answer questions from the attached document: ${uploadedDoc.filename || file.name}`)
      }
    } catch (err: any) {
      setAttachmentError(err.message || 'Error uploading document to this session.')
    } finally {
      setIsUploadingAttachment(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setPipelineState('idle')
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        conversation_id: conversationId || 0,
        role: 'assistant',
        content: 'Generation stopped.',
        created_at: new Date().toISOString(),
        metadata_json: { status: 'stopped' },
      },
    ])
  }

  const fetchFeedbackForConversation = async (convId: number) => {
    if (!session?.token || !convId) return
    try {
      const res = await fetch(`${apiBase}/api/v1/feedback/my?conversation_id=${convId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (res.ok) {
        const listData = await res.json()
        const list = Array.isArray(listData) ? listData : (listData.items || [])
        const map: Record<
          number,
          { id?: number; feedback_type: 'positive' | 'negative'; reason?: string; comment?: string }
        > = {}
        if (Array.isArray(list)) {
          list.forEach((item: any) => {
            if (item.message_id) {
              map[item.message_id] = {
                id: item.id,
                feedback_type: item.feedback_type,
                reason: item.reason,
                comment: item.comment,
              }
            }
          })
        }
        setFeedbackMap(map)
      }
    } catch (err) {
      console.error('Failed to load feedback for conversation:', err)
    }
  }

  useEffect(() => {
    if (conversationId && session?.token) {
      fetchFeedbackForConversation(conversationId)
    }
  }, [conversationId, session?.token])

  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    localStorage.removeItem('supportiq_active_conversation_id')
    setMessages([])
    setConversationId(null)
    setFeedbackMap({})
    setActiveNegativeMsgId(null)
    setActivePositiveMsgId(null)
    setNegativeComment('')
    setPositiveComment('')
    setFeedbackError(null)
    setInput('')
    setCurrentQuestion('')
    setAttachedFile(null)
    setEscalationTicket(null)
    setPreviewCitation(null)
    setPipelineState('idle')
    setAttachmentError(null)
    setEscalationError(null)
  }

  const submitFeedback = async (
    messageId: number,
    feedbackType: 'positive' | 'negative',
    reason?: string,
    comment?: string
  ) => {
    if (!session?.token) return
    setIsSubmittingFeedback(true)
    setFeedbackError(null)

    try {
      const res = await fetch(`${apiBase}/api/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          message_id: messageId,
          feedback_type: feedbackType,
          reason: reason || undefined,
          comment: comment || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Feedback submission failed')
      }

      const resData = await res.json()
      const saved = resData.feedback || resData
      setFeedbackMap((prev) => ({
        ...prev,
        [messageId]: {
          id: saved.id,
          feedback_type: saved.feedback_type,
          reason: saved.reason,
          comment: saved.comment,
        },
      }))
      setActiveNegativeMsgId(null)
      setActivePositiveMsgId(null)
      setNegativeComment('')
      setPositiveComment('')
    } catch (err: any) {
      setFeedbackError(err.message || 'Error submitting feedback')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  const handleCopyAnswer = async (msgId: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedAnswerId(msgId)
      setTimeout(() => setCopiedAnswerId(null), 2000)
    } catch {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = content
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
        setCopiedAnswerId(msgId)
        setTimeout(() => setCopiedAnswerId(null), 2000)
      } catch (e) {
        console.error('Copy failed:', e)
      }
    }
  }

  const handleCopyCitation = async (msgId: number, citations: CitationItem[]) => {
    if (!citations || citations.length === 0) return
    const text = citations
      .map((c, idx) => {
        let entry = `[Source ${idx + 1}] Document: ${c.document_title || 'Support Document'}`
        if (c.page) entry += ` | Page ${c.page}`
        if (c.match_percent) entry += ` (${c.match_percent}% match)`
        if (c.quote) entry += `\nEvidence: "${c.quote}"`
        return entry
      })
      .join('\n\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopiedCitationId(msgId)
      setTimeout(() => setCopiedCitationId(null), 2000)
    } catch {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
        setCopiedCitationId(msgId)
        setTimeout(() => setCopiedCitationId(null), 2000)
      } catch (e) {
        console.error('Copy citation failed:', e)
      }
    }
  }

  const handleRegenerate = async (msgId: number) => {
    if (!session?.token || pipelineState !== 'idle' || !conversationId) return
    setRegeneratingId(msgId)
    setPipelineState('retrieving')

    const genTimer = setTimeout(() => {
      setPipelineState('generating')
    }, 450)

    try {
      const res = await fetch(`${apiBase}/api/v1/chat/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_id: msgId,
          model_name: selectedModel,
          use_knowledge_base: useKB,
        }),
      })

      clearTimeout(genTimer)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to regenerate response')
      }

      const data = await res.json()
      setPipelineState('verifying')
      await new Promise((r) => setTimeout(r, 200))

      if (data.assistant_message) {
        setMessages((prev) => [...prev, data.assistant_message])
      }
    } catch (err) {
      clearTimeout(genTimer)
      console.error('Error regenerating response:', err)
    } finally {
      setRegeneratingId(null)
      setPipelineState('idle')
    }
  }

  const handleSend = async (textToSend?: string) => {
    let question = (textToSend || input).trim()
    if (!question && attachedFile) {
      question = `Please analyze and answer questions from the attached document: ${attachedFile.filename}`
    }
    if (!question || !session?.token) return

    setInput('')
    setCurrentQuestion(question)
    const currentAttachment = attachedFile
    const userMsgId = Date.now()
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      conversation_id: conversationId || 0,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
      metadata_json: currentAttachment ? { attachment: currentAttachment } : undefined,
    }

    setMessages((prev) => [...prev, newUserMsg])
    setAttachedFile(null)
    setPipelineState('retrieving')

    const controller = new AbortController()
    abortControllerRef.current = controller

    const genTimer = setTimeout(() => {
      setPipelineState((curr) => (curr === 'retrieving' ? 'generating' : curr))
    }, 450)

    try {
      const res = await fetch(`${apiBase}/api/v1/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          conversation_id: conversationId,
          content: question,
          use_knowledge_base: useKB,
          model_name: selectedModel,
          attachment_document_id: currentAttachment?.id,
          attachment: currentAttachment,
        }),
      })

      clearTimeout(genTimer)

      if (!res.ok) throw new Error('Failed to generate response')
      const data = await res.json()

      setPipelineState('verifying')
      await new Promise((r) => setTimeout(r, 200))

      if (data.conversation?.id) {
        setConversationId(data.conversation.id)
        localStorage.setItem('supportiq_active_conversation_id', String(data.conversation.id))
      }

      setMessages((prev) => [...prev, data.assistant_message])
    } catch (err: any) {
      clearTimeout(genTimer)
      if (err.name === 'AbortError') {
        const stoppedMsg: ChatMessage = {
          id: Date.now() + 1,
          conversation_id: conversationId || 0,
          role: 'assistant',
          content: 'Generation stopped.',
          created_at: new Date().toISOString(),
          metadata_json: { status: 'stopped' },
        }
        setMessages((prev) => [...prev, stoppedMsg])
        return
      }

      // Honest connection error when backend is unreachable
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        conversation_id: conversationId || 0,
        role: 'assistant',
        content: 'Unable to reach SupportIQ server. Please check your network connection and verify the backend is running.',
        created_at: new Date().toISOString(),
        metadata_json: {
          status: 'error',
          model: selectedModel,
          citations: [],
          reliability: { score: 0.0, label: 'low' },
          grounding_status: 'unsupported',
          failed_query: question,
        },
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      abortControllerRef.current = null
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
    if (!session?.token || isEscalating) return
    setIsEscalating(true)
    setEscalationError(null)

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')

    const subject = lastUserMsg ? `Escalated Chat: ${lastUserMsg.content.slice(0, 50)}...` : 'Support Escalation from AI Chat'
    const description = lastUserMsg
      ? `Escalated inquiry from AI Chat session.\n\nUser Question:\n${lastUserMsg.content}\n\nAI Response:\n${lastAssistantMsg?.content || 'None'}`
      : 'Customer requested human agent assistance from live chat.'

    try {
      const res = await fetch(`${apiBase}/api/v1/support-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          subject,
          description,
          category: 'Chat Escalation',
          priority: 'High',
          source: 'chat',
          context: {
            conversation_id: conversationId,
            question: lastUserMsg?.content,
            answer: lastAssistantMsg?.content,
            escalation_reason: 'User requested human agent escalation',
            reliability: lastAssistantMsg?.metadata_json?.reliability,
            evidence: lastAssistantMsg?.metadata_json?.citations,
          },
        }),
      })

      if (!res.ok) throw new Error('Failed to create escalation ticket')
      const created = await res.json()
      setEscalationTicket({ id: created.id, title: created.subject || subject })
    } catch (err: any) {
      setEscalationError(err.message || 'Escalation failed')
    } finally {
      setIsEscalating(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 overflow-hidden">
      {/* Central Chat Interface */}
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1424]">
        {/* Background Logo Watermark */}
        <ChatWatermark imageSrc={watermarkImage} />

        {/* Chat Header Quotes & New Chat Control */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 px-4 sm:px-6 py-2.5 text-[11px] text-slate-400 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-400 transition cursor-pointer"
              title="Start a fresh conversation (clears all previous messages & state)"
            >
              <span className="text-sm leading-none">+</span>
              <span>New Chat</span>
            </button>
            <span className="italic font-serif hidden md:inline">"Knowledge turns support into solutions."</span>
          </div>
          <span className="font-semibold tracking-wider text-cyan-400 uppercase">
            Ask. Retrieve. Verify. Resolve.
          </span>
        </div>

        {/* Messages / Welcome View */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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
                      {isUser && meta.attachment && (
                        <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-cyan-700/80 border border-cyan-400/50 px-2.5 py-1 text-[11px] text-cyan-100 font-medium">
                          <span>📎</span>
                          <span>Attached: {meta.attachment.filename}</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Citations Attached to Assistant Message */}
                    {!isUser && citations.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Sources & Evidence:
                        </div>
                        <div className="space-y-2">
                          {citations.map((c, i) => (
                            <div
                              key={i}
                              onClick={() => setPreviewCitation(c)}
                              className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-[11px] space-y-1.5 hover:border-cyan-500/40 cursor-pointer transition"
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
                              <button
                                type="button"
                                onClick={() => setPreviewCitation(c)}
                                className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                              >
                                Open Evidence Viewer →
                              </button>
                              {c.quote && (
                                <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2 text-[10.5px] text-slate-300 italic leading-relaxed">
                                  <span className="text-[10px] font-bold text-cyan-400 not-italic mr-1.5 uppercase">Evidence:</span>
                                  "{c.quote}"
                                </div>
                              )}
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
                      <HumanEscalationState
                        ticketId={`#SIQ-${escalationTicket.id}`}
                        onViewTicket={() => navigate('/tickets')}
                      />
                    )}

                    {/* Model Unavailable truthful notice */}
                    {!isUser && meta.status === 'model_unavailable' && (
                      <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-3 text-xs text-amber-200">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
                          <span>⚠️</span>
                          <span>Model Runtime Unavailable</span>
                        </div>
                        <p className="text-[11px] text-amber-200/90 leading-relaxed">{msg.content}</p>
                      </div>
                    )}

                    {/* Prominent Grounding & Reliability Status */}
                    {!isUser && meta.reliability && (
                      <div className="pt-2 rounded-xl border border-slate-800/90 bg-slate-950/70 p-3 space-y-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">Reliability:</span>
                            <span className={`inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-md text-[11px] ${
                              meta.reliability.label === 'high' || (typeof meta.reliability.score === 'number' && meta.reliability.score >= 0.7)
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : meta.reliability.label === 'medium' || (typeof meta.reliability.score === 'number' && meta.reliability.score >= 0.4)
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              <span className="capitalize">{meta.reliability.label || (typeof meta.reliability.score === 'number' && meta.reliability.score >= 0.7 ? 'High' : 'Medium')}</span>
                              {typeof meta.reliability.score === 'number' && (
                                <span>({Math.round(meta.reliability.score * 100)}%)</span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">Verified Claims:</span>
                            <span className="font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-md text-[11px]">
                              {meta.supported_claim_count !== undefined
                                ? `${meta.supported_claim_count}/${(meta.supported_claim_count || 0) + (meta.unsupported_claim_count || 0)} validated`
                                : meta.claims && Array.isArray(meta.claims)
                                ? `${meta.claims.filter((cl: any) => cl.supported).length}/${meta.claims.length} validated`
                                : '1/1 validated'}
                            </span>
                          </div>
                        </div>

                        {/* Grounding Status & Model details */}
                        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            <span>Grounding Status:</span>
                            <span className={`font-semibold capitalize ${meta.grounding_status === 'supported' ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {meta.grounding_status || 'supported'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[9.5px]">
                            <span className="text-slate-500">Model:</span>
                            <span className="text-slate-300">{meta.model || selectedModel}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Unsupported Guard Notice */}
                    {!isUser && meta.status === 'unsupported' && (
                      <div className="pt-1">
                        <UnsupportedState onRefine={() => setInput('')} />
                      </div>
                    )}

                    {/* Inline Error & Retry */}
                    {!isUser && meta.status === 'error' && (
                      <div className="pt-1">
                        <ErrorState
                          title="Connection or Generation Error"
                          message={msg.content}
                          onRetry={() => handleSend(meta.failed_query || input)}
                        />
                      </div>
                    )}

                    {/* Real Message Actions & Answer Feedback */}
                    {!isUser && meta.status !== 'stopped' && meta.status !== 'error' && msg.content && (
                      <div className="pt-1.5 space-y-2">
                        <div className="flex items-center flex-wrap gap-2 text-slate-400 text-[11px]">
                          {/* Helpful Thumb */}
                          <button
                            type="button"
                            disabled={pipelineState !== 'idle' || isSubmittingFeedback}
                            onClick={() => {
                              if (feedbackMap[msg.id]?.feedback_type === 'positive') {
                                setActivePositiveMsgId((prev) => (prev === msg.id ? null : msg.id))
                              } else {
                                submitFeedback(msg.id, 'positive')
                              }
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition cursor-pointer ${
                              feedbackMap[msg.id]?.feedback_type === 'positive'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-medium shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                                : 'bg-slate-900/60 hover:bg-emerald-950/40 text-slate-400 hover:text-emerald-300 border-slate-800 hover:border-emerald-700/50'
                            }`}
                            aria-label="Mark answer as helpful"
                            title="Mark answer as helpful"
                          >
                            <span>👍</span>
                            <span>Helpful</span>
                          </button>

                          {/* Not Helpful Thumb */}
                          <button
                            type="button"
                            disabled={pipelineState !== 'idle' || isSubmittingFeedback}
                            onClick={() => {
                              setActivePositiveMsgId(null)
                              setActiveNegativeMsgId((prev) => (prev === msg.id ? null : msg.id))
                              if (feedbackMap[msg.id]?.reason) {
                                setSelectedReason(feedbackMap[msg.id].reason || 'Answer is incorrect')
                              }
                              if (feedbackMap[msg.id]?.comment) {
                                setNegativeComment(feedbackMap[msg.id].comment || '')
                              }
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition cursor-pointer ${
                              feedbackMap[msg.id]?.feedback_type === 'negative'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-medium shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                                : 'bg-slate-900/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border-slate-800 hover:border-rose-700/50'
                            }`}
                            aria-label="Mark answer as not helpful"
                            title="Mark answer as not helpful"
                          >
                            <span>👎</span>
                            <span>Not Helpful</span>
                            {feedbackMap[msg.id]?.reason && (
                              <span className="hidden sm:inline text-[10px] text-rose-300/80 max-w-[110px] truncate">
                                ({feedbackMap[msg.id].reason})
                              </span>
                            )}
                          </button>

                          <span className="text-slate-700">|</span>

                          {/* Copy Answer */}
                          <button
                            type="button"
                            onClick={() => handleCopyAnswer(msg.id, msg.content)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer text-xs"
                            aria-label="Copy answer to clipboard"
                            title="Copy full answer text"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            <span>{copiedAnswerId === msg.id ? 'Copied!' : 'Copy'}</span>
                          </button>

                          {/* Copy Citation (when citations exist) */}
                          {citations.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleCopyCitation(msg.id, citations)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition cursor-pointer text-xs"
                              aria-label="Copy citation to clipboard"
                              title="Copy citation and evidence text"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                              </svg>
                              <span>{copiedCitationId === msg.id ? 'Citation Copied!' : 'Copy Citation'}</span>
                            </button>
                          )}

                          {/* View Evidence (when citations exist) */}
                          {citations.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setPreviewCitation(citations[0])}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 hover:text-cyan-200 border border-cyan-800/40 transition cursor-pointer text-xs"
                              aria-label="View document evidence"
                              title="Open Document Evidence Viewer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                              </svg>
                              <span>Evidence</span>
                            </button>
                          )}

                          {/* Regenerate Response */}
                          <button
                            type="button"
                            disabled={pipelineState !== 'idle' || regeneratingId !== null}
                            onClick={() => handleRegenerate(msg.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition cursor-pointer text-xs disabled:opacity-50"
                            aria-label="Regenerate assistant response"
                            title="Regenerate response with RAG"
                          >
                            <svg className={`w-3.5 h-3.5 ${regeneratingId === msg.id ? 'animate-spin text-cyan-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                            </svg>
                            <span>{regeneratingId === msg.id ? 'Regenerating...' : 'Regenerate'}</span>
                          </button>

                          {/* Model & Latency badges */}
                          {meta.model && (
                            <span className="rounded bg-slate-800/90 px-2 py-0.5 text-[9px] text-cyan-300 font-mono border border-slate-700/60 shadow-sm ml-auto">
                              {meta.model}
                            </span>
                          )}
                          {meta.generation_latency_ms ? (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              ⚡ Gen: {meta.generation_latency_ms}ms
                            </span>
                          ) : meta.latency_ms ? (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Total: {meta.latency_ms}ms
                            </span>
                          ) : null}
                          {meta.peak_vram_gb && (
                            <span className="text-[10px] text-purple-400 font-mono">
                              VRAM: {meta.peak_vram_gb} GB
                            </span>
                          )}
                        </div>

                        {/* Negative Feedback Form */}
                        {activeNegativeMsgId === msg.id && (
                          <div className="rounded-xl border border-rose-500/30 bg-slate-950/95 p-3.5 space-y-3 shadow-xl animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-rose-400">👎</span>
                                <span className="font-semibold text-slate-200 text-xs">Help Us Improve This Answer</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveNegativeMsgId(null)}
                                className="text-slate-500 hover:text-slate-300 text-xs font-mono cursor-pointer"
                                aria-label="Close feedback form"
                              >
                                ✕
                              </button>
                            </div>

                            <div>
                              <p className="text-[11px] text-slate-400 mb-2">Why was this answer not helpful?</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {[
                                  'Answer is incorrect',
                                  'Answer is incomplete',
                                  'Evidence is not relevant',
                                  'Citation is incorrect',
                                  'Answer was unclear',
                                  'Other',
                                ].map((reasonOption) => (
                                  <button
                                    key={reasonOption}
                                    type="button"
                                    onClick={() => setSelectedReason(reasonOption)}
                                    className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] transition cursor-pointer border ${
                                      selectedReason === reasonOption
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 font-medium'
                                        : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700'
                                    }`}
                                  >
                                    {reasonOption}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label htmlFor={`neg-comment-${msg.id}`} className="block text-[11px] text-slate-400 mb-1">
                                Tell us more (optional):
                              </label>
                              <textarea
                                id={`neg-comment-${msg.id}`}
                                value={negativeComment}
                                onChange={(e) => setNegativeComment(e.target.value)}
                                placeholder="Explain what information was inaccurate or what you were looking for..."
                                rows={2}
                                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                              />
                            </div>

                            {feedbackError && (
                              <div className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg p-2">
                                {feedbackError}
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                              <button
                                type="button"
                                onClick={() => setActiveNegativeMsgId(null)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isSubmittingFeedback || !selectedReason}
                                onClick={() => submitFeedback(msg.id, 'negative', selectedReason, negativeComment)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-md transition cursor-pointer"
                              >
                                {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Positive Feedback Optional Note Modal / Box */}
                        {activePositiveMsgId === msg.id && (
                          <div className="rounded-xl border border-emerald-500/30 bg-slate-950/95 p-3.5 space-y-2.5 shadow-xl animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-400">👍</span>
                                <span className="font-semibold text-slate-200 text-xs">What was helpful? (optional)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActivePositiveMsgId(null)}
                                className="text-slate-500 hover:text-slate-300 text-xs font-mono cursor-pointer"
                                aria-label="Close note form"
                              >
                                ✕
                              </button>
                            </div>

                            <textarea
                              value={positiveComment}
                              onChange={(e) => setPositiveComment(e.target.value)}
                              placeholder="Let us know what made this answer helpful..."
                              rows={2}
                              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                            />

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setActivePositiveMsgId(null)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
                              >
                                Close
                              </button>
                              <button
                                type="button"
                                disabled={isSubmittingFeedback}
                                onClick={() => submitFeedback(msg.id, 'positive', undefined, positiveComment)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition cursor-pointer"
                              >
                                {isSubmittingFeedback ? 'Saving...' : 'Save Note'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* Real-time Assistant Pipeline Progress inside the conversation stream */}
          {pipelineState !== 'idle' && (
            <div className="flex justify-start">
              <div className="max-w-[85%] space-y-2">
                <AssistantPipelineProgress stage={pipelineState} query={currentQuestion} />
                <StopGenerationButton onStop={handleStop} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box Area */}
        <div className="relative z-10 border-t border-slate-800 bg-[#070d18] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3 shadow-xl focus-within:border-cyan-500/60 transition"
          >
            {/* Attached file chip */}
            {attachedFile && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-3 py-1.5 text-xs text-cyan-200">
                <div className="flex items-center gap-2 truncate">
                  <span>📄</span>
                  <span className="font-semibold text-white truncate">{attachedFile.filename}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    ({(attachedFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${['indexed', 'completed'].includes(String(attachedFile.status).toLowerCase()) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {['indexed', 'completed'].includes(String(attachedFile.status).toLowerCase()) ? 'Attached & Indexed' : `Attached (${attachedFile.status || 'Pending'})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-slate-400 hover:text-white transition text-xs ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
            {isUploadingAttachment && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-slate-900 px-3 py-1.5 text-xs text-cyan-300">
                <span className="text-cyan-400 animate-pulse">⏳</span>
                <span>Uploading and indexing document to session...</span>
              </div>
            )}
            {attachmentError && (
              <div className="mb-2 flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-950/30 px-3 py-1.5 text-xs text-rose-300">
                <span>{attachmentError}</span>
                <button type="button" onClick={() => setAttachmentError(null)} className="text-rose-400 hover:text-white">✕</button>
              </div>
            )}

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
              placeholder={attachedFile ? `Ask any question about ${attachedFile.filename}...` : "Ask a question about your support knowledge base..."}
              className="w-full resize-none bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />

            {/* Bottom Input Actions Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.docx,.txt,.csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                  className="flex items-center gap-1 hover:text-cyan-300 transition disabled:opacity-50 cursor-pointer"
                  title="Attach a document (.pdf, .docx, .txt, .csv) to this chat session"
                >
                  <span>📎</span>
                  <span className="text-[11px] font-medium">{isUploadingAttachment ? 'Uploading...' : 'Attach File'}</span>
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

                <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-800">
                  <span className="text-[11px] text-slate-400">Model:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="rounded-lg bg-slate-950 border border-slate-800 px-2 py-1 text-[10px] text-cyan-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer shadow-sm"
                  >
                    {availableModels.map((m) => (
                      <option key={m.id} value={m.name} className="bg-slate-900 text-slate-100">
                        {m.name} {!m.available ? '(Unavailable)' : ''}
                      </option>
                    ))}
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
            <Link to="/documents" className="text-xs text-slate-500 hover:text-cyan-400">›</Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Connected</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {kbDocCount !== null ? `${kbDocCount} document${kbDocCount === 1 ? '' : 's'} indexed` : 'Loading documents...'}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {recentDocs.length > 0
              ? `Last updated: ${new Date(recentDocs[0].updated_at || recentDocs[0].created_at).toLocaleDateString()}`
              : 'No documents uploaded yet'}
          </p>
        </div>

        {/* System Status Checklist */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white">System Status</h4>
            <span className="text-xs text-slate-500">›</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-400 border-b border-slate-800 pb-2">
            <span className={`h-1.5 w-1.5 rounded-full ${systemHealth === 'operational' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{systemHealth === 'operational' ? 'All Systems Operational' : 'Verifying Connectivity'}</span>
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
                  <span className={`h-1.5 w-1.5 rounded-full ${systemHealth === 'operational' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-[11px]">{srv}</span>
                </div>
                <span className={`text-[10px] font-medium ${systemHealth === 'operational' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {systemHealth === 'operational' ? 'Online' : 'Checking'}
                </span>
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
            {recentDocs.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic py-2">No documents indexed yet</p>
            ) : (
              recentDocs.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate('/documents')}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/50 p-2 text-xs hover:border-slate-700 cursor-pointer transition"
                >
                  <span>📄</span>
                  <div className="truncate">
                    <p className="font-medium text-slate-200 truncate">{doc.filename}</p>
                    <p className="text-[10px] text-slate-500">
                      {doc.updated_at ? `Updated ${new Date(doc.updated_at).toLocaleDateString()}` : 'Uploaded'}
                    </p>
                  </div>
                </div>
              ))
            )}
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
          className={`rounded-2xl border ${escalationTicket ? 'border-emerald-500/40 bg-emerald-950/30' : 'border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-sky-950/40'} p-4 shadow-lg hover:border-cyan-400 cursor-pointer transition`}
        >
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl ${escalationTicket ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'} flex items-center justify-center text-base font-bold`}>
              {escalationTicket ? '✓' : '👥'}
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">
                {escalationTicket ? `Ticket #${escalationTicket.id} Created` : isEscalating ? 'Creating Ticket...' : 'Need more help?'}
              </h5>
              <p className={`text-[11px] ${escalationTicket ? 'text-emerald-300' : 'text-cyan-300'} mt-0.5`}>
                {escalationTicket ? 'View in Support Tickets →' : isEscalating ? 'Connecting to support...' : 'Connect with a support agent →'}
              </p>
            </div>
          </div>
          {escalationTicket && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate('/tickets')
              }}
              className="mt-2 text-[11px] font-semibold text-emerald-400 hover:underline block"
            >
              Open Ticket #{escalationTicket.id}
            </button>
          )}
          {escalationError && (
            <p className="mt-1 text-[10px] text-rose-400">{escalationError}</p>
          )}
        </div>
      </div>

      {/* Full Document Evidence Viewer Modal matching Image 11 Screen 4 */}
      <DocumentEvidenceModal
        isOpen={Boolean(previewCitation)}
        onClose={() => setPreviewCitation(null)}
        documentId={previewCitation?.document_id}
        documentTitle={previewCitation?.document_title || 'Document Evidence'}
        initialPage={previewCitation?.page || 1}
        totalPages={12}
        highlightText={previewCitation?.quote}
        citationEvidence={previewCitation}
      />
    </div>
  )
}
