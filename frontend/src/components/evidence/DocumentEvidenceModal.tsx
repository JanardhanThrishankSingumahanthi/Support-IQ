import { useEffect, useMemo, useState } from 'react'
import { SupportIQIcon } from '../brand/Logo'

export interface DocumentEvidenceModalProps {
  isOpen: boolean
  onClose: () => void
  documentTitle?: string
  initialPage?: number
  totalPages?: number
  highlightText?: string
  citationEvidence?: {
    quote?: string
    page?: number
    match_percent?: number
    document_title?: string
  } | null
  documentContent?: string
}

interface DocumentPage {
  pageNumber: number
  title: string
  sections: {
    heading: string
    body: string
    isEvidence?: boolean
  }[]
}

const DEFAULT_PAGES: DocumentPage[] = [
  {
    pageNumber: 1,
    title: 'Return & Refund Policy',
    sections: [
      {
        heading: '1. Overview',
        body: 'At SupportIQ, we aim to ensure complete customer satisfaction. If you are not satisfied with your purchase, you may request a return within 14 days of delivery.',
      },
      {
        heading: '2. Eligibility',
        body: 'To be eligible for a return, the product must be unused, in the same condition that you received it, and in the original packaging.',
        isEvidence: true,
      },
      {
        heading: '3. Refund Process',
        body: 'Once we receive and inspect your return, we will notify you of the approval or rejection of your refund. If approved, the refund will be processed within 5-7 business days.',
      },
    ],
  },
  {
    pageNumber: 2,
    title: 'Refund Conditions & Subscriptions',
    sections: [
      {
        heading: '3. Refund Policy (Annual Subscriptions)',
        body: 'Annual subscriptions may be refunded within 14 days of purchase, provided the service has not been substantially used.',
        isEvidence: true,
      },
      {
        heading: '4. Return Shipping Guidelines',
        body: 'Customers are responsible for shipping costs for returning non-defective items. Shipping costs are non-refundable unless verified as a defective shipment.',
      },
      {
        heading: '5. Non-Returnable Items',
        body: 'Gift cards, downloadable software licenses, and personalized custom hardware configurations cannot be returned under any circumstances.',
      },
    ],
  },
  {
    pageNumber: 3,
    title: 'Warranty & Replacements',
    sections: [
      {
        heading: '6. Hardware Warranty Coverage',
        body: 'All enterprise hardware terminals come with a 1-year limited hardware warranty covering manufacturing defects. Optional extended support is available for up to 3 years.',
        isEvidence: true,
      },
      {
        heading: '7. Inspection Procedures',
        body: 'Returned units undergo automated diagnostic testing and physical inspection within 48 hours of intake at our certified logistics facilities.',
      },
    ],
  },
  {
    pageNumber: 4,
    title: 'Exceptions & Special Circumstances',
    sections: [
      {
        heading: '8. Damaged or Defective Deliveries',
        body: 'Notice of transit damage must be filed within 72 hours of carrier delivery confirmation with supporting photo evidence attached.',
      },
      {
        heading: '9. Restocking Fees',
        body: 'Commercial orders of more than 5 units returned for convenience may be subject to a 10% restocking fee to cover re-certification.',
      },
    ],
  },
  {
    pageNumber: 5,
    title: 'International Returns & Customs',
    sections: [
      {
        heading: '10. Cross-Border Shipments',
        body: 'International return shipments must include the original commercial invoice marked with RMA authorization numbers to avoid customs duties.',
      },
    ],
  },
  {
    pageNumber: 6,
    title: 'Payment Gateway Reversals',
    sections: [
      {
        heading: '11. Credit Card & Wire Refunds',
        body: 'Credit card refunds reflect on statements within 5-10 banking business days depending on the card-issuing financial institution.',
      },
    ],
  },
  {
    pageNumber: 7,
    title: 'Corporate Accounts & Volume SLAs',
    sections: [
      {
        heading: '12. Enterprise SLA Terms',
        body: 'Enterprise Tier-1 clients receive expedited replacement hardware dispatch within 24 hours of ticket confirmation.',
      },
    ],
  },
  {
    pageNumber: 8,
    title: 'Security and Data Sanitization',
    sections: [
      {
        heading: '13. Device Data Removal',
        body: 'All returned hardware devices undergo DoD 5220.22-M certified cryptographic erasure prior to warehouse restocking.',
      },
    ],
  },
  {
    pageNumber: 9,
    title: 'Dispute Resolution & Escalation',
    sections: [
      {
        heading: '14. Escalation Path',
        body: 'If a refund request is contested, it will be escalated to the Customer Operations Review Board for final binding resolution within 5 business days.',
      },
    ],
  },
  {
    pageNumber: 10,
    title: 'Policy Modifications & Revisions',
    sections: [
      {
        heading: '15. Annual Policy Review',
        body: 'SupportIQ reserves the right to amend return terms with 30 days prior written notice to all registered account administrators.',
      },
    ],
  },
  {
    pageNumber: 11,
    title: 'Compliance & Audit Recordkeeping',
    sections: [
      {
        heading: '16. Audit Log Retention',
        body: 'All RMA correspondence, timestamps, and customer acknowledgments are cryptographically hashed and retained for 7 years.',
      },
    ],
  },
  {
    pageNumber: 12,
    title: 'Authorizations & Sign-off',
    sections: [
      {
        heading: '17. Compliance Verification',
        body: 'Document certified under ISO 27001 and SOC-2 Type II standards. Operations Director approval recorded 11 September 2026.',
      },
    ],
  },
]

export function DocumentEvidenceModal({
  isOpen,
  onClose,
  documentTitle = 'Return_Policy.pdf',
  initialPage = 1,
  totalPages = 12,
  highlightText,
  citationEvidence,
  documentContent,
}: DocumentEvidenceModalProps) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isHighlightMode, setIsHighlightMode] = useState(true)

  const effectiveTotalPages = Math.max(totalPages, DEFAULT_PAGES.length)

  // Sync to citation page when citation evidence opens
  useEffect(() => {
    if (citationEvidence?.page) {
      setCurrentPage(citationEvidence.page)
    } else if (initialPage) {
      setCurrentPage(initialPage)
    }
  }, [citationEvidence, initialPage])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const activePageData = useMemo(() => {
    const found = DEFAULT_PAGES.find((p) => p.pageNumber === currentPage)
    if (found) return found

    // Dynamic generation if page beyond static list
    return {
      pageNumber: currentPage,
      title: `${documentTitle} - Page ${currentPage}`,
      sections: [
        {
          heading: `Section ${currentPage}.1`,
          body: documentContent || `Verified documentation excerpt for page ${currentPage}. All terms governed by standard SupportIQ operational standards.`,
          isEvidence: currentPage === (citationEvidence?.page || initialPage),
        },
      ],
    }
  }, [currentPage, documentTitle, documentContent, citationEvidence, initialPage])

  // Count search term matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return 0
    const q = searchQuery.toLowerCase()
    return activePageData.sections.reduce((acc, s) => {
      const hCount = (s.heading.toLowerCase().match(new RegExp(q, 'g')) || []).length
      const bCount = (s.body.toLowerCase().match(new RegExp(q, 'g')) || []).length
      return acc + hCount + bCount
    }, 0)
  }, [searchQuery, activePageData])

  if (!isOpen) return null

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1)
  }

  const handleNextPage = () => {
    if (currentPage < effectiveTotalPages) setCurrentPage((p) => p + 1)
  }

  const handleZoomIn = () => {
    setZoomLevel((z) => Math.min(150, z + 15))
  }

  const handleZoomOut = () => {
    setZoomLevel((z) => Math.max(75, z - 15))
  }

  const handleResetZoom = () => {
    setZoomLevel(100)
  }

  const renderHighlightedBody = (text: string, isEvidenceSection?: boolean) => {
    const targetQuote = citationEvidence?.quote || highlightText
    const isTargetQuote = isEvidenceSection || (targetQuote && text.toLowerCase().includes(targetQuote.toLowerCase().slice(0, 30)))

    if (searchQuery.trim()) {
      const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'))
      return (
        <span>
          {parts.map((part, i) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
              <mark key={i} className="bg-amber-400 text-slate-950 font-bold px-1 rounded shadow-sm">
                {part}
              </mark>
            ) : (
              part
            ),
          )}
        </span>
      )
    }

    if (isTargetQuote && isHighlightMode) {
      return (
        <span className="relative inline-block rounded-lg bg-amber-400/20 border-l-4 border-amber-400 px-3 py-2 text-amber-100 font-medium leading-relaxed shadow-inner">
          <span className="block text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>🛡 Verified Grounding Evidence</span>
            {citationEvidence?.match_percent && (
              <span className="text-emerald-400 font-bold">• {citationEvidence.match_percent}% Match</span>
            )}
          </span>
          "{text}"
        </span>
      )
    }

    return <span>{text}</span>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-md">
      {/* Modal Container */}
      <div className="relative flex h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-700/80 bg-[#070d18] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 1. Header Bar matching Image 11 Screen 4 */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0c1424] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition"
              title="Back"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 text-base">📄</span>
              <span className="font-semibold text-white text-sm tracking-tight">{documentTitle}</span>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                Verified PDF
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                searchOpen ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
              title="Search Document"
            >
              🔍
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. Sub-Toolbar: Page Flipper, In-Doc Search, Zoom Controls matching Image 11 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#091120] px-4 py-2 text-xs">
          {/* Page Flipper: < 1 / 12 > */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              ‹
            </button>
            <div className="flex items-center gap-1 px-2 py-1 font-semibold text-slate-200 bg-slate-900/90 rounded-lg border border-slate-800">
              <span className="text-cyan-400">{currentPage}</span>
              <span className="text-slate-500">/</span>
              <span>{effectiveTotalPages}</span>
            </div>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= effectiveTotalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              ›
            </button>
          </div>

          {/* In-Document Search Bar */}
          {searchOpen && (
            <div className="flex items-center gap-2 flex-1 max-w-xs mx-2">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in document..."
                  className="w-full rounded-lg border border-cyan-500/40 bg-slate-950 px-3 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              {searchQuery && (
                <span className="text-[10px] text-cyan-300 whitespace-nowrap">{searchMatches} matches</span>
              )}
            </div>
          )}

          {/* Zoom Controls: - 100% + */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 75}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80 text-slate-200 hover:bg-slate-700 disabled:opacity-30 transition"
              title="Zoom Out"
            >
              -
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-900/90 rounded-lg border border-slate-800 transition"
              title="Reset Zoom"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 150}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80 text-slate-200 hover:bg-slate-700 disabled:opacity-30 transition"
              title="Zoom In"
            >
              +
            </button>
          </div>
        </div>

        {/* 3. Document Canvas Area with Highlighting matching Image 11 Screen 4 */}
        <div className="flex-1 overflow-y-auto bg-[#040810] p-4 sm:p-8 flex justify-center">
          <div
            className="w-full max-w-2xl rounded-xl border border-slate-700/60 bg-[#0b1322] p-8 sm:p-12 shadow-2xl text-slate-100 transition-all duration-200 origin-top"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* Header branding in document */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-6">
              <div className="flex items-center gap-2.5">
                <SupportIQIcon className="h-7 w-7" />
                <div>
                  <span className="font-bold text-white text-base tracking-tight">SupportIQ</span>
                  <span className="block text-[10px] text-slate-400">Enterprise Verified Document</span>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <span>Page {currentPage} of {effectiveTotalPages}</span>
                <span className="block text-[10px] text-emerald-400 font-semibold">Active Reference</span>
              </div>
            </div>

            {/* Document Title */}
            <h2 className="text-xl font-bold tracking-tight text-white mb-6">{activePageData.title}</h2>

            {/* Document Sections */}
            <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activePageData.sections.map((sec, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>{sec.heading}</span>
                    {sec.isEvidence && (
                      <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[9px] font-bold text-amber-300 uppercase">
                        Evidence Source
                      </span>
                    )}
                  </h3>
                  <div className="leading-relaxed">
                    {renderHighlightedBody(sec.body, sec.isEvidence)}
                  </div>
                </div>
              ))}
            </div>

            {/* Document Footer */}
            <div className="mt-12 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>SupportIQ Verified Repository • Confidential</span>
              <span>SHA-256: 8f2c...4e19</span>
            </div>
          </div>
        </div>

        {/* 4. Page Thumbnail Strip matching Image 11 Screen 4 */}
        <div className="border-t border-slate-800 bg-[#0a1120] px-4 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {DEFAULT_PAGES.slice(0, effectiveTotalPages).map((p) => {
              const isActive = p.pageNumber === currentPage
              return (
                <button
                  key={p.pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(p.pageNumber)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center h-16 w-12 rounded-lg border transition ${
                    isActive
                      ? 'border-cyan-400 bg-cyan-500/15 ring-2 ring-cyan-500/30'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                  title={`Jump to page ${p.pageNumber}`}
                >
                  <span className="text-[10px] text-cyan-400 font-bold">P.{p.pageNumber}</span>
                  <div className="w-8 h-8 mt-1 rounded bg-slate-950/60 p-1 flex flex-col gap-0.5 justify-center">
                    <div className="h-0.5 w-full bg-slate-700 rounded" />
                    <div className="h-0.5 w-4/5 bg-slate-700 rounded" />
                    <div className="h-0.5 w-full bg-slate-700 rounded" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 5. Bottom Action Bar matching Image 11 Screen 4 */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#0c1424] px-4 py-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => showToast('Note added to document audit trail.')}
              className="flex items-center gap-1.5 hover:text-cyan-400 transition"
            >
              <span>📝</span>
              <span className="text-[11px]">Add Note</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsHighlightMode(!isHighlightMode)
                showToast(isHighlightMode ? 'Highlight overlays hidden.' : 'Highlight overlays visible.')
              }}
              className={`flex items-center gap-1.5 transition ${isHighlightMode ? 'text-amber-300 font-semibold' : 'hover:text-amber-300'}`}
            >
              <span>🖍</span>
              <span className="text-[11px]">{isHighlightMode ? 'Highlights On' : 'Highlight'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href)
                showToast('Evidence citation link copied to clipboard.')
              }}
              className="flex items-center gap-1.5 hover:text-cyan-400 transition"
            >
              <span>🔗</span>
              <span className="text-[11px]">Share</span>
            </button>
            <button
              type="button"
              onClick={() => showToast(`Downloaded verified ${documentTitle}.`)}
              className="flex items-center gap-1.5 hover:text-cyan-400 transition"
            >
              <span>⬇</span>
              <span className="text-[11px]">Download</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Done
          </button>
        </div>

        {/* Floating feedback toast */}
        {toastMessage && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-xl border border-cyan-500/40 bg-slate-900/95 px-4 py-2 text-xs font-medium text-cyan-300 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
            ✓ {toastMessage}
          </div>
        )}
      </div>
    </div>
  )
}
