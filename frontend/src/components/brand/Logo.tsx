import type { SVGProps } from 'react'

interface LogoProps extends SVGProps<SVGSVGElement> {
  variant?: 'full' | 'compact' | 'icon'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function SupportIQIcon({ className = 'h-8 w-8', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="siq-s-grad" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="45%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="siq-check-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="siq-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Top right speech bubble */}
      <rect x="52" y="18" width="46" height="34" rx="8" fill="#082f49" stroke="#0ea5e9" strokeWidth="1.5" />
      <polygon points="68,52 64,58 74,52" fill="#082f49" stroke="#0ea5e9" strokeWidth="1.5" />
      <circle cx="67" cy="35" r="2.5" fill="#38bdf8" />
      <circle cx="75" cy="35" r="2.5" fill="#38bdf8" />
      <circle cx="83" cy="35" r="2.5" fill="#38bdf8" />

      {/* Bottom left document card with checkmark */}
      <rect x="22" y="48" width="46" height="42" rx="7" fill="#042f2e" stroke="#14b8a6" strokeWidth="1.5" />
      <line x1="28" y1="58" x2="42" y2="58" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" />
      <line x1="28" y1="65" x2="38" y2="65" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" />
      <line x1="28" y1="72" x2="34" y2="72" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" />

      {/* Verified check badge */}
      <circle cx="53" cy="71" r="10" fill="url(#siq-check-grad)" />
      <path d="M49 71 L52 74 L57 68" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dynamic Ribbon 'S' shape */}
      <path
        d="M 68 20 C 44 20, 36 34, 42 48 C 48 62, 78 62, 80 76 C 82 92, 64 102, 46 98 C 40 96, 36 92, 34 88"
        stroke="url(#siq-s-grad)"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
        filter="url(#siq-glow)"
      />
    </svg>
  )
}

export function Logo({ variant = 'compact', size = 'md', className = '' }: LogoProps) {
  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-11 w-11',
    xl: 'h-16 w-16',
  }

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
  }

  if (variant === 'icon') {
    return <SupportIQIcon className={`${iconSizes[size]} ${className}`} />
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <SupportIQIcon className={iconSizes[size]} />
        <div className="flex flex-col leading-none">
          <div className={`font-bold tracking-tight text-white ${textSizes[size]}`}>
            Support<span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">IQ</span>
          </div>
          <span className="mt-1 text-[9px] font-medium tracking-[0.18em] text-slate-400 uppercase">
            Reliable Customer Support Intelligence
          </span>
        </div>
      </div>
    )
  }

  // Full presentation variant (matching Image 1)
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <SupportIQIcon className="h-24 w-24 mb-4 drop-shadow-[0_12px_24px_rgba(6,182,212,0.25)]" />
      <div className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        Support<span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">IQ</span>
      </div>
      <p className="mt-2 text-xs sm:text-sm font-medium tracking-[0.2em] text-slate-300 uppercase">
        Reliable Customer Support Intelligence
      </p>
      <div className="mt-4 flex items-center justify-center gap-3 text-[10px] font-semibold tracking-[0.24em] text-cyan-300/90 uppercase">
        <span className="h-[1px] w-8 bg-slate-700" />
        <span>RETRIEVE</span>
        <span className="text-cyan-400">•</span>
        <span>VERIFY</span>
        <span className="text-cyan-400">•</span>
        <span>RESOLVE</span>
        <span className="h-[1px] w-8 bg-slate-700" />
      </div>
    </div>
  )
}
