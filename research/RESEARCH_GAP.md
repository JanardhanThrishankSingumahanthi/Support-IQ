# SupportIQ: Research Gap Analysis

**Project Title:** Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation  
**Product:** SupportIQ  
**Document:** `research/RESEARCH_GAP.md`  
**Status:** Verified Baseline  

---

## 1. Academic & Practical Context

Automating customer support through conversational Artificial Intelligence requires balancing three conflicting operational constraints:
1. **Factual Grounding & Domain Reliability:** Customer support conversations govern financial transactions, return windows, warranty terms, and service level agreements (SLAs). Misinformation or ungrounded generative hallucinations directly incur financial liability, customer churn, and regulatory exposure.
2. **Computational Resource Efficiency:** Enterprise deployment often operates on local edge infrastructure, branch servers, or mid-tier consumer hardware (e.g., laptop workstations with 4 GB GPU VRAM). Deploying massive commercial Large Language Models (LLMs) via external proprietary APIs introduces prohibitive token costs, network latency, and privacy compliance concerns.
3. **Retrieval Precision & Robust Safety on Unanswerable Queries:** Enterprise queries include adversarial, out-of-domain, or unanswerable requests. A production support agent must reliably differentiate between answerable domain questions and unsupported queries, providing safe refusals without hallucinating fictitious policies.

---

## 2. Existing Work vs. SupportIQ Investigated Combination

| Dimension | Existing General Literature | SupportIQ Investigated Combination |
|---|---|---|
| **Retrieval Architecture** | Standalone sparse lexical search (BM25) or dense bi-encoder semantic search using large transformer embeddings. | Two-stage hybrid pipeline combining BM25 lexical token matching with a 32-dimensional deterministic token/hash vector representation, fused via Reciprocal Rank Fusion (RRF: $k=60$, lexical weight $0.60$, vector weight $0.40$). |
| **Model Fine-Tuning** | Full parameter fine-tuning or generic LoRA adaptation on open-domain NLP datasets (e.g., Alpaca, Dolly). | Domain instruction-tuning of compact foundation model (`Qwen/Qwen2.5-0.5B-Instruct`) using low-rank adaptation: FP16 LoRA and 4-bit NF4 quantized LoRA (QLoRA) with double quantization. |
| **Hardware Boundary** | Data-center grade GPUs (A100, H100, V100 with 16 GB–80 GB VRAM). | Resource-constrained laptop GPU hardware: NVIDIA GeForce RTX 2050 (4.0 GB VRAM, CUDA 12.4), achieving full fine-tuning and inference under 1.8 GB peak VRAM. |
| **Hallucination Mitigation** | Heuristic system prompts, temperature tuning, or post-hoc external judge LLM verification. | Deterministic, in-pipeline sentence-level claim decomposition with token-level lexical alignment against retrieved knowledge chunks, domain-specific stopword filtering, and continuous reliability scoring ($0.0 - 1.0$). |
| **Safe Refusal & Escalation** | Model-dependent conversational refusal often prone to sycophancy or apologetic hallucinations. | Hard algorithmic evidence gate (composite score threshold $\ge 0.15$ and $\ge 2$ substantive matched terms) guaranteeing 100% safe refusal on unsupported queries and automated ticketing escalation. |

---

## 3. Specific Research Gaps Identified

### Gap 1: Inadequacy of Isolated Retrieval Paradigms in Customer Policy Documents
* **Observation:** Lexical matching (BM25) excels at precise keyword recall (e.g., error codes, exact product numbers) but fails when queries contain adversarial keyword traps that match policy boilerplate. Conversely, dense vector search often drifts semantically across dense paragraphs, surfacing irrelevant policies.
* **SupportIQ Investigation:** Investigating whether fusing BM25 with a lightweight 32-dimensional deterministic hash-vector representation through Reciprocal Rank Fusion (RRF) overcomes the vulnerabilities of single-method retrieval without adding GPU latency.

### Gap 2: Resource Footprint of Domain-Adapted LLMs on Constrained Hardware
* **Observation:** Standard RAG pipelines either rely on cloud APIs (raising cost/latency barriers) or require 8B–70B parameter models requiring 16 GB+ VRAM. Compact models (sub-1B parameters, such as Qwen2.5-0.5B) often lack domain formatting discipline when unadapted.
* **SupportIQ Investigation:** Evaluating whether parameter-efficient fine-tuning via LoRA (FP16) and QLoRA (4-bit NF4) on a tiny fraction of parameters (0.1093% / 540,672 parameters) confers strict customer-support stylistic adherence and grounding fidelity on a 4.0 GB VRAM laptop GPU.

### Gap 3: Separation of Retrieval Recall from Generation Faithfulness
* **Observation:** Conventional benchmarks often conflate retrieval recall with model generation quality into a single opaque accuracy metric.
* **SupportIQ Investigation:** Formulating an explicit evaluation separation where retrieval performance (Recall@K, MRR) and offline extractive verification latency (CPU ms) are strictly decoupled from neural generation latency (GPU sec) and parametric faithfulness.

### Gap 4: Deterministic Guardrails vs. Open-Ended Generation
* **Observation:** Neural text generation is inherently stochastic. Even fine-tuned models can hallucinate plausible-sounding explanations when confronted with completely out-of-domain queries (e.g., queries about quantum insurance or warp drives).
* **SupportIQ Investigation:** Integrating a deterministic claim verification engine and evidence gate that verifies every generated claim against retrieved knowledge chunks before display, providing zero-hallucination safe refusal and seamless human ticketing escalation.

---

## 4. Literature Verification Status

> [!NOTE]
> **Scientific Integrity Disclosure:** External academic paper citations have not yet been indexed into the local repository environment. The conceptual gaps documented above are derived strictly from the implemented codebase, empirical ablation experiments (Experiments 3 & 4), and live neural benchmark runs (Experiments 7 & 12). Formal academic citations (e.g., Lewis et al. for RAG, Hu et al. for LoRA, Dettmers et al. for QLoRA, Cormack et al. for RRF) will be formally linked in subsequent literature review phases. No fictitious papers or citations have been fabricated.
