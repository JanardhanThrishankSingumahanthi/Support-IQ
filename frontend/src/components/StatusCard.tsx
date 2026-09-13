type StatusCardProps = {
  title: string
  value: string
  tone?: 'neutral' | 'success' | 'warning'
}

const tones = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
}

export function StatusCard({ title, value, tone = 'neutral' }: StatusCardProps) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}
