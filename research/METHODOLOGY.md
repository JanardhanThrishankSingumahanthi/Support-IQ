# SupportIQ: Research Methodology & System Architecture

**Project Title:** Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation  
**Product:** SupportIQ  
**Document:** `research/METHODOLOGY.md`  
**Status:** Verified Baseline  

---

## 1. System Architecture Diagram

```
                       ┌───────────────────────────────┐
                       │          User Query           │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: HYBRID CANDIDATE RETRIEVAL                                         │
│                                                                             │
│   Knowledge Base Documents (PDF, DOCX, TXT)                                 │
│   ├── Text Extraction & Page Tracking (pypdf, python-docx)                  │
│   └── Chunking & 32-dim Deterministic Token/Hash Vector Generation          │
│                                                                             │
│   Parallel Retrieval Channels:                                              │
│   ├── Lexical Channel: Token Overlap Score with Stopword Removal            │
│   └── Semantic Channel: Cosine Similarity over 32-dim Deterministic Vectors │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: RECIPROCAL RANK FUSION (RRF) RE-RANKING                            │
│                                                                             │
│   Rank candidate chunks independently along Lexical & Vector streams:       │
│   Score(c) = [ 0.60 / (60 + r_lex) ] + [ 0.40 / (60 + r_vec) ]              │
│   Select Top-K candidates (k = 5)                                           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: ALGORITHMIC EVIDENCE GATE & SAFE REFUSAL                           │
│                                                                             │
│   Criteria:                                                                 │
│   ├── Top Chunk Composite Similarity Score >= 0.15                         │
│   └── Substantive Terms >= 2  OR  Lexical Score >= 0.35                     │
│       (Filtering out domain stopwords: supportiq, policy, support, etc.)   │
└──────────────────┬──────────────────────────────────────┬───────────────────┘
                   │                                      │
         [Evidence Criteria Met]                [Insufficient Evidence]
                   │                                      │
                   ▼                                      ▼
┌────────────────────────────────────────┐ ┌──────────────────────────────────┐
│ STAGE 4: NEURAL ADAPTER GENERATION     │ │ SAFE REFUSAL & HUMAN ESCALATION  │
│                                        │ │                                  │
│ Model: Qwen/Qwen2.5-0.5B-Instruct      │ │ Emit honest refusal without      │
│ Runtime Options (Explicit Execution):  │ │ hallucinating facts:             │
│ ├── QLoRA: 4-bit NF4 + Double Quant    │ │ "No relevant information was     │
│ ├── LoRA: FP16 PEFT Adapter            │ │  found in your knowledge base..."│
│ ├── Base Model: Zero-Shot FP16         │ │                                  │
│ └── Extractive: Deterministic Fallback │ │ Direct 1-Click Ticket Creation   │
│                                        │ │ in `support_tickets` table       │
└──────────────────┬─────────────────────┘ └──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 5: GROUNDING & CLAIM-LEVEL VERIFICATION                               │
│                                                                             │
│ 1. Sentence-Level Claim Decomposition: split answer into distinct claims    │
│ 2. Substantive Token Alignment against Top Retrieved Context Chunks         │
│ 3. Per-Claim Grounding Check: Claim supported if overlap score >= 0.12     │
│ 4. Continuous Reliability Score Formulation:                                │
│    Reliability = (0.7 * Coverage) + (0.3 * Normalized_Evidence_Support)     │
│    Status: supported (>=0.8) | partially_supported (>=0.5) | unsupported   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 6: GROUNDED ANSWER WITH TRACEABLE EVIDENCE CITATIONS                  │
│                                                                             │
│   Display verified response with clickable provenance citations:            │
│   Document ID → Document Title → Page Number → Chunk ID → Text Excerpt      │
│   (If reliability < 0.40, flag as low confidence and offer human ticket)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Ingestion, Extraction, and Chunking

### 2.1 Document Ingestion & Storage
Incoming files (PDF, DOCX, TXT) are uploaded via the Knowledge Base router ([`backend/app/api/v1/routers/documents/routes.py`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/app/api/v1/routers/documents/routes.py)), assigned a persistent UUID, and saved to disk at `backend/app/storage/documents/`. Duplicate document titles trigger a `409 Conflict` to prevent knowledge corruption.

### 2.2 Text Extraction & Page Tracking
* **PDF Ingestion:** Uses `pypdf.PdfReader` to extract text page-by-page, prepending explicit page markers `[Page X]` to the chunk text and recording the exact source page in `metadata_json["page"]`.
* **DOCX Ingestion:** Uses `python-docx` to iterate through paragraphs and structured tables.
* **Plain Text:** Normalizes UTF-8 encoding and trims extraneous carriage returns.

### 2.3 Chunking Strategy
Documents are partitioned along paragraph and section boundaries (average chunk size: 250–550 characters). This preserves cohesive policy statements within individual chunks.

---

## 3. Retrieval Architecture

### 3.1 Lexical Matching (BM25 / Token Overlap)
The lexical channel tokenizes query and chunk text using alphanumeric regular expression filtering (`[a-z0-9]+` with length $>2$).
* Standard English stopwords (`STOPWORDS`, 128 terms) are pruned.
* Domain stopwords (`DOMAIN_STOPWORDS`: `{"supportiq", "policy", "policies", "help", "support", "information", "question", "guide", "documentation", "details", "service", "customer", "customers", "user", "users", "client", "clients", "company"}`) are explicitly separated to prevent adversarial matches against corporate boilerplate.
* Lexical score is computed as the substantive token intersection divided by substantive query tokens:
$$\text{LexicalScore}(Q, C) = \frac{|Q_{\text{substantive}} \cap C_{\text{tokens}}|}{|Q_{\text{substantive}}|}$$

### 3.2 32-Dimensional Deterministic Token/Hash Vector Representation
To provide dense vector similarity without introducing heavy neural embedding latency or external API dependencies, SupportIQ utilizes a deterministic hash-based vector representation:
* Each token in the document chunk is hashed using SHA-1 (`hashlib.sha1`).
* The first 4 bytes of the digest are projected into a 32-dimensional bucket space modulo 32:
$$\text{Index}(t) = \text{int.from\_bytes}(\text{SHA1}(t)[:4], \text{'big'}) \pmod{32}$$
* The vector accumulates token occurrences:
$$\vec{V}[i] = \sum_{t \in \text{tokens}} \mathbb{I}(\text{Index}(t) = i)$$
* **Cosine Similarity:** Similarity between query vector $\vec{Q}$ and chunk vector $\vec{C}$ is computed via standard cosine dot product:
$$\text{CosineSim}(\vec{Q}, \vec{C}) = \frac{\vec{Q} \cdot \vec{C}}{\|\vec{Q}\|_2 \|\vec{C}\|_2}$$

> **Scientific Disclosure:** This vector representation is explicitly a **32-dimensional deterministic token/hash vector**. It is NOT a neural transformer embedding (such as BERT or Sentence-Transformers) and is documented accurately as such.

### 3.3 Reciprocal Rank Fusion (RRF)
Candidates retrieved from both channels are sorted independently to determine their ranks:
* $r_{\text{lex}}(c)$: Rank of chunk $c$ in lexical order.
* $r_{\text{vec}}(c)$: Rank of chunk $c$ in vector cosine order.

Non-linear Reciprocal Rank Fusion is computed with smoothing parameter $k=60$:
$$\text{RRF\_Score}(c) = \frac{0.60}{60 + r_{\text{lex}}(c)} + \frac{0.40}{60 + r_{\text{vec}}(c)}$$

Chunks are re-ranked based on $\text{RRF\_Score}(c)$, breaking ties using the composite score $(0.65 \times \text{LexicalScore} + 0.35 \times \text{CosineSim})$. Top-5 candidates are forwarded to the evidence gate.

---

## 4. Parameter-Efficient Fine-Tuning: LoRA & QLoRA

### 4.1 Base Foundation Model
* **Model ID:** `Qwen/Qwen2.5-0.5B-Instruct`
* **Total Parameters:** 494,573,440 (~494.6M)
* **Architecture:** Causal Language Model with RoPE, RMSNorm, SwiGLU activations, and ChatML formatting.

### 4.2 LoRA Configuration (FP16)
Implemented via HuggingFace PEFT:
* **Rank ($r$):** 8
* **Alpha ($\alpha$):** 16
* **Dropout:** 0.05
* **Target Modules:** Query projection (`q_proj`) and Value projection (`v_proj`) in self-attention layers
* **Bias:** `none`
* **Trainable Parameters:** 540,672
* **Trainable Ratio:** **0.1093%** (99.8907% parameters frozen)
* **Precision:** FP16 (`torch.float16`)
* **Training Hyperparameters:** 3 epochs, batch size 2, gradient accumulation 2 (effective batch 4), AdamW optimizer, learning rate $2 \times 10^{-4}$ with linear warmup.
* **Empirical Training Metrics:** Training time = 9.06s, Initial Val Loss = 1.6426, Final Val Loss = 1.4008, Peak Training VRAM = 2.42 GB.
* **Saved Artifact:** `backend/artifacts/adapters/supportiq_lora_qwen05b/`

### 4.3 QLoRA Configuration (4-bit NF4)
Implemented via HuggingFace PEFT and `bitsandbytes`:
* **Quantization Format:** 4-bit NormalFloat (NF4)
* **Double Quantization:** Enabled (`bnb_4bit_use_double_quant=True`)
* **Compute Dtype:** FP16 (`bnb_4bit_compute_dtype=torch.float16`)
* **LoRA Parameters:** Identical rank ($r=8$), alpha ($\alpha=16$), targets (`q_proj`, `v_proj`)
* **Trainable Parameters:** 540,672 (0.1093%)
* **Training Hyperparameters:** 3 epochs, batch size 2, gradient accumulation 2, AdamW, learning rate $2 \times 10^{-4}$.
* **Empirical Training Metrics:** Training time = 21.60s, Initial Val Loss = 1.5872, Final Val Loss = 1.3748, Peak Training VRAM = 1.79 GB.
* **Saved Artifact:** `backend/artifacts/adapters/supportiq_qlora_qwen05b/`

---

## 5. Live Generation & Evidence Grounding

### 5.1 Context Formatting & Inference
When evidence criteria are met, the top 3 retrieved chunks are assembled into the ChatML prompt:
```
<|im_start|>system
You are SupportIQ's AI customer support assistant. Answer the customer's question accurately, professionally, and concisely using ONLY the provided support context. Do not invent facts not supported by the context.<|im_end|>
<|im_start|>user
Context:
[Doc 1 Chunk 1]: ...
Question: ...<|im_end|>
<|im_start|>assistant
```
Generation is executed deterministically with greedy decoding (`do_sample=False`, `temperature=None`, `max_new_tokens=96`).

### 5.2 Deterministic Grounding & Claim Verification
Upon generation, the response is audited before user delivery:
1. **Sentence Splitting:** Answer is split into individual propositions using regex punctuation boundary delimiters (`[.!?]\s+|\n+`).
2. **Per-Claim Verification:** Each sentence claim is tokenized and evaluated against retrieved chunks using substantive token matching.
3. **Threshold Gate:** A claim is classified as `supported` if its best evidence chunk match score $\ge 0.12$.
4. **Reliability Score Formulation:**
$$\text{Coverage} = \frac{N_{\text{supported\_claims}}}{N_{\text{total\_claims}}}$$
$$\text{NormalizedSupport} = \min\left(1.0, \frac{\text{AverageEvidenceScore}}{0.35}\right)$$
$$\text{ReliabilityScore} = 0.70 \times \text{Coverage} + 0.30 \times \text{NormalizedSupport}$$
5. **Grounding Classification:**
   - `supported`: $\text{Coverage} \ge 0.80$
   - `partially_supported`: $0.50 \le \text{Coverage} < 0.80$
   - `unsupported`: $\text{Coverage} < 0.50$
   - If `ReliabilityScore < 0.40`, chat flag is marked as `low_confidence`.

### 5.3 Evidence Citations & Human Escalation
* **Traceable Citations:** For supported answers, citations attach document ID, document title, chunk ID, page number, and exact text quote snippet.
* **Safe Refusal:** When `has_evidence` is False, the pipeline suppresses model generation and outputs:
  > *"No relevant information was found in your knowledge base matching this question. To avoid misinformation, SupportIQ does not fabricate answers without source evidence. You can try a different search term or connect with a support agent."*
* **Human Escalation:** A 1-click modal allows direct ticket creation in the `support_tickets` table with priority, category, and full audit logs.
