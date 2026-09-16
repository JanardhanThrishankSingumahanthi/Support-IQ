import { useState } from 'react'
import { SupportIQIcon } from '../brand/Logo'

// 1. Loading Screen
export function LoadingScreen({ message = 'Initializing your smart support...' }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <SupportIQIcon className="h-16 w-16 animate-pulse" />
      <h3 className="mt-4 text-xl font-semibold text-white">SupportIQ</h3>
      <p className="mt-2 text-xs text-slate-400">{message}</p>
      <div className="mt-4 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" />
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
      </div>
      <p className="mt-6 text-[11px] tracking-widest text-slate-500 uppercase">Answers. Evidence. Trust.</p>
    </div>
  )
}

// 2. Skeleton Loading
export function SkeletonLoading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3 p-4">
      <div className="h-6 w-1/3 rounded-lg bg-slate-800/60 animate-pulse" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5">
            <div className="h-8 w-8 rounded-lg bg-slate-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 rounded bg-slate-800 animate-pulse" />
              <div className="h-2.5 w-1/2 rounded bg-slate-800/60 animate-pulse" />
            </div>
            <div className="h-5 w-16 rounded-full bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

// 3. AI Retrieving State
export function RetrievingState({ query = 'Searching knowledge base...' }: { query?: string }) {
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/90 p-5 shadow-lg max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-7 w-7 rounded-full bg-cyan-500/15 flex items-center justify-center text-cyan-400 animate-spin">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Finding the right information...</h4>
          <p className="text-xs text-slate-400 truncate max-w-xs">{query}</p>
        </div>
      </div>
      <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2 text-cyan-300">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span>Searching knowledge base</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
          <span>Scanning verified documents & FAQs</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
          <span>Ranking context by hybrid relevance</span>
        </div>
      </div>
    </div>
  )
}

// 4. AI Generating State
export function GeneratingState() {
  return (
    <div className="rounded-2xl border border-sky-500/20 bg-slate-900/90 p-5 shadow-lg max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-7 w-7 rounded-full bg-sky-500/15 flex items-center justify-center text-sky-400 animate-pulse">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Crafting your answer...</h4>
          <p className="text-xs text-slate-400">Synthesizing retrieved documentation</p>
        </div>
      </div>
      <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2 text-emerald-300">
          <span>✓</span>
          <span>Knowledge chunks retrieved</span>
        </div>
        <div className="flex items-center gap-2 text-sky-300">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span>Formulating clear customer response</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
          <span>Mapping exact supporting citations</span>
        </div>
      </div>
    </div>
  )
}

// 5. AI Verifying State
export function VerifyingState({ confidence = 87 }: { confidence?: number }) {
  return (
    <div className="rounded-2xl border border-teal-500/20 bg-slate-900/90 p-5 shadow-lg max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-7 w-7 rounded-full bg-teal-500/15 flex items-center justify-center text-teal-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Verifying for accuracy...</h4>
          <p className="text-xs text-slate-400">Validating claims against source ground truth</p>
        </div>
      </div>
      <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2 text-emerald-300">
          <span>✓</span>
          <span>Cross-checking evidence consistency</span>
        </div>
        <div className="flex items-center gap-2 text-teal-300">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          <span>Calculating grounding confidence: {confidence}%</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-500" style={{ width: `${confidence}%` }} />
      </div>
    </div>
  )
}

// 7. Stop Generation Button Component
export function StopGenerationButton({ onStop }: { onStop: () => void }) {
  return (
    <div className="flex items-center justify-center py-2">
      <button
        type="button"
        onClick={onStop}
        className="flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition shadow-lg"
      >
        <span className="h-2 w-2 rounded-sm bg-rose-400" />
        <span>Stop Generating</span>
      </button>
    </div>
  )
}

// 8. Success State
export function SuccessState({
  title = 'Answer Generated Successfully!',
  message = 'Your question has been resolved with verified sources.',
  onAskAnother,
}: {
  title?: string
  message?: string
  onAskAnother?: () => void
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
        ✓
      </div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="mt-1 text-xs text-slate-300">{message}</p>
      {onAskAnother && (
        <button
          type="button"
          onClick={onAskAnother}
          className="mt-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/30 transition"
        >
          Ask Another Question
        </button>
      )}
    </div>
  )
}

// 9. Error State
export function ErrorState({
  title = 'Something went wrong!',
  message = "We couldn't generate a response. Please try again.",
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 font-bold mb-2">
        !
      </div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="mt-1 text-xs text-slate-300">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-rose-500/20 border border-rose-500/40 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/30 transition"
        >
          Retry
        </button>
      )}
    </div>
  )
}

// 10. Network Error State
export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 text-center max-w-sm mx-auto shadow-2xl">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 mb-2">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a5 5 0 01-7.072 0m0 0l2.829-2.829m-2.829 2.829L3 21M8.464 8.464a5 5 0 000 7.072m0 0l2.829-2.829" />
        </svg>
      </div>
      <h4 className="text-sm font-semibold text-white">You're offline</h4>
      <p className="mt-1 text-xs text-slate-400">Please check your internet connection and try again.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 w-full rounded-xl bg-cyan-500 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-cyan-400 transition"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

// 11. Low Confidence State
export function LowConfidenceState({
  confidencePercent = 65,
  onViewSources,
  onAskHuman,
}: {
  confidencePercent?: number
  onViewSources?: () => void
  onAskHuman?: () => void
}) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span>Low Confidence Answer ({confidencePercent}%)</span>
      </div>
      <p className="mt-2 text-xs text-slate-300">
        I'm not fully confident about this answer based on existing documentation. Please review the sources or escalate to a support agent.
      </p>
      <div className="mt-3 flex items-center gap-2">
        {onViewSources && (
          <button
            type="button"
            onClick={onViewSources}
            className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/30 transition"
          >
            View Sources ({confidencePercent}%)
          </button>
        )}
        {onAskHuman && (
          <button
            type="button"
            onClick={onAskHuman}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
          >
            Ask a Human
          </button>
        )}
      </div>
    </div>
  )
}

// 12. No-Evidence State
export function NoEvidenceState({
  onTryDifferent,
  onUploadDoc,
}: {
  onTryDifferent?: () => void
  onUploadDoc?: () => void
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 text-center">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300 mb-2">
        📄
      </div>
      <h4 className="text-sm font-semibold text-white">No Relevant Information Found</h4>
      <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
        I couldn't find matching documents in your knowledge base. To prevent hallucinations, SupportIQ only answers with verified documentation.
      </p>
      <div className="mt-4 flex items-center justify-center gap-3">
        {onTryDifferent && (
          <button
            type="button"
            onClick={onTryDifferent}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition"
          >
            Try a different query
          </button>
        )}
        {onUploadDoc && (
          <button
            type="button"
            onClick={onUploadDoc}
            className="rounded-xl bg-cyan-500 px-3.5 py-1.5 text-xs font-medium text-slate-950 hover:bg-cyan-400 transition"
          >
            Upload a document
          </button>
        )}
      </div>
    </div>
  )
}

// 13. Hallucination / Unsupported Guard State
export function UnsupportedState({
  onRefine,
  onReport,
}: {
  onRefine?: () => void
  onReport?: () => void
}) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
      <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
        <span>⚠</span>
        <span>This answer isn't supported by our knowledge base</span>
      </div>
      <p className="mt-2 text-xs text-slate-300">
        To avoid misinformation, we're not showing an answer for ungrounded claims.
      </p>
      <div className="mt-3 flex items-center gap-2">
        {onRefine && (
          <button
            type="button"
            onClick={onRefine}
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-200 hover:bg-cyan-500/25 transition"
          >
            Refine Your Question
          </button>
        )}
        {onReport && (
          <button
            type="button"
            onClick={onReport}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            Report an Issue
          </button>
        )}
      </div>
    </div>
  )
}

// 14. Human Escalation State
export function HumanEscalationState({
  ticketId = '#SIQ-1042',
  expectedResponse = 'within 2 hours',
  onViewTicket,
}: {
  ticketId?: string
  expectedResponse?: string
  onViewTicket?: () => void
}) {
  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-xs">
            👤
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Escalating to Human Agent</h4>
            <p className="text-[11px] text-slate-400">Your query has been sent to our support team.</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
          Sent
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-400">Ticket: </span>
          <span className="font-semibold text-cyan-300">{ticketId}</span>
        </div>
        <span className="text-slate-400 text-[11px]">Expected response: {expectedResponse}</span>
      </div>

      {onViewTicket && (
        <button
          type="button"
          onClick={onViewTicket}
          className="mt-3 w-full rounded-lg border border-cyan-500/30 bg-cyan-500/20 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/30 transition"
        >
          View Ticket Details
        </button>
      )}
    </div>
  )
}

// 18. Toast Notification Item
export function Toast({
  type = 'success',
  message,
  onClose,
}: {
  type?: 'success' | 'info' | 'warning' | 'error'
  message: string
  onClose: () => void
}) {
  const tones = {
    success: 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200',
    info: 'border-cyan-500/30 bg-cyan-950/90 text-cyan-200',
    warning: 'border-amber-500/30 bg-amber-950/90 text-amber-200',
    error: 'border-rose-500/30 bg-rose-950/90 text-rose-200',
  }

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2 text-xs shadow-2xl backdrop-blur-md ${tones[type]}`}>
      <span>{message}</span>
      <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition">
        ✕
      </button>
    </div>
  )
}

// 19. Confirmation Modal
export function ConfirmationModal({
  title = 'Are you sure?',
  message = 'Do you want to proceed with this action?',
  confirmText = 'Yes, Submit',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400 mb-3">
          ?
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-xs text-slate-300">{message}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// 20. Delete Confirmation Modal
export function DeleteModal({
  title = 'Delete this document?',
  itemName = 'Return_Policy.pdf',
  onConfirm,
  onCancel,
}: {
  title?: string
  itemName?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15 text-rose-400 mb-3">
          🗑
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-xs text-slate-300">
          This action cannot be undone. All index vectors and associated chunks for <strong className="text-white">{itemName}</strong> will be permanently purged.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// 21. Offline / System Down
export function SystemDownState({ onHome }: { onHome?: () => void }) {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center p-8 text-center">
      <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-2xl mb-4">
        ⚡
      </div>
      <h2 className="text-2xl font-bold text-white">System is temporarily unavailable</h2>
      <p className="mt-2 text-xs text-slate-400 max-w-sm">
        We're performing infrastructure checks. Please try again shortly.
      </p>
      {onHome && (
        <button
          type="button"
          onClick={onHome}
          className="mt-6 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition"
        >
          Go to Home
        </button>
      )}
    </div>
  )
}

// 22. Maintenance Screen
export function MaintenanceScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070d18] p-6 text-center">
      <SupportIQIcon className="h-16 w-16 mb-4" />
      <h1 className="text-3xl font-extrabold text-white">We'll be back soon!</h1>
      <p className="mt-2 text-sm text-slate-400 max-w-md">
        We're performing scheduled system maintenance to serve you better.
      </p>
      <div className="mt-4 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs text-cyan-300">
        Estimated downtime: 30 minutes
      </div>
      <p className="mt-8 text-xs text-slate-500">Thank you for your patience!</p>
    </div>
  )
}

// 22 UI States Interactive Showcase Matrix Modal (Reference Image 12)
export function UIStateMatrixModal({ onClose }: { onClose: () => void }) {
  const [selectedState, setSelectedState] = useState<number>(1)

  const statesList = [
    { id: 1, title: '1. Loading Screen', desc: 'Initial application boot & authentication handshake' },
    { id: 2, title: '2. Skeleton Loading', desc: 'Ghost placeholders during asynchronous data hydration' },
    { id: 3, title: '3. AI Retrieving State', desc: 'Vector similarity search & top-k chunk retrieval' },
    { id: 4, title: '4. AI Generating Response', desc: 'Token streaming with stop generation capability' },
    { id: 5, title: '5. Evidence Verification', desc: 'Claim matching & confidence score calculation' },
    { id: 6, title: '6. Grounded Response', desc: 'Final synthesized answer with interactive citations' },
    { id: 7, title: '7. Low Confidence Warning', desc: 'Confidence below threshold with human review prompt' },
    { id: 8, title: '8. Human Escalation Banner', desc: 'Ticket creation & routing to customer support' },
    { id: 9, title: '9. No Evidence Fallback', desc: 'Graceful fallback when knowledge base lacks context' },
    { id: 10, title: '10. File Uploading', desc: 'Document ingestion with progress indicator' },
    { id: 11, title: '11. Upload Success Toast', desc: 'File parsed and queued for indexing' },
    { id: 12, title: '12. Upload Error', desc: 'Unsupported format or file size limit exceeded' },
    { id: 13, title: '13. Chunk Processing', desc: 'Chunking, embedding, and vector DB insertion' },
    { id: 14, title: '14. Search Results Found', desc: 'Query matches with relevance scores and highlights' },
    { id: 15, title: '15. Search No Results', desc: 'Empty state with suggested search terms' },
    { id: 16, title: '16. Filter Applied Tags', desc: 'Active facet chips with individual clear actions' },
    { id: 17, title: '17. Form Validation Error', desc: 'Field-level inline warnings and guidance' },
    { id: 18, title: '18. Save Changes Confirmation', desc: 'Success toast for modified system settings' },
    { id: 19, title: '19. Export Download Toast', desc: 'Report generation and file download feedback' },
    { id: 20, title: '20. Delete Warning Dialog', desc: 'Destructive action confirmation modal' },
    { id: 21, title: '21. Offline System Down', desc: 'Network failure or server unreachable state' },
    { id: 22, title: '22. Scheduled Maintenance', desc: 'Planned downtime announcement screen' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="flex h-[85vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#070d18] px-6 py-4">
          <div className="flex items-center gap-3">
            <SupportIQIcon className="h-6 w-6" />
            <div>
              <h2 className="text-base font-bold text-white">SupportIQ — 22 UI States Matrix</h2>
              <p className="text-xs text-slate-400">Approved Reference Image 12 Interactive Verification Gallery</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Split View: Left List, Right Interactive Preview */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left States Index */}
          <div className="w-80 border-r border-slate-800 bg-slate-950/60 overflow-y-auto p-3 space-y-1.5">
            {statesList.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedState(item.id)}
                className={`w-full rounded-xl p-3 text-left transition-all ${
                  selectedState === item.id
                    ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-900/40 border border-transparent text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold">{item.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.desc}</div>
              </button>
            ))}
          </div>

          {/* Right Preview Pane */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#070d18] flex items-center justify-center">
            <div className="w-full max-w-2xl">
              {selectedState === 1 && <LoadingScreen />}
              {selectedState === 2 && <SkeletonLoading rows={4} />}
              {selectedState === 3 && <RetrievingState query="What is the refund policy for annual enterprise plans?" />}
              {selectedState === 4 && <GeneratingState />}
              {selectedState === 5 && <VerifyingState confidence={94} />}
              {selectedState === 6 && (
                <SuccessState
                  title="Grounded Response (Verified)"
                  message="Dell laptops typically come with a 1-year limited hardware warranty covering manufacturing defects. Evidence: Dell_Warranty_Guide.pdf (Page 4, 94% match)."
                />
              )}
              {selectedState === 7 && <LowConfidenceState confidencePercent={48} />}
              {selectedState === 8 && <HumanEscalationState ticketId="SIQ-1042" />}
              {selectedState === 9 && <NoEvidenceState />}
              {selectedState === 10 && <UnsupportedState />}
              {selectedState === 11 && <Toast type="success" message="File Return_Policy.pdf uploaded and queued for vector indexing." onClose={() => {}} />}
              {selectedState === 12 && <ErrorState title="Upload Error" message="File size exceeds 10MB limit. Please compress or split the document." />}
              {selectedState === 13 && <RetrievingState query="Chunking document into 512-token segments and generating embeddings..." />}
              {selectedState === 14 && (
                <SuccessState
                  title="42 Search Results Found"
                  message="Matches identified across billing, return policy, and customer warranty documents."
                />
              )}
              {selectedState === 15 && <NoEvidenceState onTryDifferent={() => {}} />}
              {selectedState === 16 && (
                <Toast type="info" message="Active Facets: Category: Billing · Status: Published · Type: PDF" onClose={() => {}} />
              )}
              {selectedState === 17 && <ErrorState title="Validation Error" message="API Secret Key must be at least 32 characters." />}
              {selectedState === 18 && <Toast type="success" message="System configurations saved successfully." onClose={() => {}} />}
              {selectedState === 19 && <Toast type="info" message="Report SupportIQ_August_Analytics.pdf is downloading..." onClose={() => {}} />}
              {selectedState === 20 && (
                <DeleteModal
                  title="Delete this document?"
                  itemName="Return_Policy_2025_Draft.docx"
                  onCancel={() => {}}
                  onConfirm={() => alert('Document deleted')}
                />
              )}
              {selectedState === 21 && <SystemDownState onHome={onClose} />}
              {selectedState === 22 && <MaintenanceScreen />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
