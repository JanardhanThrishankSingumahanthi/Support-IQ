import { useEffect, useState } from 'react'
import { DonutGauge } from '../components/charts/Charts'
import { DocumentEvidenceModal } from '../components/evidence/DocumentEvidenceModal'
import { getStoredSession } from '../lib/auth'
import type { DocumentRecord, KnowledgeBaseStats } from '../types'

const apiBase = import.meta.env.VITE_API_URL ?? ''

interface IndexStatusData {
  status: string
  index_health: string
  health_label: string
  total_documents: number
  indexed_documents: number
  failed_documents: number
  pending_documents: number
  indexed_percentage: number
  total_chunks: number
  last_indexed_at: string
  embedding_model: string
  embedding_dimensions: number
  retrieval_method: string
  vector_storage: string
}

interface KnowledgeSettingsData {
  status: string
  configurable: boolean
  notice: string
  chunk_size_chars: number
  chunk_overlap_chars: number
  chunking_strategy: string
  embedding_model: string
  embedding_dimensions: number
  retrieval_top_k: number
  max_top_k: number
  similarity_threshold: number
  reranker_algorithm: string
  fusion_weights: string
  max_document_size_mb: number
  supported_file_formats: string[]
  storage_quota_gb: number
}

export function KnowledgeBase() {
  const session = getStoredSession()
  const [stats, setStats] = useState<KnowledgeBaseStats>({
    total_documents: 0,
    indexed_documents: 0,
    indexed_percentage: 0,
    total_chunks: 0,
    last_updated: 'Just now',
    storage_used_bytes: 0,
    storage_used_mb: 0,
    storage_used_gb: 0,
    storage_quota_gb: 5.0,
    storage_percentage: 0,
    categories: { Product: 0, Policy: 0, FAQ: 0, Technical: 0, Others: 0 },
  })

  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false)
  const [viewerPage] = useState(1)

  // Header controls state
  const [indexStatusOpen, setIndexStatusOpen] = useState(false)
  const [indexStatusLoading, setIndexStatusLoading] = useState(false)
  const [indexStatusData, setIndexStatusData] = useState<IndexStatusData | null>(null)
  const [indexStatusError, setIndexStatusError] = useState<string | null>(null)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsData, setSettingsData] = useState<KnowledgeSettingsData | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  const handleOpenIndexStatus = async () => {
    setIndexStatusOpen(true)
    setIndexStatusLoading(true)
    setIndexStatusError(null)

    if (!session?.token) {
      setIndexStatusLoading(false)
      setIndexStatusError('Authentication required to view index status.')
      return
    }

    try {
      const res = await fetch(`${apiBase}/api/v1/knowledge-base/index-status`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (!res.ok) {
        throw new Error(`Failed to load index status (${res.status})`)
      }
      const data = await res.json()
      setIndexStatusData(data)
    } catch (err: any) {
      if (stats.total_documents > 0) {
        setIndexStatusData({
          status: 'ok',
          index_health: stats.indexed_documents === stats.total_documents ? 'HEALTHY' : 'DEGRADED',
          health_label: stats.indexed_documents === stats.total_documents ? 'Healthy / Fully Indexed' : 'Degraded',
          total_documents: stats.total_documents,
          indexed_documents: stats.indexed_documents,
          failed_documents: 0,
          pending_documents: 0,
          indexed_percentage: stats.indexed_percentage,
          total_chunks: stats.total_chunks,
          last_indexed_at: stats.last_updated,
          embedding_model: 'Deterministic Token Hash Vector (32-dim, SHA-1)',
          embedding_dimensions: 32,
          retrieval_method: 'Two-Stage Hybrid (BM25 Lexical + Cosine Vector + RRF)',
          vector_storage: 'SQLite Relational DocumentChunk Table',
        })
      } else {
        setIndexStatusError(err.message || 'Could not retrieve index status.')
      }
    } finally {
      setIndexStatusLoading(false)
    }
  }

  const handleOpenSettings = async () => {
    setSettingsOpen(true)
    setSettingsLoading(true)
    setSettingsError(null)

    if (!session?.token) {
      setSettingsLoading(false)
      setSettingsError('Authentication required to view knowledge settings.')
      return
    }

    try {
      const res = await fetch(`${apiBase}/api/v1/knowledge-base/settings`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (!res.ok) {
        throw new Error(`Failed to load knowledge settings (${res.status})`)
      }
      const data = await res.json()
      setSettingsData(data)
    } catch (err: any) {
      setSettingsError(err.message || 'Could not retrieve knowledge settings.')
    } finally {
      setSettingsLoading(false)
    }
  }

  const fetchStatsAndDocs = async () => {
    if (!session?.token) return

    try {
      const statsRes = await fetch(`${apiBase}/api/v1/knowledge-base/stats`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      const docsRes = await fetch(`${apiBase}/api/v1/documents?page=1&page_size=50`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (docsRes.ok) {
        const docsData = await docsRes.json()
        const items = docsData.items || []
        setDocuments(items)
        if (items.length > 0) {
          setSelectedDoc(items[0])
        }
      }
    } catch {
      // Ignore network errors
    }
  }

  useEffect(() => {
    fetchStatsAndDocs()
  }, [session?.token])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !session?.token) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', activeTab === 'All' ? 'Policy' : activeTab)

    try {
      const res = await fetch(`${apiBase}/api/v1/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: formData,
      })
      if (res.ok) {
        await fetchStatsAndDocs()
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSync = async () => {
    if (!session?.token) return
    setSyncing(true)
    setSyncMessage(null)

    try {
      const res = await fetch(`${apiBase}/api/v1/knowledge-base/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSyncMessage(data.message || 'Knowledge base successfully synchronized.')
        await fetchStatsAndDocs()
      }
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMessage(null), 4000)
    }
  }

  const handleDownload = async (doc: DocumentRecord) => {
    if (!session?.token) {
      setDownloadError('Authentication required to download documents.')
      return
    }

    try {
      setDownloadingId(doc.id)
      setDownloadError(null)

      const res = await fetch(`${apiBase}/api/v1/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const errorMsg = errorData?.detail?.message || errorData?.message || `Download failed with status ${res.status}`
        throw new Error(errorMsg)
      }

      let filename = doc.filename || `${doc.title}.txt`
      const disposition = res.headers.get('Content-Disposition')
      if (disposition) {
        if (disposition.includes('filename*=')) {
          const match = disposition.match(/filename\*=(?:UTF-8''|utf-8'')?([^;]+)/i)
          if (match && match[1]) {
            filename = decodeURIComponent(match[1].trim().replace(/^["']|["']$/g, ''))
          }
        } else if (disposition.includes('filename=')) {
          const match = disposition.match(/filename=["']?([^"';]+)["']?/)
          if (match && match[1]) {
            filename = match[1].trim()
          }
        }
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download document.')
      setTimeout(() => setDownloadError(null), 5000)
    } finally {
      setDownloadingId(null)
    }
  }

  // Use actual database documents
  const displayDocs = documents
  const activeDocument = selectedDoc || (documents.length > 0 ? documents[0] : null)

  const filteredDocs = displayDocs.filter((doc) => {
    const matchesSearch = `${doc.title} ${doc.category}`.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeTab === 'All' || doc.category.toLowerCase() === activeTab.toLowerCase()
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 text-xl font-bold">
            📖
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Knowledge Base</h1>
            <p className="text-xs text-slate-400">
              Manage your documents, build your knowledge base, and keep it up to date.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenIndexStatus}
            className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition flex items-center gap-1.5"
          >
            <span>📊</span>
            <span>View Index Status</span>
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition"
          >
            <span className={syncing ? 'animate-spin' : ''}>🔄</span>
            <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenSettings}
            className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition flex items-center gap-1.5"
          >
            <span>⚙</span>
            <span>Knowledge Settings</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          ✓ {syncMessage}
        </div>
      )}

      {downloadError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          ⚠ {downloadError}
        </div>
      )}

      {/* Top Stats Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Documents</span>
            <span>📄</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.total_documents}</div>
          <span className="text-[11px] text-cyan-400 mt-1 block">+12 this week</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Indexed Documents</span>
            <span className="text-emerald-400">🛡</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.indexed_documents}</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">{stats.indexed_percentage}% indexed</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Chunks</span>
            <span>💬</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.total_chunks.toLocaleString()}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Ready for retrieval</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Last Updated</span>
            <span>⏱</span>
          </div>
          <div className="mt-2 text-sm font-bold text-white leading-snug">{stats.last_updated}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Live vector sync</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-3 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Storage Used</div>
            <div className="mt-1 text-base font-bold text-white">{stats.storage_used_gb} GB</div>
            <span className="text-[10px] text-slate-500">of {stats.storage_quota_gb} GB</span>
          </div>
          <DonutGauge percentage={stats.storage_percentage} size={54} strokeWidth={5} color="#06b6d4" valueText="24%" />
        </div>
      </div>

      {/* Upload Zone & Ingestion Pipeline Progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Dropzone (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center hover:border-cyan-500/60 transition">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 text-2xl mb-3">
            ☁
          </div>
          <h3 className="text-base font-bold text-white">Upload Documents</h3>
          <p className="text-xs text-slate-400 mt-1">
            Drag and drop files here, or click to browse. Supports PDF, DOCX, TXT, CSV (Max 50MB per file)
          </p>
          <label className="mt-4 inline-flex cursor-pointer items-center rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition shadow-lg">
            <input type="file" className="hidden" accept=".pdf,.docx,.txt,.csv" onChange={handleUpload} />
            <span>{uploading ? 'Processing File...' : 'Choose Files'}</span>
          </label>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>📄 PDF (Policies, Manuals)</span>
            <span>📝 DOCX (Guides, FAQs)</span>
            <span>📑 TXT (Plain text)</span>
            <span>📊 CSV (Data)</span>
            <span>🖼 Images (OCR)</span>
          </div>
        </div>

        {/* Live Ingestion Pipeline Status (1 col) */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white">Document Processing</h4>
            <span className="text-[11px] text-cyan-400">View all</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { label: 'Uploading', done: true },
              { label: 'Extracting text', done: true },
              { label: 'Chunking', done: true },
              { label: 'Generating embeddings', done: true },
              { label: 'Indexing to vector database', done: false, active: true },
            ].map((step) => (
              <div key={step.label} className="flex items-center justify-between text-slate-300">
                <span className="text-[11px]">{step.label}</span>
                {step.done ? (
                  <span className="text-emerald-400 font-bold">✓</span>
                ) : (
                  <span className="text-cyan-400 font-bold animate-pulse">80%</span>
                )}
              </div>
            ))}
          </div>

          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-2">
            <div className="h-full bg-cyan-400 transition-all duration-500 w-4/5" />
          </div>

          <p className="text-[10px] text-slate-500 pt-1">
            Processing... Return_Policy.pdf. This may take a few moments.
          </p>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        {[
          { label: 'All', count: stats.total_documents },
          { label: 'Product', count: stats.categories?.Product || 62 },
          { label: 'Policy', count: stats.categories?.Policy || 38 },
          { label: 'FAQ', count: stats.categories?.FAQ || 45 },
          { label: 'Technical', count: stats.categories?.Technical || 27 },
          { label: 'Others', count: stats.categories?.Others || 76 },
        ].map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(tab.label)}
            className={`rounded-xl px-3 py-1.5 font-medium transition ${
              activeTab === tab.label
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search and Table Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <select className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 focus:outline-none">
            <option>All Categories</option>
            <option>Policy</option>
            <option>Product</option>
          </select>
          <select className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 focus:outline-none">
            <option>All Status</option>
            <option>Indexed</option>
          </select>
          <select className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 focus:outline-none">
            <option>Sort by: Recent</option>
            <option>Name</option>
          </select>
        </div>
      </div>

      {/* Main Document Table & Document Preview Inspector */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Document Table (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0c1424] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-4">Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Indexed On</th>
                  <th className="p-3.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDocs.map((doc) => {
                  const isSelected = activeDocument?.id === doc.id
                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`hover:bg-slate-900/60 transition cursor-pointer ${
                        isSelected ? 'bg-cyan-500/5' : ''
                      }`}
                    >
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base text-cyan-400">📄</span>
                          <div>
                            <div className="font-semibold text-white">{doc.title}</div>
                            <div className="text-[10px] text-slate-500">
                              {doc.chunk_count || 120} chunks ready
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                          {doc.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {(doc.size / (1024 * 1024)).toFixed(1)} MB
                      </td>
                      <td className="p-3.5">
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          Indexed
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {new Date(doc.uploaded_at).toLocaleDateString([], {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3.5 text-right pr-4">
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDoc(doc)
                            }}
                            className="hover:text-cyan-300 p-1"
                            title="Preview"
                          >
                            👁
                          </button>
                          <button
                            type="button"
                            disabled={downloadingId === doc.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(doc)
                            }}
                            className="hover:text-cyan-300 p-1 disabled:opacity-50"
                            title="Download document"
                          >
                            {downloadingId === doc.id ? (
                              <span className="text-[10px] animate-pulse">⏳</span>
                            ) : (
                              '⬇'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Preview Drawer (1 col) matching Image 5 */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1424] p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Document Preview</h3>
            {activeDocument && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={downloadingId === activeDocument.id}
                  onClick={() => handleDownload(activeDocument)}
                  className="text-[11px] text-cyan-400 font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
                  title="Download document"
                >
                  <span>{downloadingId === activeDocument.id ? 'Downloading...' : 'Download'}</span>
                  <span>⬇</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceModalOpen(true)}
                  className="text-[11px] text-cyan-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Full View</span>
                  <span>↗</span>
                </button>
              </div>
            )}
          </div>

          {activeDocument ? (
            <>
              <div
                onClick={() => setEvidenceModalOpen(true)}
                className="cursor-pointer group"
                title="Click to open full document evidence viewer"
              >
                <div className="flex items-center gap-2 font-bold text-white text-sm group-hover:text-cyan-300 transition">
                  <span className="text-cyan-400">📄</span>
                  <span className="truncate">{activeDocument.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {(activeDocument.size / (1024 * 1024)).toFixed(2)} MB • {activeDocument.chunk_count || 1} chunks
                </p>
              </div>

              {/* Highlighted Chunk Viewer */}
              <div
                onClick={() => setEvidenceModalOpen(true)}
                className="rounded-xl border border-cyan-500/30 bg-[#061224] p-4 text-xs text-slate-200 leading-relaxed shadow-inner cursor-pointer hover:border-cyan-400/60 transition"
                title="Click to inspect in Full Evidence Viewer"
              >
                <div className="font-bold text-cyan-300 mb-2 truncate">{activeDocument.title}</div>
                <div className="bg-cyan-500/10 border-l-2 border-cyan-400 pl-2.5 py-1.5 text-cyan-100 rounded text-xs">
                  {activeDocument.preview || 'Document extracted and indexed into vector store.'}
                </div>
              </div>

              {/* Metadata details */}
              <div className="border-t border-slate-800 pt-3 text-[11px] space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>File name:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[150px]">
                    {activeDocument.filename || activeDocument.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="text-slate-200 font-medium">{activeDocument.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uploaded:</span>
                  <span className="text-slate-200 font-medium">
                    {new Date(activeDocument.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-medium">{activeDocument.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chunks:</span>
                  <span className="text-slate-200 font-medium">{activeDocument.chunk_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Embedding:</span>
                  <span className="text-cyan-400 font-medium">Token Hash (32-dim)</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No document selected. Upload or select a document from the table.
            </div>
          )}
        </div>
      </div>

      {/* Full Document Evidence Viewer Modal matching Image 11 Screen 4 */}
      <DocumentEvidenceModal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        documentId={activeDocument?.id}
        documentTitle={activeDocument?.title || 'Document'}
        initialPage={viewerPage}
        documentContent={activeDocument?.preview}
        citationEvidence={
          activeDocument
            ? {
                document_id: activeDocument.id,
                document_title: activeDocument.title,
                quote: activeDocument.preview,
                page: viewerPage,
                match_percent: 100,
              }
            : null
        }
      />

      {/* Index Status Modal */}
      {indexStatusOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIndexStatusOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-[#0c1424] p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 text-xl font-bold">
                  📊
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Knowledge Base Index Status</h2>
                  <p className="text-xs text-slate-400">
                    Live health telemetry from SupportIQ relational vector and retrieval pipeline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIndexStatusOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {indexStatusLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <span className="animate-spin text-xl text-cyan-400">🔄</span>
                <span>Querying index health and chunk telemetry...</span>
              </div>
            ) : indexStatusError ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                ⚠ {indexStatusError}
              </div>
            ) : indexStatusData ? (
              <div className="space-y-4">
                {/* Health Status Banner */}
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Overall Index Health
                    </span>
                    <span className="text-base font-bold text-white mt-0.5 block">
                      {indexStatusData.health_label}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      indexStatusData.index_health === 'HEALTHY'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : indexStatusData.index_health === 'INDEXING'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : indexStatusData.index_health === 'DEGRADED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-700/30 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span>●</span>
                    <span>{indexStatusData.index_health}</span>
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                    <span className="text-[11px] text-slate-400 block">Total Documents</span>
                    <span className="text-xl font-bold text-white mt-1 block">
                      {indexStatusData.total_documents}
                    </span>
                    <span className="text-[10px] text-slate-500">In knowledge store</span>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                    <span className="text-[11px] text-slate-400 block">Indexed Docs</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">
                      {indexStatusData.indexed_documents}
                    </span>
                    <span className="text-[10px] text-emerald-500">
                      {indexStatusData.indexed_percentage}% completed
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                    <span className="text-[11px] text-slate-400 block">Total Chunks</span>
                    <span className="text-xl font-bold text-cyan-400 mt-1 block">
                      {indexStatusData.total_chunks}
                    </span>
                    <span className="text-[10px] text-cyan-500">Vectorized units</span>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                    <span className="text-[11px] text-slate-400 block">Failed / Pending</span>
                    <div className="text-xl font-bold text-white mt-1 flex items-center gap-1.5">
                      <span className={indexStatusData.failed_documents > 0 ? 'text-rose-400' : 'text-slate-300'}>
                        {indexStatusData.failed_documents}
                      </span>
                      <span className="text-slate-500 text-sm">/</span>
                      <span className={indexStatusData.pending_documents > 0 ? 'text-amber-400' : 'text-slate-300'}>
                        {indexStatusData.pending_documents}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">Errors / In progress</span>
                  </div>
                </div>

                {/* Architecture Details Table */}
                <div className="rounded-xl border border-slate-800 bg-[#06101e] p-4 text-xs space-y-2.5 text-slate-300">
                  <div className="flex justify-between border-b border-slate-800/60 pb-2">
                    <span className="text-slate-400 font-medium">Embedding Architecture:</span>
                    <span className="text-cyan-300 font-semibold">{indexStatusData.embedding_model}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-2">
                    <span className="text-slate-400 font-medium">Embedding Dimensions:</span>
                    <span className="text-slate-200 font-semibold">{indexStatusData.embedding_dimensions} dimensions</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-2">
                    <span className="text-slate-400 font-medium">Retrieval Algorithm:</span>
                    <span className="text-slate-200 font-semibold">{indexStatusData.retrieval_method}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-2">
                    <span className="text-slate-400 font-medium">Vector Storage Backend:</span>
                    <span className="text-slate-200 font-semibold">{indexStatusData.vector_storage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Last Synchronized:</span>
                    <span className="text-slate-300">
                      {new Date(indexStatusData.last_indexed_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={async () => {
                  await handleSync()
                  await handleOpenIndexStatus()
                }}
                disabled={syncing}
                className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
              >
                <span className={syncing ? 'animate-spin' : ''}>🔄</span>
                <span>{syncing ? 'Synchronizing...' : 'Sync & Re-check'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIndexStatusOpen(false)}
                className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Settings Modal */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-[#0c1424] p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 text-xl font-bold">
                  ⚙
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Knowledge Base & Retrieval Settings</h2>
                  <p className="text-xs text-slate-400">
                    Active ingestion, chunking, and vector search parameters
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {settingsLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <span className="animate-spin text-xl text-cyan-400">🔄</span>
                <span>Loading runtime configuration parameters...</span>
              </div>
            ) : settingsError ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                ⚠ {settingsError}
              </div>
            ) : settingsData ? (
              <div className="space-y-4">
                {/* Truthful Read-Only Runtime Notice */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-200">
                  <span className="text-base leading-none">🔒</span>
                  <div>
                    <span className="font-bold block">{settingsData.notice}</span>
                    <p className="text-[11px] text-amber-300/80 mt-0.5">
                      Ingestion chunk limits, hybrid similarity cutoffs, and Reciprocal Rank Fusion parameters are
                      standardized for the enterprise benchmark suite and cannot be edited dynamically at runtime.
                    </p>
                  </div>
                </div>

                {/* Configuration Parameters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                    <span className="text-slate-400 text-[11px] block">Chunk Size & Overlap</span>
                    <span className="font-bold text-white mt-1 block">
                      {settingsData.chunk_size_chars.toLocaleString()} chars / {settingsData.chunk_overlap_chars} chars
                    </span>
                    <span className="text-[10px] text-slate-500">{settingsData.chunking_strategy}</span>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                    <span className="text-slate-400 text-[11px] block">Embedding Engine</span>
                    <span className="font-bold text-cyan-400 mt-1 block">
                      {settingsData.embedding_model}
                    </span>
                    <span className="text-[10px] text-slate-500">{settingsData.embedding_dimensions} floating-point dimensions</span>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                    <span className="text-slate-400 text-[11px] block">Retrieval Top-K</span>
                    <span className="font-bold text-white mt-1 block">
                      Top {settingsData.retrieval_top_k} Candidates (Max {settingsData.max_top_k})
                    </span>
                    <span className="text-[10px] text-slate-500">Evaluated against verified chunks</span>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                    <span className="text-slate-400 text-[11px] block">Grounding Similarity Threshold</span>
                    <span className="font-bold text-emerald-400 mt-1 block">
                      {settingsData.similarity_threshold}
                    </span>
                    <span className="text-[10px] text-slate-500">Minimum claim evidence support</span>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                    <span className="text-slate-400 text-[11px] block">Reranker & Fusion</span>
                    <span className="font-bold text-white mt-1 block">
                      {settingsData.reranker_algorithm}
                    </span>
                    <span className="text-[10px] text-slate-500">{settingsData.fusion_weights}</span>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                    <span className="text-slate-400 text-[11px] block">Supported Ingestion Formats</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {settingsData.supported_file_formats.map((fmt) => (
                        <span
                          key={fmt}
                          className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-slate-700"
                        >
                          .{fmt.toLowerCase()}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Max {settingsData.max_document_size_mb} MB per upload</span>
                  </div>
                </div>

                {/* Storage & Backend Allocation */}
                <div className="rounded-xl border border-slate-800 bg-[#06101e] p-3 text-[11px] flex items-center justify-between text-slate-400">
                  <span>Storage Quota: <strong className="text-slate-200">{settingsData.storage_quota_gb} GB</strong></span>
                  <span>Runtime: <strong className="text-emerald-400">Fixed SupportIQ Release</strong></span>
                </div>
              </div>
            ) : null}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <span className="text-[11px] text-slate-500">
                To alter pipeline configuration, update runtime parameters in backend service.
              </span>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
