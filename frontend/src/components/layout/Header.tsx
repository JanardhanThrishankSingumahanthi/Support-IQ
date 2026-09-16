import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession, getStoredSession } from '../../lib/auth'

export function Header({
  searchPlaceholder = 'Search conversations, documents, or ask a question...',
  onSearch,
}: {
  searchPlaceholder?: string
  onSearch?: (term: string) => void
}) {
  const navigate = useNavigate()
  const session = getStoredSession()
  const user = session?.user
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleLogout = () => {
    clearSession()
    navigate('/login')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch && searchTerm.trim()) {
      onSearch(searchTerm.trim())
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#070d18]/90 px-4 md:px-6 backdrop-blur-md">
      {/* Search Input with Ctrl+K */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
        <div className="relative flex items-center">
          <svg
            className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-16 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
          />
          <kbd className="pointer-events-none absolute right-3 hidden rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 sm:inline-block">
            Ctrl + K
          </kbd>
        </div>
      </form>

      {/* Right Action Icons & Profile */}
      <div className="flex items-center gap-3 md:gap-5 ml-4">
        {/* System Status Pill */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>All Systems Operational</span>
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
            aria-label="Notifications"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl z-50 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="font-semibold text-white">Notifications</span>
                <span className="text-[10px] text-cyan-400 cursor-pointer">Mark all read</span>
              </div>
              <div className="space-y-2">
                <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                  <p className="font-medium text-slate-200">Knowledge Base Indexed</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">248 documents synced and active.</p>
                </div>
                <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                  <p className="font-medium text-slate-200">Model Evaluation Complete</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">RAG + QLoRA achieved 92% accuracy.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggles (Visual) */}
        <div className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
          <button type="button" className="p-1 rounded text-slate-400 hover:text-amber-300 transition" title="Light mode">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </button>
          <button type="button" className="p-1 rounded bg-slate-800 text-cyan-300" title="Dark mode">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 rounded-xl border border-transparent p-1 hover:border-slate-700 hover:bg-slate-900/80 transition"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 text-xs font-bold text-white shadow-md">
              {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'JA'}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-xs font-semibold text-white leading-tight">
                {user?.full_name || 'Janardhan'}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {user?.role || 'Student'}
              </div>
            </div>
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="font-semibold text-white truncate">{user?.full_name || 'Janardhan'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'janardhan@supportiq.com'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/settings')
                }}
                className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg mt-1"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
