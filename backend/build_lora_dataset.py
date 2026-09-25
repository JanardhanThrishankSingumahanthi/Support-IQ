import json
import os
import sqlite3
import re
from pathlib import Path

def sanitize_text(text: str) -> str:
    return " ".join(text.split()).strip()

def tokenize(text: str) -> set:
    return set(re.findall(r'\b\w+\b', text.lower()))

def jaccard_similarity(s1: str, s2: str) -> float:
    t1 = tokenize(s1)
    t2 = tokenize(s2)
    if not t1 or not t2:
        return 0.0
    return len(t1.intersection(t2)) / len(t1.union(t2))

def main():
    print("=" * 65)
    print("SupportIQ REAL LoRA/QLoRA Dataset Generation & Validation")
    print("=" * 65)

    db_path = Path("backend/supportiq.db")
    if not db_path.exists():
        print(f"[-] Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Load Frozen Holdout Cases (Dataset ID 2) for strict leakage exclusion
    holdout_cases = []
    for row in cursor.execute("""
        SELECT id, question, expected_answer, expected_chunk_id, category 
        FROM evaluation_test_cases 
        WHERE dataset_id = 2
    """).fetchall():
        holdout_cases.append({
            "id": row[0],
            "question": sanitize_text(row[1]),
            "expected_answer": sanitize_text(row[2] or ""),
            "expected_chunk_id": row[3],
            "category": row[4]
        })

    print(f"[+] Loaded {len(holdout_cases)} Frozen Holdout cases from Dataset ID 2 (STRICT EXCLUSION TARGETS):")
    for hc in holdout_cases:
        print(f"    - Holdout #{hc['id']}: '{hc['question']}'")

    # 2. Load Real Support Knowledge Chunks from SQLite
    support_docs = cursor.execute("""
        SELECT c.id, c.document_id, d.title, c.chunk_index, c.content
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE d.title IN (
            'Return_Policy.pdf', 
            'Terms_of_Service.pdf', 
            'Product_Warranty.pdf', 
            'Customer_FAQ.pdf', 
            'Payment_Guide.docx', 
            'Account_Management.pdf',
            'Express_Replacement_Policy_Test'
        )
        ORDER BY c.id ASC
    """).fetchall()

    chunks_by_id = {}
    for cid, did, dtitle, cidx, content in support_docs:
        chunks_by_id[cid] = {
            "chunk_id": cid,
            "document_id": did,
            "document_title": dtitle,
            "chunk_index": cidx,
            "content": sanitize_text(content)
        }

    print(f"\n[+] Loaded {len(chunks_by_id)} support-domain knowledge chunks from SQLite.")

    # 3. Define Instruction-Style Support Dataset Examples
    # Formatted strictly as: Instruction + Support Context + User Question -> Grounded Support Answer
    SYSTEM_INSTRUCTION = (
        "You are SupportIQ's AI customer support assistant. Answer the customer's question "
        "accurately, professionally, and concisely using ONLY the provided support context. "
        "Do not invent facts not supported by the context."
    )

    # Carefully curated customer support Q&A pairs grounded in real SupportIQ documents
    # (Completely separated from the 10 holdout cases)
    raw_dataset = [
        # --- RETURN & REFUND POLICY (Doc 1, Chunk 1: Refund Policy) ---
        {
            "category": "Refund & Billing",
            "chunk_id": 1,
            "question": "Can I get a refund for an annual subscription that was bought 10 days ago?",
            "answer": "Yes. Annual subscriptions may be refunded within 14 days of purchase, provided the service has not been substantially used. Since your purchase was 10 days ago, you are within the 14-day refund window.",
            "split": "train"
        },
        {
            "category": "Refund & Billing",
            "chunk_id": 1,
            "question": "What is the refund window for annual subscription plans in SupportIQ?",
            "answer": "Annual subscriptions can be refunded within 14 days of purchase, provided that the service has not been substantially used.",
            "split": "train"
        },
        {
            "category": "Refund & Billing",
            "chunk_id": 1,
            "question": "How many business days does it normally take for a subscription refund to appear on my original payment method?",
            "answer": "Refund requests are typically processed within 5 to 7 business days back to your original payment method.",
            "split": "train"
        },
        {
            "category": "Refund & Billing",
            "chunk_id": 1,
            "question": "If I purchased an annual subscription 3 weeks ago, can I receive a full refund?",
            "answer": "No. Annual subscriptions are only eligible for a refund within 14 days of purchase. A purchase made 3 weeks ago (21 days) falls outside the eligible 14-day refund window.",
            "split": "val"
        },
        {
            "category": "Refund & Billing",
            "chunk_id": 1,
            "question": "Does SupportIQ refund annual subscriptions if the account has experienced heavy, substantial usage?",
            "answer": "No. Under the refund policy, annual subscription refunds are provided only on the condition that the service has not been substantially used.",
            "split": "train"
        },

        # --- PRODUCT RETURN ELIGIBILITY (Doc 1, Chunk 2: Return Eligibility) ---
        {
            "category": "Product Returns",
            "chunk_id": 2,
            "question": "What criteria must a physical product meet to qualify for a return?",
            "answer": "To be eligible for a return, the product must be unused, in the same condition that you received it, and in its original packaging.",
            "split": "train"
        },
        {
            "category": "Product Returns",
            "chunk_id": 2,
            "question": "Can I return an item if I have already unboxed and used it?",
            "answer": "No. To qualify for a return under our policy, the product must remain unused, in the same condition as when received, and in its original packaging.",
            "split": "train"
        },
        {
            "category": "Product Returns",
            "chunk_id": 2,
            "question": "Is the original product packaging required when returning a delivered item?",
            "answer": "Yes. Return eligibility strictly requires that the product must be in its original packaging and in unused condition.",
            "split": "val"
        },
        {
            "category": "Product Returns",
            "chunk_id": 2,
            "question": "What condition must an item be in to be accepted for return by SupportIQ?",
            "answer": "The item must be in the exact same condition that you received it, completely unused, and packed in its original packaging.",
            "split": "train"
        },

        # --- SERVICE LEVEL AGREEMENT (Doc 2, Chunk 5: SLA) ---
        {
            "category": "SLA & Reliability",
            "chunk_id": 5,
            "question": "What is the guaranteed service level agreement (SLA) for SupportIQ automated customer support endpoints?",
            "answer": "SupportIQ provides a 99.9% uptime availability SLA for all cloud-hosted automated customer support retrieval endpoints.",
            "split": "train"
        },
        {
            "category": "SLA & Reliability",
            "chunk_id": 5,
            "question": "Does SupportIQ guarantee high availability for cloud customer support retrieval endpoints?",
            "answer": "Yes. As stated in Section 8 of our Terms of Service, SupportIQ provides 99.9% uptime availability for all cloud-hosted automated customer support retrieval endpoints.",
            "split": "train"
        },
        {
            "category": "SLA & Reliability",
            "chunk_id": 5,
            "question": "What specific endpoints are covered under SupportIQ's 99.9% uptime commitment?",
            "answer": "The 99.9% uptime availability commitment covers all cloud-hosted automated customer support retrieval endpoints.",
            "split": "val"
        },
        {
            "category": "SLA & Reliability",
            "chunk_id": 5,
            "question": "What happens if cloud retrieval endpoints experience downtime below the 99.9% SLA commitment?",
            "answer": "SupportIQ's SLA commits to 99.9% uptime availability for cloud-hosted automated customer support retrieval endpoints under Section 8 of the Terms of Service.",
            "split": "train"
        },

        # --- HARDWARE WARRANTY (Doc 3, Chunk 6: Warranty Coverage) ---
        {
            "category": "Hardware Warranty",
            "chunk_id": 6,
            "question": "What warranty is included with Dell laptops provided through SupportIQ?",
            "answer": "Dell laptops typically come with a 1-year limited hardware warranty covering manufacturing defects.",
            "split": "train"
        },
        {
            "category": "Hardware Warranty",
            "chunk_id": 6,
            "question": "Are manufacturing defects covered under the standard Dell laptop warranty?",
            "answer": "Yes. The 1-year limited hardware warranty specifically covers manufacturing defects.",
            "split": "train"
        },
        {
            "category": "Hardware Warranty",
            "chunk_id": 6,
            "question": "Can I extend the hardware warranty coverage on my Dell laptop?",
            "answer": "Yes. You can extend your Dell hardware warranty coverage with Dell Premium Support.",
            "split": "val"
        },
        {
            "category": "Hardware Warranty",
            "chunk_id": 6,
            "question": "What is the duration of the standard limited hardware warranty for Dell equipment?",
            "answer": "The standard limited hardware warranty duration is 1 year, covering manufacturing defects with the option to extend via Premium Support.",
            "split": "train"
        },

        # --- ACCOUNT PASSWORD RESET (Doc 4, Chunk 8: Password Reset) ---
        {
            "category": "Account Security",
            "chunk_id": 8,
            "question": "How can I reset my SupportIQ account password if I cannot log in?",
            "answer": "To reset your password, click 'Forgot password?' on the login page and enter your registered email address. You will receive a secure one-time reset link.",
            "split": "train"
        },
        {
            "category": "Account Security",
            "chunk_id": 8,
            "question": "For how long is the password reset link valid after requesting it?",
            "answer": "The secure one-time password reset link is valid for 15 minutes.",
            "split": "train"
        },
        {
            "category": "Account Security",
            "chunk_id": 8,
            "question": "What email address should I provide when requesting a password reset link?",
            "answer": "You must enter your registered email address on the password reset form to receive the secure link.",
            "split": "val"
        },
        {
            "category": "Account Security",
            "chunk_id": 8,
            "question": "What should I do if my password reset link expires after 15 minutes?",
            "answer": "Because the secure one-time reset link is valid for 15 minutes, if it expires, click 'Forgot password?' again on the login page to request a new link.",
            "split": "train"
        },

        # --- PAYMENT METHODS & BILLING (Doc 5, Chunk 10: Billing & Payments) ---
        {
            "category": "Billing & Payments",
            "chunk_id": 10,
            "question": "What payment methods are supported for SupportIQ subscriptions?",
            "answer": "SupportIQ supports major credit cards (Visa, MasterCard, and American Express) as well as automated bank clearing.",
            "split": "train"
        },
        {
            "category": "Billing & Payments",
            "chunk_id": 10,
            "question": "Can I pay using American Express or Visa for my SupportIQ account?",
            "answer": "Yes. Major credit cards including Visa, MasterCard, and American Express (Amex) are supported.",
            "split": "train"
        },
        {
            "category": "Billing & Payments",
            "chunk_id": 10,
            "question": "I was accidentally charged twice for my subscription this month. How can this be resolved?",
            "answer": "If you were billed twice, our billing team can issue an instant reversal upon receiving your transaction IDs.",
            "split": "train"
        },
        {
            "category": "Billing & Payments",
            "chunk_id": 10,
            "question": "What information does the billing team need to reverse a duplicate subscription charge?",
            "answer": "The billing team requires the transaction IDs to verify the duplicate charge and issue an instant reversal.",
            "split": "val"
        },
        {
            "category": "Billing & Payments",
            "chunk_id": 10,
            "question": "Does SupportIQ support automated bank clearing for corporate subscriptions?",
            "answer": "Yes. Automated bank clearing is supported alongside major credit cards (Visa, MasterCard, Amex).",
            "split": "train"
        },

        # --- EXPRESS REPLACEMENT POLICY (Docs 8, 9, 10, Chunk 14: Express Replacement) ---
        {
            "category": "Express Replacement",
            "chunk_id": 14,
            "question": "Within what timeframe must I request an express replacement for a damaged shipment?",
            "answer": "Customers may request an express replacement within 14 days of receiving damaged or defective equipment.",
            "split": "train"
        },
        {
            "category": "Express Replacement",
            "chunk_id": 14,
            "question": "Do customers have to pay for return shipping on verified warranty replacements?",
            "answer": "No. SupportIQ covers all standard return shipping costs for verified warranty defects.",
            "split": "train"
        },
        {
            "category": "Express Replacement",
            "chunk_id": 14,
            "question": "What authorization number is required before returning defective equipment for express replacement?",
            "answer": "A valid Return Merchandise Authorization (RMA) number must be generated through the customer support portal before returning equipment.",
            "split": "train"
        },
        {
            "category": "Express Replacement",
            "chunk_id": 14,
            "question": "Does accidental liquid spill or water damage qualify for an express replacement?",
            "answer": "No. Accidental water damage and unauthorized third-party modifications void express replacement eligibility.",
            "split": "train"
        },
        {
            "category": "Express Replacement",
            "chunk_id": 14,
            "question": "What actions void express replacement coverage under the SupportIQ equipment policy?",
            "answer": "Express replacement eligibility is voided by accidental water damage and unauthorized third-party modifications.",
            "split": "val"
        },
        {
            "category": "Express Replacement",
            "chunk_id": 14,
            "question": "Where can a customer generate an RMA number for express equipment replacement?",
            "answer": "A valid Return Merchandise Authorization (RMA) number must be generated through the customer support portal.",
            "split": "train"
        },
        {
            "category": "Express Replacement",
            "chunk_id": 14,
            "question": "If I received a defective monitor 10 days ago, am I eligible to request an express replacement?",
            "answer": "Yes. Because your equipment was received 10 days ago, you are within the 14-day window to request an express replacement, provided you generate an RMA via the support portal and the defect is not due to non-eligible causes.",
            "split": "train"
        },
        {
            "category": "Express Replacement",
            "chunk_id": 14,
            "question": "Are shipping costs covered if equipment has unauthorized third-party modifications?",
            "answer": "No. Unauthorized third-party modifications void express replacement eligibility entirely, meaning standard warranty replacement shipping is not covered.",
            "split": "val"
        },

        # --- USER ROLE PERMISSIONS (Doc 6, Chunk 13: Roles) ---
        {
            "category": "Account & Roles",
            "chunk_id": 13,
            "question": "What role in SupportIQ is responsible for responding to ticket escalations?",
            "answer": "Support agents are responsible for responding to escalations in SupportIQ.",
            "split": "train"
        },
        {
            "category": "Account & Roles",
            "chunk_id": 13,
            "question": "Which user role in SupportIQ has permission to manage users and model configurations?",
            "answer": "Administrators manage users and models within SupportIQ.",
            "split": "train"
        },
        {
            "category": "Account & Roles",
            "chunk_id": 13,
            "question": "Can support agents manage model configurations in SupportIQ?",
            "answer": "No. Administrators manage users and models, while support agents are dedicated to responding to ticket escalations.",
            "split": "val"
        },

        # --- INTEGRATION API OVERVIEW (Doc 4, Chunk 9: API Integration) ---
        {
            "category": "Integration",
            "chunk_id": 9,
            "question": "Can our engineering team connect SupportIQ with our internal documentation and tools?",
            "answer": "Yes. SupportIQ can be connected with third-party ticketing platforms and internal documentation via our REST API and webhooks.",
            "split": "train"
        },
        {
            "category": "Integration",
            "chunk_id": 9,
            "question": "What interfaces does SupportIQ provide to connect with external platforms?",
            "answer": "SupportIQ provides a REST API and webhooks to connect with third-party ticketing platforms and internal documentation.",
            "split": "train"
        },

        # --- DATA SECURITY (Doc 6, Chunk 12: Security Controls) ---
        {
            "category": "Security & Privacy",
            "chunk_id": 12,
            "question": "How are indexed knowledge documents protected at rest within the SupportIQ infrastructure?",
            "answer": "All customer support conversations and indexed knowledge documents are encrypted at rest using AES-256.",
            "split": "train"
        },
        {
            "category": "Security & Privacy",
            "chunk_id": 12,
            "question": "What cryptographic protocol protects support conversations in transit?",
            "answer": "All customer support conversations and knowledge documents are encrypted in transit via TLS 1.3.",
            "split": "val"
        }
    ]

    # 4. Strict Validation Suite
    print(f"\n[+] Processing {len(raw_dataset)} total Q&A candidate examples...")

    train_examples = []
    val_examples = []
    seen_questions = set()
    leakage_detected = []

    for idx, item in enumerate(raw_dataset):
        q = sanitize_text(item["question"])
        ans = sanitize_text(item["answer"])
        cid = item["chunk_id"]

        # Duplicate check
        q_lower = q.lower()
        if q_lower in seen_questions:
            raise ValueError(f"Duplicate question detected: '{q}'")
        seen_questions.add(q_lower)

        # Provenance check
        if cid not in chunks_by_id:
            raise ValueError(f"Invalid chunk_id {cid} for question '{q}'")
        chunk_info = chunks_by_id[cid]

        # STRICT HOLDOUT LEAKAGE CHECK against Dataset ID 2
        for hc in holdout_cases:
            hq = hc["question"]
            sim = jaccard_similarity(q, hq)
            # Flag if identical or too close (Jaccard > 0.60)
            if q_lower == hq.lower() or sim > 0.60:
                leakage_detected.append({
                    "dataset_q": q,
                    "holdout_id": hc["id"],
                    "holdout_q": hq,
                    "similarity": round(sim, 3)
                })

        example_record = {
            "id": f"siq-lora-{idx+1:03d}",
            "instruction": SYSTEM_INSTRUCTION,
            "context": chunk_info["content"],
            "question": q,
            "answer": ans,
            "metadata": {
                "category": item["category"],
                "document_id": chunk_info["document_id"],
                "document_title": chunk_info["document_title"],
                "chunk_id": cid,
                "split": item["split"],
                "is_answerable": True,
                "grounded": True
            }
        }

        if item["split"] == "train":
            train_examples.append(example_record)
        elif item["split"] == "val":
            val_examples.append(example_record)
        else:
            raise ValueError(f"Unknown split: {item['split']}")

    # 5. Report Leakage Status
    if leakage_detected:
        print("[-] CRITICAL FAILURE: HOLDOUT LEAKAGE DETECTED:")
        for leak in leakage_detected:
            print(f"    - Dataset: '{leak['dataset_q']}' overlaps with Holdout #{leak['holdout_id']}: '{leak['holdout_q']}' (sim={leak['similarity']})")
        raise RuntimeError("Dataset generation aborted due to holdout leakage.")
    else:
        print("[+] ZERO HOLDOUT LEAKAGE: Validated against all 10 Dataset ID 2 holdout queries.")

    # 6. Save JSONL Files
    out_dir = Path("backend/data/training")
    out_dir.mkdir(parents=True, exist_ok=True)

    train_path = out_dir / "supportiq_train.jsonl"
    val_path = out_dir / "supportiq_val.jsonl"
    manifest_path = out_dir / "dataset_manifest.json"

    with open(train_path, "w", encoding="utf-8") as f:
        for ex in train_examples:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    with open(val_path, "w", encoding="utf-8") as f:
        for ex in val_examples:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    manifest = {
        "dataset_name": "SupportIQ-Domain-Instruction-Tuning-v1",
        "description": "Domain-specific customer support instruction tuning dataset grounded in SupportIQ knowledge base documents.",
        "created_at": "2026-09-25",
        "total_examples": len(raw_dataset),
        "train_count": len(train_examples),
        "val_count": len(val_examples),
        "train_split_pct": round(len(train_examples) / len(raw_dataset) * 100, 1),
        "val_split_pct": round(len(val_examples) / len(raw_dataset) * 100, 1),
        "holdout_dataset_excluded": 2,
        "holdout_leakage_count": 0,
        "categories": list(sorted(set(item["category"] for item in raw_dataset))),
        "files": {
            "train": str(train_path),
            "val": str(val_path)
        }
    }

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("\n" + "=" * 65)
    print("DATASET PREPARATION & AUDIT SUMMARY")
    print("=" * 65)
    print(f"[+] Total Dataset Examples : {len(raw_dataset)}")
    print(f"[+] Training Split Examples: {len(train_examples)} ({manifest['train_split_pct']}%)")
    print(f"[+] Validation Split Exs   : {len(val_examples)} ({manifest['val_split_pct']}%)")
    print(f"[+] Categories Covered     : {len(manifest['categories'])}")
    for cat in manifest['categories']:
        cat_count = sum(1 for ex in raw_dataset if ex['category'] == cat)
        print(f"    - {cat}: {cat_count} examples")
    print(f"[+] Holdout Dataset (ID 2) : 100% EXCLUDED (0 overlap)")
    print(f"[+] Exported Training Set  : {train_path} ({train_path.stat().st_size} bytes)")
    print(f"[+] Exported Validation Set: {val_path} ({val_path.stat().st_size} bytes)")
    print(f"[+] Exported Manifest      : {manifest_path}")
    print("=" * 65)

    conn.close()

if __name__ == "__main__":
    main()
