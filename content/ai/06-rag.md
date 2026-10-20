@section rag | Retrieval-Augmented Generation
@blurb The most asked topic in AI engineering loops. Chunking, embeddings, hybrid search, reranking, evaluation and debugging.

### [1] What is RAG, and why use it?
@tags rag, basics
@hook Look up the relevant facts first, then have the model answer from them. Fresh, private, citable knowledge without retraining.
@say
"Retrieval-augmented generation means that before the model answers, the system retrieves relevant information from an external knowledge source, like documentation, a database or a search index, and puts it into the prompt, so the model answers based on that evidence.

It solves several problems at once. Knowledge cut-off: the model can use information newer than its training data. Private data: it can answer about company documents it was never trained on. Hallucination: grounding answers in retrieved text, with instructions to stick to it, reduces made-up facts. Traceability: answers can cite their sources, so users can verify them. And maintainability: updating knowledge means updating the index, not retraining a model, and you can delete or restrict documents instantly, which matters for permissions and compliance.

The trade-offs are added latency and complexity, and the fact that the answer can only be as good as the retrieval. If the right passage isn't retrieved, the model can't use it. That's why most of the real engineering effort in RAG goes into retrieval and evaluation."

### [1] Walk me through a RAG pipeline end to end.
@tags rag, architecture
@hook Offline: load, parse, chunk, embed, index. Online: rewrite query, retrieve, rerank, assemble context, generate with citations, validate.
@say
"There are two pipelines.

The offline indexing pipeline: load documents from sources like a wiki, PDFs or a database; parse them into clean text while preserving structure like headings and tables; split them into chunks; enrich each chunk with metadata such as source, title, date, section and access permissions; compute embeddings with an embedding model; and store the vectors, text and metadata in a vector index, often alongside a keyword index.

The online query pipeline: take the user's question, optionally rewrite it, for example turning a follow-up like 'what about for students?' into a standalone question using the chat history; retrieve candidates using hybrid search, meaning vector similarity plus keyword search, with metadata filters for permissions and recency; rerank the top candidates with a cross-encoder to pick the best few; assemble the prompt with instructions, the selected chunks with IDs, and the question; generate the answer, instructing the model to use only the provided context and cite chunk IDs; and finally validate, checking citations point to real chunks and optionally that claims are supported.

Around all of it: tracing of every stage, so I can see what was retrieved for any answer, and an evaluation suite that measures retrieval and generation separately."
@deep
```text
OFFLINE  sources -> parse (layout, tables) -> chunk -> enrich metadata (ACL, date, title)
         -> embed -> vector index  +  keyword (BM25) index

ONLINE   question (+ history) -> rewrite / expand
         -> hybrid retrieve (top 50) with filters (tenant, ACL, date)
         -> rerank (cross-encoder) -> top 5
         -> prompt: rules + chunks [id] + question
         -> LLM -> answer with [id] citations -> validate citations -> user
```

### [2] How do you choose a chunking strategy and chunk size?
@tags chunking, rag
@hook Chunks must be small enough to be precise and big enough to be self-contained. Respect the document's structure, then tune on your evals.
@say
"Chunking is a trade-off. Small chunks give precise retrieval, since the embedding represents one idea, but may lack the surrounding context needed to answer. Large chunks carry more context but dilute the embedding with mixed topics and use more of the prompt.

Strategies from simple to advanced: fixed-size chunks by tokens, often a few hundred, with some overlap, like 10 to 20 percent, so sentences at boundaries aren't cut off from their context. Recursive or structure-aware splitting that respects natural boundaries: headings, sections, paragraphs, and for code, functions and classes; this is usually the best default. Semantic chunking, which splits where the topic shifts based on embedding similarity between sentences. And hierarchical chunking, where small chunks are used for retrieval but linked to their parent section, which is returned to the model for context.

Practical details matter: keep tables intact, prepend the document title and section heading to each chunk so it's self-contained, and keep metadata like page numbers for citations.

There's no universal best size; it depends on the documents and the questions. So I pick a sensible default, like 300 to 800 tokens with structure-aware splitting, then compare a few configurations on the retrieval eval set, measuring recall at k."

### [2] How do you choose an embedding model?
@tags embeddings, model selection
@hook Start from public benchmarks, decide on your own data. Weigh quality, language, max input length, dimensions, cost, latency and hosting.
@say
"I start with public leaderboards like MTEB, focusing on the retrieval tasks rather than the overall average, to shortlist a few candidates. But benchmark rankings don't always transfer, so the decision comes from evaluating on my own data: a set of real queries with their known relevant passages, measuring recall at k and MRR for each model.

Other factors I weigh: language support, which matters a lot for multilingual content such as English mixed with Sinhala or Tamil; domain fit, since legal, medical or code content can favour specialised models; maximum input length relative to my chunk size; dimensionality, because larger vectors cost more storage and search time, and some models support shortening the vector with Matryoshka-style training at little quality loss; latency and cost per million tokens; and hosting, API versus self-hosted, for data privacy.

Two operational points: the query and the documents must be embedded with the same model and version, and changing the embedding model means re-embedding the entire corpus, so I plan for that with versioned indexes. Some models also expect different prefixes or modes for queries and documents, which is easy to forget and silently hurts quality."

### [2] How do vector databases search fast? Explain HNSW and IVF.
@tags vector search, ann, hnsw
@hook Exact search compares the query with every vector. Approximate nearest neighbour indexes trade a little recall for orders-of-magnitude speed.
@say
"Exact nearest-neighbour search compares the query vector with every stored vector, which is fine for thousands of vectors but too slow for millions. Vector databases use approximate nearest neighbour indexes, which return almost all of the true nearest neighbours much faster.

HNSW, Hierarchical Navigable Small World, builds a multi-layer graph. The top layers are sparse with long-range links, and the bottom layer contains all vectors with links to their near neighbours. A search starts at the top, greedily moves towards the query, and descends layer by layer, like zooming in on a map. It gives excellent recall and low latency and supports incremental inserts, but uses a lot of memory. Parameters like M and ef_search trade recall against speed.

IVF, the inverted file index, clusters the vectors with k-means into many partitions. At query time it only searches the few clusters whose centroids are closest to the query, controlled by a parameter called nprobe. It's memory-efficient and builds fast but usually needs more tuning for recall.

Product quantisation compresses vectors into short codes, cutting memory dramatically at some accuracy cost, and is often combined with IVF for billion-scale search. There are also disk-based indexes like DiskANN for corpora too large for RAM. I tune these against a recall target measured against exact search on a sample."

### [1] Cosine similarity vs dot product vs Euclidean distance?
@tags similarity, embeddings
@hook Cosine compares direction only. Dot product includes length. On normalised vectors, all three rank results the same way.
@say
"Cosine similarity measures the angle between two vectors, ignoring their length, so it captures whether they point in the same direction, which is how most embedding models encode meaning. It ranges from minus one to one.

The dot product multiplies corresponding components and sums them, so it depends on both direction and magnitude. Euclidean distance is the straight-line distance between the points.

The key fact is that if vectors are normalised to unit length, which most embedding models do or recommend, then cosine similarity and dot product are identical, and Euclidean distance gives the same ranking. In that case, dot product is the fastest to compute.

So the rule is: use the metric the embedding model was trained with, which is usually documented, and normalise if it says to. Mismatching the metric, like using Euclidean distance on unnormalised vectors from a model trained for cosine, quietly degrades retrieval."

### [2] What is hybrid search, and why combine keyword and vector search?
@tags hybrid search, bm25, retrieval
@hook Vectors catch meaning, keywords catch exact terms like error codes and names. Run both and fuse the rankings, often with reciprocal rank fusion.
@say
"Dense vector search is great at semantic matches: it finds 'how do I reset my password' when the document says 'recovering account access'. But it's weak on exact, rare tokens like product codes, error messages, names, acronyms and numbers, because embeddings blur them.

Keyword search with BM25 is the opposite: excellent at exact term matching and rare words, poor at synonyms and paraphrases.

Hybrid search runs both and merges the results. A simple, robust way to merge is reciprocal rank fusion: each document gets a score of one over k plus its rank in each list, typically with k around 60, and the scores are summed. It needs no score normalisation, which matters because BM25 and cosine scores are on different scales. Alternatively, a weighted combination of normalised scores, with the weight tuned on evals.

In my experience, hybrid search plus a reranker is the most reliable default for production RAG, especially for technical or enterprise content full of identifiers. Many vector databases and search engines support it natively now, including Elasticsearch, OpenSearch, Weaviate, Qdrant and Postgres with pgvector plus full-text search."
@deep
```python
def reciprocal_rank_fusion(result_lists, k=60):
    """result_lists: list of ranked lists of doc ids (best first)."""
    scores = {}
    for results in result_lists:
        for rank, doc_id in enumerate(results, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores, key=scores.get, reverse=True)

fused = reciprocal_rank_fusion([bm25_ids, vector_ids])[:50]
```

### [2] What does a reranker do? Bi-encoder vs cross-encoder?
@tags reranking, cross-encoder, retrieval
@hook Retrieve wide and fast with a bi-encoder, then rerank a shortlist precisely with a cross-encoder that reads query and passage together.
@say
"A bi-encoder, which is what embedding models are, encodes the query and each document separately into vectors and compares them. Because documents are encoded ahead of time, it scales to millions of documents, but the query and document never 'see' each other, so it misses fine-grained relevance.

A cross-encoder takes the query and one document together as a single input and outputs a relevance score. Attention runs across both texts, so it judges relevance much more accurately, for example noticing that a passage mentions the right product but the wrong version. But it has to run once per query-document pair at query time, so it's too slow to apply to the whole corpus.

So we combine them in two stages: retrieve a broad candidate set, say the top 50 to 100, with hybrid search, then rerank them with a cross-encoder and keep the top 3 to 10 for the prompt. That usually gives a significant quality boost for modest added latency. Options include hosted rerank APIs, open-source cross-encoder models, or an LLM used as a reranker for the highest quality at higher cost. Better reranking also means fewer, more relevant chunks in the prompt, which reduces cost and the risk of distracting the model."

### [2] What query transformation techniques improve retrieval?
@tags query rewriting, hyde, retrieval
@hook Users ask messy questions. Rewrite follow-ups into standalone queries, expand into variants, decompose multi-part questions, or search with a hypothetical answer (HyDE).
@say
"The user's raw question is often a poor search query, so I transform it before retrieving.

Contextual rewriting: in a chat, 'what about for part-time staff?' means nothing alone, so an LLM rewrites it into a standalone question using the conversation history. This is the most important one for conversational RAG.

Multi-query expansion: generate several paraphrases of the question, retrieve for each, and fuse the results, which improves recall when users phrase things differently from the documents.

Decomposition: split a complex question like 'compare the leave policies in 2024 and 2025' into sub-questions, retrieve for each, then combine.

HyDE, hypothetical document embeddings: have the model write a hypothetical answer and embed that instead of the question, because an answer-shaped text is often closer in embedding space to the real answer passage than the question is.

Metadata extraction: pull structured filters from the question, like a year, product or department, and apply them as filters.

Each adds latency and cost, so I add them based on failure analysis, for example, if evals show follow-up questions fail, add rewriting, rather than stacking all of them by default."

### [2] How do you evaluate a RAG system?
@tags evaluation, rag, metrics
@hook Evaluate retrieval and generation separately. Retrieval: recall@k, MRR, nDCG. Generation: faithfulness, relevance, correctness. Then end-to-end.
@say
"I evaluate the stages separately, because a bad answer can come from either retrieval or generation, and the fixes are completely different.

For retrieval, I need a labelled set of questions with the passages that should be found. Then recall at k: did the relevant passage appear in the top k results? That's the most important retrieval metric, because the model can't use what isn't retrieved. Plus precision at k, how much noise comes along, and ranking metrics like MRR and nDCG, which reward putting relevant results near the top.

For generation, given the retrieved context: faithfulness or groundedness, meaning is every claim in the answer supported by the context; answer relevance, does it actually address the question; correctness against a reference answer where I have one; and citation accuracy. Frameworks like RAGAS define these, often scored by an LLM judge, which I calibrate against human labels on a sample.

End to end, I track task success, abstention behaviour, meaning does it say 'I don't know' when the answer isn't in the corpus, which needs unanswerable questions in the set, plus latency and cost.

The eval set itself comes from real user queries where possible, plus synthetic questions generated from documents and reviewed by humans, plus known hard cases, and it grows every time a production failure is found."
@deep
| Stage | Metric | Question it answers |
|---|---|---|
| Retrieval | Recall@k | Was the right passage in the top k? |
| Retrieval | Precision@k | How much of the top k is relevant? |
| Retrieval | MRR / nDCG | Is the right passage near the top? |
| Generation | Faithfulness | Is every claim supported by the context? |
| Generation | Answer relevance | Does it answer what was asked? |
| Generation | Correctness | Does it match the reference answer? |
| Generation | Citation accuracy | Do citations point at supporting text? |
| End to end | Abstention rate on unanswerable questions | Does it admit "not found"? |
| End to end | Latency, cost per query | Can we afford it at scale? |

### [2] A RAG answer is wrong, even though the right document is in the knowledge base. How do you debug it?
@tags debugging, rag, failure analysis
@hook Walk the pipeline stage by stage before touching the prompt: indexed? retrieved? ranked high enough? fitted in context? used correctly?
@say
"I resist the urge to tweak the prompt first. I pull the trace for that request and walk the pipeline stage by stage, to classify the failure.

One: was the document actually indexed, and correctly? Parsing failures are common: a scanned PDF with no text, a table flattened into nonsense, or the relevant section split across two chunks.

Two: was it filtered out? A metadata filter, like permissions, date or tenant, might have excluded it, sometimes wrongly.

Three: was it retrieved at all? I search the index directly with the query. If it's not in the top 50, it's a retrieval problem: vocabulary mismatch, which hybrid search or query rewriting fixes; a poor embedding model for this domain; or a chunk that lacks context, which contextual chunking fixes.

Four: was it retrieved but ranked too low and cut off before reaching the prompt? Then it's reranking or the top-k setting.

Five: was it in the context but the model didn't use it, or misread it? Then it's generation: conflicting chunks, the passage buried in the middle of a long context, ambiguous instructions, or the model preferring its own prior knowledge.

Once classified, I fix that stage, add the case to the eval set as a regression test, and check that the fix didn't hurt other cases. Tracking which stage fails across many examples also tells me where to invest."

### [2] RAG vs fine-tuning vs long context. When do you use each?
@tags rag, fine-tuning, long context, trade-offs
@hook RAG for knowledge, fine-tuning for behaviour and format, long context for one-off reasoning over a known small set of documents.
@say
"They solve different problems, and they combine well.

RAG is for knowledge: facts that change, private documents, large corpora and anything needing citations or access control. Updating knowledge is just re-indexing.

Fine-tuning is for behaviour: a consistent style, format or tone, domain-specific task skills like classification or extraction at high accuracy, following complex instructions reliably, or distilling a big model's skill into a smaller, cheaper one. It's poor for injecting facts: models learn new facts from fine-tuning unreliably, can hallucinate them, and you'd need to retrain whenever they change.

Long context, putting entire documents into the prompt, is great when the relevant material is a known, bounded set, like analysing three contracts or one codebase module, with no retrieval errors and simple engineering. But it's costly per call, slower, and quality can drop with very long inputs, and it doesn't scale to a whole company's knowledge base. Prompt caching makes repeated long contexts much cheaper.

So: start with prompting; add RAG when the model needs knowledge it doesn't have; consider fine-tuning when prompting can't achieve the behaviour, cost or latency needed; and often use RAG plus a fine-tuned model together."

### [2] How do you handle permissions and multi-tenancy in a RAG system?
@tags security, permissions, multi-tenant
@hook Enforce access at retrieval time with metadata filters tied to the user's identity. Never rely on the prompt to hide documents.
@say
"The rule is that a user must never receive, even indirectly through a generated answer, content they aren't allowed to see. And the model can't be trusted to enforce that, because if a forbidden document is in the context, it may leak it. So permissions are enforced before anything reaches the model.

At indexing time, each chunk inherits access-control metadata from its source document: tenant ID, groups, roles or a document-level ACL. At query time, the retrieval layer applies a filter based on the authenticated user's identity and permissions, so only allowed chunks can be retrieved. For strong isolation between customers, I'd use separate indexes or namespaces per tenant, which also makes deletion and data residency easier.

Permissions change, so the sync pipeline must propagate ACL changes and deletions quickly, and caches must be keyed by user or permission set, so one user's cached answer isn't served to another.

And I test it: eval cases where a user asks about content they shouldn't see, checking that it isn't retrieved and the answer doesn't reveal it, including cross-tenant tests, plus audit logs of what was retrieved for whom."

### [2] How do you handle PDFs, tables and images in RAG?
@tags parsing, documents, multimodal
@hook Garbage in, garbage out. Use layout-aware parsing, keep tables as tables, describe or embed images, and check the parsed output by eye.
@say
"Parsing is the most underrated part of RAG. If the text going into the index is broken, nothing downstream can fix it.

For PDFs, I use layout-aware parsers that understand reading order, columns, headers and footers, rather than naive text extraction, which jumbles multi-column layouts. Scanned PDFs need OCR. Document AI services and open-source tools like Docling, Unstructured or Marker handle much of this, and multimodal LLMs can now convert pages to clean Markdown directly, at a higher cost per page.

For tables, I keep them intact as Markdown or HTML so rows and columns stay aligned, and avoid splitting them across chunks. For large tables, I add a short generated summary of what the table contains, which helps retrieval, while keeping the full table for the answer. Sometimes numeric tables belong in a database and are queried with SQL through a tool instead.

For images and charts, I either generate text descriptions with a vision model and index those, or use multimodal embeddings, and keep a link to the original so it can be shown or passed to a vision-capable model at answer time.

And I always spot-check the parsed output by eye on a sample of documents. It catches problems no metric will."

### [2] How do you keep a RAG index fresh as documents change?
@tags indexing, freshness, pipelines
@hook Incremental sync with change detection, stable IDs for upserts and deletes, and versioned indexes for re-embedding.
@say
"I build ingestion as an incremental pipeline, not a one-time script.

Change detection: subscribe to change events or webhooks from the source systems where possible, otherwise poll using modification timestamps or content hashes, so only new or changed documents are reprocessed.

Stable IDs: each chunk gets an ID derived from the document ID and its position or section, so an updated document replaces its old chunks through upserts, and a deleted document's chunks are removed. Deletions are often forgotten, and stale content that should be gone is both a quality and a compliance problem.

Metadata: store the source's last-modified date and version, so retrieval can prefer recent content, and answers can show how current their source is.

For changes that affect everything, like a new embedding model or a new chunking strategy, I build a new versioned index in the background, evaluate it, and switch traffic over atomically, keeping the old one for rollback.

And I monitor the pipeline: ingestion lag, failed documents, and index size, with alerts, because a silently broken sync job makes the assistant confidently answer from outdated information."

### [3] What are contextual retrieval and small-to-big retrieval?
@tags advanced rag, chunking
@hook Chunks lose context when cut out of a document. Add that context back (contextual retrieval), or retrieve small and return the bigger parent (small-to-big).
@say
"Both fix the problem that a chunk, cut out of its document, often loses the context needed to retrieve it or understand it. A chunk saying 'revenue grew 3 percent over the previous quarter' doesn't say which company or quarter.

Contextual retrieval, an approach Anthropic published, prepends a short, LLM-generated context to each chunk before embedding and keyword indexing it, something like 'This chunk is from Acme's Q2 2025 earnings report, in the section on cloud revenue.' That makes the chunk self-describing, and in their tests it significantly reduced retrieval failures, especially combined with BM25 and reranking. The cost is an LLM call per chunk at indexing time, which prompt caching of the full document makes affordable.

Small-to-big, or parent-document retrieval, indexes small chunks, such as sentences or short passages, which give precise matching, but when one matches, returns its larger parent section to the model, which gives enough context to answer. A related variant is sentence-window retrieval, which returns the matched sentence plus its neighbours.

Late chunking is another approach: embed the whole long document with a long-context embedding model first, then pool token embeddings per chunk, so each chunk's vector carries document-level context. I'd choose between these based on failure analysis of what retrieval is missing."

### [3] What is GraphRAG, and when is it useful?
@tags graphrag, knowledge graph
@hook Build a knowledge graph of entities and relationships from the corpus, so the system can answer connect-the-dots and whole-corpus questions that chunk retrieval misses.
@say
"Standard RAG retrieves individual chunks similar to the question. It struggles with questions that require connecting facts across many documents, like 'which suppliers are linked to the delayed projects?', or with global questions about the whole corpus, like 'what are the main themes in these 5,000 customer complaints?', because no single chunk contains the answer.

GraphRAG uses an LLM to extract entities and relationships from the documents and build a knowledge graph. Microsoft's version also clusters the graph into communities and pre-generates summaries of each one. At query time, the system can traverse relationships for multi-hop questions, or use the community summaries to answer global questions.

It's useful for domains rich in entities and relationships: investigations, research literature, supply chains, compliance and intelligence analysis. The costs are significant: building the graph requires many LLM calls, extraction errors propagate into the graph, and keeping it updated is complex. So I'd only reach for it when evals show that plain hybrid RAG fails on those multi-hop or global questions, and sometimes a simpler fix, like structured metadata or a SQL tool, covers the need."

### [3] What is agentic RAG?
@tags agentic rag, agents
@hook Instead of one fixed retrieve-then-answer step, the model decides what to search, where, and whether it has enough, in a loop.
@say
"In classic RAG, retrieval happens once, with the user's question, before generation. Agentic RAG gives the model retrieval as a tool and lets it control the process: it can decide whether to search at all, rewrite the query, choose between sources, like a vector index, a SQL database, a web search or an API, inspect the results, search again with refined queries, and stop when it has enough evidence to answer.

That handles complex, multi-step questions much better: comparing information across sources, following references, or realising the first search missed something. It's how deep research features work.

The costs are higher and less predictable latency and token usage, more failure modes, like loops or drifting off-topic, and harder evaluation, since you need to evaluate the trajectory, not just the answer. So I'd use a fixed pipeline for the common, simple questions, which is fast and predictable, and route complex questions to the agentic path, with limits on the number of steps and tokens, and tracing of every tool call."

### [2] How do you make a RAG system cite its sources reliably?
@tags citations, grounding, trust
@hook Give every chunk an ID, require citations in a structured output, verify that each cited chunk exists and supports the claim, and show sources in the UI.
@say
"First, I make citation easy for the model: every chunk in the prompt has a short ID, with its title and source, and the instructions say to cite the IDs supporting each claim and to answer only from the provided sources.

Second, I use structured output, for example a list of statements each with its supporting chunk IDs, or inline markers that the application parses. Some provider APIs also have native citation features that return exact quoted spans from the provided documents, which is the most reliable option where available.

Third, I validate: every cited ID must exist in the provided context, and for important use cases, a verification step checks that the cited passage actually supports the claim, using an entailment model or an LLM judge. Answers with unsupported claims are regenerated, or flagged.

Fourth, the UI shows the sources with links to the original documents and, ideally, highlights the quoted passage, so users can verify quickly.

And I measure citation accuracy in the eval suite, because models can produce citations that look right but point to the wrong chunk."

### [2] Which vector database would you choose?
@tags vector database, infrastructure
@hook If you already run Postgres, start with pgvector. Move to a dedicated vector database for very large scale, heavy filtering or advanced features.
@say
"I'd start from what the team already runs and the scale required.

For many applications, up to millions of vectors, pgvector in PostgreSQL is a great default: one database to operate, transactions and joins with your relational data, metadata filtering with normal SQL, HNSW indexes, and it can be combined with Postgres full-text search for hybrid retrieval. Similarly, if the company already runs Elasticsearch or OpenSearch, their vector support plus BM25 makes hybrid search straightforward.

I'd move to a dedicated vector database, like Qdrant, Weaviate, Milvus or a managed service like Pinecone, when I need very large scale, hundreds of millions to billions of vectors, high query throughput, advanced filtering performance, built-in hybrid search and reranking, multi-tenancy features, or quantisation and disk-based indexes to control memory cost.

The criteria I'd compare: recall and latency at our scale with our filters, measured on our data; filtering performance, because filtered vector search is where many systems slow down; operational burden, managed versus self-hosted; cost; and features like hybrid search, namespaces and backups. The choice is rarely the bottleneck for quality; chunking, embeddings and reranking matter more."
