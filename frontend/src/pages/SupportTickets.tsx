import React, { useEffect, useState } from 'react'
import {
  LifeBuoy,
  Search,
  Plus,
  ChevronRight,
  User,
  FileText,
  Send,
  Download,
} from 'lucide-react'
import { getStoredSession } from '../lib/auth'

const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

interface Ticket {
  id: string
  numericId: number
  customerName: string
  customerEmail: string
  subject: string
  category: string
  priority: 'High' | 'Medium' | 'Low' | 'Urgent'
  status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed'
  confidence: number
  channel: string
  createdOn: string
  createdAt?: string
  updatedAt?: string
  resolvedAt?: string | null
  assignedTo: string
  messages: {
    sender: 'customer' | 'ai' | 'agent'
    text: string
    time: string
    citations?: string[]
  }[]
}

export const SupportTickets: React.FC = () => {
  const session = getStoredSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [replyText, setReplyText] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exportNotice, setExportNotice] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null)

  // New ticket form
  const [newSubject, setNewSubject] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCategory, setNewCategory] = useState('Billing & Payments')
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')

  const mapBackendTicket = (t: any): Ticket => {
    const rawMsgs = t.messages || []
    const mappedMessages = rawMsgs.map((m: any) => ({
      sender: m.sender_type === 'ai' ? 'ai' : m.sender_type === 'agent' ? 'agent' : 'customer',
      text: m.content,
      time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      citations: [],
    }))

    // If no explicit messages, generate first message from customer question or description
    if (mappedMessages.length === 0 && (t.description || t.issue_question || t.subject)) {
      mappedMessages.push({
        sender: 'customer',
        text: t.issue_question || t.description || t.subject,
        time: t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Initial',
      })
      if (t.ai_answer) {
        mappedMessages.push({
          sender: 'ai',
          text: t.ai_answer,
          time: t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Initial',
          citations: (t.evidence?.items || []).map((e: any) => `${e.document_title || 'Document'} (Score: ${Math.round((e.score || 0.9) * 100)}%)`),
        })
      }
    }

    const relScore = t.reliability?.score ?? 0.92

    return {
      id: `SIQ-${t.id}`,
      numericId: t.id,
      customerName: t.customer_name || 'Customer',
      customerEmail: t.customer_email || 'customer@example.com',
      subject: t.subject || t.title || 'Support Inquiry',
      category: t.category || 'General',
      priority: t.priority || 'Medium',
      status: t.status || 'Open',
      confidence: typeof relScore === 'number' ? relScore : 0.92,
      channel: t.source || 'Web Portal',
      createdOn: t.created_at
        ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Recently',
      createdAt: t.created_at ? new Date(t.created_at).toLocaleString() : '',
      updatedAt: t.updated_at ? new Date(t.updated_at).toLocaleString() : '',
      resolvedAt: t.resolved_at ? new Date(t.resolved_at).toLocaleString() : 'Not resolved',
      assignedTo: t.assigned_agent_id ? 'Support Specialist' : 'Unassigned',
      messages: mappedMessages,
    }
  }

  const fetchTickets = async () => {
    if (!session?.token) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${apiBase}/api/v1/support-tickets?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const rawItems = data.items || []
        const mapped = rawItems.map(mapBackendTicket)
        setTickets(mapped)
        if (mapped.length > 0) {
          setSelectedTicket((prev) => {
            if (prev) {
              const existing = mapped.find((item: Ticket) => item.numericId === prev.numericId)
              return existing || mapped[0]
            }
            return mapped[0]
          })
        } else {
          setSelectedTicket(null)
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [session?.token])

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedTicket || !session?.token) return

    try {
      const res = await fetch(`${apiBase}/api/v1/support-tickets/${selectedTicket.numericId}/reply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyText.trim(),
          sender_type: 'agent',
        }),
      })

      if (res.ok) {
        const newMsg = {
          sender: 'agent' as const,
          text: replyText.trim(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        const updatedTicket: Ticket = {
          ...selectedTicket,
          status: selectedTicket.status === 'Open' ? 'In Progress' : selectedTicket.status,
          messages: [...selectedTicket.messages, newMsg],
        }
        setSelectedTicket(updatedTicket)
        setTickets((prev) => prev.map((t) => (t.numericId === selectedTicket.numericId ? updatedTicket : t)))
        setReplyText('')
      }
    } catch {
      // Ignore network errors
    }
  }

  const handleUpdateStatus = async (ticketNumericId: number, newStatus: Ticket['status']) => {
    if (!session?.token) return

    try {
      const res = await fetch(`${apiBase}/api/v1/support-tickets/${ticketNumericId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setTickets((prev) => prev.map((t) => (t.numericId === ticketNumericId ? { ...t, status: newStatus } : t)))
        if (selectedTicket && selectedTicket.numericId === ticketNumericId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus })
        }
      }
    } catch {
      // Ignore network errors
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject || !newCustomerEmail || !session?.token) return

    try {
      const res = await fetch(`${apiBase}/api/v1/support-tickets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: newSubject,
          description: newSubject,
          customer_email: newCustomerEmail,
          customer_name: newCustomerEmail.split('@')[0],
          category: newCategory,
          priority: newPriority,
          source: 'Web Portal',
        }),
      })

      if (res.ok) {
        const createdRaw = await res.json()
        const mapped = mapBackendTicket(createdRaw)
        setTickets((prev) => [mapped, ...prev])
        setSelectedTicket(mapped)
        setShowCreateModal(false)
        setNewSubject('')
        setNewCustomerEmail('')
      }
    } catch {
      // Ignore network errors
    }
  }

  const handleExportTickets = () => {
    if (filteredTickets.length === 0) {
      setExportNotice({
        type: 'warning',
        message: 'No tickets available to export.',
      })
      setTimeout(() => setExportNotice(null), 5000)
      return
    }

    try {
      const headers = [
        'Ticket ID',
        'Subject',
        'Status',
        'Priority',
        'Category',
        'Customer Name',
        'Customer Email',
        'Assignee',
        'Channel',
        'Created At',
        'Updated At',
        'Resolved At',
      ]

      const escapeCsvCell = (val: unknown): string => {
        if (val === null || val === undefined) return ''
        const str = String(val)
        if (/[",\n\r]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const rows = filteredTickets.map((t) => [
        escapeCsvCell(t.id),
        escapeCsvCell(t.subject),
        escapeCsvCell(t.status),
        escapeCsvCell(t.priority),
        escapeCsvCell(t.category),
        escapeCsvCell(t.customerName),
        escapeCsvCell(t.customerEmail),
        escapeCsvCell(t.assignedTo),
        escapeCsvCell(t.channel),
        escapeCsvCell(t.createdAt || t.createdOn),
        escapeCsvCell(t.updatedAt || ''),
        escapeCsvCell(t.resolvedAt || 'Not resolved'),
      ])

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'supportiq-tickets.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportNotice({
        type: 'success',
        message: `Successfully exported ${filteredTickets.length} ticket${filteredTickets.length === 1 ? '' : 's'} to supportiq-tickets.csv`,
      })
      setTimeout(() => setExportNotice(null), 5000)
    } catch (err: any) {
      setExportNotice({
        type: 'error',
        message: err.message || 'Failed to export tickets.',
      })
      setTimeout(() => setExportNotice(null), 5000)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Support Tickets & Escalations</h1>
            <p className="text-sm text-slate-400">
              Manage incoming inquiries, claim verification audits, and human escalation handoffs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleExportTickets}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Tickets</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Export Notice Banner */}
      {exportNotice && (
        <div
          className={`rounded-xl border p-3.5 text-xs flex items-center justify-between animate-fadeIn ${
            exportNotice.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : exportNotice.type === 'warning'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{exportNotice.type === 'success' ? '✓' : '⚠'}</span>
            <span>{exportNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-slate-400 hover:text-white transition ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Ticket Management Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets Queue (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter and Search Bar */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket, customer, subject..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['All', 'Open', 'In Progress', 'Resolved', 'Escalated'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
                    filterStatus === st
                      ? 'bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket List Cards */}
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading support tickets from database...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400">
              No support tickets found in database. Click <strong className="text-cyan-400">+ Create Ticket</strong> to record a customer inquiry.
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400">
              No tickets match filter "{filterStatus}".
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTickets.map((ticket) => {
                const isSelected = selectedTicket?.numericId === ticket.numericId
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/50 shadow-lg shadow-cyan-500/5'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-cyan-400">{ticket.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            ticket.status === 'Resolved'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : ticket.status === 'In Progress'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              : ticket.status === 'Escalated'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {ticket.status}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            ticket.priority === 'High' || ticket.priority === 'Urgent'
                              ? 'bg-rose-500/20 text-rose-300'
                              : ticket.priority === 'Medium'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ticket.priority} Priority
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{ticket.createdOn}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 mb-1 line-clamp-1">{ticket.subject}</h3>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 mt-2">
                      <div className="flex items-center gap-2 truncate">
                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="text-slate-300 truncate">{ticket.customerName}</span>
                        <span className="text-slate-500 truncate">({ticket.customerEmail})</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-cyan-400 font-mono">
                          {Math.round(ticket.confidence * 100)}% Grounded
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Ticket Details & Active Chat Thread (5 Cols) */}
        <div className="lg:col-span-5">
          {selectedTicket ? (
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col h-full sticky top-4">
              {/* Ticket Top Header */}
              <div className="pb-4 border-b border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">{selectedTicket.id}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket.numericId, e.target.value as any)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Escalated">Escalated</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <h2 className="text-base font-bold text-slate-100 mb-1">{selectedTicket.subject}</h2>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>
                    Customer: <strong className="text-slate-200">{selectedTicket.customerName}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Category: <strong className="text-slate-300">{selectedTicket.category}</strong>
                  </span>
                </div>
              </div>

              {/* Conversation Messages */}
              <div className="flex-1 overflow-y-auto my-4 space-y-3.5 pr-1 max-h-[380px]">
                {selectedTicket.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl text-xs ${
                      m.sender === 'customer'
                        ? 'bg-slate-800/60 border border-slate-700/60 mr-4'
                        : m.sender === 'ai'
                        ? 'bg-cyan-950/20 border border-cyan-500/30 ml-4'
                        : 'bg-purple-950/20 border border-purple-500/30 ml-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                      <span
                        className={
                          m.sender === 'ai'
                            ? 'text-cyan-400'
                            : m.sender === 'agent'
                            ? 'text-purple-400'
                            : 'text-slate-300'
                        }
                      >
                        {m.sender === 'customer'
                          ? selectedTicket.customerName
                          : m.sender === 'ai'
                          ? '⚡ SupportIQ AI Agent'
                          : 'Human Support Specialist'}
                      </span>
                      <span>{m.time}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{m.text}</p>

                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-cyan-500/20 space-y-1">
                        <div className="text-[10px] text-cyan-300/80 font-medium">Grounded Sources:</div>
                        {m.citations.map((cite, i) => (
                          <div key={i} className="text-[10px] font-mono text-cyan-400/90 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-cyan-400" />
                            {cite}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">Compose Response</span>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyText(
                        'Our support team has reviewed your request and updated the ticket status. Let us know if you need any additional assistance.',
                      )
                    }
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    + Insert Standard Resolution Template
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type an official reply to the customer..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 resize-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 bottom-3 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900/70 border border-slate-800/80 text-center text-slate-400">
              Select a ticket to inspect messages and claim citations.
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-1">Create Support Ticket</h3>
            <p className="text-xs text-slate-400 mb-4">Record a new customer escalation or manual inquiry.</p>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Inability to access API keys"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Customer Email</label>
                <input
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="e.g. user@domain.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option>Billing & Payments</option>
                    <option>Account Management</option>
                    <option>Technical Support</option>
                    <option>Product Information</option>
                    <option>Refunds & Returns</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
