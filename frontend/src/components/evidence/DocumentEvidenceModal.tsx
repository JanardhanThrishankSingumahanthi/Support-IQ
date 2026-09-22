import { useEffect, useMemo, useState } from 'react'
import { SupportIQIcon } from '../brand/Logo'
import { getStoredSession } from '../../lib/auth'

const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export interface DocumentEvidenceModalProps {
  isOpen: boolean
  onClose: () => void
  documentId?: number
  documentTitle?: string
  initialPage?: number
  totalPages?: number
  highlightText?: string
  citationEvidence?: {
    document_id?: number
    quote?: string
    page?: number
    match_percent?: number
    document_title?: string
    chunk_id?: number
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

export function DocumentEvidenceModal({
  isOpen,
  onClose,
  documentId,
  documentTitle = 'Document',
  initialPage = 1,
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
  const [fetchedPages, setFetchedPages] = useState<DocumentPage[]>([])
  const [loading, setLoading] = useState(false)

  // Target document ID
  const effectiveDocId = documentId || citationEvidence?.document_id

  useEffect(() => {
    if (!isOpen) return

    const session = getStoredSession()
    if (effectiveDocId && session?.token) {
      setLoading(true)
      fetch(`${apiBase}/api/v1/documents/${effectiveDocId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setLoading(false)
          if (!data) return

          const chunks: any[] = data.chunks || []
          if (chunks.length > 0) {
            // Group chunks by page number
            const pagesMap = new Map<number, { heading: string; body: string; isEvidence?: boolean }[]>()
            chunks.forEach((c) => {
              const pNum = c.page || c.chunk_index + 1
              const existing = pagesMap.get(pNum) || []
              const isMatch =
                (citationEvidence?.quote && c.content.includes(citationEvidence.quote.slice(0, 30))) ||
                (highlightText && c.content.toLowerCase().includes(highlightText.toLowerCase()))
              existing.push({
                heading: `Section ${c.chunk_index + 1} (Page ${pNum})`,
                body: c.content,
                isEvidence: Boolean(isMatch),
              })
              pagesMap.set(pNum, existing)
            })

            const built: DocumentPage[] = Array.from(pagesMap.entries())
              .sort(([a], [b]) => a - b)
              .map(([pageNum, sections]) => ({
                pageNumber: pageNum,
                title: data.title || documentTitle,
                sections,
              }))
            setFetchedPages(built)
          } else if (data.content && data.content.trim()) {
            // Split raw content into sections
            const paragraphs = data.content.split(/\n\s*\n/).filter((p: string) => p.trim())
            const built: DocumentPage[] = [
              {
                pageNumber: 1,
                title: data.title || documentTitle,
                sections: paragraphs.map((p: string, idx: number) => ({
                  heading: `Paragraph ${idx + 1}`,
                  body: p.trim(),
                  isEvidence: citationEvidence?.quote ? p.includes(citationEvidence.quote.slice(0, 30)) : false,
                })),
              },
            ]
            setFetchedPages(built)
          } else {
            setFetchedPages([])
          }
        })
        .catch(() => {
          setLoading(false)
        })
    } else if (documentContent) {
      // Use locally passed content
      setFetchedPages([
        {
          pageNumber: 1,
          title: documentTitle,
          sections: [
            {
              heading: 'Document Content',
              body: documentContent,
              isEvidence: Boolean(citationEvidence?.quote || highlightText),
            },
          ],
        },
      ])
    } else {
      setFetchedPages([])
    }
  }, [isOpen, effectiveDocId, documentTitle, documentContent, citationEvidence?.quote, highlightText])

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

  const effectiveTotalPages = Math.max(1, fetchedPages.length)

  const activePageData = useMemo(() => {
    const found = fetchedPages.find((p) => p.pageNumber === currentPage)
    if (found) return found

    if (fetchedPages.length > 0) return fetchedPages[0]

    return {
      pageNumber: currentPage,
      title: documentTitle,
      sections: [
        {
          heading: 'Extracted Passage',
          body: documentContent || 'No extracted document content available for this document.',
          isEvidence: Boolean(citationEvidence?.quote || highlightText),
        },
      ],
    }
  }, [currentPage, fetchedPages, documentTitle, documentContent, citationEvidence, highlightText])

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
    const isTargetQuote =
      isEvidenceSection ||
      (targetQuote && targetQuote.trim().length > 5 && text.toLowerCase().includes(targetQuote.toLowerCase().slice(0, 30)))

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
        {/* 1. Header Bar */}
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
              <span className="font-semibold text-white text-sm tracking-tight truncate max-w-[280px]">
                {documentTitle}
              </span>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                Verified Document
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

        {/* 2. Sub-Toolbar: Page Flipper, In-Doc Search, Zoom Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#091120] px-4 py-2 text-xs">
          {/* Page Flipper */}
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

          {/* Zoom Controls */}
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

        {/* 3. Document Canvas Area with Highlighting */}
        <div className="flex-1 overflow-y-auto bg-[#040810] p-4 sm:p-8 flex justify-center">
          {loading ? (
            <div className="m-auto text-xs text-slate-400">Loading document chunks from repository...</div>
          ) : (
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
                  <span>
                    Page {currentPage} of {effectiveTotalPages}
                  </span>
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
                    <div className="leading-relaxed whitespace-pre-wrap">
                      {renderHighlightedBody(sec.body, sec.isEvidence)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Document Footer */}
              <div className="mt-12 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>SupportIQ Knowledge Repository • Verified Document</span>
                <span>Active ID: {effectiveDocId || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Page Thumbnail Strip */}
        {fetchedPages.length > 1 && (
          <div className="border-t border-slate-800 bg-[#0a1120] px-4 py-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {fetchedPages.map((p) => {
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
        )}

        {/* 5. Bottom Action Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#0c1424] px-4 py-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-4">
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
                if (citationEvidence?.quote) {
                  navigator.clipboard?.writeText(citationEvidence.quote)
                  showToast('Evidence quotation copied to clipboard.')
                } else {
                  showToast('Citation ready.')
                }
              }}
              className="flex items-center gap-1.5 hover:text-cyan-400 transition"
            >
              <span>📋</span>
              <span className="text-[11px]">Copy Citation</span>
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
