import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResearchTablesView, type ResearchData } from './ResearchTablesView'
import { ResearchFiguresView } from './ResearchFiguresView'

const mockResearchData: ResearchData = {
  table_1: {
    title: 'Table 1: Dataset Specification & Evaluation Protocol',
    datasets: [
      {
        id: 1,
        name: 'SupportIQ Golden Dev/Validation Benchmark v1',
        role: 'Development, validation tuning, threshold calibration',
        total_cases: 10,
        answerable: 7,
        unsupported: 3,
        kb_chunks_covered: 'Chunks 1, 2, 5, 6, 8, 10, 14',
        status: 'Calibration Suite',
      },
      {
        id: 2,
        name: 'SupportIQ Holdout Test Benchmark v1',
        role: 'Primary test suite for unbiased final empirical evaluation and ablation',
        total_cases: 10,
        answerable: 7,
        unsupported: 3,
        kb_chunks_covered: 'Chunks 3, 4, 7, 9, 11, 12, 13',
        status: 'Frozen Final Holdout Suite',
      },
    ],
    metrics_protocol: [
      {
        metric: 'Accuracy',
        formula: '(Correct Answers + Correct Safe Refusals) / N_total',
        denominator: 'N = 10',
        description: 'Composite accuracy across factual and adversarial queries.',
      },
    ],
  },
  table_2: [
    {
      variant: 'RAG + QLoRA',
      type: 'Configuration Pipeline',
      accuracy: '100.0% (10/10)',
      faithfulness: '100.0% (7/7)',
      recall_at_5: '1.0000 (7/7)',
      mrr: '1.0000',
      hallucination_rate: '0.0% (0/3)',
      citation_correctness: '100.0% (10/10)',
      retrieval_latency: '0.0168s (16.8ms)',
      llm_gen_latency: 'Not experimentally measured',
      notes: 'Proposed configuration pipeline',
    },
    {
      variant: 'RAG Base',
      type: 'Lexical BM25 Baseline',
      accuracy: '90.0% (9/10)',
      faithfulness: '100.0% (7/7)',
      recall_at_5: '1.0000 (7/7)',
      mrr: '1.0000',
      hallucination_rate: '33.3% (1/3)',
      citation_correctness: '90.0% (9/10)',
      retrieval_latency: '0.0049s (4.9ms)',
      llm_gen_latency: 'Not experimentally measured',
      notes: 'BM25 baseline without dense or RRF fusion',
    },
  ],
  table_3: [
    {
      run_id: 45,
      ablation_mode: 'BM25-only retrieval',
      isolated_component: 'Lexical BM25 ranker only (no embeddings, no RRF)',
      accuracy: '90.0% (9/10)',
      recall_at_5: '1.0000 (7/7)',
      mrr: '1.0000',
      faithfulness: '100.0% (7/7)',
      citation_correctness: '90.0% (9/10)',
      hallucination_rate: '33.3% (1/3)',
      latency: '0.0049s',
      key_failure: 'Case #20 keyword collision falsely verified Chunk #14',
    },
    {
      run_id: 50,
      ablation_mode: 'Full current SupportIQ pipeline',
      isolated_component: 'Hybrid RRF + Evidence Validation Gate + Claim Grounding',
      accuracy: '100.0% (10/10)',
      recall_at_5: '1.0000 (7/7)',
      mrr: '1.0000',
      faithfulness: '100.0% (7/7)',
      citation_correctness: '100.0% (10/10)',
      hallucination_rate: '0.0% (0/3)',
      latency: '0.0168s',
      key_failure: 'None (Optimal composite score)',
    },
  ],
  table_4: [
    {
      case_id: 11,
      category: 'Hours & Access',
      question: 'What are SupportIQ customer support operating hours?',
      expected: 'Chunk #3: Monday through Friday, 8:00 AM to 8:00 PM EST',
      bm25_only: 'PASS (Exact chunk #3 retrieved)',
      dense_only: 'PASS (Exact chunk #3 retrieved)',
      hybrid_no_rrf: 'PASS (Exact chunk #3 retrieved)',
      hybrid_rrf_naive: 'PASS (Exact chunk #3 retrieved)',
      full_retr_verif: 'PASS (Exact chunk #3 retrieved)',
      full_pipeline: 'PASS (Exact chunk #3 retrieved)',
      diagnosis: 'Standard operational query; successfully answered across all 6 configurations.',
    },
    {
      case_id: 20,
      category: 'Unsupported',
      question: 'Does SupportIQ provide an unconditional 5-year hardware replacement warranty?',
      expected: 'Safe refusal: No hardware warranty offered by SupportIQ',
      bm25_only: 'FAIL (Hallucinated warranty claims via chunk #14 keyword collision)',
      dense_only: 'FAIL (Hallucinated warranty claims via semantic drift)',
      hybrid_no_rrf: 'FAIL (Linear combination pushed candidate above threshold)',
      hybrid_rrf_naive: 'FAIL (Blind synthesis from unverified candidate)',
      full_retr_verif: 'PASS (Evidence gate suppressed non-grounded candidate)',
      full_pipeline: 'PASS (Dual safeguard successfully triggered safe refusal)',
      diagnosis: 'Adversarial unsupported query. Dual safeguard prevents keyword collision hallucinations.',
    },
  ],
  table_5: [
    {
      experiment: 'Experiment 4 (Ablation)',
      variant_mode: 'BM25 Only',
      mean_latency: '0.0049s (4.9ms)',
      min_latency: '0.0039s',
      max_latency: '0.0062s',
      llm_gen_latency: 'Not experimentally measured',
      pipeline_stage: 'Lexical Retrieval (BM25 only)',
    },
    {
      experiment: 'Experiment 3 (Holdout)',
      variant_mode: 'RAG + QLoRA (Config)',
      mean_latency: '0.0168s (16.8ms)',
      min_latency: '0.0141s',
      max_latency: '0.0210s',
      llm_gen_latency: 'Not experimentally measured',
      pipeline_stage: 'End-to-End Hybrid Retrieval + Verification',
    },
  ],
  key_findings: [
    'Hybrid RRF with claim verification achieves 100.0% accuracy on unseen holdout benchmark.',
    'Pure lexical BM25 suffers 33.3% hallucination rate on adversarial unsupported queries.',
  ],
  scientific_disclosure: {
    title: 'Scientific Disclosure: Offline Pipeline Benchmarking vs. Real Neural GPU Inference',
    offline_pipeline_evaluation: {
      title: '1. Offline SupportIQ Pipeline Evaluation (Experiments #3 & #4)',
      description: 'Evaluated on frozen Dataset ID 2 using CPU-based candidate retrieval (BM25 + Dense Vector), Reciprocal Rank Fusion (RRF), and claim verification. Text synthesis in Experiments #3 and #4 operated via a deterministic extractive template synthesizer against verified knowledge chunks rather than GPU autoregressive generation. Consequently, retrieval/verification latency is measured on CPU (4.9ms – 16.8ms), while LLM generation latency is strictly disclosed as "Not experimentally measured".',
      runtime_type: 'Offline Extractive Synthesizer (CPU)',
      latency_scope: 'Retrieval & claim verification only (CPU wall-clock: 0.0049s – 0.0168s)',
      experiments: 'Experiment #3 (Final Frozen Holdout), Experiment #4 (Component Ablation)',
    },
    real_neural_model_evaluation: {
      title: '2. Actual Qwen LoRA/QLoRA Neural Inference (Experiments #7 & #12)',
      description: 'Evaluated on frozen Dataset ID 2 using real autoregressive token generation with Qwen/Qwen2.5-0.5B-Instruct on an NVIDIA GeForce RTX 2050 Laptop GPU (4.0 GB VRAM, CUDA 12.4). Adapter inference was executed live with FP16 PEFT LoRA (Experiment #7, Run #54) and 4-bit NF4 quantized PEFT QLoRA with double quantization (Experiment #12, Run #59). Generation latency (0.844s LoRA, 1.668s QLoRA, 2.061s Base Qwen) and peak GPU VRAM allocation (0.46 GB QLoRA, 0.96 GB LoRA) represent actual empirical GPU measurements. These are real neural model experiments, not configuration-only pipelines.',
      runtime_type: 'Real Transformer Neural Inference (NVIDIA GeForce RTX 2050 GPU, CUDA 12.4)',
      latency_scope: 'Actual LLM autoregressive token generation latency (GPU wall-clock: 0.844s – 2.061s)',
      experiments: 'Experiment #7 (Real LoRA Holdout Evaluation), Experiment #12 (Real QLoRA Holdout Evaluation)',
    },
    methodological_boundary: 'Retrieval latency (CPU milliseconds) and LLM generation latency (GPU seconds) evaluate distinct stages of the RAG lifecycle and must never be conflated.',
  },
  real_neural_experiments: [
    {
      model_name: 'SupportIQ QLoRA Adapter (4-bit NF4)',
      experiment_id: 12,
      run_id: 59,
      dataset_id: 2,
      dataset_name: 'SupportIQ Holdout Test Benchmark v1',
      architecture_type: 'Real Neural Model (GPU Inference)',
      quantization: '4-bit NF4 (Double Quantization + PEFT)',
      trainable_parameters: '540,672 / 494.6M (0.1093%)',
      total_parameters: '494,573,440',
      accuracy: '100.0% (10/10)',
      faithfulness: '100.0% (7/7)',
      recall_at_5: '1.0000 (7/7)',
      mrr: '1.0000',
      citation_correctness: '100.0% (10/10)',
      hallucination_rate: '0.0% (0/3)',
      llm_generation_latency: '1.668s',
      retrieval_latency: '0.0089s',
      peak_gpu_vram: '0.46 GB (11.5% of GPU)',
      vram_reduction: '52.1% VRAM reduction vs FP16',
      training_loss: '0.9609 -> 0.7758 (3 epochs)',
      validation_loss: '1.5872 -> 1.3748',
      training_duration: '21.6s',
      loss_progression: [
        { epoch: 1, train_loss: 0.9609, val_loss: 1.4528 },
        { epoch: 2, train_loss: 0.8309, val_loss: 1.3950 },
        { epoch: 3, train_loss: 0.7758, val_loss: 1.3748 },
      ],
      hardware: 'NVIDIA GeForce RTX 2050 (4.0 GB VRAM, CUDA 12.4)',
      notes: 'Optimal edge configuration: halves VRAM requirement while preserving 100% accuracy.',
    },
    {
      model_name: 'SupportIQ LoRA Adapter (FP16)',
      experiment_id: 7,
      run_id: 54,
      dataset_id: 2,
      dataset_name: 'SupportIQ Holdout Test Benchmark v1',
      architecture_type: 'Real Neural Model (GPU Inference)',
      quantization: 'FP16 (PEFT LoRA Unquantized)',
      trainable_parameters: '540,672 / 494.6M (0.1093%)',
      total_parameters: '494,573,440',
      accuracy: '100.0% (10/10)',
      faithfulness: '100.0% (7/7)',
      recall_at_5: '1.0000 (7/7)',
      mrr: '1.0000',
      citation_correctness: '100.0% (10/10)',
      hallucination_rate: '0.0% (0/3)',
      llm_generation_latency: '0.844s',
      retrieval_latency: '0.0086s',
      peak_gpu_vram: '0.96 GB (24.0% of GPU)',
      vram_reduction: 'Baseline FP16 footprint',
      training_loss: '1.0531 -> 0.7438 (3 epochs)',
      validation_loss: '1.6426 -> 1.4008',
      training_duration: '9.1s',
      loss_progression: [
        { epoch: 1, train_loss: 1.0531, val_loss: 1.4741 },
        { epoch: 2, train_loss: 0.8523, val_loss: 1.4499 },
        { epoch: 3, train_loss: 0.7438, val_loss: 1.4008 },
      ],
      hardware: 'NVIDIA GeForce RTX 2050 (4.0 GB VRAM, CUDA 12.4)',
      notes: 'Fastest inference latency (0.844s avg), providing 2.44x speedup over Base Qwen.',
    },
  ],
  real_qlora_cases: [
    {
      test_case_id: 11,
      category: 'Policy',
      question: 'How long does it take for an approved refund to be processed after inspection?',
      is_answerable: true,
      generation_status: 'resolved',
      generated_answer: 'Refunds are typically processed within 5-7 business days from the date of receipt of the completed inspection report.',
      expected_answer: 'Once we receive and inspect your return, we will notify you of the approval or rejection of your refund. If approved, the refund will be processed within 5-7 business days.',
      retrieval_latency_sec: 0.0106,
      generation_latency_sec: 1.9492,
      retrieved_chunk_count: 5,
      recall_at_5: 1.0,
      mrr: 1.0,
      coverage: 1.0,
      citation_correct: true,
      accurate: true,
    },
  ],
}

describe('Research Data Integrity & Figures (Stage 7)', () => {
  it('displays "Research data unavailable" in ResearchTablesView when endpoint fails', () => {
    render(<ResearchTablesView researchData={null} />)

    expect(screen.getByText(/research data unavailable/i)).toBeInTheDocument()
    expect(
      screen.getByText(/in accordance with strict scientific integrity guidelines, fallback or fabricated numbers are never displayed/i)
    ).toBeInTheDocument()

    // Ensure fabricated numbers like 97.4% or hardcoded tables are not displayed
    expect(screen.queryByText(/table 1:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/table 2:/i)).not.toBeInTheDocument()
  })

  it('displays "Research data unavailable" in ResearchFiguresView when endpoint fails', () => {
    render(<ResearchFiguresView researchData={null} />)

    expect(screen.getByText(/research data unavailable/i)).toBeInTheDocument()
    expect(
      screen.getByText(/fallback or fabricated numbers are never displayed/i)
    ).toBeInTheDocument()

    // Ensure figures are not rendered without valid SQLite data
    expect(screen.queryByText(/figure 1/i)).not.toBeInTheDocument()
  })

  it('renders scientific disclosure separating offline pipeline and real neural GPU inference', () => {
    render(<ResearchTablesView researchData={mockResearchData} />)

    // Scientific disclosure title
    expect(
      screen.getByText(/Scientific Disclosure: Offline Pipeline Benchmarking vs\. Real Neural GPU Inference/i)
    ).toBeInTheDocument()

    // Offline pipeline description
    expect(screen.getByText(/1\. Offline Configuration-Pipeline Experiments/i)).toBeInTheDocument()
    expect(screen.getByText(/Offline Extractive Synthesizer \(CPU\)/i)).toBeInTheDocument()

    // Real neural model description
    expect(screen.getByText(/2\. Real Neural-Model Experiments \(Actual GPU Inference\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Autoregressive PyTorch\/HuggingFace GPU runtime \(CUDA 12\.4\)/i)).toBeInTheDocument()

    // Methodological boundary
    expect(
      screen.getByText(/Strict Methodological Separation:/i)
    ).toBeInTheDocument()
  })

  it('renders Section 1 with real neural LoRA and QLoRA experiments and all required metrics', () => {
    render(<ResearchTablesView researchData={mockResearchData} />)

    // Section 1 Heading
    expect(screen.getByText(/Section 1/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Real Neural-Model Experiments \(Actual GPU Adapter Inference on RTX 2050\)/i)
    ).toBeInTheDocument()

    // Real neural model rows
    expect(screen.getByText('SupportIQ QLoRA Adapter (4-bit NF4)')).toBeInTheDocument()
    expect(screen.getByText('SupportIQ LoRA Adapter (FP16)')).toBeInTheDocument()

    // Quantization
    expect(screen.getByText('4-bit NF4 (Double Quantization + PEFT)')).toBeInTheDocument()
    expect(screen.getByText('FP16 (PEFT LoRA Unquantized)')).toBeInTheDocument()

    // Trainable parameters
    expect(screen.getAllByText('540,672 / 494.6M (0.1093%)').length).toBeGreaterThan(0)

    // Real LLM Generation Latency (GPU seconds)
    expect(screen.getAllByText('1.668s').length).toBeGreaterThan(0)
    expect(screen.getAllByText('0.844s').length).toBeGreaterThan(0)

    // Peak GPU VRAM
    expect(screen.getAllByText('0.46 GB').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/0\.46 GB/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/0\.96 GB/i).length).toBeGreaterThan(0)

    // Training / Validation loss
    expect(screen.getByText('0.9609 -> 0.7758 (3 epochs)')).toBeInTheDocument()
    expect(screen.getByText('1.0531 -> 0.7438 (3 epochs)')).toBeInTheDocument()

    // Telemetry summary cards
    expect(screen.getByText('52.1% Reduction')).toBeInTheDocument()
    expect(screen.getByText('2.44x Faster')).toBeInTheDocument()
  })

  it('renders Section 2 with offline configuration-pipeline experiments', () => {
    render(<ResearchTablesView researchData={mockResearchData} />)

    expect(screen.getByText(/Section 2/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Offline Configuration-Pipeline Experiments \(Dataset ID 2\)/i)
    ).toBeInTheDocument()

    // Table 2, Table 3, Table 4, Table 5, Table 1
    expect(screen.getByText('Table 2')).toBeInTheDocument()
    expect(screen.getByText('Table 3')).toBeInTheDocument()
    expect(screen.getByText('Table 4')).toBeInTheDocument()
    expect(screen.getByText('Table 5')).toBeInTheDocument()
    expect(screen.getByText('Table 1')).toBeInTheDocument()
  })

  it('renders all 7 empirical research figures from SQLite data with proper scientific labeling', () => {
    render(<ResearchFiguresView researchData={mockResearchData} />)

    // 1. Final holdout model/configuration comparison
    expect(screen.getByText('Figure 1')).toBeInTheDocument()
    expect(screen.getByText(/Final Holdout Model & Configuration Performance/i)).toBeInTheDocument()

    // 2. Ablation study comparison
    expect(screen.getByText('Figure 2')).toBeInTheDocument()
    expect(screen.getByText(/Component Ablation Study Comparison/i)).toBeInTheDocument()

    // 3. Accuracy comparison
    expect(screen.getByText('Figure 3')).toBeInTheDocument()
    expect(screen.getByText(/Accuracy Progression Across Pipelines & Ablations/i)).toBeInTheDocument()

    // 4. Hallucination-rate comparison
    expect(screen.getByText('Figure 4')).toBeInTheDocument()
    expect(screen.getByText(/Hallucination Rate Comparison on Unsupported Queries/i)).toBeInTheDocument()

    // 5. Recall@5 / MRR comparison
    expect(screen.getByText('Figure 5')).toBeInTheDocument()
    expect(screen.getByText(/Candidate Recall@5 vs\. Ranking MRR Comparison/i)).toBeInTheDocument()

    // 6. Retrieval & Verification latency comparison
    expect(screen.getByText('Figure 6')).toBeInTheDocument()
    expect(screen.getByText(/Measured CPU Retrieval & Verification Latency Profile/i)).toBeInTheDocument()

    // 7. Per-case error distribution
    expect(screen.getByText('Figure 7')).toBeInTheDocument()
    expect(screen.getByText(/Per-Case Error Distribution Across the 6 Ablation Pipelines/i)).toBeInTheDocument()

    // Required research labels
    expect(screen.getAllByText(/Configuration Pipeline/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/BM25 baseline/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/offline extractive runtime/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/LLM Generation Latency:\s*Not experimentally measured/i).length).toBeGreaterThan(0)
  })
})

