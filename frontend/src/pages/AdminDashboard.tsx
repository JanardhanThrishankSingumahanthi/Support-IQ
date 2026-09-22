import React, { useState, useEffect } from 'react';
import { DonutGauge } from '../components/charts/Charts';
import {
  Users, LifeBuoy, CheckCircle2, FileText, FlaskConical,
  HardDrive, Search, Plus,
  MoreHorizontal, Clock, ArrowUpRight, ChevronRight,
  Shield, UserPlus, Upload, Play, BarChart3, Settings,
  Megaphone, Layers
} from 'lucide-react';
import { getStoredSession } from '../lib/auth';

const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedOn: string;
}

interface TicketItem {
  id: string;
  subject: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdOn: string;
}

export const AdminDashboard: React.FC = () => {
  const [userSearch, setUserSearch] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Customer');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalTickets: 0,
    resolvedTickets: 0,
    totalDocuments: 0,
    experimentsCount: 0,
    openTickets: 0,
    inProgressTickets: 0,
    escalatedTickets: 0,
  });

  // Fetch real backend users, tickets, and analytics
  useEffect(() => {
    const session = getStoredSession();
    const headers = {
      Accept: 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
    };

    // 1. Fetch Users
    fetch(`${apiBase}/api/v1/users`, { headers })
      .then((res) => res.json())
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.items || data?.users || [];
        if (list.length > 0) {
          const mapped: UserItem[] = list.slice(0, 10).map((u: any, idx: number) => ({
            id: String(u.id || idx + 1),
            name: u.full_name || u.email?.split('@')[0] || 'User',
            email: u.email || 'user@example.com',
            role: u.role || 'Customer',
            status: u.is_active ? 'Active' : 'Inactive',
            joinedOn: u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'
          }));
          setUsers(mapped);
          setAnalytics((prev) => ({ ...prev, totalUsers: data.meta?.total || list.length }));
        }
      })
      .catch(() => {});

    // 2. Fetch Tickets
    fetch(`${apiBase}/api/v1/support-tickets?page=1&page_size=5`, { headers })
      .then((res) => res.json())
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.items || [];
        if (list.length > 0) {
          const mapped: TicketItem[] = list.map((t: any) => ({
            id: `#${t.id}`,
            subject: t.subject || t.title || 'Support Request',
            priority: (t.priority as any) || 'Medium',
            status: (t.status as any) || 'Open',
            createdOn: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recently'
          }));
          setTickets(mapped);
        }
      })
      .catch(() => {});

    // 3. Fetch Analytics Overview & Experiments
    Promise.all([
      fetch(`${apiBase}/api/v1/analytics/overview`, { headers }),
      fetch(`${apiBase}/api/v1/experiments`, { headers }),
    ])
      .then(async ([overRes, expRes]) => {
        if (overRes.ok) {
          const oData = await overRes.json();
          setAnalytics((prev) => ({
            ...prev,
            totalTickets: oData.total_tickets || 0,
            resolvedTickets: oData.tickets_resolved || 0,
            totalDocuments: oData.total_documents || 0,
            totalUsers: oData.active_users || prev.totalUsers || 1,
            openTickets: (oData.resolution_breakdown?.find((b: any) => b.name?.includes('Open'))?.count) || 0,
            inProgressTickets: (oData.resolution_breakdown?.find((b: any) => b.name?.includes('Progress'))?.count) || 0,
          }));
        }
        if (expRes.ok) {
          const eData = await expRes.json();
          const count = eData.total || (eData.items || []).length || (Array.isArray(eData) ? eData.length : 0);
          setAnalytics((prev) => ({ ...prev, experimentsCount: count }));
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName) return;
    const session = getStoredSession();
    const roleName = newUserRole === 'Admin' ? 'Administrator' : newUserRole === 'Support' ? 'Support Agent' : 'Viewer';

    try {
      const res = await fetch(`${apiBase}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
        },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          full_name: newUserName.trim(),
          role_name: roleName,
          password: 'Password123!',
        })
      });
      if (res.ok) {
        const created = await res.json();
        const u = created.user || created;
        const added: UserItem = {
          id: String(u.id),
          name: u.full_name || newUserName,
          email: u.email || newUserEmail,
          role: u.role || newUserRole,
          status: u.is_active ? 'Active' : 'Inactive',
          joinedOn: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        };
        setUsers([added, ...users]);
        setAnalytics(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
      }
    } catch {
      // ignore
    }
    setNewUserName('');
    setNewUserEmail('');
    setShowAddUserModal(false);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject) return;
    const session = getStoredSession();

    try {
      const res = await fetch(`${apiBase}/api/v1/support-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
        },
        body: JSON.stringify({
          subject: newTicketSubject.trim(),
          description: newTicketSubject.trim(),
          priority: newTicketPriority,
          category: 'General',
        })
      });
      if (res.ok) {
        const created = await res.json();
        const newT: TicketItem = {
          id: `#${created.id}`,
          subject: created.subject || newTicketSubject,
          priority: created.priority || newTicketPriority,
          status: created.status || 'Open',
          createdOn: 'Just now',
        };
        setTickets([newT, ...tickets]);
        setAnalytics(prev => ({ ...prev, totalTickets: prev.totalTickets + 1, openTickets: prev.openTickets + 1 }));
      }
    } catch {
      // ignore
    }
    setNewTicketSubject('');
    setShowAddTicketModal(false);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) || 
    t.id.toLowerCase().includes(ticketSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Banner matching Image 9 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-slate-400">
              Manage users, monitor system health, and keep SupportIQ running smoothly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{new Date().toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* 6 Top Stat Cards matching Image 9 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Total Users</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{analytics.totalUsers || users.length || 0}</div>
          <div className="text-[11px] text-cyan-400 mt-1">Live Database</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Total Tickets</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <LifeBuoy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{analytics.totalTickets || tickets.length || 0}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Support Queue</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Resolved Tickets</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{analytics.resolvedTickets}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            {analytics.totalTickets > 0 ? `${Math.round((analytics.resolvedTickets / analytics.totalTickets) * 100)}% resolution rate` : '0%'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Knowledge Base Docs</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{analytics.totalDocuments}</div>
          <div className="text-[11px] text-purple-400 mt-1">Indexed & Verified</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Experiments</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <FlaskConical className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{analytics.experimentsCount}</div>
          <div className="text-[11px] text-cyan-400 mt-1">Model Variants</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">System Uptime</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <HardDrive className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">99.9%</div>
          <div className="text-[11px] text-slate-400 mt-1">Operational</div>
        </div>
      </div>

      {/* Middle Row: System Overview, Ticket Status Distribution, Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Overview: 4 Hardware Gauges */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">System Overview</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5">
                View Details <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Real-time resource utilization</p>

            <div className="grid grid-cols-2 gap-4 my-auto">
              <div className="flex flex-col items-center">
                <DonutGauge value={42} max={100} size={110} strokeWidth={10} color="#06b6d4" label="CPU Usage" />
                <span className="text-xs text-slate-300 font-medium mt-1">42%</span>
                <span className="text-[10px] text-slate-500">8 Cores Active</span>
              </div>
              <div className="flex flex-col items-center">
                <DonutGauge value={68} max={100} size={110} strokeWidth={10} color="#a855f7" label="RAM Usage" />
                <span className="text-xs text-slate-300 font-medium mt-1">68%</span>
                <span className="text-[10px] text-slate-500">21.8 / 32 GB</span>
              </div>
              <div className="flex flex-col items-center">
                <DonutGauge value={54} max={100} size={110} strokeWidth={10} color="#10b981" label="Disk Space" />
                <span className="text-xs text-slate-300 font-medium mt-1">54%</span>
                <span className="text-[10px] text-slate-500">270 / 500 GB</span>
              </div>
              <div className="flex flex-col items-center">
                <DonutGauge value={76} max={100} size={110} strokeWidth={10} color="#f59e0b" label="GPU Load" />
                <span className="text-xs text-slate-300 font-medium mt-1">76%</span>
                <span className="text-[10px] text-slate-500">NVIDIA RTX 4090</span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Cluster Status: <strong className="text-emerald-400 font-medium">Healthy</strong></span>
            <span>Load Average: 1.42</span>
          </div>
        </div>

        {/* Ticket Status Distribution */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Ticket Status Distribution</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5">
                View Reports <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">Breakdown of support tickets across states</p>

            <div className="flex justify-center my-2">
              <DonutGauge 
                value={analytics.totalTickets || tickets.length || 1} 
                max={analytics.totalTickets || tickets.length || 1} 
                size={140} 
                strokeWidth={14} 
                color="#10b981" 
                label="Total Tickets" 
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-3 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Resolved</span>
              </div>
              <span className="font-medium text-slate-200">{analytics.resolvedTickets}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span>In Progress</span>
              </div>
              <span className="font-medium text-slate-200">{analytics.inProgressTickets}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Open</span>
              </div>
              <span className="font-medium text-slate-200">{analytics.openTickets}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Escalated</span>
              </div>
              <span className="font-medium text-slate-200">{analytics.escalatedTickets}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline matching Image 9 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Recent Activity</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Audit trail and system events log</p>

            <div className="space-y-3 text-xs max-h-72 overflow-y-auto pr-1">
              {[
                { title: 'New document uploaded', desc: 'Return_Policy.pdf', time: '10 min ago', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: FileText },
                { title: 'User registered', desc: 'rahul.kumar@example.com', time: '22 min ago', color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: UserPlus },
                { title: 'Model experiment completed', desc: 'RAG + QLoRA (v2)', time: '1 hour ago', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: FlaskConical },
                { title: 'Ticket escalated', desc: '#SIQ-1042', time: '2 hours ago', color: 'text-rose-400', bg: 'bg-rose-500/10', icon: LifeBuoy },
                { title: 'System backup completed', desc: 'Daily backup successful', time: '3 hours ago', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: HardDrive },
                { title: 'Knowledge base updated', desc: '12 documents indexed', time: '4 hours ago', color: 'text-indigo-400', bg: 'bg-indigo-500/10', icon: Layers },
                { title: 'New admin login', desc: 'admin@supportiq.com', time: '5 hours ago', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Shield },
                { title: 'Model deployed', desc: 'QLoRA (v2.1)', time: '6 hours ago', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Play },
              ].map((ev, idx) => {
                const IconComponent = ev.icon;
                return (
                  <div key={idx} className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-6 h-6 rounded-lg ${ev.bg} ${ev.color} flex items-center justify-center shrink-0 mt-0.5`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-200 text-xs">{ev.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{ev.desc}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{ev.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row 1: User Management & Recent Support Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management Mini Table */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">User Management</h2>
              <p className="text-xs text-slate-400">Team members, support agents, and customer accounts</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAddUserModal(true)}
                className="px-2.5 py-1 text-xs rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add User
              </button>
              <button className="text-xs text-cyan-400 hover:underline">View All →</button>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Joined On</th>
                  <th className="pb-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-medium text-slate-200 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{u.name}</span>
                    </td>
                    <td className="py-2.5 text-slate-400 text-[11px] font-mono truncate">{u.email}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        u.role === 'Admin' ? 'bg-purple-500/20 text-purple-300' :
                        u.role === 'Support' ? 'bg-cyan-500/20 text-cyan-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 text-[11px]">{u.joinedOn}</td>
                    <td className="py-2.5 text-right">
                      <button className="text-slate-500 hover:text-slate-300">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Support Tickets Mini Table */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Recent Support Tickets</h2>
              <p className="text-xs text-slate-400">Incoming inquiries and escalation queue</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAddTicketModal(true)}
                className="px-2.5 py-1 text-xs rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Ticket
              </button>
              <button className="text-xs text-cyan-400 hover:underline">View All →</button>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={ticketSearch}
              onChange={(e) => setTicketSearch(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Subject</th>
                  <th className="pb-2 font-medium">Priority</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Created On</th>
                  <th className="pb-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-mono text-[11px] text-cyan-400">{t.id}</td>
                    <td className="py-2.5 font-medium text-slate-200 truncate max-w-[180px]">{t.subject}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        t.priority === 'High' ? 'bg-rose-500/20 text-rose-300' :
                        t.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        t.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        t.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 text-[11px]">{t.createdOn}</td>
                    <td className="py-2.5 text-right">
                      <button className="text-slate-500 hover:text-slate-300">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Row 2: Model Management, Knowledge Base Stats, Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Management */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-100">Model Management</h2>
            <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">View All →</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { name: 'Llama-3-8B-Instruct', type: 'Base LLM', status: 'Active', ver: '1.0', updated: '20 Aug 2026' },
              { name: 'RAG (Base)', type: 'RAG', status: 'Active', ver: '1.1', updated: '25 Aug 2026' },
              { name: 'LoRA (Fine-tuned)', type: 'Fine-tuned', status: 'Active', ver: '1.2', updated: '2 Sep 2026' },
              { name: 'QLoRA (Proposed)', type: 'Fine-tuned', status: 'Active', ver: '2.1', updated: '7 Sep 2026' },
            ].map((m) => (
              <div key={m.name} className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-200">{m.name}</div>
                  <div className="text-[11px] text-slate-400">{m.type} · v{m.ver}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {m.status}
                  </span>
                  <button className="text-slate-500 hover:text-slate-300">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Base Stats */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-100">Knowledge Base Stats</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">View All →</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2.5 rounded-lg bg-slate-800/50 text-center">
                <div className="text-base font-bold text-slate-100">248</div>
                <div className="text-[10px] text-slate-400">Total Documents</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/50 text-center">
                <div className="text-base font-bold text-slate-100">18,436</div>
                <div className="text-[10px] text-slate-400">Total Chunks</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/50 text-center">
                <div className="text-base font-bold text-slate-100">1.2 GB</div>
                <div className="text-[10px] text-slate-400">Storage Used</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-medium text-slate-400 mb-1">Top Categories</div>
              {[
                { name: 'Billing & Payments', percent: 28, color: '#06b6d4' },
                { name: 'Account Management', percent: 18, color: '#3b82f6' },
                { name: 'Technical Support', percent: 16, color: '#8b5cf6' },
                { name: 'Product Information', percent: 14, color: '#f59e0b' },
                { name: 'Refunds & Returns', percent: 12, color: '#ec4899' },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-300 w-32 truncate">{c.name}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.percent * 3}%`, backgroundColor: c.color }} />
                  </div>
                  <span className="text-slate-400 w-8 text-right font-mono">{c.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions matching Image 9 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-400 mb-3">High-frequency management tasks</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2.5 text-xs text-slate-200"
            >
              <UserPlus className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-medium text-xs">Add User</span>
            </button>

            <button 
              onClick={() => alert('Opening Document Ingestion Dialog...')}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2.5 text-xs text-slate-200"
            >
              <Upload className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-medium text-xs">Upload Document</span>
            </button>

            <button 
              onClick={() => window.location.href = '#/experiments'}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2.5 text-xs text-slate-200"
            >
              <Play className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium text-xs">Run Experiment</span>
            </button>

            <button 
              onClick={() => window.location.href = '#/analytics'}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2.5 text-xs text-slate-200"
            >
              <BarChart3 className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-medium text-xs">View Reports</span>
            </button>

            <button 
              onClick={() => window.location.href = '#/security'}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2.5 text-xs text-slate-200"
            >
              <Settings className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-medium text-xs">System Settings</span>
            </button>

            <button 
              onClick={() => alert('Broadcast announcement prompt dialog')}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2.5 text-xs text-slate-200"
            >
              <Megaphone className="w-4 h-4 text-pink-400 shrink-0" />
              <span className="font-medium text-xs">Send Announcement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-1">Add New User</h3>
            <p className="text-xs text-slate-400 mb-4">Create a new team member or customer profile.</p>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Maya Patel"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. maya@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="Customer">Customer</option>
                  <option value="Support">Support Agent</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Ticket Modal */}
      {showAddTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-1">Create Support Ticket</h3>
            <p className="text-xs text-slate-400 mb-4">Log an incoming customer inquiry or issue.</p>

            <form
              onSubmit={handleCreateTicket}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="e.g. Account access issues"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Priority</label>
                <select
                  value={newTicketPriority}
                  onChange={(e) => setNewTicketPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTicketModal(false)}
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
