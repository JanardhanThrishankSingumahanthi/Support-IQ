"""
SupportIQ Academic Research Presentation Generator
Creates: presentation/SupportIQ_Research_Presentation.pptx
Primary Source of Truth: research/SUPPORTIQ_RESEARCH_PAPER_FORMATTED.md
"""

import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette - Professional Academic / Dark Navy Theme
    BG_COLOR = RGBColor(11, 19, 43)        # #0B132B Dark Navy
    CARD_BG = RGBColor(28, 37, 65)         # #1C2541 Navy Slate Card
    CARD_BORDER = RGBColor(58, 80, 107)    # #3A506B Subtle Border
    ACCENT_TEAL = RGBColor(56, 189, 248)   # #38BDF8 Cyan Accent
    ACCENT_MINT = RGBColor(45, 212, 191)   # #2DD4BF Mint Accent
    ACCENT_AMBER = RGBColor(245, 158, 11)  # #F59E0B Warning / Note
    TEXT_WHITE = RGBColor(248, 250, 252)   # #F8FAFC White Text
    TEXT_MUTED = RGBColor(148, 163, 184)   # #94A3B8 Slate Muted
    TEXT_BODY = RGBColor(226, 232, 240)    # #E2E8F0 Body Text
    TABLE_HEADER = RGBColor(30, 58, 138)   # Deep Blue Header
    TABLE_ROW_ALT = RGBColor(21, 32, 59)   # Slightly darker row

    def add_base_slide(section_tag, title_text, subtitle_text=None, slide_num=1):
        slide = prs.slides.add_slide(blank_layout)
        
        # Background fill
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background()

        # Top Accent Line
        top_line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.04))
        top_line.fill.solid()
        top_line.fill.fore_color.rgb = ACCENT_TEAL
        top_line.line.fill.background()

        # Header Text Box
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.733), Inches(1.1))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        # Category tracker
        p_cat = tf.paragraphs[0]
        p_cat.text = f"SUPPORTIQ RESEARCH PRESENTATION  |  {section_tag.upper()}"
        p_cat.font.name = "Arial"
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_MINT

        # Title
        p_title = tf.add_paragraph()
        p_title.text = title_text
        p_title.font.name = "Arial"
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE

        # Subtitle
        if subtitle_text:
            p_sub = tf.add_paragraph()
            p_sub.text = subtitle_text
            p_sub.font.name = "Arial"
            p_sub.font.size = Pt(12)
            p_sub.font.color.rgb = ACCENT_TEAL

        # Footer
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.35))
        ftf = footer_box.text_frame
        ftf.word_wrap = True
        ftf.margin_left = ftf.margin_top = ftf.margin_right = ftf.margin_bottom = 0
        fp = ftf.paragraphs[0]
        fp.text = f"SupportIQ  •  Janardhan Thrishank Singumahanthi  •  Ramachandra College of Engineering                                Slide {slide_num} of 24"
        fp.font.name = "Arial"
        fp.font.size = Pt(9)
        fp.font.color.rgb = TEXT_MUTED

        return slide

    def add_card(slide, left, top, width, height, title, items, badge=None, accent_color=ACCENT_TEAL):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1)

        tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.18), width - Inches(0.4), height - Inches(0.36))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p0 = tf.paragraphs[0]
        if badge:
            p0.text = f"[{badge}]  {title}"
        else:
            p0.text = title
        p0.font.name = "Arial"
        p0.font.size = Pt(13)
        p0.font.bold = True
        p0.font.color.rgb = accent_color

        for item in items:
            p = tf.add_paragraph()
            p.text = f"•  {item}"
            p.font.name = "Arial"
            p.font.size = Pt(11)
            p.font.color.rgb = TEXT_BODY
            p.space_before = Pt(4)

        return card

    # =========================================================================
    # SLIDE 1: TITLE SLIDE
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = BG_COLOR
    bg1.line.fill.background()

    # Title Card Accent Frame
    frame1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.0), Inches(10.933), Inches(5.5))
    frame1.fill.solid()
    frame1.fill.fore_color.rgb = CARD_BG
    frame1.line.color.rgb = ACCENT_TEAL
    frame1.line.width = Pt(1.5)

    tb1 = slide1.shapes.add_textbox(Inches(1.6), Inches(1.3), Inches(10.133), Inches(4.9))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "ACADEMIC RESEARCH & PROJECT DEFENSE"
    p.font.name = "Arial"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_MINT

    p = tf1.add_paragraph()
    p.text = "SupportIQ"
    p.font.name = "Arial"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.space_before = Pt(6)

    p = tf1.add_paragraph()
    p.text = "Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation"
    p.font.name = "Arial"
    p.font.size = Pt(16)
    p.font.color.rgb = ACCENT_TEAL
    p.space_before = Pt(8)

    p = tf1.add_paragraph()
    p.text = "Core Architectural Paradigm: RETRIEVE  →  VERIFY  →  RESOLVE"
    p.font.name = "Arial"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER
    p.space_before = Pt(16)

    # Author details
    p = tf1.add_paragraph()
    p.text = "\nAuthor: Janardhan Thrishank Singumahanthi\nDepartment of Computer Science and Engineering (AI & ML)\nRamachandra College of Engineering, Eluru, Andhra Pradesh, India\nEmail: janardhanthrisank123@gmail.com"
    p.font.name = "Arial"
    p.font.size = Pt(12)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(12)

    # =========================================================================
    # SLIDE 2: PROBLEM STATEMENT
    # =========================================================================
    s2 = add_base_slide("PROBLEM STATEMENT", "Challenges in Enterprise Customer Support Automation", "Operational hurdles facing frontline conversational AI systems", 2)
    add_card(s2, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.3), "Repetitive Inquiries & Search Latency", [
        "Customer service operations handle thousands of repetitive inquiries on warranties, refunds, and SLAs.",
        "Manual retrieval across evolving documentation causes substantial agent cognitive fatigue and response latency.",
        "Delays directly reduce customer satisfaction and degrade SLA performance."
    ], badge="VOLUME")

    add_card(s2, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.3), "Unaugmented LLM Hallucinations", [
        "Off-the-shelf generative LLMs lack access to private enterprise policies and internal workflows.",
        "Unaugmented models exhibit generative hallucinations, synthesizing plausible but fabricated terms.",
        "Inaccurate statements incur severe financial liabilities and compliance penalties."
    ], badge="ACCURACY", accent_color=ACCENT_AMBER)

    add_card(s2, Inches(0.8), Inches(4.4), Inches(5.6), Inches(2.3), "Retrieval Brittleness & Semantic Drift", [
        "Pure lexical matching (BM25) fails on keyword traps and superficial lexical overlap in boilerplate text.",
        "Dense vector models frequently suffer semantic drift across dense technical documentation.",
        "Standard RAG lacks mechanisms to abstain when retrieved passages lack supporting evidence."
    ], badge="RETRIEVAL")

    add_card(s2, Inches(6.9), Inches(4.4), Inches(5.6), Inches(2.3), "Resource & Compute Constraints", [
        "Deploying standard 7B–70B models requires multi-GPU servers (16 GB–80 GB VRAM), creating severe cost barriers.",
        "Local branch workstations and customer-edge deployments operate within strict compute limits (e.g., 4 GB laptop GPUs).",
        "Small models must be domain-adapted without degrading factual accuracy or exceeding memory budgets."
    ], badge="HARDWARE", accent_color=ACCENT_MINT)

    # =========================================================================
    # SLIDE 3: MOTIVATION
    # =========================================================================
    s3 = add_base_slide("PROJECT MOTIVATION", "Why SupportIQ: Verifiable, Resource-Efficient Automation", "Core principles guiding the design of the SupportIQ framework", 3)
    add_card(s3, Inches(0.8), Inches(1.8), Inches(3.6), Inches(4.9), "Strict Factual Grounding", [
        "Ensure answers are generated solely from authentic, uploaded corporate policy documents.",
        "Condition neural models strictly on verified context passages.",
        "Eliminate speculative completion and hallucinated commitments.",
        "Formulate factual truth as an explicit evidence chain connecting answers to physical documents."
    ], badge="INTEGRITY")

    add_card(s3, Inches(4.8), Inches(1.8), Inches(3.6), Inches(4.9), "Traceable Attribution & Provenance", [
        "Every factual claim must point to an auditable source citation.",
        "Attach Document ID, Title, Page Number, and Chunk ID to every verified proposition.",
        "Empower human agents to inspect exact quoted excerpts instantly.",
        "Build customer and regulator trust through deterministic transparency."
    ], badge="AUDITABILITY", accent_color=ACCENT_MINT)

    add_card(s3, Inches(8.8), Inches(1.8), Inches(3.7), Inches(4.9), "Safe Abstention & Edge Efficiency", [
        "Enforce automated safe refusal on unsupported, adversarial, or out-of-domain queries.",
        "Provide seamless 1-click human ticketing escalation whenever confidence is low.",
        "Execute full parameter-efficient fine-tuning and live inference on a consumer 4 GB laptop GPU.",
        "Sustain sub-second interactive response latencies without external cloud API dependencies."
    ], badge="SAFETY & EDGE", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 4: EXISTING APPROACHES
    # =========================================================================
    s4 = add_base_slide("EXISTING APPROACHES", "Comparative Analysis of Conversational QA Paradigms", "Objective evaluation of architectural trade-offs in customer support", 4)
    table_shape4 = s4.shapes.add_table(6, 4, Inches(0.8), Inches(1.8), Inches(11.733), Inches(4.8))
    table4 = table_shape4.table
    table4.columns[0].width = Inches(2.6)
    table4.columns[1].width = Inches(3.1)
    table4.columns[2].width = Inches(3.2)
    table4.columns[3].width = Inches(2.833)

    headers4 = ["Paradigm", "Operational Architecture", "Identified Limitations", "SupportIQ Distinction"]
    for col_idx, h in enumerate(headers4):
        cell = table4.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = TABLE_HEADER
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = "Arial"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE

    rows4 = [
        ("Standalone Parametric LLM", "Zero-shot prompt completion on pretrained foundation weights", "Severe hallucinations on proprietary policies; no citations; large VRAM requirement", "Conditions sub-1B model on retrieved context + PEFT domain adaptation"),
        ("Basic RAG (Lexical BM25)", "Sparse term frequency overlap with top candidate extraction", "Vulnerable to keyword traps, synonyms, and superficial boilerplate matches", "Fuses BM25 with 32-D deterministic hash vectors via RRF (k=60)"),
        ("Dense Bi-Encoder RAG", "Continuous dense embeddings (DPR, Sentence-Transformers)", "Semantic drift across dense technical text; heavy GPU memory overhead for embeddings", "Deterministic 32-D hash vector operates in milliseconds on CPU with zero neural overhead"),
        ("Naive RAG (RRF No Gate)", "Retrieval with rank fusion fed directly into generation", "100% hallucination on unsupported queries due to lack of evidence gating", "Algorithmic evidence gate enforces safe refusal on out-of-domain queries"),
        ("SupportIQ Unified Pipeline", "Two-stage hybrid retrieval + PEFT (LoRA/QLoRA) + Claim verification", "Controlled edge scope; single laptop workstation boundary (fully disclosed)", "100% composite accuracy, 100% claim faithfulness, zero hallucination on holdout")
    ]

    for row_idx, r in enumerate(rows4):
        for col_idx, val in enumerate(r):
            cell = table4.cell(row_idx + 1, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG if row_idx % 2 == 0 else TABLE_ROW_ALT
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = "Arial"
            p.font.size = Pt(10)
            p.font.color.rgb = TEXT_BODY if col_idx < 3 else ACCENT_MINT

    # =========================================================================
    # SLIDE 5: LITERATURE REVIEW
    # =========================================================================
    s5 = add_base_slide("LITERATURE REVIEW", "Academic Foundations & Related Research (16 Seminal Works)", "Four pillars synthesized from peer-reviewed publications in NLP and IR", 5)
    add_card(s5, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.4), "Retrieval-Augmented Generation & BM25", [
        "Lewis et al. (NeurIPS 2020) [1]: Formalized RAG by conditioning generative models on retrieved knowledge passages.",
        "Robertson & Zaragoza (FnTIR 2009) [5]: BM25 probabilistic relevance framework for exact lexical matching.",
        "Gao et al. (arXiv 2023) [9]: Comprehensive survey of modular and advanced RAG paradigms for LLMs."
    ], badge="RAG & LEXICAL")

    add_card(s5, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.4), "Vector Retrieval & Rank Fusion", [
        "Karpukhin et al. (EMNLP 2020) [11]: Dense Passage Retrieval (DPR) bi-encoder mapping.",
        "Cormack, Clarke, & Büttcher (ACM SIGIR 2009) [4]: Reciprocal Rank Fusion (RRF) combining distinct rank orders without score calibration."
    ], badge="RETRIEVAL & FUSION", accent_color=ACCENT_MINT)

    add_card(s5, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.4), "Parameter-Efficient Fine-Tuning (PEFT)", [
        "Hu et al. (ICLR 2022) [2]: Low-Rank Adaptation (LoRA) freezing base weights and updating low-rank attention matrices.",
        "Dettmers et al. (NeurIPS 2023) [3]: QLoRA 4-bit NormalFloat quantization with double quantization.",
        "Yang et al. (arXiv 2024) [6]: Qwen2.5 foundation model family technical report.",
        "Wolf et al. [15] & Mangrulkar et al. [16]: HuggingFace Transformers and PEFT frameworks."
    ], badge="PEFT ALGORITHMS")

    add_card(s5, Inches(6.9), Inches(4.5), Inches(5.6), Inches(2.4), "Hallucination Suppression & Attribution", [
        "Thorne et al. (NAACL 2018) [7]: FEVER dataset for proposition-level fact verification.",
        "Asai et al. (ICLR 2024) [8]: Self-RAG reflection and critique tokens for dynamic retrieval.",
        "Shuster et al. [10], Gautam et al. [12], Yoran et al. [13], Bohnet et al. [14]: Attributed QA, conversational support AI, and distractor robustness."
    ], badge="GROUNDING & SAFETY", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 6: RESEARCH GAP
    # =========================================================================
    s6 = add_base_slide("RESEARCH GAP", "Identified Gaps in Constrained Customer Support QA", "Translating theoretical advances into resource-constrained edge architectures", 6)
    add_card(s6, Inches(0.8), Inches(1.8), Inches(3.6), Inches(4.9), "Gap 1: Retrieval in Policy Corpora", [
        "Prior hybrid retrieval research predominantly benchmarks large neural bi-encoders on data-center servers.",
        "Evaluation of sparse BM25 fused with lightweight 32-dimensional deterministic hash-vector representations via RRF remains less explored on edge devices.",
        "Investigated Configuration: Non-linear RRF (k=60, lexical weight 0.60, vector weight 0.40) on CPU with zero neural embedding overhead."
    ], badge="RETRIEVAL GAP")

    add_card(s6, Inches(4.8), Inches(1.8), Inches(3.6), Inches(4.9), "Gap 2: Sub-1B Models via QLoRA", [
        "Most QLoRA literature focuses on 7B–65B parameter foundation models operating on enterprise GPUs.",
        "The impact of 4-bit NF4 quantization on compact sub-1B parameter models (Qwen2.5-0.5B) under 4 GB laptop GPU constraints is under-investigated.",
        "Investigated Configuration: Direct empirical comparison between unquantized FP16 LoRA and 4-bit NF4 QLoRA updating exactly 0.1093% of parameters."
    ], badge="PEFT EDGE GAP", accent_color=ACCENT_MINT)

    add_card(s6, Inches(8.8), Inches(1.8), Inches(3.7), Inches(4.9), "Gap 3: In-Pipeline Claim Attribution", [
        "Contemporary RAG pipelines frequently rely on secondary LLM judges for factual verification, adding latency and recurring token costs.",
        "There is a need for deterministic, in-pipeline sentence-level claim verification and continuous reliability scoring operating in milliseconds on CPU.",
        "Investigated Configuration: Deterministic claim decomposition, lexical token alignment, continuous reliability formulation, and automated safe refusal."
    ], badge="GROUNDING GAP", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 7: RESEARCH QUESTIONS & OBJECTIVES
    # =========================================================================
    s7 = add_base_slide("RESEARCH QUESTIONS & OBJECTIVES", "Experimental Inquiries and Research Objectives", "Directly mapping empirical research questions to testable system components", 7)
    add_card(s7, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.3), "RQ1 & RO1: Hybrid Retrieval & RRF Ranking", [
        "RQ1: How do sparse lexical matching, a 32-D deterministic hash vector, and their RRF hybrid fusion affect candidate Recall@5 and MRR?",
        "RO1: Implement and evaluate candidate recall and ranking precision across enterprise policy documents on host CPU."
    ], badge="RQ1 / RO1")

    add_card(s7, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.3), "RQ2 & RO2: Parameter-Efficient Domain Adaptation", [
        "RQ2: Can low-rank adaptation (LoRA/QLoRA) on <= 0.11% parameters condition Qwen2.5-0.5B into strict customer-support formatting?",
        "RO2: Validate training convergence, loss dynamics, and parameter economy on an NVIDIA GeForce RTX 2050 Laptop GPU."
    ], badge="RQ2 / RO2", accent_color=ACCENT_MINT)

    add_card(s7, Inches(0.8), Inches(4.4), Inches(5.6), Inches(2.3), "RQ3 & RO3: Deterministic Grounding & Safe Refusal", [
        "RQ3: Does sentence-level claim decomposition and evidence gating eliminate hallucinations and enforce safe refusal on adversarial queries?",
        "RO3: Measure claim faithfulness, citation correctness, and hallucination suppression on a frozen holdout benchmark."
    ], badge="RQ3 / RO3", accent_color=ACCENT_AMBER)

    add_card(s7, Inches(6.9), Inches(4.4), Inches(5.6), Inches(2.3), "RQ4 & RO4: Hardware Efficiency Trade-Offs", [
        "RQ4: What are the empirical trade-offs between unquantized FP16 LoRA and 4-bit NF4 QLoRA in generation latency and peak VRAM?",
        "RO4: Record live synchronized GPU telemetry on an RTX 2050 GPU (4 GB) to quantify latency vs. memory compression trade-offs."
    ], badge="RQ4 / RO4")

    # =========================================================================
    # SLIDE 8: PROPOSED SYSTEM
    # =========================================================================
    s8 = add_base_slide("PROPOSED SYSTEM", "SupportIQ: End-to-End Grounded Customer Support QA", "A unified architecture built on the principle: RETRIEVE → VERIFY → RESOLVE", 8)
    
    stages8 = [
        ("1. Query Ingestion", "Tokenize query, remove domain stopwords", Inches(0.8), Inches(1.8)),
        ("2. Hybrid Retrieval", "BM25 lexical + 32-D hash vector cosine", Inches(3.8), Inches(1.8)),
        ("3. RRF Re-ranking", "Fused ordinal rank scoring (k=60)", Inches(6.8), Inches(1.8)),
        ("4. Evidence Gate", "Threshold check (score >= 0.15)", Inches(9.8), Inches(1.8)),
        ("5. Context Assembly", "Top-3 chunks formatted into ChatML prompt", Inches(0.8), Inches(3.4)),
        ("6. Adapter Generation", "Qwen2.5-0.5B with LoRA / QLoRA greedy decode", Inches(3.8), Inches(3.4)),
        ("7. Claim Verification", "Sentence decomposition + lexical token alignment", Inches(6.8), Inches(3.4)),
        ("8. Provenance Attribution", "Continuous reliability score + page citations", Inches(9.8), Inches(3.4)),
    ]

    for title, desc, left, top in stages8:
        card = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(2.733), Inches(1.3))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = ACCENT_TEAL
        card.line.width = Pt(1)
        tb = s8.shapes.add_textbox(left + Inches(0.12), top + Inches(0.1), Inches(2.5), Inches(1.1))
        tf = tb.text_frame
        tf.word_wrap = True
        p0 = tf.paragraphs[0]
        p0.text = title
        p0.font.name = "Arial"
        p0.font.size = Pt(11)
        p0.font.bold = True
        p0.font.color.rgb = ACCENT_MINT
        p1 = tf.add_paragraph()
        p1.text = desc
        p1.font.name = "Arial"
        p1.font.size = Pt(9.5)
        p1.font.color.rgb = TEXT_BODY
        p1.space_before = Pt(3)

    # Bottom Resolution Paths
    res_card1 = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.0), Inches(5.7), Inches(1.7))
    res_card1.fill.solid()
    res_card1.fill.fore_color.rgb = RGBColor(16, 44, 40)
    res_card1.line.color.rgb = ACCENT_MINT
    tb_r1 = s8.shapes.add_textbox(Inches(1.0), Inches(5.1), Inches(5.3), Inches(1.5))
    tf_r1 = tb_r1.text_frame
    tf_r1.word_wrap = True
    p = tf_r1.paragraphs[0]
    p.text = "PRIMARY RESOLUTION: VERIFIED GROUNDED ANSWER"
    p.font.name = "Arial"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_MINT
    p = tf_r1.add_paragraph()
    p.text = "• Emits factual response strictly adhering to retrieved evidence.\n• Displays continuous reliability score (0.0 – 1.0).\n• Attaches clickable page-level provenance citations (Doc, Page, Chunk)."
    p.font.name = "Arial"
    p.font.size = Pt(10)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(4)

    res_card2 = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(5.0), Inches(5.733), Inches(1.7))
    res_card2.fill.solid()
    res_card2.fill.fore_color.rgb = RGBColor(50, 30, 20)
    res_card2.line.color.rgb = ACCENT_AMBER
    tb_r2 = s8.shapes.add_textbox(Inches(7.0), Inches(5.1), Inches(5.3), Inches(1.5))
    tf_r2 = tb_r2.text_frame
    tf_r2.word_wrap = True
    p = tf_r2.paragraphs[0]
    p.text = "SAFE ABSTENTION & HUMAN ESCALATION"
    p.font.name = "Arial"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER
    p = tf_r2.add_paragraph()
    p.text = "• If evidence criteria fail: suppresses generation to prevent hallucination.\n• Emits transparent safe refusal notice.\n• Provides direct 1-click modal for support ticket creation in database."
    p.font.name = "Arial"
    p.font.size = Pt(10)
    p.font.color.rgb = TEXT_BODY
    p.space_before = Pt(4)

    # =========================================================================
    # SLIDE 9: SYSTEM ARCHITECTURE DIAGRAM
    # =========================================================================
    s9 = add_base_slide("SYSTEM ARCHITECTURE", "Technical System Architecture & Data Flow", "Detailed multi-stage pipeline connecting knowledge ingestion to verified user response", 9)
    
    # 4 Columns of Architecture Flow
    col_w = Inches(2.733)
    c1 = add_card(s9, Inches(0.8), Inches(1.8), col_w, Inches(4.9), "1. Retrieval Layer", [
        "User Query Ingestion via FastAPI REST endpoints.",
        "Knowledge Base (7 Docs / 14 Chunks in SQLite).",
        "Parallel Retrieval:",
        "  - Lexical Channel: Substantive token overlap (pruning 128 standard + 18 domain stopwords).",
        "  - Deterministic Vector: SHA-1 token hashing modulo 32 + Cosine Similarity.",
        "Reciprocal Rank Fusion (RRF): Combines ranks with k=60 (0.60 lex / 0.40 vec)."
    ], badge="INPUT & RETRIEVAL")

    c2 = add_card(s9, Inches(3.8), Inches(1.8), col_w, Inches(4.9), "2. Gating & Context", [
        "Algorithmic Evidence Gate:",
        "  - Top chunk composite similarity >= 0.15",
        "  - Substantive terms >= 2 OR lexical score >= 0.35",
        "Dual Safeguard:",
        "  - Rejects keyword traps and domain boilerplate.",
        "Context Assembly:",
        "  - Formats Top-3 verified chunks into structured ChatML system prompt."
    ], badge="FILTER & GATE", accent_color=ACCENT_MINT)

    c3 = add_card(s9, Inches(6.8), Inches(1.8), col_w, Inches(4.9), "3. Neural Generation", [
        "Foundation Model:",
        "  - Qwen/Qwen2.5-0.5B-Instruct (494.6M parameters).",
        "PEFT Adapters (Runtime Switchable):",
        "  - SupportIQ LoRA: FP16 unquantized (0.844 s latency).",
        "  - SupportIQ QLoRA: 4-bit NF4 quantized (0.46 GB VRAM).",
        "Greedy Decoding:",
        "  - Deterministic inference (do_sample=False, max_tokens=96)."
    ], badge="PEFT SYNTHESIS")

    c4 = add_card(s9, Inches(9.8), Inches(1.8), col_w, Inches(4.9), "4. Grounding & Citations", [
        "Claim Decomposition:",
        "  - Splits answer into sentences.",
        "Token-Level Alignment:",
        "  - Verifies claim support (threshold >= 0.12).",
        "Reliability Scoring:",
        "  - Continuous 0.0 - 1.0 reliability.",
        "Output Pathways:",
        "  - Grounded answer + page citations.",
        "  - OR Safe refusal + 1-click human ticketing modal."
    ], badge="VERIFY & RESOLVE", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 10: HYBRID RETRIEVAL + RRF
    # =========================================================================
    s10 = add_base_slide("HYBRID RETRIEVAL & RRF", "Sparse Lexical Matching + 32-D Deterministic Hash Vector", "Overcoming keyword traps and semantic drift through non-linear rank fusion", 10)
    add_card(s10, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.6), "Lexical Channel (BM25 / Token Overlap)", [
        "Tokenizes alphanumeric queries ([a-z0-9]+ with length > 2).",
        "Two-Tier Stopword Filtering:",
        "  - Standard English stopwords (128 words).",
        "  - Domain stopwords (18 words: supportiq, policy, support, help, customer, client, etc.).",
        "Formula: LexicalScore(Q, C) = |Q_substantive ∩ C_tokens| / |Q_substantive|"
    ], badge="LEXICAL")

    add_card(s10, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.6), "32-D Deterministic Hash-Vector Channel", [
        "Projects tokens into a 32-dimensional bucket space via SHA-1 hashing modulo 32: Index(t) = SHA1(t)[:4] mod 32.",
        "Accumulates token counts in chunk vector C ∈ R^32.",
        "Computes Cosine Similarity between query vector Q and chunk vector C.",
        "CRITICAL DISCLOSURE: Strictly a deterministic hash-vector representation. It is NOT a learned neural embedding."
    ], badge="DETERMINISTIC VECTOR", accent_color=ACCENT_MINT)

    add_card(s10, Inches(0.8), Inches(4.6), Inches(11.733), Inches(2.2), "Reciprocal Rank Fusion (RRF) Formulation & Evidence Gate", [
        "Non-linear Rank Fusion Formula: RRF_Score(c) = [ 0.60 / (60 + r_lex) ] + [ 0.40 / (60 + r_vec) ]  with smoothing constant k = 60.",
        "Tie-Breaking Composite Score: Sim(c) = 0.65 × LexicalScore(c) + 0.35 × CosineSim(c). Top-5 chunks forwarded to gate.",
        "Evidence Gate Safeguards: Query passes to generation ONLY if (Top Chunk Composite Score >= 0.15) AND (Substantive Matched Terms >= 2 OR Lexical Score >= 0.35).",
        "Impact: Completely neutralizes keyword traps (e.g. Case #20 matching 'warranty') and boilerplate collisions (Case #18)."
    ], badge="RRF & EVIDENCE GATE", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 11: LoRA FINE-TUNING
    # =========================================================================
    s11 = add_base_slide("LoRA ADAPTATION", "Low-Rank Adaptation (FP16) on Qwen2.5-0.5B", "Drastic parameter economy enabling fast interactive customer support inference", 11)
    add_card(s11, Inches(0.8), Inches(1.8), Inches(3.6), Inches(4.9), "Low-Rank Mathematics", [
        "Freezes pre-trained weight matrix W_0 ∈ R^(d × k).",
        "Constrains weight updates to a low-rank decomposition: W = W_0 + (α/r) × B × A.",
        "B ∈ R^(d × r) initialized to zero; A ∈ R^(r × k) initialized from Gaussian.",
        "Hyperparameters: Rank r = 8, Alpha α = 16, Scaling factor α/r = 2.0, Dropout = 0.05.",
        "Target Modules: Query projection (q_proj) and Value projection (v_proj) in self-attention layers."
    ], badge="FORMULATION")

    add_card(s11, Inches(4.8), Inches(1.8), Inches(3.6), Inches(4.9), "Parameter Economy", [
        "Base Model: Qwen/Qwen2.5-0.5B-Instruct (494,573,440 total parameters).",
        "Trainable Adapter Parameters: Exactly 540,672.",
        "Trainable Ratio: Exactly 0.1093% of base model weights.",
        "Frozen Ratio: 99.8907% of the model remains completely untouched.",
        "Memory Benefit: Eliminates full optimizer state storage for 494.6M parameters."
    ], badge="EFFICIENCY", accent_color=ACCENT_MINT)

    add_card(s11, Inches(8.8), Inches(1.8), Inches(3.7), Inches(4.9), "Training Dynamics & Telemetry", [
        "Dataset: 31 domain-specific instruction examples (3 epochs, effective batch size 4).",
        "Optimizer: AdamW, learning rate 2e-4 with linear warmup.",
        "Training Wall-Clock Time: Exactly 9.06 seconds on RTX 2050 GPU.",
        "Loss Convergence: Cross-entropy validation loss decreased from 1.6426 to 1.4008.",
        "Peak Training VRAM: 2.42 GB.",
        "Inference Speed: Achieves the fastest generation latency (0.844 s) on holdout."
    ], badge="TELEMETRY", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 12: QLoRA FINE-TUNING
    # =========================================================================
    s12 = add_base_slide("QLoRA QUANTIZATION", "Quantized Low-Rank Adaptation (4-bit NF4)", "Extreme memory compression for local workstation and edge deployment", 12)
    add_card(s12, Inches(0.8), Inches(1.8), Inches(3.6), Inches(4.9), "4-bit NormalFloat (NF4)", [
        "Information-theoretically optimal quantile quantization for normally distributed weights.",
        "Each quantization bin contains an equal number of expected parameters from Gaussian distribution.",
        "Preserves expressive capacity of base model weights far better than uniform linear integer (INT4) quantization.",
        "Weights remain compressed in 4-bit memory until dynamically dequantized during forward pass."
    ], badge="QUANTIZATION")

    add_card(s12, Inches(4.8), Inches(1.8), Inches(3.6), Inches(4.9), "Double Quantization & FP16 Compute", [
        "Double Quantization (DQ): Quantizes first-stage quantization constants into 8-bit integers with 32-block size.",
        "Memory Savings: Saves 0.37 bits per parameter (~180 MB memory saving on 0.5B model).",
        "Compute Dtype: FP16 (torch.float16) is used during forward and backward matrix multiplications.",
        "Adapter Parameters: Identical low-rank low-overhead matrices (r=8, α=16, 540,672 parameters)."
    ], badge="MEMORY SAVING", accent_color=ACCENT_MINT)

    add_card(s12, Inches(8.8), Inches(1.8), Inches(3.7), Inches(4.9), "QLoRA Telemetry & VRAM Cut", [
        "Training Wall-Clock Time: 21.60 seconds (2.38x slower than LoRA due to dequantization overhead).",
        "Loss Convergence: Validation loss decreased from 1.5872 to 1.3748.",
        "Peak Training VRAM: Exactly 1.79 GB (a 26.0% training memory saving vs. LoRA).",
        "Inference VRAM Slashed: Requires only 0.46 GB VRAM during inference—a 52.1% reduction over unquantized baselines.",
        "GPU Utilization: Consumes just 11.5% of total 4 GB VRAM on RTX 2050."
    ], badge="TELEMETRY", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 13: GROUNDING & CLAIM VERIFICATION
    # =========================================================================
    s13 = add_base_slide("GROUNDING & VERIFICATION", "Sentence-Level Claim Decomposition & Reliability Scoring", "Deterministic in-pipeline evidence chain eliminating hallucinations", 13)
    add_card(s13, Inches(0.8), Inches(1.8), Inches(3.6), Inches(4.9), "1. Claim Proposition Splitting", [
        "Segments generated text into atomic proposition sentences S = {s_1, ..., s_m} using regex punctuation delimiters ([.!?]\\s+|\\n+).",
        "Treats each sentence as an independently verifiable factual claim.",
        "Prevents compound sentences from concealing ungrounded assertions.",
        "Operates deterministically in milliseconds on host CPU."
    ], badge="STAGE 1")

    add_card(s13, Inches(4.8), Inches(1.8), Inches(3.6), Inches(4.9), "2. Substantive Evidence Alignment", [
        "For each proposition s_j, computes lexical token overlap against retrieved context chunks C_i.",
        "Formula: ClaimScore(s_j, C_i) = |s_j,sub ∩ C_i,tok| / |s_j,sub|.",
        "Grounding Gate: Proposition is classified as supported if max_i ClaimScore(s_j, C_i) >= 0.12.",
        "Tracks the exact chunk ID and document page providing highest alignment."
    ], badge="STAGE 2", accent_color=ACCENT_MINT)

    add_card(s13, Inches(8.8), Inches(1.8), Inches(3.7), Inches(4.9), "3. Continuous Reliability Formulation", [
        "Coverage = N_supported_claims / N_total_claims",
        "NormalizedSupport = min(1.0, AverageEvidenceScore / 0.35)",
        "ReliabilityScore = 0.70 × Coverage + 0.30 × NormalizedSupport",
        "Grounding Status Tiers:",
        "  - supported: Coverage >= 0.80",
        "  - partially_supported: 0.50 <= Coverage < 0.80",
        "  - unsupported: Coverage < 0.50",
        "Safety Escalation: If Reliability < 0.40, response is flagged as low_confidence with direct 1-click human ticketing modal."
    ], badge="STAGE 3", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 14: DATASET & DATA GOVERNANCE
    # =========================================================================
    s14 = add_base_slide("DATASET & DATA GOVERNANCE", "Document Corpus, Fine-Tuning Pool, and Frozen Holdout", "Strict disjoint partitioning guaranteeing 0.0% data leakage", 14)
    add_card(s14, Inches(0.8), Inches(1.8), Inches(3.6), Inches(4.9), "Knowledge Base Corpus (7 Docs)", [
        "Return_Policy.pdf (Doc 1, 3 chunks): Refund windows, return eligibility, disbursement timelines.",
        "Terms_of_Service.pdf (Doc 2, 2 chunks): SLA guarantees, admin credential security.",
        "Product_Warranty.pdf (Doc 3, 2 chunks): Hardware warranty, pre-diagnostic RMA tags.",
        "Customer_FAQ.pdf (Doc 4, 2 chunks): Password reset, ticketing platform API.",
        "Payment_Guide.docx (Doc 5, 2 chunks): Accepted credit cards, invoice downloads.",
        "Account_Management.pdf (Doc 6, 2 chunks): Role permissions, AES-256 data encryption.",
        "Express_Replacement_Policy_Test.txt (Doc 8, 1 chunk): Defective replacement dispatch.",
        "Total: 14 discrete policy chunks stored in SQLite."
    ], badge="KNOWLEDGE BASE")

    add_card(s14, Inches(4.8), Inches(1.8), Inches(3.6), Inches(4.9), "Fine-Tuning Instruction Pool", [
        "Created directly from knowledge chunks to enforce strict context-bound question answering.",
        "Training Dataset: Exactly 31 verified examples (75.6% split).",
        "Validation Dataset: Exactly 10 verified examples (24.4% split).",
        "Total Instruction Suite: 41 verified pairs.",
        "Strict JSON Schema: id, instruction, context, question, answer, and metadata (category, doc_id, chunk_id, is_answerable, grounded)."
    ], badge="TRAINING SUITE", accent_color=ACCENT_MINT)

    add_card(s14, Inches(8.8), Inches(1.8), Inches(3.7), Inches(4.9), "Frozen Holdout Benchmark & 0.0% Leakage", [
        "Dataset 1 (Dev/Validation Benchmark v1): 10 cases (7 answerable, 3 unsupported) mapped to Chunks {1, 2, 5, 6, 8, 10, 14}.",
        "Dataset 2 (Frozen Holdout Benchmark v1): 10 cases (7 answerable, 3 unsupported) mapped to Chunks {3, 4, 7, 9, 11, 12, 13}.",
        "Strict Disjointness: Chunk coverage intersection between Dev and Holdout is strictly empty (∅).",
        "Frozen State: Database records strictly frozen (timestamp: 2026-09-23 04:53:12).",
        "Zero Leakage: Pre-training assertions verified 0.0% question/answer leakage into training sets."
    ], badge="BENCHMARK & INTEGRITY", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 15: EXPERIMENTAL SETUP
    # =========================================================================
    s15 = add_base_slide("EXPERIMENTAL SETUP", "Hardware Constraints & Software Environment", "Strict single-workstation environment reflecting realistic local enterprise deployment", 15)
    add_card(s15, Inches(0.8), Inches(1.8), Inches(3.6), Inches(4.9), "Base Foundation Model", [
        "Model ID: Qwen/Qwen2.5-0.5B-Instruct",
        "Developer: Alibaba Cloud (Qwen Team) [6]",
        "Total Parameter Count: Exactly 494,573,440",
        "Architecture: Transformer Causal Decoder",
        "Layers: 24 transformer layers",
        "Hidden Dimension: 896",
        "Attention Heads: 14 query heads, 2 KV heads",
        "Context Window: Native support up to 32k tokens",
        "Vocabulary: 151,936 tokens (ChatML format)"
    ], badge="FOUNDATION MODEL")

    add_card(s15, Inches(4.8), Inches(1.8), Inches(3.6), Inches(4.9), "Workstation Hardware Boundary", [
        "Host: Single consumer laptop workstation",
        "GPU: NVIDIA GeForce RTX 2050 Laptop GPU",
        "GPU Devices: 1 physical device",
        "Total Physical VRAM: Exactly 4.00 GB (4096 MB)",
        "CUDA Compute Capability: 8.6 (Ampere architecture)",
        "CUDA Runtime: CUDA 12.4",
        "CPU: AMD Ryzen / Host System",
        "Integrity Confirmation: Erroneous prior references to RTX 3050 eliminated; physical hardware confirmed as RTX 2050."
    ], badge="HARDWARE CEILING", accent_color=ACCENT_MINT)

    add_card(s15, Inches(8.8), Inches(1.8), Inches(3.7), Inches(4.9), "Software Stack & Protocols", [
        "Operating System: Windows 11 AMD64",
        "Python Runtime: Python 3.12.10",
        "Deep Learning: PyTorch 2.6.0+cu124",
        "HuggingFace Libraries: Transformers 5.17.0 [15], PEFT 0.21.0 [16], Accelerate 1.15.0",
        "Quantization: bitsandbytes 0.50.2",
        "Inference Protocol: Greedy autoregressive decoding (do_sample=False, max_new_tokens=96) with synchronized CUDA timers (torch.cuda.synchronize())."
    ], badge="SOFTWARE STACK", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 16: EVALUATION METRICS
    # =========================================================================
    s16 = add_base_slide("EVALUATION METRICS", "Evaluation Framework & Latency Separation", "Mathematical definitions and strict decoupling of retrieval and generation metrics", 16)
    add_card(s16, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.6), "Retrieval & Ranking Metrics (N_ans = 7)", [
        "Recall@5: Fraction of answerable queries where ground-truth chunk c* is retrieved within Top 5: (1/N_ans) ∑ I(c* ∈ Top5(Q_i)).",
        "Mean Reciprocal Rank (MRR): Average of reciprocal ranks of the first relevant chunk: (1/N_ans) ∑ (1 / Rank(c*_i)).",
        "Target Threshold: Recall@5 >= 0.90, MRR >= 0.85."
    ], badge="RETRIEVAL METRICS")

    add_card(s16, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.6), "Factual Grounding & Safety Metrics", [
        "Composite Accuracy (N=10): (N_correct_answers + N_safe_refusals) / N_total.",
        "Claim Faithfulness (N_ans=7): Proportion of generated propositions mathematically grounded in context (match score >= 0.12).",
        "Citation Correctness (N=10): Valid chunk links for answerable / exactly zero citations emitted on safe refusal.",
        "Hallucination Rate (N_unsupp=3): Fraction of unsupported queries where fictitious claims are generated (Target: 0.0%)."
    ], badge="GROUNDING & SAFETY", accent_color=ACCENT_MINT)

    add_card(s16, Inches(0.8), Inches(4.6), Inches(11.733), Inches(2.2), "Strict Latency Decoupling: CPU Retrieval vs. GPU Generation", [
        "CPU Retrieval Latency (wall-clock ms): Measures candidate gathering, SHA-1 token projection, cosine similarity, RRF, and evidence gating on CPU. (Observed: ~5 ms – 12 ms).",
        "GPU Neural Generation Latency (synchronized CUDA seconds): Measures autoregressive token synthesis on RTX 2050 GPU via torch.cuda.synchronize(). (Observed: 0.844 s – 2.061 s).",
        "CRITICAL SCIENTIFIC INTEGRITY RULE: Offline extractive baseline latency (0.0119 s CPU) must NEVER be conflated with neural GPU generation latency."
    ], badge="LATENCY SEPARATION", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 17: MAIN EMPIRICAL RESULTS
    # =========================================================================
    s17 = add_base_slide("MAIN RESULTS", "Empirical Holdout Evaluation Results (Dataset 2, N=10)", "Live neural inference telemetry on NVIDIA GeForce RTX 2050 Laptop GPU (4 GB)", 17)
    table_shape17 = s17.shapes.add_table(5, 7, Inches(0.8), Inches(1.8), Inches(11.733), Inches(3.4))
    table17 = table_shape17.table
    widths17 = [Inches(2.5), Inches(1.6), Inches(1.5), Inches(1.5), Inches(1.5), Inches(1.6), Inches(1.533)]
    for idx, w in enumerate(widths17):
        table17.columns[idx].width = w

    headers17 = ["Architecture", "Precision", "Accuracy", "Faithfulness", "Recall@5", "Gen. Latency", "Inference VRAM"]
    for col_idx, h in enumerate(headers17):
        cell = table17.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = TABLE_HEADER
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = "Arial"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE

    rows17 = [
        ("Base Qwen 2.5 0.5B", "FP16 (Pretrained)", "100.0% (10/10)", "95.2%", "1.0000", "2.061 s", "0.96 GB"),
        ("SupportIQ LoRA", "FP16 PEFT (r=8)", "100.0% (10/10)", "100.0%", "1.0000", "0.844 s", "0.96 GB"),
        ("SupportIQ QLoRA", "4-bit NF4 PEFT", "100.0% (10/10)", "100.0%", "1.0000", "1.668 s", "0.46 GB"),
        ("Offline Extractive (Run 42)", "Template Baseline", "100.0% (10/10)", "98.0%", "1.0000", "Not measured", "Not measured")
    ]

    for row_idx, r in enumerate(rows17):
        for col_idx, val in enumerate(r):
            cell = table17.cell(row_idx + 1, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG if row_idx % 2 == 0 else TABLE_ROW_ALT
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = "Arial"
            p.font.size = Pt(10.5)
            p.font.bold = (col_idx == 0 or "100.0%" in val or "0.844" in val or "0.46" in val)
            p.font.color.rgb = ACCENT_MINT if ("0.844" in val or "0.46" in val or "100.0%" in val) else TEXT_BODY

    add_card(s17, Inches(0.8), Inches(5.4), Inches(11.733), Inches(1.5), "Key Empirical Findings on Frozen Holdout Benchmark", [
        "Both fine-tuned adapters (LoRA and QLoRA) achieved 100.0% composite accuracy and 100.0% claim faithfulness (answering all 7 policy questions accurately and refusing all 3 unsupported queries).",
        "Pretrained Base Qwen achieved 95.2% faithfulness due to conversational verbosity, while fine-tuned adapters adhered strictly to extracted facts.",
        "In offline pipeline execution (Run 42), candidate retrieval and verification executed in just 11.9 milliseconds (0.0119 s) on CPU.",
        "No Single Winner: FP16 LoRA maximizes interactive speed (0.844 s), while 4-bit QLoRA maximizes memory efficiency (0.46 GB VRAM)."
    ], badge="SUMMARY", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 18: RESOURCE TRADE-OFF ANALYSIS
    # =========================================================================
    s18 = add_base_slide("RESOURCE TRADE-OFFS", "Operational Trade-Offs: LoRA vs. QLoRA", "Balanced empirical comparison of latency versus memory compression on RTX 2050", 18)
    add_card(s18, Inches(0.8), Inches(1.8), Inches(5.6), Inches(3.2), "SupportIQ LoRA (FP16 PEFT)", [
        "Inference VRAM: 0.96 GB allocated (24.0% of 4 GB GPU capacity).",
        "Generation Latency: 0.844 seconds (1.98x faster than QLoRA, 2.44x faster than Base Qwen).",
        "Training Duration: 9.06 seconds (2.38x faster training).",
        "Primary Advantage: Fastest response generation; zero on-the-fly dequantization overhead.",
        "Best Suited For: High-throughput interactive customer chat where minimizing response latency is the primary engineering goal."
    ], badge="SPEED ADVANTAGE", accent_color=ACCENT_TEAL)

    add_card(s18, Inches(6.9), Inches(1.8), Inches(5.6), Inches(3.2), "SupportIQ QLoRA (4-bit NF4)", [
        "Inference VRAM: 0.46 GB allocated (52.1% VRAM reduction relative to LoRA and Base).",
        "GPU Capacity Footprint: Consumes just 11.5% of total 4 GB VRAM.",
        "Generation Latency: 1.668 seconds (incurs real-time NF4 to FP16 dequantization overhead).",
        "Training VRAM: 1.79 GB (26.0% memory saving during training).",
        "Best Suited For: Resource-constrained edge workstations where the GPU must concurrently host other services or multi-tenant microservices."
    ], badge="MEMORY ADVANTAGE", accent_color=ACCENT_MINT)

    add_card(s18, Inches(0.8), Inches(5.2), Inches(11.733), Inches(1.6), "Balanced Scientific Evaluation & Non-Generalization Caveat", [
        "Identical Task Quality: Both configurations achieved identical 100.0% composite accuracy and 100.0% claim faithfulness on the evaluated holdout suite.",
        "Engineering Complementarity: The choice between LoRA and QLoRA represents a pure latency-versus-memory engineering trade-off.",
        "Non-Generalization Caveat: These empirical trade-offs reflect the evaluated sub-1B architecture on an RTX 2050 laptop GPU and should not be generalized beyond these tested experimental conditions."
    ], badge="EVIDENCE-BASED SYNTHESIS", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 19: COMPONENT ABLATION STUDY
    # =========================================================================
    s19 = add_base_slide("ABLATION STUDY", "Component Ablation Analysis (Experiment 4, Runs 45–50)", "Isolating individual components across Frozen Holdout Dataset 2 (N=10)", 19)
    table_shape19 = s19.shapes.add_table(7, 6, Inches(0.8), Inches(1.8), Inches(11.733), Inches(3.4))
    table19 = table_shape19.table
    widths19 = [Inches(1.1), Inches(2.2), Inches(1.4), Inches(1.4), Inches(1.6), Inches(4.033)]
    for idx, w in enumerate(widths19):
        table19.columns[idx].width = w

    headers19 = ["Run ID", "Ablation Mode", "Accuracy", "MRR", "Hallucination", "Primary Failure Mechanism Identified"]
    for col_idx, h in enumerate(headers19):
        cell = table19.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = TABLE_HEADER
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = "Arial"
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE

    rows19 = [
        ("Run 45", "BM25 Only", "90.0% (9/10)", "1.0000", "33.3% (1/3)", "Keyword trap: Case #20 matched 'warranty' in Dell chunk"),
        ("Run 46", "Dense Vector Only", "70.0% (7/10)", "0.7976", "100.0% (3/3)", "Semantic drift: Case 16 at rank 3, Case 17 at rank 4; hash collisions"),
        ("Run 47", "Hybrid w/o RRF", "90.0% (9/10)", "1.0000", "33.3% (1/3)", "Keyword spike: Linear sum bypassed similarity threshold"),
        ("Run 48", "Naive RAG (No Gate)", "70.0% (7/10)", "1.0000", "100.0% (3/3)", "Unconditional generation: Top chunk passed without verification gate"),
        ("Run 49", "Generic Filter", "90.0% (9/10)", "1.0000", "33.3% (1/3)", "Boilerplate trap: Case #18 matched 'supportiq' and 'support'"),
        ("Run 50", "Full SupportIQ", "100.0% (10/10)", "1.0000", "0.0% (0/3)", "None: Dual safeguard eliminated keyword traps and boilerplate false positives")
    ]

    for row_idx, r in enumerate(rows19):
        for col_idx, val in enumerate(r):
            cell = table19.cell(row_idx + 1, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG if row_idx % 2 == 0 else TABLE_ROW_ALT
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = "Arial"
            p.font.size = Pt(9.5)
            p.font.bold = (row_idx == 5 or col_idx == 0)
            p.font.color.rgb = ACCENT_MINT if row_idx == 5 else (ACCENT_AMBER if "100.0%" in val and col_idx == 4 else TEXT_BODY)

    add_card(s19, Inches(0.8), Inches(5.4), Inches(11.733), Inches(1.5), "Key Takeaways from Ablation Analysis", [
        "Naive RAG Fails Safety: In Run 48, retrieval was optimal (MRR 1.0000), but hallucinated on 100% of unsupported queries because evidence was not audited.",
        "Keyword Traps Exist: Case #20 ('warp drive warranty') tricked lexical and linear hybrid search by matching Dell hardware warranty text.",
        "Dual Safeguard Essential: Coupling domain stopword filtering with the RRF evidence gate is strictly necessary to achieve zero hallucination."
    ], badge="ABLATION LESSONS", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 20: SUPPORTIQ UI / SYSTEM
    # =========================================================================
    s20 = add_base_slide("SYSTEM & UI MODULES", "SupportIQ Functional Platform Architecture", "Production-grade UI modules implemented in React, TypeScript, and FastAPI", 20)
    
    ui_modules = [
        ("Knowledge Ingestion", "Uploads PDF, DOCX, TXT with page tracking, checksum validation, and SHA-1 hash-vector indexing.", Inches(0.8), Inches(1.8)),
        ("Multi-Model Chat", "Interactive conversational interface with dynamic runtime switching between Base, LoRA, and QLoRA.", Inches(4.8), Inches(1.8)),
        ("Reliability Panel", "Real-time inspection of claim decomposition, proposition coverage %, and continuous score (0.0–1.0).", Inches(8.8), Inches(1.8)),
        ("Evidence Viewer", "Displays exact supporting excerpts with clickable citations (Document Title, Page Number, Chunk ID).", Inches(0.8), Inches(4.4)),
        ("Safe Refusal & Tickets", "Automated transparent refusal notice with 1-click support ticket escalation modal in database.", Inches(4.8), Inches(4.4)),
        ("Live GPU Telemetry", "Real-time monitoring of CUDA generation latency, peak VRAM allocation, and retrieval speed.", Inches(8.8), Inches(4.4)),
    ]

    for title, desc, left, top in ui_modules:
        card = s20.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(3.733), Inches(2.3))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = ACCENT_TEAL
        card.line.width = Pt(1)
        tb = s20.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), Inches(3.333), Inches(1.9))
        tf = tb.text_frame
        tf.word_wrap = True
        p0 = tf.paragraphs[0]
        p0.text = f"[MODULE]  {title}"
        p0.font.name = "Arial"
        p0.font.size = Pt(13)
        p0.font.bold = True
        p0.font.color.rgb = ACCENT_MINT
        p1 = tf.add_paragraph()
        p1.text = desc
        p1.font.name = "Arial"
        p1.font.size = Pt(11)
        p1.font.color.rgb = TEXT_BODY
        p1.space_before = Pt(8)

    # =========================================================================
    # SLIDE 21: LIMITATIONS
    # =========================================================================
    s21 = add_base_slide("LIMITATIONS", "Scientific Disclosures & Operational Boundaries", "Maintaining strict academic integrity by explicitly identifying operational constraints", 21)
    add_card(s21, Inches(0.8), Inches(1.8), Inches(3.6), Inches(2.4), "1. Holdout Benchmark Scale", [
        "The frozen holdout suite consists of N=10 structured cases (7 answerable, 3 unsupported).",
        "While balanced, this represents a controlled verification suite rather than a large statistical benchmark."
    ], badge="DATASET LIMIT")

    add_card(s21, Inches(4.8), Inches(1.8), Inches(3.6), Inches(2.4), "2. Single Hardware Environment", [
        "Evaluated exclusively on an NVIDIA GeForce RTX 2050 Laptop GPU (4.0 GB VRAM).",
        "Distributed multi-GPU scaling, enterprise clusters, and high-concurrency request queuing were not evaluated."
    ], badge="HARDWARE LIMIT", accent_color=ACCENT_MINT)

    add_card(s21, Inches(8.8), Inches(1.8), Inches(3.7), Inches(2.4), "3. Hash Vector Representation", [
        "Retrieval semantic channel uses a 32-D deterministic hash vector rather than learned continuous embeddings.",
        "While fast on CPU, hash vectors cannot capture deep latent semantic synonyms."
    ], badge="REPRESENTATION LIMIT", accent_color=ACCENT_AMBER)

    add_card(s21, Inches(0.8), Inches(4.5), Inches(3.6), Inches(2.4), "4. Policy Domain Scope", [
        "The experimental corpus covers seven enterprise operational documents (14 discrete chunks).",
        "Behavior across multi-million-page documentation lakes or dynamic graphs remains unmeasured."
    ], badge="DOMAIN LIMIT")

    add_card(s21, Inches(4.8), Inches(4.5), Inches(3.6), Inches(2.4), "5. Single-Turn Interaction Scope", [
        "Benchmark evaluates single-turn question-answering interactions.",
        "Multi-turn conversational context tracking, slot filling, and dialogue state tracking were not benchmarked."
    ], badge="DIALOGUE SCOPE", accent_color=ACCENT_MINT)

    add_card(s21, Inches(8.8), Inches(4.5), Inches(3.7), Inches(2.4), "6. Generalization Boundaries", [
        "Empirical findings must not be generalized beyond the tested hardware, small dataset scale, and policy domain.",
        "Comprehensive testing on noisy multi-turn enterprise data is required for broad generalization."
    ], badge="GENERALIZATION", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 22: FUTURE WORK
    # =========================================================================
    s22 = add_base_slide("FUTURE WORK", "Planned Extensions & Research Roadmap", "Concrete directions to advance the SupportIQ architecture", 22)
    
    future_cards = [
        ("1. Lightweight Learned Neural Bi-Encoders", "Integrate compact, locally quantized neural bi-encoder models (e.g., MiniLM) to replace or augment the 32-D hash vector, evaluating semantic recall gains under edge memory limits.", Inches(0.8), Inches(1.8)),
        ("2. Multi-Turn Dialogue Benchmark Scaling", "Scale evaluation benchmarks to hundreds of multi-turn customer dialogues with user typos, noisy queries, and conversational state tracking.", Inches(6.9), Inches(1.8)),
        ("3. Broader Document Domain Ingestion", "Benchmark pipeline throughput across multi-thousand-page technical libraries, semi-structured tables, and hierarchical policy knowledge bases.", Inches(0.8), Inches(3.5)),
        ("4. Enterprise CRM & Ticketing API Integration", "Connect the verification engine directly to Zendesk, Jira Service Desk, and ServiceNow REST APIs for automated ticket creation, routing, and triage.", Inches(6.9), Inches(3.5)),
        ("5. Human-in-the-Loop DPO Alignment", "Incorporate implicit customer service agent feedback from resolved tickets into iterative Direct Preference Optimization (DPO) fine-tuning pipelines.", Inches(0.8), Inches(5.2)),
    ]

    for title, desc, left, top in future_cards:
        w = Inches(11.733) if top > Inches(5.0) else Inches(5.6)
        card = s22.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, w, Inches(1.4))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = ACCENT_TEAL
        card.line.width = Pt(1)
        tb = s22.shapes.add_textbox(left + Inches(0.18), top + Inches(0.12), w - Inches(0.36), Inches(1.16))
        tf = tb.text_frame
        tf.word_wrap = True
        p0 = tf.paragraphs[0]
        p0.text = title
        p0.font.name = "Arial"
        p0.font.size = Pt(12)
        p0.font.bold = True
        p0.font.color.rgb = ACCENT_MINT
        p1 = tf.add_paragraph()
        p1.text = desc
        p1.font.name = "Arial"
        p1.font.size = Pt(10.5)
        p1.font.color.rgb = TEXT_BODY
        p1.space_before = Pt(3)

    # =========================================================================
    # SLIDE 23: CONCLUSION
    # =========================================================================
    s23 = add_base_slide("CONCLUSION", "Summary of Research Contributions & Key Takeaways", "Evidence-based synthesis of the SupportIQ question-answering framework", 23)
    add_card(s23, Inches(0.8), Inches(1.8), Inches(3.6), Inches(4.9), "Unified Edge Architecture", [
        "Successfully coupled two-stage hybrid retrieval with PEFT domain adaptation and in-pipeline claim verification.",
        "Fused sparse BM25 with a 32-D deterministic hash vector via RRF (k=60), mitigating keyword traps.",
        "Domain-adapted Qwen2.5-0.5B via LoRA and QLoRA, training only 0.1093% of parameters (540,672).",
        "Demonstrates complete operational execution on a 4 GB consumer laptop GPU."
    ], badge="ARCHITECTURE")

    add_card(s23, Inches(4.8), Inches(1.8), Inches(3.6), Inches(4.9), "Observed Resource Trade-Offs", [
        "Inference VRAM Slashed: 4-bit NF4 QLoRA cuts inference memory to 0.46 GB (52.1% reduction vs. LoRA and Base).",
        "Interactive Speed: FP16 LoRA generates in 0.844 s (1.98x faster than QLoRA, 2.44x faster than Base Qwen).",
        "No Quality Degradation: Both fine-tuned adapters achieved 100.0% composite accuracy and 100.0% claim faithfulness on holdout.",
        "Trade-Off Rationale: Latency overhead in QLoRA stems from runtime NF4 to FP16 dequantization."
    ], badge="TRADE-OFFS", accent_color=ACCENT_MINT)

    add_card(s23, Inches(8.8), Inches(1.8), Inches(3.7), Inches(4.9), "The Necessity of Verification", [
        "Ablation Proof: Hybrid retrieval alone (Naive RAG) hallucinated on 100% of unsupported queries.",
        "Deterministic Safeguards Essential: Sentence claim decomposition and domain stopword filtering eliminated all false positives.",
        "Practical Impact: Enables verifiable, fact-grounded customer support automation with automated safe abstention on commodity hardware."
    ], badge="SAFETY LESSON", accent_color=ACCENT_AMBER)

    # =========================================================================
    # SLIDE 24: REFERENCES
    # =========================================================================
    s24 = add_base_slide("REFERENCES", "Seminal Literature & Academic References", "16 peer-reviewed publications grounding the SupportIQ methodology", 24)
    
    # 2 columns of 8 references each
    refs_col1 = [
        "[1] P. Lewis et al., 'Retrieval-augmented generation for knowledge-intensive NLP tasks,' in NeurIPS, vol. 33, 2020.",
        "[2] E. J. Hu et al., 'LoRA: Low-rank adaptation of large language models,' in Proc. ICLR, 2022.",
        "[3] T. Dettmers et al., 'QLoRA: Efficient finetuning of quantized LLMs,' in NeurIPS, vol. 36, 2023.",
        "[4] G. V. Cormack et al., 'Reciprocal rank fusion outperforms Condorcet and individual rank learning methods,' in ACM SIGIR, 2009.",
        "[5] S. Robertson & H. Zaragoza, 'The probabilistic relevance framework: BM25 and beyond,' Found. Trends Inf. Retr., 2009.",
        "[6] A. Yang et al. (Qwen Team), 'Qwen2.5 technical report,' arXiv preprint arXiv:2412.15115, 2024.",
        "[7] J. Thorne et al., 'FEVER: A large-scale dataset for fact extraction and VERification,' in NAACL-HLT, 2018.",
        "[8] A. Asai et al., 'Self-RAG: Learning to retrieve, generate, and critique through self-reflection,' in Proc. ICLR, 2024."
    ]

    refs_col2 = [
        "[9] Y. Gao et al., 'Retrieval-augmented generation for large language models: A survey,' arXiv:2312.10997, 2023.",
        "[10] K. Shuster et al., 'Retrieval augmentation reduces hallucination in conversation,' in Findings of EMNLP, 2021.",
        "[11] V. Karpukhin et al., 'Dense passage retrieval for open-domain question answering,' in Proc. EMNLP, 2020.",
        "[12] A. Gautam et al., 'Domain-specific conversational AI in customer support: Challenges and opportunities,' IEEE Access, 2022.",
        "[13] O. Yoran et al., 'Making retrieval-augmented language models robust to irrelevant context,' in Proc. ICLR, 2024.",
        "[14] B. Bohnet et al., 'Attributed question answering: Evaluation and modeling for attributed LLMs,' arXiv:2212.08037, 2022.",
        "[15] T. Wolf et al., 'Transformers: State-of-the-art natural language processing,' in EMNLP Demos, 2020.",
        "[16] S. Mangrulkar et al., 'PEFT: State-of-the-art parameter-efficient fine-tuning methods,' Hugging Face, 2022."
    ]

    card_r1 = s24.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9))
    card_r1.fill.solid()
    card_r1.fill.fore_color.rgb = CARD_BG
    card_r1.line.color.rgb = CARD_BORDER
    tb_r1 = s24.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(5.2), Inches(4.7))
    tf_r1 = tb_r1.text_frame
    tf_r1.word_wrap = True
    for idx, ref in enumerate(refs_col1):
        p = tf_r1.paragraphs[0] if idx == 0 else tf_r1.add_paragraph()
        p.text = ref
        p.font.name = "Arial"
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_BODY
        p.space_before = Pt(5)

    card_r2 = s24.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.8), Inches(5.6), Inches(4.9))
    card_r2.fill.solid()
    card_r2.fill.fore_color.rgb = CARD_BG
    card_r2.line.color.rgb = CARD_BORDER
    tb_r2 = s24.shapes.add_textbox(Inches(7.1), Inches(1.9), Inches(5.2), Inches(4.7))
    tf_r2 = tb_r2.text_frame
    tf_r2.word_wrap = True
    for idx, ref in enumerate(refs_col2):
        p = tf_r2.paragraphs[0] if idx == 0 else tf_r2.add_paragraph()
        p.text = ref
        p.font.name = "Arial"
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_BODY
        p.space_before = Pt(5)

    # Save presentation
    output_path = os.path.join("presentation", "SupportIQ_Research_Presentation.pptx")
    prs.save(output_path)
    print(f"Presentation successfully saved to {output_path} (Total Slides: {len(prs.slides)})")

if __name__ == "__main__":
    create_presentation()
