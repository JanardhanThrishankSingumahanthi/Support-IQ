from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Document,
    DocumentChunk,
    EvaluationDataset,
    EvaluationTestCase,
    Experiment,
    Role,
    User,
)
from app.services.evaluation_runner import EvaluationRunner


def _create_test_user(session: Session) -> User:
    role = session.query(Role).filter_by(name="Administrator").first()
    if role is None:
        role = Role(name="Administrator", description="Admin role")
        session.add(role)
        session.commit()
        session.refresh(role)

    user = User(email="eval_runner@example.com", full_name="Eval User", role_id=role.id, is_active=True)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def test_evaluation_runner_calculates_empirical_metrics(tmp_path):
    database_path = tmp_path / "test_eval.db"
    engine = create_engine(f"sqlite:///{database_path.resolve().as_posix()}")
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        user = _create_test_user(session)

        # 1. Create real document & chunk
        doc = Document(
            title="Express Replacement Policy",
            owner_id=user.id,
            status="COMPLETED",
            content="Customers may request an express replacement within 14 days of receiving defective equipment.",
            metadata_json={"filename": "express.txt", "category": "Warranty"},
        )
        session.add(doc)
        session.flush()

        chunk = DocumentChunk(
            document_id=doc.id,
            chunk_index=1,
            content="Customers may request an express replacement within 14 days of receiving defective equipment.",
            metadata_json={"page": 1},
        )
        session.add(chunk)
        session.flush()

        # 2. Create dataset & test cases (1 answerable, 1 unsupported)
        dataset = EvaluationDataset(
            name="Test Eval Dataset",
            description="Unit test benchmark",
            version="1.0.0",
            created_by_user_id=user.id,
        )
        session.add(dataset)
        session.flush()

        case_answerable = EvaluationTestCase(
            dataset_id=dataset.id,
            question="What is the window for requesting an express replacement?",
            expected_answer="Customers may request an express replacement within 14 days.",
            expected_document_id=doc.id,
            expected_chunk_id=chunk.id,
            category="Warranty",
            is_answerable=True,
        )
        case_unsupported = EvaluationTestCase(
            dataset_id=dataset.id,
            question="What is the policy on quantum teleportation insurance?",
            expected_answer=None,
            expected_document_id=None,
            expected_chunk_id=None,
            category="Unsupported",
            is_answerable=False,
        )
        session.add_all([case_answerable, case_unsupported])
        session.flush()

        # 3. Create experiment
        experiment = Experiment(
            name="Unit Test Experiment",
            dataset_name=dataset.name,
            status="DRAFT",
            created_by_user_id=user.id,
        )
        session.add(experiment)
        session.commit()

        # 4. Run benchmark through EvaluationRunner
        runner = EvaluationRunner(db=session)
        result = runner.run_benchmark(
            experiment_id=experiment.id,
            dataset_id=dataset.id,
            model_variant="RAG + QLoRA",
        )

        assert result["status"] == "ok"
        metrics = result["metrics"]
        assert "recall_at_5" in metrics
        assert "mrr" in metrics
        assert "faithfulness" in metrics
        assert "citation_correctness" in metrics
        assert "hallucination_rate" in metrics
        assert "response_time" in metrics
        assert metrics["gpu_memory"] == "Not experimentally measured"
        assert metrics["parameter_count"] == "Not experimentally measured"

        # The answerable case matched the chunk
        assert metrics["recall_at_5"] == 1.0
        assert metrics["mrr"] == 1.0

        # The unsupported case was refused honestly (no hallucination)
        assert metrics["hallucination_rate"] == 0.0

        # Accuracy across both answerable and correct refusal is 100%
        assert metrics["accuracy"] == 1.0


def test_research_tables_service_generates_valid_research_data():
    from app.services.research_tables_service import get_research_data, format_markdown

    data = get_research_data()
    assert "table_1" in data
    assert "table_2" in data
    assert "table_3" in data
    assert "table_4" in data
    assert "table_5" in data
    assert "key_findings" in data
    assert len(data["table_2"]) == 6
    assert len(data["table_3"]) == 6
    assert len(data["table_4"]) == 10
    assert len(data["key_findings"]) >= 6

    assert "scientific_disclosure" in data
    assert "real_neural_experiments" in data
    assert len(data["real_neural_experiments"]) == 3

    # Check that Experiment 12 (QLoRA) and Experiment 7 (LoRA) are properly integrated
    qlora_exp = next((r for r in data["real_neural_experiments"] if r["experiment_id"] == 12), None)
    lora_exp = next((r for r in data["real_neural_experiments"] if r["experiment_id"] == 7 and "LoRA" in r["model_name"]), None)
    assert qlora_exp is not None
    assert lora_exp is not None
    assert qlora_exp["quantization"] == "4-bit NF4 (Double Quantization + PEFT)"
    assert qlora_exp["peak_gpu_vram"] == "0.46 GB (11.5% of GPU)"
    assert lora_exp["llm_generation_latency"] == "0.844s"
    assert qlora_exp["accuracy"] == "100.0% (10/10)"
    assert lora_exp["faithfulness"] == "100.0% (7/7)"

    md = format_markdown(data)
    assert "# SupportIQ Final Empirical Research Metrics & Tables" in md
    assert "Scientific Disclosure" in md
    assert "Real Neural-Model Experiments" in md
    assert "1. Dataset & Evaluation Protocol" in md
    assert "2. Final Holdout Model/Configuration Comparison" in md
    assert "3. Retrieval & Verification Ablation Study" in md
    assert "4. Per-Case Error Analysis Matrix" in md
    assert "5. Retrieval & Verification Latency Breakdown" in md
    assert "6. Key Findings" in md


