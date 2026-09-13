from app.training.config import LoraTrainingConfig, QLoraTrainingConfig, TrainingPipelineConfig
from app.training.hardware import detect_hardware
from app.training.pipeline import TrainingPipeline


def test_hardware_detection_reports_capability_without_faking_training():
    profile = detect_hardware()
    assert "supports_transformers" in profile.to_dict()
    assert "device_type" in profile.to_dict()
    assert isinstance(profile.libraries, dict)


def test_lora_config_and_pipeline_are_serializable():
    config = TrainingPipelineConfig(
        model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        dataset_name="demo-dataset",
        output_dir="./artifacts/test",
        dry_run=True,
        lora=LoraTrainingConfig(
            rank=4,
            alpha=8,
            dropout=0.1,
            target_modules=["q_proj", "v_proj"],
            learning_rate=1e-4,
            batch_size=1,
            gradient_accumulation_steps=2,
            epochs=1,
            max_seq_length=512,
        ),
        qlora=QLoraTrainingConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype="float16",
            gradient_checkpointing=True,
            mixed_precision="bf16",
        ),
    )

    pipeline = TrainingPipeline(config)
    result = pipeline.run(dry_run=True)
    assert result["status"] in {"dry_run", "unsupported", "ready"}
    assert result["pipeline"]["lora"]["rank"] == 4
    assert result["pipeline"]["qlora"]["bnb_4bit_quant_type"] == "nf4"


def test_qlora_detects_unsupported_hardware_without_claiming_success():
    config = TrainingPipelineConfig(
        model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        dataset_name="demo-dataset",
        dry_run=False,
        lora=LoraTrainingConfig(),
        qlora=QLoraTrainingConfig(),
    )

    pipeline = TrainingPipeline(config)
    result = pipeline.run(dry_run=False)

    if result["status"] == "unsupported":
        assert "QLoRA" in result["reason"] or "not supported" in result["reason"].lower()
    else:
        assert result["status"] in {"ready", "dry_run"}
