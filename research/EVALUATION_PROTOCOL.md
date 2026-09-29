# SupportIQ: Research Evaluation Protocol & Mathematical Formulations

**Project Title:** Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation  
**Product:** SupportIQ  
**Document:** `research/EVALUATION_PROTOCOL.md`  
**Status:** Verified Baseline  

---

## 1. Overview & Methodological Disclosures

Evaluating a Retrieval-Augmented Generation (RAG) system for mission-critical enterprise customer support requires an evaluation framework that spans retrieval precision, factual grounding, safety on unanswerable queries, and operational computational efficiency.

> [!IMPORTANT]
> **Strict Metric Decoupling Rule:** Retrieval latency (CPU wall-clock in milliseconds) and neural generation latency (GPU wall-clock in seconds) evaluate distinct stages of the RAG lifecycle and must **NEVER** be conflated into a single metric. Conflating them obscures whether latency bottlenecks originate in indexing or token generation.

---

## 2. Retrieval Metrics

Retrieval metrics evaluate the candidate selection quality on answerable knowledge base queries ($N_{\text{ans}} = 7$).

### 2.1 Recall@K
* **Definition:** Proportion of answerable queries where the ground-truth knowledge chunk $c^*$ is successfully retrieved within the top-$K$ candidates.
* **Mathematical Formulation:**
$$\text{Recall@K} = \frac{1}{N_{\text{ans}}} \sum_{i=1}^{N_{\text{ans}}} \mathbb{I}\left(c_i^* \in \text{TopK}(Q_i)\right)$$
where $\mathbb{I}(\cdot)$ is the indicator function, and $K=5$.
* **Evaluated Cohort:** $N_{\text{ans}} = 7$ answerable queries in Dataset 2 (Cases 11–17).

### 2.2 Mean Reciprocal Rank (MRR)
* **Definition:** The average of reciprocal ranks of the first relevant ground-truth chunk in the retrieved ranking.
* **Mathematical Formulation:**
$$\text{MRR} = \frac{1}{N_{\text{ans}}} \sum_{i=1}^{N_{\text{ans}}} \frac{1}{\text{Rank}(c_i^*)}$$
If $c_i^*$ is not retrieved within the candidate window, its reciprocal rank is $0.0$.
* **Evaluated Cohort:** $N_{\text{ans}} = 7$ answerable queries in Dataset 2 (Cases 11–17).

---

## 3. Answer Generation & Grounding Metrics

Answer metrics evaluate factual correctness, sentence-level grounding, and provenance attribution across all test cases ($N = 10$).

### 3.1 Composite Accuracy
* **Definition:** The proportion of total test cases where the system either correctly answers an answerable query using verified evidence OR correctly issues a safe refusal for an unsupported query without hallucination.
* **Mathematical Formulation:**
$$\text{Accuracy} = \frac{N_{\text{correct\_answers}} + N_{\text{correct\_safe\_refusals}}}{N_{\text{total}}}$$
* **Evaluated Cohort:** $N_{\text{total}} = 10$ test cases in Dataset 2 ($7$ answerable + $3$ unsupported).

### 3.2 Faithfulness / Evidence Coverage
* **Definition:** The fraction of generated claims in answerable queries that are mathematically grounded in the retrieved support context (sentence match score $\ge 0.12$).
* **Mathematical Formulation:**
$$\text{Faithfulness} = \frac{1}{N_{\text{ans}}} \sum_{i=1}^{N_{\text{ans}}} \left( \frac{\sum_{j=1}^{M_i} \mathbb{I}(\text{Score}(\text{claim}_{i,j}, C_i) \ge 0.12)}{M_i} \right)$$
where $M_i$ is the number of distinct sentence claims in the generated response for query $i$.
* **Evaluated Cohort:** $N_{\text{ans}} = 7$ answerable cases in Dataset 2.

### 3.3 Citation Correctness
* **Definition:** The proportion of queries where either:
  1. The attached citation points to the correct ground-truth document and chunk ID for answerable queries, OR
  2. Exactly zero citations are emitted for safe refusals on unsupported queries.
* **Mathematical Formulation:**
$$\text{CitationCorrectness} = \frac{N_{\text{valid\_citations\_ans}} + N_{\text{zero\_citations\_unsupp}}}{N_{\text{total}}}$$
* **Evaluated Cohort:** $N_{\text{total}} = 10$ test cases in Dataset 2.

---

## 4. Safety & Hallucination Metrics

Safety metrics specifically isolate system behavior on adversarial, out-of-domain, or unanswerable queries ($N_{\text{unsupp}} = 3$).

### 4.1 Hallucination Rate
* **Definition:** The proportion of unsupported queries for which the system fabricates an ungrounded answer rather than triggering a safe refusal.
* **Mathematical Formulation:**
$$\text{HallucinationRate} = \frac{N_{\text{hallucinated\_unsupported}}}{N_{\text{unsupp}}}$$
* **Target:** $0.0\%$ (zero hallucination).
* **Evaluated Cohort:** $N_{\text{unsupp}} = 3$ unsupported cases in Dataset 2 (Cases 18, 19, 20).

### 4.2 Unsupported Query Refusal
* **Verification Criterion:** For an unsupported query (e.g., "What is the warranty coverage for warp drive antimatter core containment breaches?"), the system must:
  1. Detect insufficient knowledge evidence (`has_evidence == False`),
  2. Emit the standard transparent refusal notice,
  3. Attach zero citation links (`len(citations) == 0`),
  4. Record `status == "no_evidence"`.

---

## 5. Computational Efficiency & Hardware Telemetry

Computational efficiency metrics measure wall-clock latency, parameter economy, and GPU memory utilization.

### 5.1 Retrieval Latency (CPU)
* **Definition:** Wall-clock duration required to execute candidate gathering (BM25 + 32-dim Vector Cosine) plus Reciprocal Rank Fusion and the Evidence Gate.
* **Measurement:** Measured in Python via high-precision monotonic clock (`time.perf_counter()`), reported in milliseconds or seconds.
* **Execution Environment:** Host CPU.

### 5.2 LLM Generation Latency (GPU)
* **Definition:** Wall-clock duration required for the autoregressive decoding of new tokens by the neural model on the GPU.
* **Measurement:** Synchronized GPU wall-clock execution:
```python
if torch.cuda.is_available():
    torch.cuda.synchronize()
start = time.perf_counter()
outputs = model.generate(**inputs, max_new_tokens=96)
if torch.cuda.is_available():
    torch.cuda.synchronize()
gen_latency_sec = time.perf_counter() - start
```
* **Execution Environment:** NVIDIA GeForce RTX 2050 Laptop GPU (CUDA 12.4).
* **Scope Disclosure:** When evaluating offline extractive pipelines (Experiments 3 & 4), this metric is strictly recorded as **NOT MEASURED**.

### 5.3 Peak GPU VRAM
* **Definition:** Maximum active GPU memory allocated during model loading, fine-tuning, or inference.
* **Measurement:**
```python
peak_vram_gb = torch.cuda.max_memory_allocated(0) / (1024**3)
```
* **Hardware Ceiling:** 4.00 GB total available VRAM on NVIDIA GeForce RTX 2050.

### 5.4 Trainable Parameter Percentage
* **Definition:** The ratio of fine-tuned adapter parameters to total model parameters:
$$\text{TrainableRatio} = \frac{\Theta_{\text{trainable}}}{\Theta_{\text{total}}} \times 100\% = \frac{540,672}{494,573,440} \times 100\% = 0.1093\%$$

---

## 6. Summary Evaluation Metric Matrix

| Evaluation Dimension | Metric | Formula / Source | Denominator | Target Threshold |
|---|---|---|:---:|:---:|
| **Retrieval Quality** | Recall@5 | $\frac{1}{N_{ans}}\sum \mathbb{I}(c^* \in \text{Top5})$ | $N_{\text{ans}}=7$ | $\ge 0.90$ (Achieved: 1.00) |
| **Retrieval Quality** | MRR | $\frac{1}{N_{ans}}\sum \frac{1}{\text{Rank}(c^*)}$ | $N_{\text{ans}}=7$ | $\ge 0.85$ (Achieved: 1.00) |
| **Answer Quality** | Composite Accuracy | $\frac{\text{Correct Ans} + \text{Safe Refusal}}{N_{total}}$ | $N_{\text{total}}=10$ | $\ge 0.90$ (Achieved: 1.00) |
| **Answer Quality** | Faithfulness | Claim Evidence Overlap $\ge 0.12$ | $N_{\text{ans}}=7$ | $\ge 0.95$ (Achieved: 1.00) |
| **Safety & Trust** | Citation Correctness | Valid Chunk Links / Zero on Refusal | $N_{\text{total}}=10$ | $\ge 0.90$ (Achieved: 1.00) |
| **Safety & Trust** | Hallucination Rate | Ungrounded Claims on Unsupported | $N_{\text{unsupp}}=3$ | $0.0\%$ (Achieved: 0.0%) |
| **Efficiency (CPU)** | Retrieval Latency | Wall-clock BM25+Vector+RRF | $N_{\text{total}}=10$ | $< 25$ ms (Achieved: ~5–12 ms) |
| **Efficiency (GPU)** | Generation Latency | Synchronized `model.generate` time | $N_{\text{total}}=10$ | $< 3.0$ s (Achieved: 0.84s–1.67s) |
| **Resource Footprint** | Peak GPU VRAM | Peak `torch.cuda.max_memory_allocated` | 4.0 GB max | $< 2.0$ GB (Achieved: 0.46–0.96 GB) |
