import React, { useState } from 'react';
import {
  LifeBuoy, Search, Plus, ChevronRight, User,
  FileText, Send
} from 'lucide-react';

interface Ticket {
  id: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated';
  confidence: number;
  channel: string;
  createdOn: string;
  assignedTo: string;
  messages: {
    sender: 'customer' | 'ai' | 'agent';
    text: string;
    time: string;
    citations?: string[];
  }[];
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'SIQ-1042',
    customerName: 'Rahul Kumar',
    customerEmail: 'rahul.kumar@example.com',
    subject: 'Refund for annual subscription after accidental renewal',
    category: 'Billing & Payments',
    priority: 'High',
    status: 'Open',
    confidence: 0.94,
    channel: 'Web Portal',
    createdOn: '10 min ago',
    assignedTo: 'Unassigned',
    messages: [
      {
        sender: 'customer',
        text: 'Hi, I was charged for an annual renewal yesterday without receiving an advance notice email. Can I get a full refund if I request within 14 days?',
        time: '10:14 AM'
      },
      {
        sender: 'ai',
        text: 'Yes, according to Section 2 of our Return & Refund Policy, customers who request a refund within 14 days of subscription renewal are eligible for a 100% full refund back to their original payment method, processed within 5-7 business days.',
        time: '10:14 AM',
        citations: ['Return_Policy.pdf (Section 2, Page 1)', 'Payment_Guide.pdf (Refund SLA)']
      }
    ]
  },
  {
    id: 'SIQ-1041',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.s@domain.com',
    subject: 'Unable to login to account after password reset token expiry',
    category: 'Account Management',
    priority: 'Medium',
    status: 'In Progress',
    confidence: 0.88,
    channel: 'Mobile App',
    createdOn: '32 min ago',
    assignedTo: 'Mohit Jain',
    messages: [
      {
        sender: 'customer',
        text: 'My reset password link expired after 15 minutes and now the portal says too many requests.',
        time: '09:52 AM'
      },
      {
        sender: 'ai',
        text: 'Password reset links expire automatically after 15 minutes for enterprise security. A cooldown period of 10 minutes applies before a new link can be requested.',
        time: '09:53 AM',
        citations: ['Account_Management.pdf (Auth Rules)']
      }
    ]
  },
  {
    id: 'SIQ-1040',
    customerName: 'Anil Verma',
    customerEmail: 'anil.v@techcorp.in',
    subject: 'Warranty claim for Dell laptop motherboard defect',
    category: 'Technical Support',
    priority: 'Medium',
    status: 'Open',
    confidence: 0.96,
    channel: 'Web Portal',
    createdOn: '1 hour ago',
    assignedTo: 'Sneha Nair',
    messages: [
      {
        sender: 'customer',
        text: 'The laptop motherboard stopped powering on. Is this covered under the standard 1-year limited hardware warranty?',
        time: '09:24 AM'
      }
    ]
  },
  {
    id: 'SIQ-1039',
    customerName: 'Neha Gupta',
    customerEmail: 'neha.g@startup.io',
    subject: 'Product delivery delay for express shipment order #9942',
    category: 'Product Information',
    priority: 'Low',
    status: 'Resolved',
    confidence: 0.99,
    channel: 'Chat Widget',
    createdOn: '2 hours ago',
    assignedTo: 'AI Assistant',
    messages: [
      {
        sender: 'customer',
        text: 'Where is my order #9942 shipped via express courier?',
        time: '08:20 AM'
      },
      {
        sender: 'ai',
        text: 'Order #9942 has been handed to BlueDart express courier (Tracking #BD849204) and is scheduled for delivery today before 4:00 PM.',
        time: '08:21 AM'
      }
    ]
  },
  {
    id: 'SIQ-1038',
    customerName: 'Carlos Silva',
    customerEmail: 'carlos.silva@global.net',
    subject: 'Payment failed during checkout with Stripe international card',
    category: 'Billing & Payments',
    priority: 'High',
    status: 'In Progress',
    confidence: 0.82,
    channel: 'Email',
    createdOn: '3 hours ago',
    assignedTo: 'Mohit Jain',
    messages: [
      {
        sender: 'customer',
        text: 'Checkout returned error 4002: 3D-Secure authentication timed out.',
        time: '07:22 AM'
      }
    ]
  }
];

export const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(INITIAL_TICKETS[0]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New ticket form
  const [newSubject, setNewSubject] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCategory, setNewCategory] = useState('Billing & Payments');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const filteredTickets = tickets.filter(t => {
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const updatedTicket: Ticket = {
      ...selectedTicket,
      messages: [
        ...selectedTicket.messages,
        {
          sender: 'agent',
          text: replyText,
          time: 'Just now'
        }
      ]
    };

    setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
    setReplyText('');
  };

  const handleUpdateStatus = (ticketId: string, newStatus: Ticket['status']) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t);
    setTickets(updated);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newCustomerEmail) return;
    const added: Ticket = {
      id: `SIQ-${1043 + tickets.length}`,
      customerName: newCustomerEmail.split('@')[0],
      customerEmail: newCustomerEmail,
      subject: newSubject,
      category: newCategory,
      priority: newPriority,
      status: 'Open',
      confidence: 0.91,
      channel: 'Web Portal',
      createdOn: 'Just now',
      assignedTo: 'Unassigned',
      messages: [
        {
          sender: 'customer',
          text: newSubject,
          time: 'Just now'
        }
      ]
    };
    setTickets([added, ...tickets]);
    setSelectedTicket(added);
    setShowCreateModal(false);
    setNewSubject('');
    setNewCustomerEmail('');
  };

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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>
        </div>
      </div>

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
          <div className="space-y-2.5">
            {filteredTickets.map((ticket) => {
              const isSelected = selectedTicket?.id === ticket.id;
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        ticket.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                        ticket.status === 'In Progress' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
                        ticket.status === 'Escalated' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                        'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {ticket.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        ticket.priority === 'High' ? 'bg-rose-500/20 text-rose-300' :
                        ticket.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
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
              );
            })}
          </div>
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
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Escalated">Escalated</option>
                    </select>
                  </div>
                </div>

                <h2 className="text-base font-bold text-slate-100 mb-1">{selectedTicket.subject}</h2>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Customer: <strong className="text-slate-200">{selectedTicket.customerName}</strong></span>
                  <span>·</span>
                  <span>Category: <strong className="text-slate-300">{selectedTicket.category}</strong></span>
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
                      <span className={m.sender === 'ai' ? 'text-cyan-400' : m.sender === 'agent' ? 'text-purple-400' : 'text-slate-300'}>
                        {m.sender === 'customer' ? selectedTicket.customerName : m.sender === 'ai' ? '⚡ SupportIQ AI Agent' : 'Human Support Specialist'}
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
                    onClick={() => setReplyText('Our team has reviewed your request and processed the approval. You should see the confirmation reflected on your dashboard shortly.')}
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
  );
};
