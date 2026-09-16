import React, { useState } from 'react';
import { DonutGauge } from '../components/charts/Charts';
import {
  Shield, Lock, Users, Clock, Key,
  CheckCircle2, XCircle,
  Download, Database, RefreshCw, FileText,
  Sliders, Trash2, Globe
} from 'lucide-react';

export const Security: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  
  // Toggles for Authentication & Access Control matching Image 10
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [passwordPolicy, setPasswordPolicy] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30 minutes');
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanMessage('Security scan complete: 0 vulnerabilities detected across 1,842 vectors.');
      setTimeout(() => setScanMessage(null), 5000);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner matching Image 10 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Security</h1>
            <p className="text-sm text-slate-400">
              Protect your data, users, and systems with enterprise-grade security controls.
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>All Systems Secure</span>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Tabs Row matching Image 10 */}
      <div className="flex items-center gap-1 border-b border-slate-800/80 overflow-x-auto pb-px">
        {[
          'Overview',
          'Access Control',
          'Authentication',
          'Data Protection',
          'Audit Logs',
          'Threat Monitoring',
          'Compliance'
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

      {/* 5 Top KPI Cards matching Image 10 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Security Status</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">Secure</div>
          <div className="text-[11px] text-slate-400 mt-1">No active threats</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Active Users</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">256</div>
          <div className="text-[11px] text-cyan-400 mt-1">0 suspicious activity</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Failed Login Attempts</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">3</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">↓ 85% from last week</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Data Encrypted</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-300">100%</div>
          <div className="text-[11px] text-slate-400 mt-1">In transit & at rest</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Last Security Scan</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-semibold text-slate-200 mt-1">11 Sep 2026, 08:12 AM</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            No vulnerabilities found
          </div>
        </div>
      </div>

      {/* Middle Row 1: Auth & Access Control, Roles & Permissions, Recent Security Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Authentication & Access Control Card */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Authentication & Access Control</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">Edit Settings →</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Credentials, tokens, and authorization policies</p>

            <div className="space-y-4 text-xs">
              {/* MFA Toggle */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-200">Multi-Factor Authentication (MFA)</div>
                  <div className="text-[11px] text-slate-400">Add an extra layer of security for all admin users.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setMfaEnabled(!mfaEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${mfaEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${mfaEnabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {/* Password Policy Toggle */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-200">Password Policy</div>
                  <div className="text-[11px] text-slate-400">Enforce strong password requirements.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordPolicy(!passwordPolicy)}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${passwordPolicy ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${passwordPolicy ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {/* Session Timeout */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-200">Session Timeout</div>
                  <div className="text-[11px] text-slate-400">Automatically log out inactive users.</div>
                </div>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>4 hours</option>
                </select>
              </div>

              {/* SSO Toggle */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-200">Single Sign-On (SSO)</div>
                  <div className="text-[11px] text-slate-400">Enable login via institutional/organization SSO.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSsoEnabled(!ssoEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${ssoEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${ssoEnabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Roles & Permissions Card matching Image 10 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">User Roles & Permissions</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">Manage Roles →</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Granular RBAC entitlement matrix</p>

            <div className="space-y-3 text-xs">
              {[
                { title: 'Administrator', desc: 'Full access to all features', count: '12 users', color: 'bg-rose-500/20 text-rose-300' },
                { title: 'Support Agent', desc: 'Manage tickets and view knowledge base', count: '68 users', color: 'bg-blue-500/20 text-blue-300' },
                { title: 'Knowledge Manager', desc: 'Upload and manage documents', count: '8 users', color: 'bg-purple-500/20 text-purple-300' },
                { title: 'Data Scientist', desc: 'Run experiments and manage models', count: '6 users', color: 'bg-emerald-500/20 text-emerald-300' },
                { title: 'Viewer', desc: 'Read-only access', count: '162 users', color: 'bg-slate-800 text-slate-400' },
              ].map((r) => (
                <div key={r.title} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                  <div>
                    <div className="font-medium text-slate-200">{r.title}</div>
                    <div className="text-[11px] text-slate-500">{r.desc}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ${r.color}`}>
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Security Events Timeline matching Image 10 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Recent Security Events</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">View All →</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Live event stream from authentication servers</p>

            <div className="space-y-2.5 text-xs max-h-72 overflow-y-auto pr-1">
              {[
                {
                  title: 'Successful login',
                  desc: 'janardhan@supportiq.com · IP: 117.240.XX.XX',
                  time: '11 Sep 2026, 10:24 AM',
                  status: 'ok',
                },
                {
                  title: 'Failed login attempt',
                  desc: 'unknown@domain.com · IP: 185.199.XX.XX',
                  time: '11 Sep 2026, 09:18 AM',
                  status: 'fail',
                },
                {
                  title: 'Role updated',
                  desc: 'User priya@supportiq.com changed to Support Agent',
                  time: '11 Sep 2026, 08:45 AM',
                  status: 'info',
                },
                {
                  title: 'Document access',
                  desc: 'rahul@supportiq.com viewed: Return_Policy.pdf',
                  time: '11 Sep 2026, 08:12 AM',
                  status: 'info',
                },
                {
                  title: 'New document uploaded',
                  desc: 'sneha@supportiq.com file: Terms_of_Service.pdf',
                  time: '11 Sep 2026, 07:56 AM',
                  status: 'ok',
                },
              ].map((ev, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-slate-800/30">
                  <div className="flex items-start gap-2">
                    {ev.status === 'ok' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    ) : ev.status === 'fail' ? (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                    ) : (
                      <Key className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-slate-200 text-xs">{ev.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">{ev.desc}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{ev.time.split(',')[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row 2: Data Protection, Threat Monitoring, Compliance & Privacy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Protection Card */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Data Protection</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">Configure →</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Cryptographic storage and network transport protocols</p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
                <Database className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200">Encryption at Rest</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-medium">
                      ✔ Enabled
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    All documents, embeddings, and user data are encrypted using AES-256 with key rotation.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
                <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200">Encryption in Transit</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-medium">
                      ✔ Enabled
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    All client-server communications use TLS 1.3 with strict HSTS preloading.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Threat Monitoring Donut Gauge */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Threat Monitoring</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">View Details →</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">Automated intrusion prevention & anomalous heuristics</p>

            <div className="flex justify-center my-2">
              <DonutGauge 
                value={0} 
                max={100} 
                size={130} 
                strokeWidth={12} 
                color="#10b981" 
                label="Active Threats" 
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-3 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Safe</span>
              </div>
              <span className="font-medium text-slate-200">99.8%</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Suspicious</span>
              </div>
              <span className="font-medium text-slate-200">0.1%</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Critical</span>
              </div>
              <span className="font-medium text-slate-200">0.0%</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Blocked</span>
              </div>
              <span className="font-medium text-slate-200">0.1%</span>
            </div>
          </div>
        </div>

        {/* Compliance & Privacy Card matching Image 10 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-100">Compliance & Privacy</h2>
              <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">View Details →</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Regulatory standards and privacy policies</p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-200">GDPR Compliant</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-medium">
                  ✔ Compliant
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-200">Data Retention Policy</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                  1 Year
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span className="text-slate-200">User Data Deletion</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                  Automated & On Request
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-200">Access Logging</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-medium">
                  ✔ Enabled
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Login Activity Table & Security Actions matching Image 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Login Activity (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Recent Login Activity</h2>
              <p className="text-xs text-slate-400">Authentication sessions and geographic origin detection</p>
            </div>
            <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">View All →</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">IP Address</th>
                  <th className="pb-2 font-medium">Location</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {[
                  { email: 'janardhan@supportiq.com', role: 'Admin', ip: '117.240.XX.XX', loc: 'India', status: 'Success', time: '10:24 AM' },
                  { email: 'priya@supportiq.com', role: 'Support Agent', ip: '49.204.XX.XX', loc: 'India', status: 'Success', time: '09:12 AM' },
                  { email: 'unknown@domain.com', role: '—', ip: '185.199.XX.XX', loc: 'Unknown', status: 'Failed', time: '09:18 AM' },
                  { email: 'rahul@supportiq.com', role: 'Knowledge Manager', ip: '103.197.XX.XX', loc: 'India', status: 'Success', time: '08:45 AM' },
                  { email: 'sneha@supportiq.com', role: 'Data Scientist', ip: '157.51.XX.XX', loc: 'India', status: 'Success', time: '07:56 AM' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-mono text-[11px] text-slate-200">{row.email}</td>
                    <td className="py-2.5 text-slate-400 text-[11px]">{row.role}</td>
                    <td className="py-2.5 font-mono text-slate-400 text-[11px]">{row.ip}</td>
                    <td className="py-2.5 text-slate-400">{row.loc}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        row.status === 'Success' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 text-right text-[11px]">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Actions (1 Col) */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 mb-1">Security Actions</h2>
            <p className="text-xs text-slate-400 mb-4">Execute administrative security procedures</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button 
              onClick={handleScan}
              disabled={isScanning}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2 text-xs text-slate-200 disabled:opacity-50"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <div>
                <div className="font-medium text-[11px]">Run Security Scan</div>
                <div className="text-[9px] text-slate-400">Check vulnerabilities</div>
              </div>
            </button>

            <button 
              onClick={() => alert('Viewing tamper-evident audit logs...')}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2 text-xs text-slate-200"
            >
              <FileText className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="font-medium text-[11px]">View Audit Logs</div>
                <div className="text-[9px] text-slate-400">Track user activities</div>
              </div>
            </button>

            <button 
              onClick={() => alert('Exporting SOC2 compliance security report...')}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2 text-xs text-slate-200"
            >
              <Download className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-medium text-[11px]">Export Security Report</div>
                <div className="text-[9px] text-slate-400">Download PDF/CSV</div>
              </div>
            </button>

            <button 
              onClick={() => alert('Firewall IP access rules configuration')}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2 text-xs text-slate-200"
            >
              <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-medium text-[11px]">Configure Firewall</div>
                <div className="text-[9px] text-slate-400">Manage IP restrictions</div>
              </div>
            </button>

            <button 
              onClick={() => alert('API Key token generator dialog')}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2 text-xs text-slate-200"
            >
              <Key className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="font-medium text-[11px]">Manage API Keys</div>
                <div className="text-[9px] text-slate-400">Create or revoke keys</div>
              </div>
            </button>

            <button 
              onClick={() => alert('Historical logs purged. Reclaimed 450 MB.')}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex items-center gap-2 text-xs text-slate-200"
            >
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <div className="font-medium text-[11px]">Purge Old Logs</div>
                <div className="text-[9px] text-slate-400">Free up storage</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
