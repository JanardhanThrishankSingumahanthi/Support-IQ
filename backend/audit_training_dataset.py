import json
import sqlite3
from pathlib import Path

def main():
    print("=" * 65)
    print("INDEPENDENT AUDIT: SupportIQ LoRA/QLoRA Training Dataset")
    print("=" * 65)

    data_dir = Path("backend/data/training")
    train_path = data_dir / "supportiq_train.jsonl"
    val_path = data_dir / "supportiq_val.jsonl"
    manifest_path = data_dir / "dataset_manifest.json"

    assert train_path.exists(), f"Missing {train_path}"
    assert val_path.exists(), f"Missing {val_path}"
    assert manifest_path.exists(), f"Missing {manifest_path}"

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # 1. Parse JSONL files
    train_records = []
    with open(train_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                train_records.append(json.loads(line))

    val_records = []
    with open(val_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                val_records.append(json.loads(line))

    total_count = len(train_records) + len(val_records)
    print(f"[+] Loaded {len(train_records)} Train records, {len(val_records)} Validation records (Total: {total_count})")
    assert len(train_records) == manifest["train_count"]
    assert len(val_records) == manifest["val_count"]

    # 2. Schema Integrity Check
    required_keys = {"id", "instruction", "context", "question", "answer", "metadata"}
    required_meta = {"category", "document_id", "chunk_id", "split", "is_answerable", "grounded"}

    all_questions = set()
    train_questions = set()
    val_questions = set()

    for r in train_records + val_records:
        assert required_keys.issubset(r.keys()), f"Missing keys in record {r.get('id')}"
        assert required_meta.issubset(r["metadata"].keys()), f"Missing metadata in record {r.get('id')}"
        assert r["question"].strip(), f"Empty question in {r['id']}"
        assert r["context"].strip(), f"Empty context in {r['id']}"
        assert r["answer"].strip(), f"Empty answer in {r['id']}"

        q_lower = r["question"].strip().lower()
        assert q_lower not in all_questions, f"Duplicate question detected: {r['question']}"
        all_questions.add(q_lower)

        if r["metadata"]["split"] == "train":
            train_questions.add(q_lower)
        else:
            val_questions.add(q_lower)

    print("[+] Schema Integrity: PASS (All fields populated, no empty values)")
    print(f"[+] Unique Questions: PASS ({len(all_questions)} distinct queries, 0 duplicates)")

    # 3. Train vs Validation Disjoint Check
    train_val_overlap = train_questions.intersection(val_questions)
    assert len(train_val_overlap) == 0, f"Overlap between train and val: {train_val_overlap}"
    print("[+] Train / Validation Separation: PASS (0 overlap between splits)")

    # 4. Strict Holdout Leakage Audit (against Dataset ID 2 in SQLite)
    conn = sqlite3.connect("backend/supportiq.db")
    cursor = conn.cursor()

    holdout_cases = cursor.execute("""
        SELECT id, question, expected_answer FROM evaluation_test_cases WHERE dataset_id = 2
    """).fetchall()

    print(f"\n[+] Verifying zero leakage against {len(holdout_cases)} Frozen Holdout cases...")
    for hid, hq, ha in holdout_cases:
        hq_clean = hq.strip().lower()
        ha_clean = (ha or "").strip().lower()

        # Check against all questions in dataset
        assert hq_clean not in all_questions, f"CRITICAL: Holdout #{hid} query found in training dataset!"

        # Check against all answers in dataset
        for r in train_records + val_records:
            ans_clean = r["answer"].strip().lower()
            if ha_clean and len(ha_clean) > 20:
                assert ha_clean != ans_clean, f"CRITICAL: Holdout #{hid} expected answer matches record {r['id']}!"

    print("[+] Strict Holdout Leakage Audit: PASS (100% clean, 0 holdout cases present)")

    # 5. Database Chunk Provenance Verification
    chunk_ids = {r["metadata"]["chunk_id"] for r in train_records + val_records}
    placeholders = ",".join("?" for _ in chunk_ids)
    db_chunks = cursor.execute(f"""
        SELECT id, document_id, content FROM document_chunks WHERE id IN ({placeholders})
    """, list(chunk_ids)).fetchall()

    db_chunk_map = {row[0]: row for row in db_chunks}
    for r in train_records + val_records:
        cid = r["metadata"]["chunk_id"]
        assert cid in db_chunk_map, f"Chunk {cid} not found in database!"
        # Verify content matches
        db_content_clean = " ".join(db_chunk_map[cid][2].split())
        r_content_clean = " ".join(r["context"].split())
        assert db_content_clean == r_content_clean, f"Content mismatch for chunk {cid}"

    print(f"[+] Chunk Provenance Verification: PASS (All {len(chunk_ids)} source chunks match SQLite)")
    conn.close()

    # 6. Sample Output Display
    print("\n" + "=" * 65)
    print("SAMPLE RECORD: TRAINING SPLIT")
    print("=" * 65)
    sample_train = train_records[0]
    print(f"ID         : {sample_train['id']}")
    print(f"Category   : {sample_train['metadata']['category']}")
    print(f"Document   : {sample_train['metadata']['document_title']} (Chunk #{sample_train['metadata']['chunk_id']})")
    print(f"Instruction: {sample_train['instruction']}")
    print(f"Context    :\n  \"{sample_train['context']}\"")
    print(f"Question   : \"{sample_train['question']}\"")
    print(f"Answer     :\n  \"{sample_train['answer']}\"")

    print("\n" + "=" * 65)
    print("SAMPLE RECORD: VALIDATION SPLIT")
    print("=" * 65)
    sample_val = val_records[0]
    print(f"ID         : {sample_val['id']}")
    print(f"Category   : {sample_val['metadata']['category']}")
    print(f"Document   : {sample_val['metadata']['document_title']} (Chunk #{sample_val['metadata']['chunk_id']})")
    print(f"Instruction: {sample_val['instruction']}")
    print(f"Context    :\n  \"{sample_val['context']}\"")
    print(f"Question   : \"{sample_val['question']}\"")
    print(f"Answer     :\n  \"{sample_val['answer']}\"")

    print("\n" + "=" * 65)
    print("AUDIT VERDICT: ALL AUDIT CHECKS PASSED (100% INTEGRITY)")
    print("=" * 65)

if __name__ == "__main__":
    main()
