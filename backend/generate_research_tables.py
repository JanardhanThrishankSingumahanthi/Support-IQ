import os
import sys
import csv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.services.research_tables_service import get_research_data, format_markdown

def export_csvs(data, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    # Table 1
    with open(os.path.join(output_dir, "table1_evaluation_protocol.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Dataset ID", "Dataset Name", "Role", "Total Cases", "Answerable", "Unsupported", "KB Chunks"])
        for d in data["table_1"]["datasets"]:
            w.writerow([d["id"], d["name"], d["role"], d["total_cases"], d["answerable"], d["unsupported"], d["kb_chunks_covered"]])

    # Table 2
    with open(os.path.join(output_dir, "table2_final_holdout_comparison.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Variant", "Architecture Type", "Accuracy", "Recall@5", "MRR", "Faithfulness", "Citation Correctness", "Hallucination Rate", "Retrieval Latency", "LLM Generation Latency", "Notes"])
        for r in data["table_2"]:
            w.writerow([r["variant"], r["type"], r["accuracy"], r["recall_at_5"], r["mrr"], r["faithfulness"], r["citation_correctness"], r["hallucination_rate"], r["retrieval_latency"], r["llm_gen_latency"], r["notes"]])

    # Table 3
    with open(os.path.join(output_dir, "table3_ablation_study.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Run ID", "Ablation Mode", "Isolated Component", "Accuracy", "Recall@5", "MRR", "Faithfulness", "Citation Correctness", "Hallucination Rate", "Retrieval Latency", "Key Failure"])
        for r in data["table_3"]:
            w.writerow([r["run_id"], r["ablation_mode"], r["isolated_component"], r["accuracy"], r["recall_at_5"], r["mrr"], r["faithfulness"], r["citation_correctness"], r["hallucination_rate"], r["latency"], r["key_failure"]])

    # Table 4
    with open(os.path.join(output_dir, "table4_per_case_error_analysis.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Case ID", "Category", "Question", "Expected Target", "BM25 Only", "Dense Vector Only", "Hybrid w/o RRF", "Hybrid + RRF", "Full Retr + Verif", "Full SupportIQ Pipeline", "Diagnosis"])
        for r in data["table_4"]:
            w.writerow([r["case_id"], r["category"], r["question"], r["expected"], r["bm25_only"], r["dense_only"], r["hybrid_no_rrf"], r["hybrid_rrf_naive"], r["full_retr_verif"], r["full_pipeline"], r["diagnosis"]])

    # Table 5
    with open(os.path.join(output_dir, "table5_latency_breakdown.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Experiment Source", "Variant / Mode", "Mean Latency", "Min Latency", "Max Latency", "LLM Generation Latency", "Pipeline Stage"])
        for r in data["table_5"]:
            w.writerow([r["experiment"], r["variant_mode"], r["mean_latency"], r["min_latency"], r["max_latency"], r["llm_gen_latency"], r["pipeline_stage"]])

    # Real Neural Experiments
    if "real_neural_experiments" in data:
        with open(os.path.join(output_dir, "real_neural_model_experiments.csv"), "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["Model Variant", "Architecture Type", "Quantization", "Trainable Parameters", "Total Parameters", "Accuracy", "Faithfulness", "Recall@5", "MRR", "Citation Correctness", "Hallucination Rate", "Real LLM Gen Latency", "Peak GPU VRAM", "Training Loss", "Validation Loss", "Training Duration", "Notes"])
            for r in data["real_neural_experiments"]:
                w.writerow([
                    r["model_name"], r["architecture_type"], r["quantization"], r["trainable_parameters"], r["total_parameters"],
                    r["accuracy"], r["faithfulness"], r["recall_at_5"], r["mrr"], r["citation_correctness"], r["hallucination_rate"],
                    r["llm_generation_latency"], r["peak_gpu_vram"], r["training_loss"], r["validation_loss"], r["training_duration"], r["notes"]
                ])

if __name__ == "__main__":
    data = get_research_data()
    md_content = format_markdown(data)
    
    # Save markdown file
    md_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "RESEARCH_TABLES.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"Generated {md_path}")

    # Export CSVs
    csv_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "research_tables")
    export_csvs(data, csv_dir)
    print(f"Exported CSVs to {csv_dir}")
