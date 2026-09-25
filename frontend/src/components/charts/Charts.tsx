import { useState } from 'react'

// 1. Smooth multi-series Line Chart
export interface LineSeries {
  name: string
  color: string
  values: number[]
}

export function LineTrendChart({
  series,
  labels,
  points,
  color = '#06b6d4',
  height = 180,
  showArea = true,
}: {
  series?: LineSeries[]
  labels?: string[]
  points?: Array<{ label: string; value: number }>
  color?: string
  height?: number
  showArea?: boolean
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const padding = { top: 20, right: 20, bottom: 30, left: 35 }
  const width = 540
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const effectiveLabels: string[] = labels || (points ? points.map((p) => p.label) : [])
  const effectiveSeries: LineSeries[] = series || (points ? [{ name: 'Trend', color, values: points.map((p) => p.value) }] : [])

  const allValues = effectiveSeries.flatMap((s) => s.values)
  const maxValue = Math.max(...allValues, 1)
  const minValue = Math.min(0, ...allValues)

  const getY = (val: number) => {
    const ratio = (val - minValue) / (maxValue - minValue || 1)
    return chartHeight - ratio * chartHeight + padding.top
  }

  const getX = (idx: number) => {
    return padding.left + (idx / (effectiveLabels.length - 1 || 1)) * chartWidth
  }

  const generatePath = (values: number[]) => {
    return values
      .map((val, i) => {
        const x = getX(i)
        const y = getY(val)
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  const generateArea = (values: number[]) => {
    const linePath = generatePath(values)
    const lastX = getX(values.length - 1)
    const firstX = getX(0)
    const bottomY = padding.top + chartHeight
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
  }

  return (
    <div className="relative w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * (1 - ratio)
          const val = Math.round(minValue + ratio * (maxValue - minValue))
          return (
            <g key={ratio}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#64748b">
                {val}
              </text>
            </g>
          )
        })}

        {/* Series area & lines */}
        {effectiveSeries.map((s, idx) => (
          <g key={s.name}>
            {showArea && idx === 0 && (
              <path d={generateArea(s.values)} fill={`url(#area-grad-${idx})`} opacity="0.3" />
            )}
            <defs>
              <linearGradient id={`area-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.45" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d={generatePath(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dots */}
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={getX(i)}
                cy={getY(v)}
                r={hoverIndex === i ? 4.5 : 2.5}
                fill="#0f172a"
                stroke={s.color}
                strokeWidth="2"
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            ))}
          </g>
        ))}

        {/* X-axis labels */}
        {effectiveLabels.map((lbl, idx) => (
          <text key={idx} x={getX(idx)} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b">
            {lbl}
          </text>
        ))}
      </svg>

      {/* Floating tooltip on hover */}
      {hoverIndex !== null && (
        <div
          className="absolute z-10 pointer-events-none rounded-lg border border-slate-700 bg-slate-900/95 px-2.5 py-1.5 text-xs shadow-xl text-slate-200"
          style={{
            left: `${(getX(hoverIndex) / width) * 100}%`,
            top: '10px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold text-slate-300 mb-1">{effectiveLabels[hoverIndex]}</div>
          {effectiveSeries.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-slate-400">{s.name}:</span>
              <span className="font-bold text-white">{s.values[hoverIndex]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 2. Circular Donut Gauge
export function DonutGauge({
  percentage,
  value,
  max,
  size = 120,
  strokeWidth = 10,
  color = '#06b6d4',
  trackColor = '#1e293b',
  label,
  valueText,
  subtitle,
}: {
  percentage?: number
  value?: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  valueText?: string
  subtitle?: string
}) {
  const computedPercent = percentage !== undefined 
    ? percentage 
    : value !== undefined 
    ? (value / (max || 100)) * 100 
    : 0

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, computedPercent))
  const strokeDashoffset = circumference - (clamped / 100) * circumference

  const displayText = valueText 
    ? valueText 
    : value !== undefined && max && max !== 100
    ? String(value)
    : `${Math.round(clamped)}%`

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Active progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tracking-tight text-white">{displayText}</span>
          {label && <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">{label}</span>}
        </div>
      </div>
      {subtitle && <p className="mt-2 text-xs text-slate-400 text-center">{subtitle}</p>}
    </div>
  )
}

// 3. Grouped Bar Chart for Model Comparison
export interface GroupedBarMetric {
  category: string
  values: {
    base_llm: number
    rag_base: number
    lora: number
    qlora: number
    rag_lora: number
    rag_qlora: number
  }
}

export function GroupedBarChart({
  metrics,
  categories,
  series,
}: {
  metrics?: GroupedBarMetric[]
  categories?: string[]
  series?: Array<{ name: string; color: string; data: number[] }>
  height?: number
}) {
  const defaultColors = {
    base_llm: '#64748b',       // Slate gray
    rag_base: '#38bdf8',       // Sky blue
    lora: '#a855f7',           // Purple
    qlora: '#f59e0b',          // Amber
    rag_lora: '#10b981',       // Emerald
    rag_qlora: '#06b6d4',      // Vibrant Cyan / Proposed
  }

  // If custom categories & series are passed (e.g. from ExperimentCenter)
  if (categories && series) {
    return (
      <div className="w-full space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 pt-2">
          {categories.map((cat, catIdx) => (
            <div key={cat} className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-xs font-semibold text-slate-200 mb-3 text-center truncate w-full">{cat}</div>
              <div className="flex items-end justify-center gap-1.5 w-full h-32 px-1 border-b border-slate-800 pb-1">
                {series.map((s) => {
                  const val = s.data[catIdx] ?? 0
                  const heightPercent = Math.min(100, Math.max(6, val <= 1 ? val * 100 : val <= 10 ? val * 8 : val))
                  return (
                    <div key={s.name} className="group relative flex-1 flex flex-col items-center h-full justify-end">
                      <div
                        className="w-full rounded-t-sm transition-all duration-300 hover:brightness-125"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: s.color,
                        }}
                      />
                      <div className="absolute -top-7 hidden group-hover:flex px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] font-bold text-white whitespace-nowrap z-10 shadow-lg">
                        {val}
                      </div>
                    </div>
                  )
                })}
              </div>
              <span className="text-[10px] text-slate-400 mt-2">
                Proposed: <strong className="text-cyan-300">{series[series.length - 1]?.data[catIdx]}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const metricList = metrics || []
  const keys = ['base_llm', 'rag_base', 'lora', 'qlora', 'rag_lora', 'rag_qlora'] as const
  const labels = {
    base_llm: 'Base LLM (No Retr)',
    rag_base: 'RAG Base (BM25)',
    lora: 'LoRA (No Retr)',
    qlora: 'QLoRA (No Retr)',
    rag_lora: 'RAG + LoRA (Config)',
    rag_qlora: 'RAG + QLoRA (Config, Proposed)',
  }

  return (
    <div className="w-full space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
        {keys.map((k) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: defaultColors[k] }} />
            <span className={k === 'rag_qlora' ? 'font-semibold text-cyan-300' : ''}>{labels[k]}</span>
          </div>
        ))}
      </div>

      {/* Bars container */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 pt-2">
        {metricList.map((item) => (
          <div key={item.category} className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-xs font-semibold text-slate-200 mb-3">{item.category}</div>
            <div className="flex items-end justify-center gap-1 w-full h-32 px-1 border-b border-slate-800 pb-1">
              {keys.map((k) => {
                const val = item.values[k]
                const heightPercent = Math.min(100, Math.max(8, val <= 1 ? val * 100 : val))
                return (
                  <div key={k} className="group relative flex-1 flex flex-col items-center h-full justify-end">
                    <div
                      className="w-full rounded-t-sm transition-all duration-300 hover:brightness-125"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: defaultColors[k],
                      }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 hidden group-hover:flex px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] font-bold text-white whitespace-nowrap z-10 shadow-lg">
                      {val}
                    </div>
                  </div>
                )
              })}
            </div>
            <span className="text-[10px] text-slate-400 mt-2">
              Proposed: <strong className="text-cyan-300">{item.values.rag_qlora}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 4. Horizontal Categorical Distribution Bar
export function HorizontalBarList({
  items,
}: {
  items: Array<{ label: string; count?: number; percentage: number; color?: string }>
}) {
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 truncate">{it.label}</span>
            <span className="font-semibold text-white ml-2">
              {it.percentage}% {it.count !== undefined && <span className="font-normal text-slate-400">({it.count})</span>}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(2, it.percentage)}%`,
                backgroundColor: it.color || '#06b6d4',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
