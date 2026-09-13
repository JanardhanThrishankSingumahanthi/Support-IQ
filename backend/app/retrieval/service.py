from __future__ import annotations

import hashlib
import math
import re
import time
from collections import Counter
from typing import Any

from sqlalchemy.orm import Session

from app.db.models import Document, DocumentChunk

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").lower()).strip()


def tokenize(value: str) -> list[str]:
    text = normalize_text(value)
    return [token for token in _TOKEN_RE.findall(text) if len(token) > 2]


def _hash_vector(tokens: list[str], vector_size: int = 32) -> list[float]:
    vector = [0.0 for _ in range(vector_size)]
    if not tokens:
        return vector
    for token in tokens:
        digest = hashlib.sha1(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:4], "big") % vector_size
        vector[index] += 1.0
    return vector


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        limit = min(len(left), len(right))
        left = left[:limit]
        right = right[:limit]
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return float(dot / (left_norm * right_norm))


def lexical_score(query_tokens: list[str], chunk_text: str) -> float:
    if not query_tokens:
        return 0.0
    chunk_tokens = Counter(tokenize(chunk_text))
    overlap = sum(chunk_tokens[token] for token in set(query_tokens) if token in chunk_tokens)
    query_weight = sum(1 for token in set(query_tokens) if token)
    if query_weight == 0:
        return 0.0
    return overlap / max(query_weight, 1)


def compute_recall_at_k(relevant_ids: list[int], retrieved_ids: list[int], k: int) -> float:
    if not relevant_ids:
        return 0.0
    window = retrieved_ids[:k]
    overlap = len(set(relevant_ids).intersection(window))
    return overlap / len(set(relevant_ids))


def compute_mrr(relevant_ids: list[int], retrieved_ids: list[int]) -> float:
    if not relevant_ids:
        return 0.0
    relevant_set = set(relevant_ids)
    for index, item in enumerate(retrieved_ids, start=1):
        if item in relevant_set:
            return 1.0 / index
    return 0.0


class RetrievalService:
    def __init__(self, db: Session, user_id: int | None = None):
        self.db = db
        self.user_id = user_id

    @staticmethod
    def split_answer_claims(answer: str) -> list[str]:
        cleaned = (answer or "").strip()
        if not cleaned:
            return []
        parts = re.split(r"(?<=[.!?])\s+|\n+", cleaned)
        claims: list[str] = []
        for part in parts:
            sentence = " ".join(part.strip().split())
            if sentence and len(sentence) > 6:
                claims.append(sentence)
        return claims or [cleaned]

    @staticmethod
    def _claim_evidence_match(claim: str, results: list[dict[str, Any]]) -> list[dict[str, Any]]:
        claim_tokens = set(tokenize(claim))
        if not claim_tokens:
            return []

        matches: list[dict[str, Any]] = []
        for result in results:
            chunk_text = str(result.get("content") or "")
            chunk_tokens = set(tokenize(chunk_text))
            overlap = claim_tokens.intersection(chunk_tokens)
            if not overlap:
                continue
            score = lexical_score(list(claim_tokens), chunk_text)
            matches.append(
                {
                    "document_id": result.get("document_id"),
                    "document_title": result.get("document_title"),
                    "chunk_id": result.get("chunk_id"),
                    "chunk_index": result.get("chunk_index"),
                    "content": chunk_text[:800],
                    "score": round(float(score), 6),
                    "matched_terms": sorted(overlap),
                }
            )

        matches.sort(key=lambda item: item["score"], reverse=True)
        return matches

    def analyze_answer_grounding(self, query: str, answer: str, top_k: int = 5) -> dict[str, Any]:
        retrieval_results = self.retrieve(query=query, top_k=top_k, retrieval_method="hybrid")
        claims = self.split_answer_claims(answer)
        claim_details: list[dict[str, Any]] = []
        claim_evidence_rows: list[dict[str, Any]] = []
        evidence_scores: list[float] = []
        supported_claim_count = 0

        for claim in claims:
            matches = self._claim_evidence_match(claim, retrieval_results)
            best_score = matches[0]["score"] if matches else 0.0
            supported = best_score >= 0.12
            if supported:
                supported_claim_count += 1
                evidence_scores.append(best_score)
            else:
                evidence_scores.append(0.0)

            details = {
                "claim_text": claim,
                "supported": supported,
                "score": round(float(best_score), 6),
                "matched_evidence": [
                    {
                        "document_id": item["document_id"],
                        "document_title": item["document_title"],
                        "chunk_id": item["chunk_id"],
                        "chunk_index": item["chunk_index"],
                        "content": item["content"],
                        "score": item["score"],
                        "matched_terms": item["matched_terms"],
                    }
                    for item in matches[:3]
                ],
            }
            claim_details.append(details)
            for item in matches[:3]:
                claim_evidence_rows.append(
                    {
                        "claim_text": claim,
                        "document_id": item["document_id"],
                        "document_title": item["document_title"],
                        "chunk_id": item["chunk_id"],
                        "content": item["content"],
                        "score": item["score"],
                        "matched_terms": item["matched_terms"],
                        "matched_evidence": [
                            {
                                "document_id": item["document_id"],
                                "document_title": item["document_title"],
                                "chunk_id": item["chunk_id"],
                                "chunk_index": item["chunk_index"],
                                "content": item["content"],
                                "score": item["score"],
                                "matched_terms": item["matched_terms"],
                            }
                        ],
                    }
                )

        claim_total = max(len(claims), 1)
        coverage = supported_claim_count / claim_total
        average_support = sum(evidence_scores) / claim_total if evidence_scores else 0.0
        reliability_score = min(1.0, max(0.0, (0.7 * coverage) + (0.3 * average_support / max(1.0, 0.2))))
        grounding_status = "supported"
        if coverage < 0.5:
            grounding_status = "unsupported"
        elif coverage < 0.8:
            grounding_status = "partially_supported"

        return {
            "query": query,
            "answer": answer,
            "claim_count": len(claims),
            "supported_claim_count": supported_claim_count,
            "unsupported_claim_count": claim_total - supported_claim_count,
            "grounding_status": grounding_status,
            "claims": claim_details,
            "claim_evidence": claim_evidence_rows,
            "reliability": {
                "score": round(float(reliability_score), 6),
                "coverage": round(float(coverage), 6),
                "average_evidence_score": round(float(average_support), 6),
                "label": "high" if reliability_score >= 0.8 else "medium" if reliability_score >= 0.45 else "low",
            },
            "retrieval_results": retrieval_results,
        }

    def _query_documents(self):
        query = self.db.query(Document).filter(Document.status == "COMPLETED")
        if self.user_id is not None:
            query = query.filter(Document.owner_id == self.user_id)
        return query.order_by(Document.updated_at.desc())

    def ensure_chunk_embedding(self, chunk: DocumentChunk) -> list[float]:
        embedding = chunk.metadata_json.get("embedding") if chunk.metadata_json else None
        if embedding and isinstance(embedding, list) and all(isinstance(value, (int, float)) for value in embedding):
            return [float(value) for value in embedding]

        vector = _hash_vector(tokenize(chunk.content or ""))
        if chunk.metadata_json is None:
            chunk.metadata_json = {}
        chunk.metadata_json["embedding"] = vector
        return vector

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        retrieval_method: str = "hybrid",
    ) -> list[dict[str, Any]]:
        query_text = normalize_text(query)
        query_tokens = tokenize(query_text)
        started_at = time.perf_counter()
        documents = self._query_documents().all()

        candidates: list[dict[str, Any]] = []
        for document in documents:
            for chunk in document.chunks:
                chunk_text = chunk.content or ""
                chunk_tokens = tokenize(chunk_text)
                if not query_tokens and not chunk_tokens:
                    continue

                chunk_embedding = self.ensure_chunk_embedding(chunk)
                query_embedding = _hash_vector(query_tokens)
                vector_score = cosine_similarity(query_embedding, chunk_embedding)
                lexical = lexical_score(query_tokens, chunk_text)
                hybrid = (0.65 * lexical) + (0.35 * max(vector_score, 0.0))

                score_map = {
                    "lexical": lexical,
                    "vector": max(vector_score, 0.0),
                    "hybrid": hybrid,
                }
                score = score_map.get(retrieval_method.lower(), hybrid)
                if score <= 0:
                    continue

                candidates.append(
                    {
                        "document_id": document.id,
                        "document_title": document.title,
                        "chunk_id": chunk.id,
                        "chunk_index": chunk.chunk_index,
                        "content": chunk_text[:800],
                        "retrieval_method": retrieval_method.lower(),
                        "similarity_score": round(float(score), 6),
                        "lexical_score": round(float(lexical), 6),
                        "vector_score": round(float(max(vector_score, 0.0)), 6),
                        "matched_terms": sorted(set(query_tokens).intersection(set(chunk_tokens))),
                        "document_metadata": document.metadata_json or {},
                    }
                )

        ranked = sorted(candidates, key=lambda item: item["similarity_score"], reverse=True)[:top_k]
        for index, item in enumerate(ranked, start=1):
            item["rank"] = index
            item["latency_ms"] = round((time.perf_counter() - started_at) * 1000, 3)

        if ranked:
            self.db.commit()

        return ranked
