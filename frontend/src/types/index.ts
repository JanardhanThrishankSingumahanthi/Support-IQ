export type AuthUser = {
  id: number
  email: string
  full_name: string
  role: string | null
  permissions: string[]
  is_active: boolean
}

export type AuthSession = {
  token: string
  expires_in_minutes: number
  user: AuthUser
}

export type CitationItem = {
  document_id?: number
  document_title: string
  chunk_id?: number
  chunk_index?: number
  page?: number
  quote: string
  score?: number
  match_percent?: number
}

export type ReliabilityInfo = {
  score?: number
  coverage?: number
  average_evidence_score?: number
  label?: 'high' | 'medium' | 'low'
}

export type ChatMessage = {
  id: number
  conversation_id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
  metadata_json?: {
    status?: 'resolved' | 'low_confidence' | 'no_evidence' | 'unsupported' | 'generating' | 'retrieving' | 'verifying'
    model?: string
    latency_ms?: number
    citations?: CitationItem[]
    reliability?: ReliabilityInfo
    grounding_status?: string
    supported_claim_count?: number
    unsupported_claim_count?: number
    escalation_available?: boolean
    pipeline_stages?: Array<{ name: string; status: string; latency_ms?: number }>
  } | null
}

export type Conversation = {
  id: number
  user_id: number | null
  title: string | null
  state: string
  created_at: string
  updated_at: string
  messages: ChatMessage[]
}

export type DocumentRecord = {
  id: number
  title: string
  filename: string
  file_type: string
  size: number
  category: string
  version: number
  status: string
  chunk_count: number
  uploaded_at: string
  updated_at: string
  indexed_at?: string | null
  preview?: string
  storage_path?: string
  error?: string | null
}

export type SupportTicket = {
  id: number
  user_id?: number | null
  assigned_agent_id?: number | null
  customer_name?: string | null
  customer_email?: string | null
  subject: string
  description?: string | null
  category?: string | null
  status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  source?: string | null
  reason?: string | null
  ai_answer?: string | null
  escalation_reason?: string | null
  resolution_note?: string | null
  created_at: string
  updated_at: string
  resolved_at?: string | null
}

export type ExperimentRecord = {
  id: number
  name: string
  description?: string | null
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  dataset_name?: string | null
  model_variant?: string | null
  created_at: string
  latest_metrics?: Record<string, string | number | null>
  runs?: Array<{
    id: number
    status: string
    config_json?: Record<string, unknown>
    metrics: Record<string, string | number | null>
  }>
}

export type KnowledgeBaseStats = {
  total_documents: number
  indexed_documents: number
  indexed_percentage: number
  total_chunks: number
  last_updated: string
  storage_used_bytes: number
  storage_used_mb: number
  storage_used_gb: number
  storage_quota_gb: number
  storage_percentage: number
  categories: Record<string, number>
}

export type UIStateModal =
  | { type: 'confirmation'; title: string; message: string; onConfirm: () => void; onCancel: () => void }
  | { type: 'delete'; title: string; itemName: string; onConfirm: () => void; onCancel: () => void }
  | { type: 'preview_doc'; doc: DocumentRecord; initialChunk?: string; initialPage?: number }
  | { type: 'escalate'; ticketId?: string; query: string; answer?: string }
  | null
