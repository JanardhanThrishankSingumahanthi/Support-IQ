import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/brand/Logo'

const apiBase = import.meta.env.VITE_API_URL ?? ''

export function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [roleName, setRoleName] = useState('Customer')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()

    // 1. Required fields validation
    if (!trimmedName) {
      setError('Please provide your full name.')
      return
    }

    if (!trimmedEmail) {
      setError('Please provide a valid email address.')
      return
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please provide a valid email address.')
      return
    }

    // 3. Password length / strength validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    // 4. Password confirmation match validation
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and re-enter.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${apiBase}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          full_name: trimmedName,
          password: password,
          role_name: roleName,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const detailMsg =
          payload?.message ||
          payload?.detail?.message ||
          (typeof payload?.detail === 'string' ? payload.detail : null) ||
          (Array.isArray(payload?.detail) && payload.detail[0]?.msg ? payload.detail[0].msg : null) ||
          'Registration failed. Please check your information and try again.'
        throw new Error(detailMsg)
      }

      setSuccess('Account created successfully! Redirecting to sign in...')
      // Clear password fields for security
      setPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Unable to connect to authentication server. Please verify backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#070d18] text-slate-100 selection:bg-cyan-500/30">
      {/* Left Column: Brand Hero Presentation */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-slate-800/80 bg-gradient-to-b from-[#091222] via-[#060c18] to-[#040810] p-12 lg:flex">
        {/* Top Logo */}
        <div className="z-10">
          <Logo variant="compact" size="lg" />
        </div>

        {/* Hero Copy & Pipeline Steps */}
        <div className="z-10 my-auto max-w-xl space-y-6 pt-8">
          <div className="h-1 w-10 bg-cyan-400 rounded-full mb-4" />
          <h1 className="text-4xl font-extrabold tracking-tight text-white xl:text-5xl leading-tight">
            From Questions to <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">Real Solutions.</span>
          </h1>
          <p className="text-sm leading-relaxed text-slate-300 max-w-md">
            Join SupportIQ to experience grounded AI customer support, evidence verification, and fine-tuned neural models.
          </p>

          {/* 3-Step Pipeline Row */}
          <div className="pt-4 flex items-center gap-3">
            <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md">
              <div className="h-7 w-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-2">
                📄
              </div>
              <h4 className="text-xs font-bold text-white">Retrieve</h4>
              <p className="text-[11px] text-slate-400 mt-1">Find relevant information</p>
            </div>

            <div className="text-slate-600 font-bold">→</div>

            <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md">
              <div className="h-7 w-7 rounded-lg bg-teal-500/15 text-teal-300 flex items-center justify-center mb-2">
                🛡
              </div>
              <h4 className="text-xs font-bold text-white">Verify</h4>
              <p className="text-[11px] text-slate-400 mt-1">Ground answers for reliability</p>
            </div>

            <div className="text-slate-600 font-bold">→</div>

            <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md">
              <div className="h-7 w-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center mb-2">
                💬
              </div>
              <h4 className="text-xs font-bold text-white">Resolve</h4>
              <p className="text-[11px] text-slate-400 mt-1">Deliver accurate, helpful support</p>
            </div>
          </div>

          {/* Quote badge */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 mt-6 flex items-center justify-between text-xs text-slate-400">
            <div>
              <p className="text-slate-300 font-semibold">Self-Service Onboarding</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Secure, role-based registration for customer accounts</p>
            </div>
            <div className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 text-[10px] font-medium text-cyan-300">
              SECURE ACCESS
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="z-10 text-xs text-slate-500 space-y-1">
          <div className="h-0.5 w-12 bg-cyan-500/40 mb-3" />
          <p className="text-slate-400">Smarter Support. Stronger Relationships.</p>
          <p className="text-[11px]">© 2026 SupportIQ. All rights reserved.</p>
        </div>

        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* Right Column: Authentication Form Card */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-12 lg:w-1/2 lg:p-16">
        {/* Top bar controls */}
        <div className="flex items-center justify-between lg:justify-end gap-3">
          <div className="lg:hidden">
            <Logo variant="compact" size="sm" />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1">
              <span>🌐</span>
              <span>English</span>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Center Auth Card */}
        <div className="mx-auto my-auto w-full max-w-md rounded-3xl border border-slate-800 bg-[#0c1424]/90 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Create Account</h2>
            <p className="text-xs text-slate-400">Sign up for your individual SupportIQ credentials</p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300">Full Name</label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alicia Gomez"
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Email address</label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Account Role</label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 pl-10 pr-4 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="Customer">Customer (Standard Support & Chat)</option>
                  <option value="Viewer">Viewer (Read-Only Knowledge Access)</option>
                </select>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Staff roles (Admin, Agent, Data Scientist) are provisioned through internal administration.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 pl-10 pr-10 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Confirm Password</label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 pl-10 pr-10 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showConfirmPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 font-semibold text-xs text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                <>
                  <span>Create Account</span>
                  <span>→</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 pt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-semibold text-cyan-400 hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-6">
          <button type="button" className="hover:text-slate-300">Privacy</button>
          <span>•</span>
          <button type="button" className="hover:text-slate-300">Terms</button>
          <span>•</span>
          <button type="button" className="hover:text-slate-300">Help</button>
        </div>
      </div>
    </div>
  )
}
