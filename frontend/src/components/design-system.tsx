import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ')

type ButtonProps = {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  icon?: ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className,
  type = 'button',
  onClick,
  disabled = false,
}: ButtonProps) {
  const variants = {
    primary: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/80',
    ghost: 'bg-transparent text-slate-300 hover:bg-slate-800 border border-transparent',
    danger: 'bg-rose-500/15 text-rose-200 hover:bg-rose-500/20 border border-rose-500/30',
  }

  const sizes = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-sm',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

type CardProps = {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return <div className={cn('rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.35)]', className)}>{children}</div>
}

type StatCardProps = {
  label: string
  value: string
  delta?: string
  note?: string
  tone?: 'cyan' | 'purple' | 'teal' | 'amber'
}

export function StatCard({ label, value, delta, note, tone = 'cyan' }: StatCardProps) {
  const tones = {
    cyan: 'from-cyan-500/20 via-cyan-500/5 to-slate-900 text-cyan-200',
    purple: 'from-violet-500/20 via-violet-500/5 to-slate-900 text-violet-200',
    teal: 'from-teal-500/20 via-teal-500/5 to-slate-900 text-teal-200',
    amber: 'from-amber-500/20 via-amber-500/5 to-slate-900 text-amber-200',
  }

  return (
    <Card className={cn('relative overflow-hidden bg-gradient-to-br', tones[tone])}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/30 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        {delta ? <Badge tone="info">{delta}</Badge> : null}
      </div>
      {note ? <p className="mt-4 text-sm text-slate-400">{note}</p> : null}
    </Card>
  )
}

type BadgeProps = {
  children: ReactNode
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  className?: string
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  const tones = {
    neutral: 'bg-slate-800 text-slate-200 border border-slate-700',
    info: 'bg-cyan-500/10 text-cyan-200 border border-cyan-500/30',
    success: 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-200 border border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-200 border border-rose-500/30',
  }

  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] uppercase', tones[tone], className)}>{children}</span>
}

export function StatusBadge({ status }: { status: 'online' | 'warning' | 'offline' | 'processing' | 'success' }) {
  const tones = {
    online: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/25',
    warning: 'bg-amber-500/15 text-amber-200 border border-amber-500/25',
    offline: 'bg-slate-700 text-slate-200 border border-slate-600',
    processing: 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30',
    success: 'bg-teal-500/15 text-teal-200 border border-teal-500/30',
  }

  return <span className={cn('inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]', tones[status])}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>
}

type SearchBarProps = {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search anything…' }: SearchBarProps) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">Search</span>
      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
        <SearchIcon className="h-4 w-4" />
      </span>
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-900/80 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
      />
    </label>
  )
}

type SidebarProps = {
  activeItem?: string
  items?: { label: string; icon: ReactNode; count?: number; active?: boolean; path?: string }[]
}

export function Sidebar({ activeItem, items = [] }: SidebarProps) {
  const defaultItems = [
    { label: 'Dashboard', icon: <GridIcon className="h-4 w-4" />, path: '/dashboard', active: true },
    { label: 'Documents', icon: <BookIcon className="h-4 w-4" />, path: '/documents' },
    { label: 'Conversations', icon: <TicketIcon className="h-4 w-4" />, path: '/conversations' },
    { label: 'Support Tickets', icon: <TicketIcon className="h-4 w-4" />, path: '/support-tickets' },
    { label: 'Experiment Center', icon: <ChartIcon className="h-4 w-4" />, path: '/experiments' },
    { label: 'Knowledge', icon: <UsersIcon className="h-4 w-4" />, path: '/knowledge' },
    { label: 'Analytics', icon: <ChartIcon className="h-4 w-4" />, path: '/analytics' },
  ]

  const navItems = items.length ? items : defaultItems

  return (
    <aside className="flex w-full max-w-[260px] flex-col border-r border-slate-800 bg-slate-950/90 p-5">
      <div className="flex items-center gap-3 px-2 pb-6 pt-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-inset ring-cyan-500/20">
          <LogoMark />
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.26em] text-slate-400">Support</div>
          <div className="text-lg font-semibold tracking-tight text-white">IQ</div>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const countValue = 'count' in item ? item.count : undefined
          const content = (
            <>
              <span className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </span>
              {countValue ? <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">{countValue}</span> : null}
            </>
          )

          const classes = cn(
            'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors',
            activeItem === item.label || item.active ? 'bg-slate-800 text-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]' : 'text-slate-300 hover:bg-slate-900 hover:text-white',
          )

          if (item.path) {
            return (
              <Link key={item.label} to={item.path} className={classes}>
                {content}
              </Link>
            )
          }

          return (
            <button key={item.label} type="button" className={classes}>
              {content}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>System</span>
          <Badge tone="success">Live</Badge>
        </div>
        <div className="space-y-2 text-sm text-slate-400">
          <p>Latency <span className="float-right font-medium text-slate-200">124ms</span></p>
          <p>Queue <span className="float-right font-medium text-slate-200">18</span></p>
          <p>Uptime <span className="float-right font-medium text-slate-200">99.9%</span></p>
        </div>
      </div>
    </aside>
  )
}

type HeaderProps = {
  title?: string
}

export function Header({ title = 'SupportIQ Console' }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur-sm">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Operations</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h1>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        <div className="hidden min-w-[280px] max-w-[420px] flex-1 md:block">
          <SearchBar />
        </div>
        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-slate-500 hover:text-white" aria-label="Notifications">
          <BellIcon className="h-4 w-4" />
        </button>
        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-slate-500 hover:text-white" aria-label="Theme toggle">
          <MoonIcon className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 px-2 py-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-sm font-semibold text-slate-950">JS</div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-white">Jasmine Shaw</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Admin</p>
          </div>
          <ChevronDownIcon className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </header>
  )
}

type TabsProps = {
  items: string[]
  active: string
  onChange: (value: string) => void
}

export function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <div className="inline-flex gap-2 rounded-xl border border-slate-800 bg-slate-900 p-1">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn('rounded-lg px-3 py-2 text-sm transition', item === active ? 'bg-slate-800 text-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.2)]' : 'text-slate-400 hover:text-white')}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

type DataTableProps = {
  columns: { key: string; label: string; align?: 'left' | 'right' }[]
  rows: Array<Record<string, string | ReactNode>>
}

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
      <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
        <thead className="bg-slate-900/90 text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn('px-4 py-3 font-medium', column.align === 'right' && 'text-right')}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-slate-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-900/60">
              {columns.map((column) => (
                <td key={column.key} className={cn('px-4 py-3', column.align === 'right' && 'text-right')}>{row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type DropdownProps = {
  label: string
  children: ReactNode
}

export function Dropdown({ label, children }: DropdownProps) {
  return (
    <div className="relative inline-block">
      <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:border-slate-500">
        {label}
        <ChevronDownIcon className="h-4 w-4 text-slate-400" />
      </button>
      <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl">
        {children}
      </div>
    </div>
  )
}

type ModalProps = {
  open: boolean
  title: string
  description?: string
  children?: ReactNode
  onClose?: () => void
}

export function Modal({ open, title, description, children, onClose }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            {description ? <p className="mt-2 text-sm text-slate-400">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close dialog">×</button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

type ToastProps = {
  title: string
  message: string
  tone?: 'success' | 'info' | 'warning'
}

export function Toast({ title, message, tone = 'success' }: ToastProps) {
  const tones = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
    info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  }

  return (
    <div className={cn('pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md', tones[tone])}>
      <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-current" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm text-current/80">{message}</p>
      </div>
    </div>
  )
}

type LoadingStateProps = {
  label?: string
}

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      {label}
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300">
        <InboxIcon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

type ErrorStateProps = {
  title?: string
  message?: string
}

export function ErrorState({ title = 'Something went wrong', message = 'We could not load this view. Please try again.' }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-5 text-rose-100">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-200/85">Error</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-rose-100/80">{message}</p>
    </div>
  )
}

type ProgressIndicatorProps = {
  value: number
  label?: string
  tone?: 'cyan' | 'teal' | 'amber'
}

export function ProgressIndicator({ value, label, tone = 'cyan' }: ProgressIndicatorProps) {
  const tones = {
    cyan: 'bg-cyan-400',
    teal: 'bg-teal-400',
    amber: 'bg-amber-400',
  }

  return (
    <div>
      {label ? <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate-400"><span>{label}</span><span>{value}%</span></div> : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div className={cn('h-full rounded-full', tones[tone])} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
      </div>
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16L21 21" strokeLinecap="round" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M14 18H10M5 16V11a7 7 0 0 1 14 0v5l2 2H3l2-2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M21 12.8A8.8 8.8 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="4" rx="1.5" />
      <rect x="14" y="11" width="7" height="10" rx="1.5" />
      <rect x="3" y="12" width="7" height="9" rx="1.5" />
    </svg>
  )
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M6 7.5h12M6 12h12M6 16.5h9" strokeLinecap="round" />
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    </svg>
  )
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H19v15H7.5A2.5 2.5 0 0 0 5 21.5V6.5Z" strokeLinejoin="round" />
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H19" strokeLinejoin="round" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" strokeLinecap="round" />
      <circle cx="9.5" cy="7" r="3.5" />
      <path d="M20 19v-1a4 4 0 0 0-3-3.87" strokeLinecap="round" />
      <path d="M16 4.13a4 4 0 0 1 0 7.74" strokeLinecap="round" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 18V6M9 18V10M14 18V8M19 18V4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" strokeLinejoin="round" />
      <path d="M4 14h4l2 3h4l2-3h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M7 12.5 12.2 6l5.4 6.5L12.2 18 7 12.5Z" />
      <path d="M12.2 6v12" opacity="0.8" />
    </svg>
  )
}
