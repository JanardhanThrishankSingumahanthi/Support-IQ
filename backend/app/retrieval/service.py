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

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
    "have", "haven't", "having", "he", "her", "here", "hers", "herself", "him",
    "himself", "his", "how", "i", "if", "in", "into", "is", "isn't", "it", "its",
    "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no",
    "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
    "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
    "should", "shouldn't", "so", "some", "such", "than", "that", "the", "their",
    "theirs", "them", "themselves", "then", "there", "these", "they", "this",
    "those", "through", "to", "too", "under", "until", "up", "very", "was",
    "wasn't", "we", "were", "weren't", "what", "when", "where", "which", "while",
    "who", "whom", "why", "with", "won't", "would", "wouldn't", "you", "your",
    "yours", "yourself", "yourselves"
}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").lower()).strip()


def tokenize(value: str, filter_stopwords: bool = True) -> list[str]:
    text = normalize_text(value)
    tokens = [token for token in _TOKEN_RE.findall(text) if len(token) > 2]
    if filter_stopwords:
        filtered = [t for t in tokens if t not in STOPWORDS]
        return filtered if filtered else tokens
    return tokens


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


DOMAIN_STOPWORDS = {
    "supportiq", "policy", "policies", "help", "support", "information",
    "question", "guide", "documentation", "details", "service",
    "customer", "customers", "user", "users", "client", "clients", "company"
}


def lexical_score(query_tokens: list[str], chunk_text: str) -> float:
    if not query_tokens:
        return 0.0
    distinct_query = [t for t in set(query_tokens) if t not in STOPWORDS]
    if not distinct_query:
        distinct_query = list(set(query_tokens))
    chunk_tokens = set(tokenize(chunk_text, filter_stopwords=True))
    matched = set(distinct_query).intersection(chunk_tokens)
    if not matched:
        return 0.0

    substantive_query = [t for t in distinct_query if t not in DOMAIN_STOPWORDS]
    if substantive_query:
        substantive_matched = set(substantive_query).intersection(chunk_tokens)
        if not substantive_matched:
            return 0.0
        return len(substantive_matched) / len(substantive_query)

    return len(matched) / len(distinct_query)


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
        normalized_support = min(1.0, average_support / 0.35) if average_support > 0 else 0.0
        reliability_score = min(1.0, max(0.0, (0.7 * coverage) + (0.3 * normalized_support)))
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

    def retrieve_candidates(
        self,
        query: str,
        candidate_pool_size: int = 25,
    ) -> list[dict[str, Any]]:
        """Stage 1: Retrieve candidate chunks across verified documents via lexical and semantic indexing."""
        query_text = normalize_text(query)
        query_tokens = tokenize(query_text)
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

                if lexical <= 0 and vector_score <= 0.01:
                    continue

                candidates.append(
                    {
                        "document_id": document.id,
                        "document_title": document.title,
                        "chunk_id": chunk.id,
                        "chunk_index": chunk.chunk_index,
                        "content": chunk_text[:800],
                        "lexical_score": round(float(lexical), 6),
                        "vector_score": round(float(max(vector_score, 0.0)), 6),
                        "matched_terms": sorted(set(query_tokens).intersection(set(chunk_tokens))),
                        "substantive_matched_terms": sorted(
                            [t for t in set(query_tokens).intersection(set(chunk_tokens)) if t not in DOMAIN_STOPWORDS]
                        ),
                        "document_metadata": document.metadata_json or {},
                    }
                )

        # Pre-filter candidate pool if excessively large
        if len(candidates) > candidate_pool_size:
            candidates.sort(key=lambda item: (item["lexical_score"] + item["vector_score"]), reverse=True)
            candidates = candidates[:candidate_pool_size]

        return candidates

    def rerank(
        self,
        candidates: list[dict[str, Any]],
        query: str,
        top_k: int = 5,
        rrf_k: int = 60,
    ) -> list[dict[str, Any]]:
        """Stage 2: Re-rank candidate chunks using Reciprocal Rank Fusion (RRF) between lexical and vector signals."""
        if not candidates:
            return []

        # Rank candidates along lexical stream
        by_lexical = sorted(candidates, key=lambda item: item["lexical_score"], reverse=True)
        lexical_ranks = {item["chunk_id"]: idx for idx, item in enumerate(by_lexical, start=1)}

        # Rank candidates along vector stream
        by_vector = sorted(candidates, key=lambda item: item["vector_score"], reverse=True)
        vector_ranks = {item["chunk_id"]: idx for idx, item in enumerate(by_vector, start=1)}

        reranked: list[dict[str, Any]] = []
        for item in candidates:
            chunk_id = item["chunk_id"]
            r_lex = lexical_ranks.get(chunk_id, len(candidates) + 1)
            r_vec = vector_ranks.get(chunk_id, len(candidates) + 1)

            # Standard Reciprocal Rank Fusion with weighted lexical and semantic channels
            rrf_score = (0.60 / (rrf_k + r_lex)) + (0.40 / (rrf_k + r_vec))

            # Normalized composite similarity_score
            raw_hybrid = (0.65 * item["lexical_score"]) + (0.35 * item["vector_score"])
            combined_score = raw_hybrid

            enriched = dict(item)
            enriched.update(
                {
                    "retrieval_method": "hybrid",
                    "lexical_rank": r_lex,
                    "vector_rank": r_vec,
                    "rrf_score": round(float(rrf_score), 6),
                    "similarity_score": round(float(combined_score), 6),
                }
            )
            reranked.append(enriched)

        reranked.sort(key=lambda item: (item["rrf_score"], item["similarity_score"]), reverse=True)
        return reranked[:top_k]

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        retrieval_method: str = "hybrid",
    ) -> list[dict[str, Any]]:
        """Execute full 2-stage retrieval: candidate gathering followed by RRF re-ranking."""
        started_at = time.perf_counter()
        candidates = self.retrieve_candidates(query=query, candidate_pool_size=max(top_k * 4, 25))

        if retrieval_method.lower() == "lexical":
            ranked = sorted(candidates, key=lambda item: item["lexical_score"], reverse=True)[:top_k]
            for item in ranked:
                item["retrieval_method"] = "lexical"
                item["similarity_score"] = item["lexical_score"]
        elif retrieval_method.lower() == "vector":
            ranked = sorted(candidates, key=lambda item: item["vector_score"], reverse=True)[:top_k]
            for item in ranked:
                item["retrieval_method"] = "vector"
                item["similarity_score"] = item["vector_score"]
        elif retrieval_method.lower() in ("hybrid_no_rrf", "hybrid_linear", "linear"):
            # Ablation mode: Weighted linear combination (0.65 lexical + 0.35 vector) without RRF rank fusion
            ranked = sorted(
                candidates,
                key=lambda item: ((0.65 * item["lexical_score"]) + (0.35 * item["vector_score"])),
                reverse=True,
            )[:top_k]
            for item in ranked:
                item["retrieval_method"] = "hybrid_no_rrf"
                item["similarity_score"] = round(float((0.65 * item["lexical_score"]) + (0.35 * item["vector_score"])), 6)
        else:
            # Default to Stage 2 Reciprocal Rank Fusion
            ranked = self.rerank(candidates=candidates, query=query, top_k=top_k)

        latency_ms = round((time.perf_counter() - started_at) * 1000, 3)
        for index, item in enumerate(ranked, start=1):
            item["rank"] = index
            item["latency_ms"] = latency_ms

        if ranked:
            self.db.commit()

        return ranked


def synthesize_support_answer(query: str, retrieved_chunks: list[dict[str, Any]]) -> str:
    if not retrieved_chunks:
        return (
            "I could not find sufficient verified information in the knowledge base to answer this question. "
            "To prevent inaccurate guidance, please refine your question or escalate this query to a support agent."
        )

    top_chunk = retrieved_chunks[0]
    content = top_chunk.get("content", "").strip()

    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
    lead = paragraphs[0] if paragraphs else content

    if len(retrieved_chunks) > 1:
        second = retrieved_chunks[1].get("content", "").strip()
        second_lead = second.split("\n\n")[0] if "\n\n" in second else second[:200]
        return f"{lead}\n\nAdditionally: {second_lead}"

    return lead

