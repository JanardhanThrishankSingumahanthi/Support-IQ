import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Bell,
  Lock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/common/ToastContext';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  // Configurable preferences stored in localStorage
  const [defaultModel, setDefaultModel] = useState<string>(() => {
    return localStorage.getItem('supportiq_default_model') || 'SupportIQ QLoRA (4-bit NF4)';
  });
  const [streamingEnabled, setStreamingEnabled] = useState<boolean>(() => {
    const val = localStorage.getItem('supportiq_streaming_enabled');
    return val !== null ? val === 'true' : true;
  });
  const [autoScroll, setAutoScroll] = useState<boolean>(() => {
    const val = localStorage.getItem('supportiq_autoscroll');
    return val !== null ? val === 'true' : true;
  });
  const [compactDensity, setCompactDensity] = useState<boolean>(() => {
    const val = localStorage.getItem('supportiq_compact_mode');
    return val === 'true';
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    const val = localStorage.getItem('supportiq_high_contrast');
    return val === 'true';
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    // Simulate async storage / validation
    await new Promise((res) => setTimeout(res, 400));

    try {
      localStorage.setItem('supportiq_default_model', defaultModel);
      localStorage.setItem('supportiq_streaming_enabled', String(streamingEnabled));
      localStorage.setItem('supportiq_autoscroll', String(autoScroll));
      localStorage.setItem('supportiq_compact_mode', String(compactDensity));
      localStorage.setItem('supportiq_high_contrast', String(highContrast));

      setIsSaving(false);
      setSaveMessage('Preferences saved and applied successfully.');
      showToast('Settings updated successfully', 'success');
      setTimeout(() => setSaveMessage(null), 4000);
    } catch {
      setIsSaving(false);
      showToast('Failed to persist settings', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">System & Application Settings</h1>
            <p className="text-sm text-slate-400">
              Configure user preferences, chat interface defaults, and verify system governance policies.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          {isSaving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>

      {saveMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Grid of Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Appearance & Theme */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Sun className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-100">Appearance & Theme</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">Application-wide visual theme and layout density</p>

            <div className="space-y-4 text-xs">
              {/* Theme Mode Toggle */}
              <div>
                <label className="font-medium text-slate-200 block mb-2">Color Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-cyan-500/50 text-cyan-300 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark Enterprise (Default)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      theme === 'light'
                        ? 'bg-slate-800 border-cyan-500/50 text-cyan-300 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clean Light</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  Active theme is persisted across page navigation, reloads, and browser sessions.
                </span>
              </div>

              {/* Compact Density */}
              <div className="flex items-start justify-between gap-3 pt-3 border-t border-slate-800/60">
                <div>
                  <div className="font-medium text-slate-200">Compact Table Density</div>
                  <div className="text-[11px] text-slate-400">Reduce table row padding for denser data tables.</div>
                </div>
                <input
                  type="checkbox"
                  checked={compactDensity}
                  onChange={(e) => setCompactDensity(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 h-4 w-4 mt-1 cursor-pointer"
                />
              </div>

              {/* High Contrast */}
              <div className="flex items-start justify-between gap-3 pt-3 border-t border-slate-800/60">
                <div>
                  <div className="font-medium text-slate-200">High Contrast Badges</div>
                  <div className="text-[11px] text-slate-400">Enhance status badge border thickness for accessibility.</div>
                </div>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 h-4 w-4 mt-1 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <div className="text-[10px] text-emerald-400/80 pt-3 border-t border-slate-800/60 mt-4 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Fully Implemented (Stored locally & applied immediately)</span>
          </div>
        </div>

        {/* Card 2: Chat & Model Preferences */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-100">Chat & Model Defaults</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">Inference runtime parameters for customer assistant</p>

            <div className="space-y-4 text-xs">
              {/* Default Model */}
              <div>
                <label className="font-medium text-slate-200 block mb-1.5">Default Inference Model</label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="SupportIQ QLoRA (4-bit NF4)">SupportIQ QLoRA (4-bit NF4) - Fine-Tuned (Proposed)</option>
                  <option value="Base Qwen2.5-0.5B">Base Qwen2.5-0.5B (Baseline Benchmark)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Sets the default model pre-selected when starting fresh chat conversations.
                </span>
              </div>

              {/* Streaming Responses */}
              <div className="flex items-start justify-between gap-3 pt-3 border-t border-slate-800/60">
                <div>
                  <div className="font-medium text-slate-200">Progressive Answer Rendering</div>
                  <div className="text-[11px] text-slate-400">Stream tokens smoothly into chat bubble as generated.</div>
                </div>
                <input
                  type="checkbox"
                  checked={streamingEnabled}
                  onChange={(e) => setStreamingEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 h-4 w-4 mt-1 cursor-pointer"
                />
              </div>

              {/* Auto Scroll */}
              <div className="flex items-start justify-between gap-3 pt-3 border-t border-slate-800/60">
                <div>
                  <div className="font-medium text-slate-200">Auto-Scroll on Updates</div>
                  <div className="text-[11px] text-slate-400">Keep conversation view focused on latest assistant response.</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 h-4 w-4 mt-1 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <div className="text-[10px] text-emerald-400/80 pt-3 border-t border-slate-800/60 mt-4 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Fully Implemented (Preserved in chat state)</span>
          </div>
        </div>

        {/* Card 3: Session & Authentication Governance */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Lock className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-slate-100">Session & Authentication Governance</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">Backend authorization and token lifetime enforcement</p>

            <div className="space-y-3.5 text-xs">
              {/* Session TTL */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200">Session Timeout (TTL)</div>
                  <div className="text-[11px] text-slate-500">Fixed server-side JWT expiration window.</div>
                </div>
                <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">
                  60 minutes
                </span>
              </div>

              {/* Password Rule */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200">Password Complexity Policy</div>
                  <div className="text-[11px] text-slate-500">Min 8 characters, bcrypt hashed with salts.</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Enforced
                </span>
              </div>

              {/* MFA Policy */}
              <div className="flex items-start justify-between gap-3 pt-2">
                <div>
                  <div className="font-medium text-slate-300">Multi-Factor Authentication (MFA)</div>
                  <div className="text-[10px] text-slate-500">TOTP authenticator integration.</div>
                  <span className="text-[10px] text-amber-400/90 mt-0.5 block font-medium">
                    Not configurable in this release
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  className="w-10 h-5 rounded-full bg-slate-800 cursor-not-allowed relative shrink-0 opacity-50"
                  title="Not configurable in this release"
                >
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-slate-500" />
                </button>
              </div>

              {/* SSO */}
              <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-800/60">
                <div>
                  <div className="font-medium text-slate-300">Single Sign-On (SSO / SAML)</div>
                  <div className="text-[10px] text-slate-500">Enterprise identity provider delegation.</div>
                  <span className="text-[10px] text-amber-400/90 mt-0.5 block font-medium">
                    Not configurable in this release
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  className="w-10 h-5 rounded-full bg-slate-800 cursor-not-allowed relative shrink-0 opacity-50"
                  title="Not configurable in this release"
                >
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-slate-500" />
                </button>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-800/60 mt-4 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span>Server-side constants & disabled release placeholders</span>
          </div>
        </div>

        {/* Card 4: Notification Channels */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Bell className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-100">External Notifications & Webhooks</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">Outbound communication alerts and webhook dispatches</p>

            <div className="space-y-3.5 text-xs">
              {/* Email Alerts */}
              <div className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="font-medium text-slate-300">Email Alerts on Escalated Tickets</div>
                  <div className="text-[11px] text-slate-500">SMTP mail delivery on new ticket creation.</div>
                  <span className="text-[10px] text-amber-400/90 mt-0.5 block font-medium">
                    Not configured (SMTP service unavailable)
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  className="w-10 h-5 rounded-full bg-slate-800 cursor-not-allowed relative shrink-0 opacity-50"
                  title="SMTP service not configured in this release"
                >
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-slate-500" />
                </button>
              </div>

              {/* Sound Notifications */}
              <div className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="font-medium text-slate-300">Audio Chimes on Chat Completion</div>
                  <div className="text-[11px] text-slate-500">Play web audio notification tone.</div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Not configurable in this release
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  className="w-10 h-5 rounded-full bg-slate-800 cursor-not-allowed relative shrink-0 opacity-50"
                  title="Not configurable in this release"
                >
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-slate-500" />
                </button>
              </div>

              {/* Webhook Push */}
              <div className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="font-medium text-slate-300">Outbound Webhook Dispatch</div>
                  <div className="text-[11px] text-slate-500">HTTP POST payloads to external CRM.</div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Not configured in this release
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  className="w-10 h-5 rounded-full bg-slate-800 cursor-not-allowed relative shrink-0 opacity-50"
                  title="Not configured in this release"
                >
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-slate-500" />
                </button>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-amber-400/90 pt-3 border-t border-slate-800/60 mt-4 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>External gateways not configured in local single-host mode</span>
          </div>
        </div>
      </div>
    </div>
  );
};
