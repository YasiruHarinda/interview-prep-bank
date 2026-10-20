@section serving | Inference, Serving and LLMOps
@blurb Latency, throughput, GPUs, caching, cost control and running AI systems in production without surprises.

### [1] What latency metrics matter for LLM applications?
@tags latency, metrics, performance
@hook Time to first token for perceived speed, time per output token for streaming speed, end-to-end latency, throughput, and always the tail (p95, p99).
@say
"Time to first token, TTFT, is how long until the first output token arrives. It's dominated by queueing and the prefill of the prompt, so long prompts increase it. It's what makes an app feel responsive when streaming.

Time per output token, also called inter-token latency, is the gap between tokens during generation. It determines reading speed; roughly 20 to 50 milliseconds per token feels fluid. Its inverse is output tokens per second per request.

End-to-end latency is TTFT plus the number of output tokens times time per token, plus everything around the model: retrieval, tool calls, validation and network. For agents with many steps, the step count dominates.

Throughput is total tokens or requests per second the system handles, which drives cost; there's a trade-off, because batching more requests raises throughput but can raise per-request latency.

And I always look at percentiles, p50, p95 and p99, not averages, because LLM latency has long tails from long prompts, long outputs, queueing and provider variability, and users remember the slow ones. I set targets per use case: a chat UI needs a fast TTFT; a background batch job only cares about throughput and cost."

### [2] What are the prefill and decode phases, and why is decoding memory-bound?
@tags inference, gpu, performance
@hook Prefill reads the whole prompt in one parallel pass (compute-bound). Decode makes one token at a time, reloading the weights each step (memory-bandwidth-bound).
@say
"LLM inference has two phases with very different characteristics.

Prefill processes all the prompt tokens in parallel in one forward pass, computing their keys and values for the KV cache. That's large matrix-matrix multiplications that keep the GPU's compute units busy, so it's compute-bound, and it's efficient per token. It determines time to first token.

Decode generates output tokens one at a time. Each step does a forward pass for a single new token per sequence, which means reading all the model's weights, plus the KV cache, from GPU memory to do relatively little arithmetic. The GPU spends most of its time waiting on memory transfers, so decode is memory-bandwidth-bound and the compute units are under-used.

That explains most serving optimisations. Batching many sequences together lets one read of the weights serve many tokens, raising throughput. Quantisation shrinks the bytes that must be read per step. Speculative decoding produces several tokens per expensive forward pass. Grouped-query attention and KV cache compression reduce memory traffic. And some systems run prefill and decode on separate GPU pools, called disaggregated serving, because they need different hardware balances."

### [2] Static vs dynamic vs continuous batching?
@tags batching, throughput, serving
@hook Continuous batching swaps finished sequences out and new ones in at every step, so the GPU never waits for the slowest request.
@say
"Batching processes several requests together so each expensive read of the model's weights produces more useful work.

Static batching collects a fixed batch and runs it until every sequence finishes. Since output lengths vary a lot, short requests finish early and their slots sit idle while the longest one completes, wasting GPU time and making short requests wait.

Dynamic batching groups requests that arrive within a short time window into a batch. It's better for latency, but still has the problem of waiting for the longest sequence in the batch.

Continuous batching, also called in-flight or iteration-level batching, schedules at the level of individual decoding steps: after each step, finished sequences leave the batch and waiting requests join immediately. The GPU stays fully utilised, and short requests aren't held back by long ones. It typically improves throughput several-fold and is standard in modern serving engines like vLLM, SGLang, TensorRT-LLM and Hugging Face TGI.

The tuning trade-off remains: larger batches mean higher throughput and lower cost per token, but more contention, so slightly higher per-token latency; servers expose limits like maximum concurrent sequences and token budgets per step to balance them."

### [2] What is vLLM, and what does PagedAttention solve?
@tags vllm, pagedattention, serving
@hook vLLM is a high-throughput serving engine. PagedAttention stores the KV cache in small fixed-size pages, like OS virtual memory, so almost no memory is wasted.
@say
"vLLM is an open-source inference and serving engine for LLMs, known for high throughput. Its key innovation was PagedAttention.

The problem: the KV cache for each sequence grows as tokens are generated, and the final length is unknown. Earlier systems pre-allocated a contiguous memory block for the maximum possible length per request, wasting most of it through over-reservation and fragmentation, which limited how many requests fit on a GPU.

PagedAttention borrows the idea of virtual memory paging from operating systems. The KV cache is split into small fixed-size blocks that can live anywhere in GPU memory, and each sequence has a block table mapping its logical positions to physical blocks, allocated on demand as it grows. Waste drops to almost nothing, so many more sequences fit in a batch, which directly raises throughput. It also enables sharing blocks between sequences, which is great for parallel sampling and for sharing a common prompt prefix.

vLLM combines this with continuous batching, prefix caching, quantisation support, multi-LoRA serving, tensor parallelism and an OpenAI-compatible API, which is why it's a common default for self-hosting open models. Alternatives include SGLang, TensorRT-LLM and TGI, and for local use, llama.cpp and Ollama."

### [2] What is quantisation? Compare INT8, INT4 and FP8, and methods like GPTQ and AWQ.
@tags quantisation, efficiency, inference
@hook Store weights (and sometimes activations) with fewer bits. Half or a quarter of the memory, faster decoding, small quality loss if done well.
@say
"Quantisation represents model weights, and sometimes activations and the KV cache, with fewer bits than the usual 16-bit floats. Going to 8 bits halves the memory; 4 bits quarters it. Since decoding is memory-bandwidth-bound, smaller weights also mean faster generation, and a model that needed two GPUs may fit on one.

The common formats: INT8 and FP8 usually lose very little quality; FP8 is well supported on recent GPUs and is used for both inference and increasingly training. INT4 and 4-bit formats save more memory, with a small but sometimes noticeable quality drop, more so on reasoning, maths and code, and on smaller models.

Methods: post-training quantisation methods like GPTQ use a small calibration dataset to quantise weights layer by layer while minimising the error introduced. AWQ, activation-aware weight quantisation, protects the small fraction of weights that matter most, based on activation magnitudes. GGUF is the file format used by llama.cpp for running quantised models efficiently on CPUs and consumer hardware, with many quantisation levels. Quantisation-aware training gives better quality at very low bit-widths, at the cost of extra training.

My rule: always evaluate the quantised model on my own eval set, not just perplexity, because degradation can be uneven across tasks."

### [3] How does speculative decoding work?
@tags speculative decoding, latency
@hook A small draft model guesses several tokens ahead; the big model checks them all in one pass and keeps the ones it agrees with. Same output, fewer slow steps.
@say
"Speculative decoding speeds up generation without changing the output distribution.

Decoding is slow because each token needs a full forward pass of the big model, and that pass is memory-bound, so it has spare compute capacity. Speculative decoding exploits that. A small, fast draft model proposes the next several tokens, say four. Then the big target model processes all of them in a single forward pass, in parallel, computing what it would have generated at each position. Tokens are accepted from left to right as long as they agree with the target model, using a rejection sampling scheme that guarantees the final output follows exactly the target model's distribution. At the first disagreement, the target model's own token is used, and drafting continues from there.

If the draft model guesses well, each expensive pass yields several tokens, giving roughly 2 to 3 times faster generation. The speed-up depends on the acceptance rate, which is high for predictable text like code or structured output.

Variants avoid needing a separate draft model: Medusa adds extra prediction heads to the main model, EAGLE drafts using the model's own hidden features, and n-gram or prompt-lookup decoding copies likely continuations from the prompt, which works well for editing tasks. The trade-off is extra memory and complexity, and less benefit at high batch sizes where the GPU is already compute-bound."

### [2] What is prompt caching, and how do you design for it?
@tags prompt caching, cost, latency
@hook Reuse the computed KV cache for an identical prompt prefix. Put stable content first, keep it byte-identical, and put variable content last.
@say
"Prompt caching, or prefix caching, reuses the work done for the beginning of a prompt that was already seen recently. When the model processes a prompt, it computes keys and values for every token; if a new request starts with exactly the same tokens, the server can reuse those cached keys and values instead of recomputing them. That cuts the cost of the cached input tokens dramatically, and reduces time to first token, especially for long prompts. Major API providers offer it with discounted pricing for cached tokens, and self-hosted engines like vLLM support automatic prefix caching.

Designing for it is about ordering. Put the stable parts first: system instructions, tool definitions, few-shot examples, and large reference documents. Put variable parts last: the user's question and recent turns. The cached prefix must be exactly identical, so even a timestamp or a randomly ordered tool list at the top breaks the cache for everything after it.

It's especially valuable for long system prompts used on every request, multi-turn conversations, where each turn extends the previous prompt, agents, which resend a growing context every step, and repeated questions over the same long document. Caches expire after a few minutes of inactivity, so I monitor the cache hit rate as a cost metric."

### [2] What is semantic caching, and what are its risks?
@tags semantic caching, cost
@hook Return a stored answer when a new question is similar enough to an old one. Big savings for repetitive traffic, but a wrong match serves a wrong answer.
@say
"Semantic caching stores previous questions and answers with an embedding of each question. When a new request comes in, the system embeds it, searches the cache for a sufficiently similar past question above a threshold, and if found, returns the stored answer without calling the LLM. That's much faster and cheaper for workloads with many near-duplicate questions, like FAQs or popular support topics.

The risks: a false hit returns an answer to a different question. 'How do I cancel my order?' and 'How do I cancel my subscription?' may look similar in embedding space but need different answers. Personalised or context-dependent answers, which depend on the user's account, permissions or conversation history, shouldn't be shared between users at all. And cached answers go stale when the underlying information changes.

So I use it carefully: a conservative similarity threshold tuned on labelled pairs; cache only non-personalised, factual answers, with the cache key including relevant context like language, product or user segment; TTLs and invalidation when source documents change; and monitoring of hit rate and quality on cached responses. Exact-match caching of normalised queries is a safer first step, and provider prompt caching is complementary, not a substitute."

### [2] How do you reduce the cost of an LLM application?
@tags cost optimisation, routing
@hook Measure cost per successful task, then route to the cheapest model that passes evals, cache aggressively, shrink tokens, batch offline work, and cut agent steps.
@say
"First I measure: cost per request and, more importantly, cost per successful outcome, broken down by feature, model and token type. Usually a few features or prompt components dominate.

Then the main levers. Model routing: send each request to the cheapest model that handles it well. A classifier or rules route simple requests to a small model and hard ones to a frontier model, or a cascade tries the cheap model first and escalates when confidence or validation fails. This is often the biggest win.

Caching: provider prompt caching for stable prefixes, exact-match and carefully tuned semantic caching for repeated questions.

Fewer tokens: tighter prompts, fewer but better retrieved chunks through reranking, compacted history, concise output formats and sensible max-token limits, remembering that output tokens usually cost more than input.

Batch processing: providers offer large discounts for asynchronous batch APIs, ideal for offline jobs like classification, evals and enrichment.

Fewer calls: for agents, fewer steps through better tools and planning; for pipelines, merging unnecessary steps.

Fine-tuning or distillation: a small fine-tuned model can replace a large prompted one for high-volume narrow tasks.

And at very high steady volume, self-hosting open models can be cheaper. Every change is validated on the eval set, so savings don't silently cost quality."

### [2] Quality improved, but latency and cost became unacceptable. What do you do?
@tags trade-offs, latency, cost
@hook Define the budget and the acceptable quality loss, break latency down by stage including the tail, then try targeted fixes and compare them all on the same eval set.
@say
"First I make the trade-off explicit with the product owner: the latency target, say p95 under three seconds, the cost budget per successful task, and how much quality loss, if any, is acceptable.

Then I profile. I break end-to-end latency and cost down by stage using traces: retrieval, each model call, tool calls, and how many steps or retries happen, looking at p95 and p99, not just averages. Usually one or two things dominate, like an extra verification call, a large model used for a simple step, long prompts, or an agent taking too many steps.

Then I try targeted interventions: route simple requests or sub-steps to a smaller model; shorten the context with better retrieval and compaction; enable prompt caching; run independent steps in parallel; stream the response so perceived latency drops; reduce agent turns with better tools or a fixed workflow for common paths; cap reasoning effort for easy cases; and cache frequent answers.

Crucially, I compare every option on the same eval set, plotting quality against latency and cost, so we choose a point on the trade-off curve deliberately. Often a combination, like routing plus caching plus streaming, recovers most of the quality gain at a fraction of the cost."

### [1] Why stream LLM responses, and how?
@tags streaming, ux, sse
@hook Users see words in under a second instead of waiting for the full answer. Stream tokens over server-sent events, and handle partial structured output carefully.
@say
"Generation can take many seconds for long answers, but the first tokens arrive quickly. Streaming shows text as it's generated, so perceived latency drops from the full generation time to the time to first token. Users can start reading, and cancel if it's going wrong, which also saves cost.

Technically, provider APIs stream tokens using server-sent events: one long HTTP response with incremental events. My backend consumes that stream and forwards it to the client, usually also over SSE or a WebSocket, through every layer, making sure proxies and load balancers don't buffer the response, and handling client disconnects by cancelling the upstream request.

Some complications: post-generation checks, like safety filtering or citation validation, can't wait for the end, so I either check incrementally, stream with the ability to retract, or only stream for low-risk outputs. Structured output arrives as partial JSON, so I use a partial JSON parser or stream only the human-readable fields. And for agents, I stream progress events, like 'searching the knowledge base', between tool calls, so long tasks feel alive. Logging and token accounting happen once the stream completes."

### [2] Self-hosting open models vs using an API provider: how do you decide?
@tags self-hosting, tco, infrastructure
@hook Compare total cost of ownership and constraints, not just price per token. APIs win at low or spiky volume; self-hosting can win at high, steady volume or with strict data rules.
@say
"I compare on four dimensions.

Quality: does an open model that I can host meet the bar on my eval set? For many narrow tasks yes, for frontier reasoning or agentic work often not.

Cost: APIs charge per token with no idle cost, which is ideal for low, spiky or uncertain volume. Self-hosting means paying for GPUs whether they're busy or not, plus engineering time for serving, scaling, monitoring and upgrades. Self-hosting becomes cheaper only at high, steady utilisation. I'd model it as cost per million tokens at my expected traffic, including realistic GPU utilisation and staff time, not just the GPU rental price.

Control and compliance: data residency, on-premise or air-gapped requirements, and regulatory constraints can make self-hosting necessary, though cloud-hosted API models in your own cloud region often satisfy these too.

Operational capability: does the team have the MLOps skills to run GPU infrastructure reliably, with autoscaling, failover and security patching?

Often the answer is hybrid: APIs for complex, lower-volume tasks, and a self-hosted or fine-tuned small model for high-volume, simple tasks, all behind a gateway so routing can change without application changes."

### [2] How much GPU memory do you need to serve a 70-billion-parameter model?
@tags gpu, memory, capacity planning
@hook Weights: parameters times bytes per parameter (140 GB in 16-bit). Then add the KV cache for your concurrency and context, plus overhead.
@say
"Start with the weights: number of parameters times bytes per parameter. At 16-bit, 2 bytes each, 70 billion parameters is about 140 gigabytes. At 8-bit, about 70 gigabytes. At 4-bit, about 35 to 40 gigabytes including quantisation overhead.

Then the KV cache, which scales with concurrent sequences and context length. For a 70B-class model with grouped-query attention, roughly 80 layers, 8 KV heads and a head size of 128, the cache is about 320 kilobytes per token at 16-bit. So 32 concurrent users with 4,000 tokens each is around 40 gigabytes, and long contexts or high concurrency can exceed the weights' size.

Plus runtime overhead and activations, maybe 10 to 20 percent.

So in 16-bit, a 70B model needs at least two 80-gigabyte GPUs just for weights, realistically more for useful concurrency, using tensor parallelism. In 8-bit, one or two GPUs. In 4-bit it fits on a single 48 or 80-gigabyte GPU with room for some KV cache.

I'd present it as a formula, then validate with the serving engine's actual memory reports and a load test, because concurrency targets, context lengths and quantisation choices change the answer a lot."
@deep
```text
weights_GB   ~= params_in_billions x bytes_per_param
                 70 x 2 (FP16/BF16) = 140 GB | 70 x 1 (INT8/FP8) = 70 GB | 70 x 0.5 (4-bit) = 35 GB (+ overhead)

kv_per_token ~= 2 (K and V) x layers x kv_heads x head_dim x bytes
             =  2 x 80 x 8 x 128 x 2 bytes = 327,680 bytes ~= 0.33 MB

kv_total     ~= kv_per_token x context_tokens x concurrent_sequences
             =  0.33 MB x 4,096 x 32 ~= 43 GB
```

### [2] How do you handle provider rate limits, outages and failover?
@tags reliability, gateway, rate limits
@hook Put an LLM gateway in front: retries with backoff and jitter for transient errors, fallback models or providers, client-side rate limiting and queues, and circuit breakers.
@say
"I put a thin LLM gateway layer between the application and the providers, either a library or a service, so these concerns are handled consistently.

Rate limits: providers limit requests and tokens per minute. I track usage, apply client-side rate limiting and queueing so we smooth bursts instead of hitting 429 errors, prioritise interactive traffic over batch work, and request higher limits or reserved capacity ahead of launches.

Retries: for 429s, 5xx errors and timeouts, retry with exponential backoff plus jitter, respecting retry-after headers, with a maximum attempt count. I never retry on validation or 400-type errors, which won't succeed.

Failover: a fallback chain, like the same model through another cloud region or provider, then a different model, defined per use case and validated on the eval set, because prompts don't always transfer perfectly between models.

Circuit breakers: if a provider is failing consistently, stop sending traffic for a short period and use the fallback, instead of piling on retries.

Timeouts: separate timeouts for time to first token and total generation, so stuck streams are cut.

And graceful degradation in the product: a cached or simpler response, or a clear message and handoff to a human, rather than an endless spinner. All of it is monitored with alerts on error and fallback rates."

### [2] A production incident started right after a model or prompt change. How do you respond?
@tags incident response, llmops
@hook Protect users first (roll back or disable), preserve the traces, reproduce against the exact versions, add the failing slice to the evals, canary the fix with abort thresholds.
@say
"First, protect users. Because prompts and model versions are versioned configuration, I roll back to the last known good version, or disable the affected capability, switch to a fallback, or route to human review, depending on severity. Mitigation comes before diagnosis.

Second, preserve evidence: keep the traces of affected requests, with the exact prompt version, model ID, parameters, retrieved context and outputs, and establish the timeline of what changed and when.

Third, reproduce: replay the failing inputs against the new and old versions, to confirm the change caused it and understand which slice of inputs is affected, like a specific language, a long-context case or a tool-use path.

Fourth, add those failing cases to the eval suite as a new slice, and work out why the existing evals missed it, which usually reveals a coverage gap.

Fifth, fix and release carefully: validate on the expanded eval set, then canary to a small percentage of traffic with explicit abort thresholds on the relevant metrics, before full rollout.

Finally, a blameless post-incident review with a clear timeline and a process change, like requiring that slice in the CI eval gate, or adding an online monitor that would have caught it within minutes."

### [2] What should you monitor for an LLM application in production?
@tags observability, monitoring, llmops
@hook Operational metrics (latency, errors, tokens, cost), quality signals (evals on sampled traces, user feedback), safety signals, and drift in what users ask.
@say
"I monitor four groups of signals.

Operational: request volume, latency percentiles including time to first token, error and timeout rates by provider and model, rate-limit hits, fallback usage, token usage and cost per request and per feature, and cache hit rates.

Quality: automated graders running on a sample of production traces, like faithfulness, format validity and policy compliance; user feedback, explicit thumbs and implicit signals like retries, rephrasing, abandonment, escalations and acceptance of suggestions; and downstream business metrics, like resolution rate.

Safety and security: guardrail triggers, refusals, detected prompt injection attempts, PII detections, and unusual tool usage by agents.

Drift: changes in the distribution of user inputs, like new topics, languages or longer queries, often detected by clustering embeddings of incoming queries, and changes in retrieval scores, which can signal stale or missing content.

All of it is built on traces that link each request to its prompt and model version, so any dashboard spike can be traced to specific examples. Alerts focus on user-facing symptoms, and sampled traces go into regular error analysis sessions."

### [2] What is data drift vs concept drift, and how do you detect them?
@tags drift, monitoring, mlops
@hook Data drift: the inputs change. Concept drift: the relationship between inputs and the right answer changes. Monitor input distributions and, where possible, ground-truth performance.
@say
"Data drift, or covariate shift, is when the distribution of inputs changes compared with what the model was trained or evaluated on. For example, a fraud model sees a new payment method, or a support assistant suddenly gets questions about a newly launched product.

Concept drift is when the relationship between inputs and the correct output changes, even if the inputs look similar. For example, a refund policy changes, so the same question now has a different correct answer, or fraudsters change tactics so previously safe patterns become risky.

Detection: for data drift, compare distributions of features or input embeddings between a reference window and recent traffic, using statistical tests or metrics like population stability index or KL divergence, and for text, track new clusters of topics. For concept drift, you need ground truth or proxies: delayed labels, human review of samples, user feedback and outcome metrics declining while inputs look stable.

Responses: update the knowledge base for RAG systems, which handles many 'concept' changes for LLM apps; retrain or fine-tune classic models on recent data; update prompts and eval sets to cover the new patterns; and set alerts so drift is noticed in days, not months."

### [2] What does MLOps involve for teams that train their own models?
@tags mlops, model registry, pipelines
@hook Version everything (data, code, models), track experiments, automate training and evaluation pipelines, gate deployments, and monitor in production.
@say
"MLOps applies DevOps discipline to machine learning, where the system depends on data and trained models as well as code.

Core practices: Versioning data, code, configuration and models together, so any model can be reproduced, with tools like DVC or lakehouse table versioning for data. Experiment tracking, logging parameters, metrics and artefacts for every training run, with tools like MLflow or Weights and Biases. A model registry that stores approved models with their lineage, evaluation results and stage, like staging or production. Automated pipelines for data validation, feature computation, training, evaluation and packaging, triggered on schedule or on new data, using orchestrators like Airflow, Kubeflow or cloud ML pipelines. Feature stores in some setups, to keep training and serving features consistent and avoid training-serving skew.

Deployment uses the same safe release patterns as software: shadow deployments, where the new model scores live traffic without affecting users, canaries and A/B tests, with automatic rollback. And monitoring for drift, performance and data quality closes the loop by triggering retraining.

For LLM applications built on API models, much of this translates into LLMOps: versioning prompts and model configurations, eval pipelines, tracing and the same release gates."
