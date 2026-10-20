@section aidesign | AI System Design Case Studies
@blurb Full walkthroughs of the LLM design prompts companies use in 2026. Each one: scope, baseline, architecture, evals, cost, safety and rollout.

### [2] Design a customer-support assistant that answers from the company's knowledge base.
@tags system design, rag, support, case study
@hook RAG over policies and help articles, account tools with the user's permissions, strict grounding and citations, confident handoff to humans, and evals on real tickets.
@say
"Scope: customers ask questions in chat about orders, billing and policies. Success means resolving questions correctly without a human, while keeping wrong answers very rare and escalating smoothly. Say 50,000 conversations a day, with a first response in under two seconds.

Baseline: a prompted model with RAG over help-centre articles and policies, which probably handles most informational questions.

Architecture: an ingestion pipeline syncs articles and policy documents, parsed, chunked by section, with metadata like product, region and effective date. At query time: rewrite the latest message into a standalone question using the history, run hybrid search with filters for the customer's region and product, rerank, and generate an answer that cites the article sections. For account-specific questions, like 'where is my order', the assistant has a few read-only tools, such as order status and subscription details, executed with the customer's own authenticated identity. Actions like refunds go through a tool that only creates a request for approval or applies strict policy limits in code.

Handoff: a router or the model's structured output flags low confidence, frustration, sensitive topics or explicit requests for a human, and transfers the conversation with a summary, so the customer never repeats themselves.

Evals: a golden set built from a few hundred real historical tickets with correct resolutions, including unanswerable and adversarial cases, measuring retrieval recall, faithfulness, correctness, policy compliance and appropriate escalation.

Cost and latency: a mid-sized model for most turns with prompt caching for the system prompt, streaming responses, and escalation to a stronger model for complex cases.

Rollout: start as an agent-assist tool that drafts replies for human agents, measuring acceptance rates, then let it answer one low-risk category autonomously, and expand by category as metrics hold."
@deep
```text
Customer chat -> Gateway (auth, rate limit) -> Conversation service
   -> query rewrite (history) -> hybrid retrieval (filters: region, product, date) -> rerank
   -> LLM (system rules + chunks + account tool results) -> structured output:
        {answer, citations[], confidence, needs_human, reason}
   -> validators (citations exist, policy numbers valid, PII) -> stream to customer
   -> or handoff to human queue with conversation summary
Tools (read-only, user-scoped): get_order_status, get_subscription, create_refund_request (policy-capped)
Online metrics: resolution without handoff, CSAT, reopen rate, escalation rate, wrong-answer reports
```

### [3] Design an enterprise search assistant over internal documents with permissions.
@tags system design, enterprise search, permissions, case study
@hook Connectors that sync content and ACLs, permission-filtered hybrid retrieval, answers with citations, freshness, and strict tenant and user isolation.
@say
"Scope: employees ask questions across Confluence, SharePoint, Google Drive, Slack and Jira, and get answers with citations. Hard requirements: never show content a user can't access in the source system, and keep content fresh within minutes to hours.

Ingestion: a connector per source pulls documents incrementally, using webhooks or change APIs, along with their access-control lists: which users and groups can see each document. Documents are parsed, chunked by structure, enriched with metadata like source, author, date and space, and indexed in both a vector index and a keyword index. Group memberships are synced from the identity provider, so permissions can be resolved quickly.

Query time: authenticate the user, resolve their groups, and apply permission filters inside the retrieval query itself, so unauthorised chunks are never retrieved, rather than filtering afterwards. Then hybrid search, reranking and answer generation with citations linking back to the source documents. For questions that need structured data, like 'how many P1 incidents last month', an agentic path can call source APIs or SQL tools, again with the user's own permissions.

Freshness and deletion: deletions and permission changes must propagate fast, prioritised over new content. Caches are keyed per user or permission set.

Evals: a labelled set of employee questions per department, measuring recall at k and answer faithfulness, plus specific permission tests, where users ask about documents they shouldn't see, which must score zero leakage.

Scale: tens of millions of chunks, so a dedicated or well-tuned vector store with efficient filtered search, and sharding by tenant if it's a multi-tenant product. Observability includes audit logs of who retrieved what."

### [2] Design an AI tutoring and feedback system for university courses.
@tags system design, education, agents, case study
@hook Ground everything in course material, separate tutoring from grading, verify feedback against tests and rubrics, protect academic integrity, and evaluate against teaching staff.
@say
"Scope: students ask questions about course content and get feedback on assignment drafts; staff want consistent, rubric-aligned feedback at scale. Success means learning gains and student satisfaction, feedback that staff agree with, and no help that undermines academic integrity.

Knowledge: index lecture notes, slides, past Q&A and the rubrics per course, with metadata for course, week and topic, so answers stay within the syllabus and cite the relevant lecture.

Tutoring mode: a Socratic style by policy, giving hints and guiding questions rather than full solutions for graded work, with the course's academic integrity rules in the system prompt and enforced by classifying requests, like 'write my assignment' versus 'explain recursion'.

Feedback mode: a workflow rather than a free agent. For programming assignments: run the submission against tests in a sandbox, retrieve the relevant rubric items, have the model draft feedback per rubric criterion grounded in the test results and code, then a verification step checks every claim against the evidence. Grades, if any, stay with humans; the system gives formative feedback or suggested scores for staff review.

Evals: a golden set of past submissions with tutor-written feedback and scores; measure agreement with tutors per criterion, factual error rate as a hard gate, tone checks, and fairness checks across student groups. Pilot with one course and compare against tutor-only feedback.

Privacy and safety: student data is personal data, so access controls, retention limits and no training on student work without consent; plus escalation for wellbeing concerns. Cost: cache course material in the prompt prefix, and use a smaller model for simple Q&A."

### [2] Design a document extraction pipeline for invoices.
@tags system design, extraction, document ai, case study
@hook Parse or read the document, extract into a strict schema, validate with business rules, route low-confidence cases to humans, and learn from their corrections.
@say
"Scope: thousands of supplier invoices a day as PDFs and scans, in many layouts. Extract supplier, invoice number, dates, line items, tax and totals into the accounting system with very high accuracy, since errors cost money.

Pipeline: documents arrive by email or upload into object storage and a queue. Preprocessing detects the type, de-duplicates by hash, and does OCR for scans. Extraction uses a multimodal model that reads the page images, or a layout-aware parser plus an LLM, producing output constrained to a strict schema: typed fields, line items as an array, and a null option for missing fields.

Validation is where reliability comes from: deterministic business rules in code, like line items summing to the subtotal, subtotal plus tax equalling the total, valid dates, the supplier matching the vendor master data, the purchase order existing, and the invoice number not already processed. Any failure, missing required field, or low confidence routes the document to a human review queue that shows the extracted fields next to the highlighted source region, so correction is fast.

Learning loop: human corrections are stored as labelled data, used to expand the eval set, refine prompts, add supplier-specific hints, and eventually fine-tune a smaller model for cost.

Evals: field-level accuracy, exact match for IDs and amounts, document-level 'straight-through' rate, meaning fully correct with no human touch, and the error rate of documents that passed validation, which must be near zero. Cost: batch processing APIs for non-urgent volume, and a cheaper model first with escalation for difficult documents."

### [3] Design a multi-agent deep research assistant.
@tags system design, multi-agent, research, case study
@hook A lead agent plans and delegates, sub-agents search in parallel with clean contexts, findings are synthesised with citations, and budgets keep cost bounded.
@say
"Scope: a user asks an open-ended question, like 'compare the regulatory approaches to AI in the EU, US and Singapore', and gets a well-sourced report in a few minutes. Quality means coverage, accuracy and citation correctness.

Architecture: a lead agent analyses the question, writes a research plan and stores it in persistent memory, then spawns several sub-agents in parallel, each with a focused brief, like 'EU AI Act obligations for general-purpose models', the tools it can use, such as web search, fetch page and internal document search, and the expected output format. Each sub-agent runs its own search-read-refine loop in a fresh context, and returns a condensed summary with source URLs and quotes, not raw pages, which keeps the lead agent's context small. The lead agent reviews the findings, identifies gaps, optionally dispatches more sub-agents, and then writes the report. A final citation step checks that each claim maps to a source that supports it.

Controls: budgets on sub-agents, tool calls and tokens, scaled to query complexity, because multi-agent systems can use many times the tokens of a single chat; source quality heuristics; deduplication; and treating all fetched web content as untrusted data, since it may contain prompt injections, with no sensitive tools available to the browsing agents.

Evals: a set of research questions with expert-written key points, graded on coverage, factual accuracy, citation accuracy and source quality, using a calibrated LLM judge plus human review, with multiple runs because outcomes vary. Track cost and time per report.

Ops: full tracing of the agent tree, checkpointing so long runs can resume, and streaming progress updates to the user."

### [2] Design an LLM gateway or platform for a whole company.
@tags system design, platform, gateway, case study
@hook One internal entry point for all model calls: auth, routing, quotas, caching, guardrails, logging, cost attribution and evals as a service.
@say
"Scope: many teams are calling different LLM providers directly, with keys in config files, no cost visibility, inconsistent safety controls and no shared tooling. The goal is a platform that makes the safe path the easy path.

The core is an LLM gateway that every team calls through one API, ideally OpenAI-compatible so existing SDKs work. It handles authentication with per-team credentials, so provider keys live only in the gateway's secret store; routing to approved models and providers, including regional deployments for data residency; fallbacks and retries when a provider fails; quotas, rate limits and budgets per team; prompt and semantic caching; and logging of every request with cost attribution by team and feature.

Shared guardrails run in the gateway: PII detection and redaction policies, content moderation, and blocking of disallowed data classes, configurable per application's risk level.

Around it, platform services: a prompt and model registry with versioning, an evaluation service where teams register eval sets and run them in CI, tracing and observability dashboards, a vector search service for RAG with permission filtering, and a catalogue of approved MCP servers and tools.

Governance: an approved-model list with security and legal review, data handling rules per model, and audit logs.

The design priority is low added latency, a few milliseconds, and high availability, since the gateway becomes critical infrastructure, so it's stateless, horizontally scaled and multi-region. Adoption comes from making it easier than going direct: better SDKs, free dashboards and evals."

### [2] Design an AI code review assistant.
@tags system design, code review, case study
@hook Trigger on pull requests, gather the diff plus the right context, generate specific, verified comments, keep noise low, and measure what developers actually accept.
@say
"Scope: when a pull request is opened, the assistant posts review comments on bugs, security issues and maintainability problems. The biggest risk is noise: if most comments are wrong or trivial, developers ignore all of them. So the success metric is the share of comments developers accept or act on, plus bugs caught before merge.

Pipeline: a webhook on pull request events enqueues a job. Context gathering: the diff, the full contents of the changed files, related code found through the repository's symbol index, like callers of changed functions, the project's conventions file, and linked ticket descriptions. Static analysers and tests run first, and their findings are fed in, so the model doesn't duplicate what tools catch reliably.

Review: the model reviews the change hunk by hunk with a checklist of categories, producing structured comments with file, line, severity, explanation and a suggested fix. A second verification pass filters comments: does the issue really exist in the code, is it in changed lines, and is it above a confidence threshold. Comments are de-duplicated and capped per pull request.

Feedback loop: developers react to or resolve comments; that data measures precision per category and builds the eval set, made of historical pull requests with known bugs and their fixes.

Security and cost: code is sent only to approved model endpoints, secrets are never included, large pull requests are summarised first, and smaller models handle trivial changes."

### [2] Design semantic search for an e-commerce catalogue.
@tags system design, search, embeddings, case study
@hook Hybrid retrieval over product text and attributes, query understanding to extract filters, learning-to-rank on behaviour signals, and very low latency.
@say
"Scope: shoppers type queries like 'waterproof hiking boots for wide feet under 20,000 rupees', and expect relevant products in under 200 milliseconds across millions of items. Success is measured by click-through, add-to-cart and conversion from search, and by fewer zero-result searches.

Indexing: each product gets a text representation from its title, description, category and key attributes, embedded with a model fine-tuned or chosen for product search, plus a keyword index with fields and structured attributes for filtering, like price, size, brand and stock.

Query understanding: a fast model or a small LLM extracts structured filters from the query, like category hiking boots, attribute waterproof, width wide and price under 20,000, and normalises spelling and synonyms. Expensive LLM calls are cached for popular queries, since search traffic is very repetitive.

Retrieval and ranking: hybrid retrieval, meaning BM25 for exact brand and model numbers plus vector similarity for meaning, with filters applied in the index. Then a ranking model combines relevance scores with business and behaviour signals, like popularity, conversion rate, ratings, availability and personalisation. Learning-to-rank models trained on click and purchase logs typically give the biggest gains.

Evals: offline relevance judgements on sampled queries, measured with nDCG, plus online A/B tests on conversion. Special attention to zero-result and long-tail queries, where semantic search adds the most value, and latency budgets per stage."
