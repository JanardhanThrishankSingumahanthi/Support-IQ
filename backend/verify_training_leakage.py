import json
import sqlite3
from pathlib import Path

TRAIN_PATH = (Path(__file__).parent / "data" / "training" / "supportiq_train.jsonl").resolve()
VAL_PATH = (Path(__file__).parent / "data" / "training" / "supportiq_val.jsonl").resolve()
DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def verify_datasets():
    print(f"Train file: {TRAIN_PATH} (exists: {TRAIN_PATH.exists()})")
    print(f"Val file: {VAL_PATH} (exists: {VAL_PATH.exists()})")

    train_records = []
    with open(TRAIN_PATH, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if line.strip():
                train_records.append(json.loads(line))
    print(f"Actual Train records: {len(train_records)}")

    val_records = []
    with open(VAL_PATH, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if line.strip():
                val_records.append(json.loads(line))
    print(f"Actual Val records: {len(val_records)}")

    # Inspect sample format
    if train_records:
        print("\nTrain sample keys:", list(train_records[0].keys()))
        print("Train sample prompt/messages:", train_records[0].get("messages", train_records[0]))

    # Connect to DB to get Dataset 1 and Dataset 2 questions
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT id, name FROM evaluation_datasets")
    datasets = cur.fetchall()
    print("\nEvaluation Datasets in DB:", datasets)

    cur.execute("SELECT id, dataset_id, question, is_answerable FROM evaluation_test_cases ORDER BY id ASC")
    test_cases = cur.fetchall()
    print(f"Total test cases in DB: {len(test_cases)}")

    ds1_questions = [tc[2].strip().lower() for tc in test_cases if tc[1] == 1]
    ds2_questions = [tc[2].strip().lower() for tc in test_cases if tc[1] == 2]

    print(f"Dataset 1 questions ({len(ds1_questions)}):")
    for q in ds1_questions:
        print(f"  - {q}")

    print(f"Dataset 2 questions ({len(ds2_questions)}):")
    for q in ds2_questions:
        print(f"  - {q}")

    # Extract user queries from train & val
    def extract_user_query(rec):
        if "messages" in rec:
            for m in rec["messages"]:
                if m.get("role") == "user":
                    return m.get("content", "").strip().lower()
        if "prompt" in rec:
            return rec["prompt"].strip().lower()
        if "question" in rec:
            return rec["question"].strip().lower()
        return str(rec).strip().lower()

    train_queries = [extract_user_query(r) for r in train_records]
    val_queries = [extract_user_query(r) for r in val_records]

    # Check for leakage
    print("\n--- LEAKAGE CHECK ---")
    leakage_train_ds2 = []
    for dq in ds2_questions:
        for tq in train_queries:
            if dq in tq or tq in dq:
                leakage_train_ds2.append((dq, tq))

    leakage_val_ds2 = []
    for dq in ds2_questions:
        for vq in val_queries:
            if dq in vq or vq in dq:
                leakage_val_ds2.append((dq, vq))

    print(f"Dataset 2 questions in Train: {len(leakage_train_ds2)}")
    for d, t in leakage_train_ds2:
        print(f"  MATCH: DS2='{d}' vs Train='{t}'")

    print(f"Dataset 2 questions in Val: {len(leakage_val_ds2)}")
    for d, v in leakage_val_ds2:
        print(f"  MATCH: DS2='{d}' vs Val='{v}'")

    leakage_train_ds1 = []
    for dq in ds1_questions:
        for tq in train_queries:
            if dq in tq or tq in dq:
                leakage_train_ds1.append((dq, tq))

    print(f"Dataset 1 questions in Train: {len(leakage_train_ds1)}")

    conn.close()

if __name__ == "__main__":
    verify_datasets()
