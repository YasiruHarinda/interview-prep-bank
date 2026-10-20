@section aicoding | Coding Tasks for AI Engineers
@blurb The build-and-debug round. Small, practical implementations you should be able to write and explain without looking anything up.

### [1] Implement a numerically stable softmax and cross-entropy loss.
@tags numpy, softmax, coding
@hook Subtract the max before exponentiating, so exp never overflows. Use log-sum-exp for the loss.
@say
"Softmax is exp of each value divided by the sum of exps. The naive version overflows: exp of 1,000 is infinity in floating point. Since softmax doesn't change if you subtract the same constant from every input, I subtract the maximum first, so the largest exponent is exp of zero, which is one, and nothing overflows.

For cross-entropy, computing softmax and then taking the log can underflow to log of zero. The stable way uses log-softmax directly: x minus the max, minus the log of the sum of exps of the shifted values, which is the log-sum-exp trick. Then the loss is the negative log-probability of the correct class, averaged over the batch.

Frameworks do this for you, which is why PyTorch's cross-entropy loss takes raw logits, not probabilities. Passing softmax outputs into it is a classic bug that applies softmax twice."
@deep
```python
import numpy as np

def softmax(x, axis=-1):
    z = x - x.max(axis=axis, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=axis, keepdims=True)

def log_softmax(x, axis=-1):
    z = x - x.max(axis=axis, keepdims=True)
    return z - np.log(np.exp(z).sum(axis=axis, keepdims=True))

def cross_entropy(logits, targets):
    """logits: (batch, classes); targets: (batch,) int class ids"""
    lp = log_softmax(logits)
    return -lp[np.arange(len(targets)), targets].mean()

softmax(np.array([1000.0, 1001.0, 1002.0]))   # works, no overflow
```

### [2] Implement cosine similarity and top-k retrieval with NumPy.
@tags numpy, retrieval, vectors
@hook Normalise once, then a single matrix multiply gives all similarities. Use argpartition for top-k instead of a full sort.
@say
"Cosine similarity is the dot product divided by the product of the vector norms. For retrieval over many documents, I normalise the document matrix once, at indexing time, and normalise the query, so the similarity to every document is a single matrix-vector product, which NumPy runs as fast vectorised code.

For top-k, a full sort is O(n log n). argpartition finds the k largest in O(n) on average, and then I sort just those k. I also guard against division by zero for empty or zero vectors.

At real scale, millions of vectors, I'd move to an approximate nearest neighbour index like HNSW in a vector database or FAISS, but this brute-force version is exact, simple, and fine up to tens or hundreds of thousands of vectors. It's also what I'd use as ground truth to measure an ANN index's recall."
@deep
```python
import numpy as np

def normalize(m, eps=1e-12):
    norms = np.linalg.norm(m, axis=-1, keepdims=True)
    return m / np.maximum(norms, eps)

class BruteForceIndex:
    def __init__(self, vectors, ids):
        self.vecs = normalize(np.asarray(vectors, dtype=np.float32))
        self.ids = list(ids)

    def search(self, query, k=5):
        q = normalize(np.asarray(query, dtype=np.float32))
        sims = self.vecs @ q                         # (n,)
        k = min(k, len(sims))
        top = np.argpartition(-sims, k - 1)[:k]     # O(n)
        top = top[np.argsort(-sims[top])]           # sort only k
        return [(self.ids[i], float(sims[i])) for i in top]
```

### [1] Implement a text chunker with overlap.
@tags chunking, rag, coding
@hook Slide a window of size N with step N minus overlap. Better: split on structure first, then pack paragraphs up to the size limit.
@say
"The simplest chunker splits text into windows of a fixed size with some overlap, so the step between chunk starts is the size minus the overlap. I validate that the overlap is smaller than the chunk size, otherwise the loop never advances.

In practice I'd measure size in tokens with the embedding model's tokeniser rather than characters, and I'd prefer a structure-aware approach: split into paragraphs first, then pack consecutive paragraphs into a chunk until adding the next one would exceed the limit, so chunks don't cut sentences in half. Very long paragraphs fall back to the sliding window.

I'd also attach metadata to each chunk, like the source document ID, the chunk's position and its character offsets, which are needed for citations and for replacing a document's chunks when it changes."
@deep
```python
def sliding_chunks(text, size=800, overlap=120):
    if overlap >= size:
        raise ValueError("overlap must be smaller than size")
    step = size - overlap
    return [text[i:i + size] for i in range(0, max(len(text) - overlap, 1), step)]

def paragraph_chunks(text, max_len=800):
    chunks, current = [], ""
    for para in (p.strip() for p in text.split("\n\n")):
        if not para:
            continue
        if len(para) > max_len:                       # oversized paragraph
            if current:
                chunks.append(current); current = ""
            chunks.extend(sliding_chunks(para, max_len, max_len // 8))
        elif len(current) + len(para) + 2 <= max_len:
            current = f"{current}\n\n{para}" if current else para
        else:
            chunks.append(current); current = para
    if current:
        chunks.append(current)
    return chunks
```

### [2] Call an LLM API for 10,000 items concurrently, with a concurrency limit, retries and backoff.
@tags asyncio, concurrency, reliability
@hook asyncio with a semaphore to cap in-flight calls, exponential backoff with jitter on retryable errors only, and results kept in input order.
@say
"Calling sequentially would take hours; firing all 10,000 at once would hit rate limits and get throttled. So I use asyncio with a semaphore that caps the number of in-flight requests, say 20, which I'd tune to the provider's rate limits.

Each call is wrapped in a retry loop: on retryable errors, like 429 rate limits, 5xx server errors and timeouts, I wait with exponential backoff plus random jitter, respecting a retry-after header if present, up to a maximum number of attempts. Non-retryable errors, like invalid requests, fail immediately. Each call also has a timeout.

I gather the results in input order and return exceptions as values rather than letting one failure cancel the whole batch, so I can log and re-run only the failures. For large offline jobs like this, I'd also mention the provider's batch API, which is often half price, if results aren't needed immediately."
@deep
```python
import asyncio, random

class RetryableError(Exception): ...

async def call_with_retry(client, item, sem, max_attempts=5, base=0.5, timeout=60):
    async with sem:
        for attempt in range(1, max_attempts + 1):
            try:
                return await asyncio.wait_for(client.complete(item), timeout)
            except (RetryableError, asyncio.TimeoutError) as e:
                if attempt == max_attempts:
                    raise
                delay = min(30, base * 2 ** (attempt - 1)) * (0.5 + random.random())
                await asyncio.sleep(delay)

async def run_all(client, items, concurrency=20):
    sem = asyncio.Semaphore(concurrency)
    tasks = [call_with_retry(client, it, sem) for it in items]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    failures = [i for i, r in enumerate(results) if isinstance(r, Exception)]
    return results, failures
```

### [2] Implement recall@k and MRR to evaluate retrieval.
@tags evaluation, metrics, rag
@hook Recall@k: did any relevant doc show up in the top k (or what fraction of them did)? MRR: average of 1 over the rank of the first relevant hit.
@say
"For each query I have the ranked list of retrieved document IDs and the set of relevant IDs.

Recall at k is the fraction of the relevant documents that appear in the top k. When each question has a single relevant passage, it becomes the hit rate: did it appear in the top k at all. I average it across queries. This is the key retrieval metric for RAG, because the generator can only use what's retrieved.

Mean reciprocal rank looks at the position of the first relevant result: 1 if it's first, a half if second, a third if third, and zero if it's not found, averaged over queries. It rewards putting the right document near the top, which matters when only the top few chunks go into the prompt.

I'd report both at the k values the system actually uses, like 5 and 20, and break them down by query type, since an average can hide a category that always fails."
@deep
```python
def recall_at_k(retrieved, relevant, k):
    if not relevant:
        return None
    return len(set(retrieved[:k]) & set(relevant)) / len(relevant)

def reciprocal_rank(retrieved, relevant):
    for rank, doc_id in enumerate(retrieved, start=1):
        if doc_id in relevant:
            return 1.0 / rank
    return 0.0

def evaluate(runs, k=5):
    """runs: list of (retrieved_ids, relevant_ids)"""
    recalls = [r for r in (recall_at_k(ret, rel, k) for ret, rel in runs) if r is not None]
    mrr = sum(reciprocal_rank(ret, set(rel)) for ret, rel in runs) / len(runs)
    return {"recall@k": sum(recalls) / len(recalls), "mrr": mrr}
```

### [3] Implement BM25 scoring from scratch.
@tags bm25, search, coding
@hook Score = sum over query terms of IDF times a saturating term frequency, normalised by document length.
@say
"BM25 scores a document for a query by summing a contribution for each query term. Each contribution is the term's inverse document frequency, which is high for rare terms and low for common ones, multiplied by a saturating function of how often the term appears in the document.

The saturation, controlled by k1, typically around 1.2 to 2, means the tenth occurrence of a word adds much less than the first. Length normalisation, controlled by b, typically 0.75, means long documents don't win just by containing more words: term frequency is scaled relative to the document's length compared with the average length.

To implement it, I tokenise and precompute document frequencies, document lengths and the average length once. Then scoring a query is a loop over its terms. In production you'd use an inverted index, so you only score documents that contain at least one query term, which is what Lucene and Elasticsearch do."
@deep
```python
import math
from collections import Counter

class BM25:
    def __init__(self, docs, k1=1.5, b=0.75):
        self.k1, self.b = k1, b
        self.docs = [d.lower().split() for d in docs]
        self.tfs = [Counter(d) for d in self.docs]
        self.lens = [len(d) for d in self.docs]
        self.avgdl = sum(self.lens) / len(self.lens)
        df = Counter(t for d in self.docs for t in set(d))
        n = len(self.docs)
        self.idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}

    def score(self, query, i):
        tf, dl, s = self.tfs[i], self.lens[i], 0.0
        for t in query.lower().split():
            if t not in tf:
                continue
            f = tf[t]
            s += self.idf[t] * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * dl / self.avgdl))
        return s

    def search(self, query, k=5):
        scores = [(self.score(query, i), i) for i in range(len(self.docs))]
        return sorted(scores, reverse=True)[:k]
```

### [3] Implement causal multi-head self-attention in PyTorch.
@tags pytorch, attention, transformers
@hook Project to Q, K, V, split into heads, scaled dot-product with a causal mask, softmax, weight the values, merge heads, output projection.
@say
"I project the input of shape batch, sequence, model dimension into queries, keys and values with one linear layer producing three times the model dimension, then split it into three. I reshape each into batch, heads, sequence, head dimension, where head dimension is the model dimension divided by the number of heads.

Attention scores are Q times K-transpose divided by the square root of the head dimension, giving a sequence by sequence matrix per head. I apply a causal mask, setting positions above the diagonal to minus infinity, so each position only attends to itself and earlier positions, then softmax over the last dimension, optional dropout, and multiply by V.

Finally I transpose back, merge the heads into the model dimension and apply the output projection. In real code I'd call PyTorch's scaled_dot_product_attention with is_causal set to true, which uses FlashAttention kernels when available, but writing it out shows I understand each step. I'd mention the extensions: a KV cache for generation, and grouped-query attention where several query heads share K and V heads."
@deep
```python
import math, torch, torch.nn as nn, torch.nn.functional as F

class CausalSelfAttention(nn.Module):
    def __init__(self, d_model, n_heads, dropout=0.0):
        super().__init__()
        assert d_model % n_heads == 0
        self.h, self.d = n_heads, d_model // n_heads
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.out = nn.Linear(d_model, d_model)
        self.drop = nn.Dropout(dropout)

    def forward(self, x):                         # x: (B, T, C)
        B, T, C = x.shape
        q, k, v = self.qkv(x).split(C, dim=-1)
        q, k, v = (t.view(B, T, self.h, self.d).transpose(1, 2) for t in (q, k, v))  # (B, h, T, d)
        att = (q @ k.transpose(-2, -1)) / math.sqrt(self.d)                           # (B, h, T, T)
        mask = torch.triu(torch.ones(T, T, dtype=torch.bool, device=x.device), 1)
        att = att.masked_fill(mask, float("-inf"))
        att = self.drop(F.softmax(att, dim=-1))
        y = (att @ v).transpose(1, 2).contiguous().view(B, T, C)                      # merge heads
        return self.out(y)

# Production equivalent of the middle part:
# y = F.scaled_dot_product_attention(q, k, v, is_causal=True)
```

### [2] Trim a chat history to fit a token budget.
@tags context management, tokens, coding
@hook Always keep the system prompt and the latest user turn, then add earlier turns newest-first until the budget runs out; summarise what you dropped.
@say
"The goal is to fit within the model's context budget, minus room reserved for the output, while keeping the most useful context.

Rules: always keep the system prompt and the latest user message. Then walk backwards through earlier messages, newest first, adding each one while the running token count stays under the budget. Keep tool calls and their results together as a unit, because most APIs reject a tool result without its matching call. Then reverse to restore chronological order.

Better still, if messages were dropped, replace them with a short summary generated by a cheap model, so older facts and decisions aren't lost completely. I'd count tokens with the provider's tokeniser or token-counting endpoint rather than estimating by characters, and keep the stable prefix unchanged, so prompt caching still works."
@deep
```python
def fit_history(system, messages, count_tokens, budget, reserve_output=1024):
    """messages: oldest -> newest; each is a dict, tool call + result pre-grouped as one unit."""
    limit = budget - reserve_output - count_tokens(system)
    latest = messages[-1]
    used = count_tokens(latest)
    if used > limit:
        raise ValueError("latest message alone exceeds the budget")
    kept = [latest]
    for msg in reversed(messages[:-1]):
        cost = count_tokens(msg)
        if used + cost > limit:
            break
        kept.append(msg)
        used += cost
    kept.reverse()
    dropped = messages[: len(messages) - len(kept)]
    return kept, dropped          # caller can summarise `dropped` into one short message
```

### [2] Stream LLM tokens to a browser with FastAPI and server-sent events.
@tags streaming, fastapi, sse
@hook An async generator yields tokens as SSE events; the endpoint returns a StreamingResponse; handle disconnects and send a final done event.
@say
"I write an async generator that iterates over the provider's streaming response and yields each text delta formatted as a server-sent event: a line starting with 'data:', the payload as JSON, and a blank line. The FastAPI endpoint returns a StreamingResponse with the text/event-stream media type.

Details that matter in production: send a final event signalling completion, plus an error event if something fails mid-stream, since the HTTP status code was already sent; check whether the client disconnected and stop consuming the upstream stream, so we don't pay for tokens nobody reads; disable buffering in proxies like Nginx, for example with an X-Accel-Buffering header; and record token usage and the full response for logging once the stream ends.

On the client, the browser's EventSource only supports GET, so for POST requests with a JSON body I'd use fetch and read the response body stream, parsing the events manually."
@deep
```python
import json
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.post("/chat")
async def chat(req: Request):
    body = await req.json()

    async def events():
        try:
            async for delta in llm.stream(messages=body["messages"]):   # provider SDK stream
                if await req.is_disconnected():
                    break                                                 # stop paying for tokens
                yield f"data: {json.dumps({'type': 'delta', 'text': delta})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception:
            yield f"data: {json.dumps({'type': 'error', 'message': 'generation failed'})}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
```

### [2] Write a minimal eval harness that runs each case several times and reports a pass rate.
@tags evaluation, harness, coding
@hook Cases with checker functions, N trials each, concurrent runs, pass rate with a confidence interval, and per-tag breakdown.
@say
"Each eval case has an input, tags for slicing, like 'refunds' or 'unanswerable', and a checker function that returns pass or fail. That could be a deterministic check, like 'the JSON is valid and the amount equals 49.99', or a call to an LLM judge.

The harness runs every case several times, because outputs are non-deterministic, concurrently with a limit. It records each trial's output and result, then computes the overall pass rate with a confidence interval, the per-tag pass rates, and the share of cases that passed on every trial, which measures consistency. It also records latency and token cost per case.

The results are saved as JSON with the prompt and model version, so two runs can be compared, and printed as a summary table. In CI, a comparison against the main branch's stored results decides whether a regression is bigger than the noise."
@deep
```python
import asyncio, math, statistics
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Awaitable, Callable

@dataclass
class Case:
    id: str
    input: dict
    check: Callable[[str], bool]
    tags: list[str] = field(default_factory=list)

def wilson(p, n, z=1.96):
    if n == 0: return (0.0, 0.0)
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (c - h, c + h)

async def run_eval(cases, system: Callable[[dict], Awaitable[str]], trials=3, concurrency=10):
    sem = asyncio.Semaphore(concurrency)
    async def one(case):
        async with sem:
            out = await system(case.input)
            return case, case.check(out)
    results = await asyncio.gather(*(one(c) for c in cases for _ in range(trials)))

    passes = [ok for _, ok in results]
    rate = statistics.mean(passes)
    by_tag, by_case = defaultdict(list), defaultdict(list)
    for case, ok in results:
        by_case[case.id].append(ok)
        for t in case.tags:
            by_tag[t].append(ok)
    return {
        "pass_rate": rate,
        "ci95": wilson(rate, len(passes)),
        "all_trials_pass": statistics.mean(all(v) for v in by_case.values()),
        "by_tag": {t: statistics.mean(v) for t, v in by_tag.items()},
    }
```
