@section llm | Transformers and LLM Internals
@blurb Attention, tokens, decoding, the KV cache and why models hallucinate. Explain the machine you build on.

### [1] Explain the transformer architecture at a high level.
@tags transformers, architecture
@hook Tokens become vectors, attention lets every token look at the others, feed-forward layers process each one, repeat N times, predict the next token.
@say
"A transformer turns text into tokens, maps each token to an embedding vector, and adds information about position. Then it passes these vectors through a stack of identical blocks.

Each block has two main parts. First, multi-head self-attention, where every token gathers information from the other tokens in the context, weighted by relevance. Second, a feed-forward network applied to each token independently, which transforms that gathered information; a lot of the model's stored knowledge lives in these layers. Each part is wrapped with a residual connection and layer normalisation, which keeps training stable even with dozens of layers.

After the final block, a linear layer projects each token's vector onto the vocabulary to get logits, and softmax turns them into a probability distribution over the next token.

Most modern LLMs are decoder-only: they use causal attention, so each token can only attend to earlier tokens, and they're trained to predict the next token. The key advantages over earlier RNNs are that all positions are processed in parallel during training, and any token can attend directly to any other, no matter how far apart."
@deep
```text
"The cat sat" -> tokens -> embeddings (+ position info, e.g. RoPE)
     |
     v  x N blocks
  [ RMSNorm -> masked multi-head self-attention -> + residual ]
  [ RMSNorm -> feed-forward (e.g. SwiGLU)       -> + residual ]
     |
     v
  final norm -> linear to vocab size -> softmax -> P(next token)
```

### [2] How does self-attention work? Why divide by the square root of d_k?
@tags attention, transformers, math
@hook Each token asks a question (query), every token advertises a label (key) and carries content (value). Softmax of query-key match decides how much of each value to take.
@say
"For each token, the model computes three vectors by multiplying its embedding with learned weight matrices: a query, a key and a value. Intuitively, the query is what this token is looking for, the key is what each token offers, and the value is the information it passes along.

To update a token, we take the dot product of its query with every token's key, which gives a relevance score for each pair. We divide those scores by the square root of the key dimension, apply softmax to turn them into weights that sum to one, and take the weighted sum of the value vectors. In matrix form: softmax of Q times K-transpose over root d_k, times V.

The scaling matters because dot products of high-dimensional vectors grow in magnitude with the dimension. Large scores push softmax into a nearly one-hot, saturated region where gradients are tiny, which hurts training. Dividing by root d_k keeps the variance of the scores around one.

In a decoder, a causal mask sets the scores for future positions to minus infinity before the softmax, so each token can only attend to itself and earlier tokens. That's what makes next-token prediction training valid."
@deep
```python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)      # numerical stability
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)

def causal_self_attention(X, Wq, Wk, Wv):
    """X: (seq_len, d_model)"""
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    d_k = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)              # (seq, seq)
    mask = np.triu(np.ones_like(scores), k=1).astype(bool)
    scores[mask] = -np.inf                       # no peeking at the future
    weights = softmax(scores, axis=-1)
    return weights @ V                           # (seq, d_k)
```

### [2] Why use multi-head attention?
@tags attention, transformers
@hook Several smaller attention heads in parallel, each free to track a different kind of relationship.
@say
"Instead of one attention operation with full-size vectors, multi-head attention splits the model dimension into several heads, say 32 heads of size 128 in a 4,096-dimensional model. Each head has its own query, key and value projections and computes attention independently. The heads' outputs are concatenated and mixed with a final output projection.

The benefit is that different heads can specialise in different relationships at the same time: one might track syntax, like which verb goes with which subject, another coreference, like what 'it' refers to, another position-based patterns like the previous token. A single head would have to average all those signals into one weighting.

The total compute is about the same as one big head, because each head works in a smaller dimension. For inference efficiency, many modern models use grouped-query attention, where several query heads share the same key and value heads, which shrinks the KV cache dramatically with little quality loss."

### [2] Why do transformers need positional encodings? What is RoPE?
@tags positional encoding, rope
@hook Attention by itself is order-blind. Positional information tells the model "dog bites man" from "man bites dog". RoPE encodes position by rotating queries and keys.
@say
"Self-attention treats its input as a set: if you shuffle the tokens, each token's attention output is the same, just shuffled. Without positional information, 'dog bites man' and 'man bites dog' would look identical. So we inject position.

The original transformer added fixed sinusoidal vectors to the embeddings, and models like early GPT and BERT used learned absolute position embeddings. Absolute schemes generalise poorly beyond the training length.

Most modern LLMs use RoPE, rotary position embeddings. Instead of adding a vector, RoPE rotates the query and key vectors by an angle proportional to their position, in many 2D planes at different frequencies. The neat property is that the dot product between a query and a key then depends only on their relative distance, so the model naturally learns relative position.

RoPE also enables context extension: techniques like position interpolation, NTK-aware scaling and YaRN adjust the rotation frequencies so a model trained on, say, 8,000 tokens can be extended to much longer contexts with a modest amount of extra training."

### [1] Encoder-only vs decoder-only vs encoder-decoder models?
@tags architectures, bert, gpt, t5
@hook Encoders read everything both ways (BERT: understanding, embeddings). Decoders generate left to right (GPT: chat). Encoder-decoders map input to output (T5: translation).
@say
"Encoder-only models, like BERT, use bidirectional attention, so every token sees the whole input in both directions. They're trained with masked language modelling, predicting hidden words. They're excellent at understanding tasks: classification, named entity recognition, and producing embeddings, and many retrieval embedding models and rerankers are encoder-based.

Decoder-only models, like GPT, Claude, Llama and Gemini, use causal attention, seeing only earlier tokens, and are trained on next-token prediction. They generate text naturally, and with enough scale and instruction tuning they handle almost any task through prompting, which is why they dominate today.

Encoder-decoder models, like T5 and the original transformer, encode the full input bidirectionally, then a decoder generates the output while attending to the encoded input through cross-attention. They're strong for sequence-to-sequence tasks like translation and summarisation, and are used in some speech models like Whisper.

The industry consolidated on decoder-only largely because it's simple, scales well, and one objective covers every task."

### [1] What is tokenisation, and why does it matter for AI engineers?
@tags tokenization, bpe, cost
@hook Models read sub-word tokens, not characters or words. Tokens drive cost, context limits, multilingual fairness and some famous failure modes.
@say
"Tokenisation splits text into the units a model actually processes. Modern LLMs use sub-word tokenisers like byte-pair encoding: common words become one token, rarer words are split into pieces, and anything can fall back to bytes, so there are no unknown words. A typical English rule of thumb is about four characters, or three quarters of a word, per token, with vocabularies of roughly 30,000 to 200,000 tokens.

It matters practically in several ways. Cost and limits: APIs bill per token and context windows are measured in tokens, so verbose prompts, JSON formatting and retrieved chunks all have a token price. Languages: many non-English languages, including Sinhala and Tamil, often take several times more tokens for the same meaning, so they cost more and fit less in context. Failure modes: models see tokens, not letters, which is why they historically struggled to count letters in a word, reverse strings, or do digit-level arithmetic. And consistency: different models use different tokenisers, so token counts aren't portable between providers.

So I always measure token counts with the provider's tokeniser or token-counting API when estimating cost, rather than counting words."

### [2] How is a modern LLM trained, from scratch to a chat assistant?
@tags training pipeline, rlhf, pretraining
@hook Pretrain on trillions of tokens to learn language and knowledge, then post-train with instructions, preferences and reinforcement learning to be helpful, safe and good at reasoning.
@say
"There are two big phases.

Pretraining: the model learns to predict the next token on a huge, filtered corpus of trillions of tokens of web text, books, code and more. That's where it acquires language, world knowledge and general skills. It's by far the most compute-intensive phase. Many labs add a mid-training stage with higher-quality data, like curated code, maths and longer documents, often to extend the context length.

Post-training turns a raw text predictor into an assistant. Supervised fine-tuning trains on high-quality examples of instructions and ideal responses, teaching the format and behaviour of a helpful assistant. Then preference tuning aligns it with human judgement: in RLHF, humans compare pairs of responses, a reward model is trained on those preferences, and the model is optimised with reinforcement learning to score highly. DPO achieves a similar effect directly from preference pairs, without a separate reward model. AI-generated feedback against a written set of principles is also used to scale this up.

For reasoning models, there's an additional stage of reinforcement learning with verifiable rewards: the model attempts maths, coding and logic problems, and gets rewarded when answers can be checked as correct. That teaches it to produce long chains of reasoning, try approaches and correct itself. Safety training runs throughout post-training."

### [1] How does an LLM actually generate text?
@tags inference, decoding
@hook One token at a time: predict a distribution, pick a token, append it, run again. That loop is why output length drives latency.
@say
"Generation is autoregressive. The prompt is tokenised and run through the model, which outputs logits, a score for every token in the vocabulary, at the last position. Softmax turns those into probabilities, a decoding strategy picks one token, and that token is appended to the input. Then the model runs again to predict the next token, and so on, until it produces an end-of-sequence token or hits a maximum length.

There are two phases with different performance characteristics. Prefill processes the whole prompt in parallel, which is compute-heavy but fast per token, and it determines the time to the first token. Decode generates output tokens one at a time, each step depending on the previous one, which is limited by memory bandwidth and determines tokens per second.

That's why output length dominates latency and cost: generating 1,000 tokens means 1,000 sequential steps, while reading 1,000 prompt tokens happens in one parallel pass. It's also why the KV cache exists: to avoid recomputing the attention keys and values for all previous tokens at every step."

### [1] Explain temperature, top-k and top-p sampling.
@tags decoding, sampling
@hook Temperature sharpens or flattens the distribution. Top-k keeps the k likeliest tokens. Top-p keeps the smallest set covering p of the probability.
@say
"After the model produces probabilities for the next token, decoding settings control how a token is chosen.

Greedy decoding always takes the most likely token: deterministic, but often repetitive and dull.

Temperature divides the logits before softmax. A temperature below 1 sharpens the distribution, making the likely tokens even more likely, which is more focused and consistent. Above 1 flattens it, making output more diverse and creative but riskier. Temperature 0 effectively means greedy.

Top-k sampling keeps only the k most likely tokens and samples among them. Top-p, or nucleus sampling, keeps the smallest set of tokens whose probabilities add up to p, like 0.9, so the candidate set adapts: narrow when the model is confident, wider when it's uncertain.

In practice: for extraction, classification, code and anything that needs to be consistent, I use low temperature. For brainstorming or creative writing, higher. I usually tune temperature or top-p, not both aggressively. Also, even at temperature 0, outputs aren't guaranteed identical across calls, because of batching and floating-point effects on the server, so systems must tolerate some non-determinism. Some newer reasoning models fix or restrict these parameters."

### [2] What limits the context window, and what is "lost in the middle"?
@tags context window, long context
@hook Attention cost, KV cache memory and training length limit context. And models use the start and end of long inputs better than the middle.
@say
"The context window is the maximum number of tokens, prompt plus output, the model can handle in one call. It's limited by three things: attention compute grows quadratically with sequence length in standard attention; the KV cache memory grows linearly with length and becomes the main serving bottleneck; and the model must be trained, or adapted, to handle long positions well.

Context windows have grown to hundreds of thousands or even millions of tokens, but having a large window doesn't mean the model uses all of it equally well. Research showed the 'lost in the middle' effect: models are better at using information at the beginning and end of a long context than in the middle. Newer models have improved a lot, but quality still tends to degrade as context grows, and long prompts cost more and take longer to process.

So as an engineer, I treat context as a scarce resource. I retrieve and include only the relevant chunks rather than dumping everything, put the most important instructions and evidence near the start or end, summarise or compact old conversation turns, and test performance on our own long-context cases rather than trusting the advertised maximum."

### [2] What is the KV cache, and why does it matter?
@tags inference, kv cache, memory
@hook During generation, keep each past token's attention keys and values instead of recomputing them. Faster decoding, but it eats GPU memory.
@say
"When a decoder generates token number 500, attention needs the keys and values of all 499 previous tokens. Without caching, the model would recompute them for the entire sequence at every step, which is hugely wasteful. The KV cache stores each layer's key and value vectors for every token once they're computed, so each new step only computes the new token's query, key and value and attends over the cached ones. That turns generation from roughly quadratic recomputation into linear work per step.

The cost is memory. The cache size is two, for keys and values, times the number of layers, times the number of KV heads, times the head dimension, times the sequence length, times the batch size, times the bytes per value. For a large model with long contexts and many concurrent users, the KV cache can be bigger than the model weights and becomes the main limit on how many requests a GPU can serve at once.

That's why so many optimisations target it: grouped-query and multi-query attention reduce the number of KV heads; PagedAttention in vLLM manages the cache in pages like virtual memory to avoid fragmentation; KV cache quantisation; and prefix caching, which reuses the cached keys and values for a shared prompt prefix across requests, which is what makes prompt caching in provider APIs cheaper and faster."
@deep
Back-of-the-envelope KV cache size:

`bytes = 2 x layers x kv_heads x head_dim x seq_len x batch x bytes_per_value`

Example: 80 layers, 8 KV heads (GQA), head_dim 128, 32k tokens, batch 1, FP16 (2 bytes):
`2 x 80 x 8 x 128 x 32768 x 2 bytes = about 10.7 GB` for a single 32k-token sequence. Without GQA (64 KV heads) it would be 8x larger.

### [3] Why is attention quadratic, and how do FlashAttention, GQA and sliding windows help?
@tags attention, efficiency, flashattention
@hook Every token attends to every token: n squared scores. FlashAttention makes it memory-efficient and fast; GQA shrinks the cache; sliding windows cap how far tokens look.
@say
"Standard self-attention computes a score for every pair of tokens, so for a sequence of n tokens it's an n by n matrix: compute and, naively, memory grow quadratically. Doubling the context quadruples the attention cost.

FlashAttention doesn't change the maths; it's an exact attention algorithm that's IO-aware. It splits the computation into tiles that fit in the GPU's fast on-chip SRAM and computes softmax incrementally, so the full n by n matrix is never written to slow GPU memory. That makes memory linear in sequence length and gives large speedups, and it's now standard in training and inference.

Grouped-query attention and multi-query attention reduce the number of key and value heads shared by the query heads. That shrinks the KV cache and memory bandwidth during decoding, which is where inference is bottlenecked.

Sliding window, or local attention, limits each token to attending to a fixed window of recent tokens, making cost linear; models often interleave local and global attention layers so information still propagates across the whole context. There are also sparse attention patterns, and alternative architectures like state space models and hybrids, which aim for linear scaling on very long sequences."

### [3] What is a Mixture of Experts model?
@tags moe, architecture, efficiency
@hook Many expert feed-forward networks per layer, but a router sends each token to only a few. Huge total capacity, small compute per token.
@say
"In a Mixture of Experts transformer, the single feed-forward layer in each block is replaced by many parallel feed-forward networks called experts, plus a small learned router. For each token, the router picks a few experts, often 2 out of dozens or even hundreds, and the token is processed only by those, with their outputs combined by the router's weights.

The benefit is decoupling total parameters from compute per token. A model can have hundreds of billions of total parameters, so a lot of capacity for knowledge, while each token only activates a fraction of them, so inference compute is closer to that of a much smaller dense model. Many frontier and open-weight models use this design.

The trade-offs: all experts still need to be in memory, so serving needs lots of GPU memory even though compute is lower; training needs load-balancing losses so the router doesn't overuse a few experts; and serving at scale needs expert parallelism across GPUs, with communication overhead. So 'active parameters' and 'total parameters' are both worth asking about when comparing MoE models."

### [2] What are scaling laws?
@tags scaling laws, chinchilla
@hook Loss falls predictably as a power law with more parameters, data and compute. Chinchilla showed many models were undertrained on data.
@say
"Scaling laws are empirical findings that a language model's loss decreases smoothly and predictably, as a power law, as you increase model size, training data and compute. That predictability lets labs forecast the performance of a huge training run from smaller experiments and decide how to spend a compute budget.

The Chinchilla paper from DeepMind in 2022 refined this: for a fixed compute budget, the optimal allocation scales parameters and training tokens roughly equally, around 20 tokens per parameter. Many earlier models were too big and undertrained on data.

In practice, labs now train smaller models on far more tokens than Chinchilla-optimal, sometimes trillions of tokens for models of a few billion parameters, because inference cost depends on model size: a smaller model trained longer is cheaper to serve for its whole life.

The more recent development is test-time compute scaling: reasoning models get better by thinking longer at inference, spending more tokens on reasoning before answering. So performance now scales along pretraining, post-training reinforcement learning and inference-time compute."

### [1] Why do LLMs hallucinate, and how do you reduce it?
@tags hallucination, reliability
@hook The model is trained to produce plausible text, not verified truth. Ground it in sources, let it say "I don't know", and verify outputs.
@say
"An LLM generates the most plausible continuation based on patterns learned in training. It has no built-in mechanism to check facts against reality, and training has historically rewarded confident answers over admitting uncertainty, a bit like a student who guesses on a multiple-choice test because guessing scores better than leaving it blank. So when its knowledge is missing, outdated or ambiguous, it can produce fluent, confident, wrong statements. Hallucinations are more likely for rare facts, precise numbers, citations, recent events and long chains of reasoning.

To reduce them in a product, I use several layers. Grounding: provide the relevant facts in context with RAG and instruct the model to answer only from the provided sources and to cite them. Permission to abstain: explicitly allow 'I don't know' or 'not in the documents', and reward it in evals. Tools: use calculators, code execution, search or database lookups for facts and arithmetic instead of model memory. Structure: constrained outputs and validation of fields, like checking that a quoted policy number actually exists. Verification: a second check that every claim is supported by the retrieved text. And for high-stakes cases, human review.

And measure it: track a faithfulness or groundedness metric in the eval suite, so you know whether changes make it better or worse."

### [2] What are reasoning models, and when should you use them?
@tags reasoning, test-time compute, chain of thought
@hook Models trained to think step by step before answering, spending more tokens to get harder problems right. Better accuracy, higher cost and latency.
@say
"Reasoning models are LLMs trained, mostly with reinforcement learning on verifiable problems, to produce an extended chain of thought before giving a final answer. They decompose the problem, try approaches, check their work and backtrack. This is test-time compute: spending more computation at inference to get better answers. Many APIs let you control the thinking budget or effort level.

They shine on tasks that need multi-step reasoning: hard maths, complex coding and debugging, planning, multi-hop analysis, and agentic tasks where the model must decide what to do next. On simple tasks, like extraction, classification, short rewriting or quick chat, they add latency and cost with little benefit.

So I treat reasoning as a dial, not a default. I route easy requests to fast, cheap models or low thinking budgets, and send hard ones to a reasoning model or a higher budget, and I decide based on our evals rather than assumptions. One more practical point: with reasoning models, I give clear goals and constraints rather than micromanaging step-by-step instructions, because they plan better on their own."

### [2] What is in-context learning? Why does few-shot prompting work?
@tags in-context learning, few-shot
@hook The model picks up a task from examples in the prompt, with no weight updates. It's pattern completion at scale.
@say
"In-context learning is an LLM's ability to perform a task from instructions and examples given in the prompt, without any change to its weights. If I show three examples of support tickets labelled with categories, the model labels the fourth correctly.

It works because pretraining on vast amounts of text exposes the model to countless patterns of 'here are some examples, now continue the pattern', and large models learn to infer the underlying task from the context. Research suggests attention mechanisms can implement something like a simple learning algorithm over the examples inside the forward pass.

Practically, few-shot examples are powerful for format and style, edge-case handling and ambiguous labels. But they cost tokens on every call, the model can over-copy surface features of the examples, and the choice and order of examples affects results. So I choose diverse, representative examples, including tricky edge cases, sometimes retrieve the most similar examples dynamically for each input, and test whether they actually help on the eval set, since strong modern models often do well zero-shot with clear instructions."

### [2] How are embedding models trained, and how do they differ from generative LLMs?
@tags embeddings, contrastive learning, retrieval
@hook Generative models predict the next token. Embedding models are trained contrastively to place matching texts close together and non-matching ones far apart.
@say
"A generative LLM is trained to predict the next token, producing text. An embedding model is trained to map a whole piece of text to a single vector such that semantically related texts have similar vectors.

Embedding models are usually trained with contrastive learning. You feed in pairs that should match, like a question and the passage that answers it, or two paraphrases. The loss pulls matching pairs together in vector space and pushes them away from other examples in the batch, which serve as negatives; hard negatives, passages that look similar but don't answer the question, are especially valuable. Many are built on encoder models like BERT variants, though some now start from decoder LLMs.

The practical differences: embedding models are small and fast, and you compute document embeddings once at indexing time and only embed the query at search time. They're a bi-encoder: query and document are encoded independently, which is what makes searching millions of documents feasible. The trade-off is less precision than a cross-encoder reranker, which reads the query and document together.

When choosing one, I check retrieval benchmarks like MTEB as a starting point, but evaluate on our own queries and documents, and consider dimension size, multilingual support, maximum input length and cost."

### [2] How do multimodal LLMs handle images?
@tags multimodal, vision
@hook A vision encoder turns the image into a sequence of embeddings that the language model reads like tokens.
@say
"Most multimodal LLMs connect a vision encoder to a language model. The image is split into patches, like 14 by 14 pixels each, and a vision transformer, often initialised from a contrastively trained model like CLIP or SigLIP, encodes them into vectors. A projection layer maps those vectors into the language model's embedding space, so the image becomes a sequence of 'visual tokens' placed in the context alongside the text tokens. The model is then trained on image-text data, like captions, documents, charts and screenshots, so it learns to reason about both together.

Practical consequences for engineers: images consume tokens, often hundreds to a few thousand per image depending on resolution, so they affect cost and context. Resolution matters for reading small text, so high-resolution images may be tiled. And models can still misread fine details like small numbers or dense tables.

Use cases I'd mention are document understanding, like invoices and forms without a separate OCR step, chart and screenshot analysis, UI automation for computer-use agents, and visual question answering. For critical extraction, I'd still validate the extracted values against rules or a second pass."

### [2] Closed API models vs open-weight models. How do you choose?
@tags model selection, open weights, cost
@hook Closed APIs: strongest capability, zero ops. Open weights: control, privacy, customisation and cost at scale. Decide with your evals and constraints.
@say
"Closed models from providers like Anthropic, OpenAI and Google, accessed through APIs, generally offer the strongest capabilities, especially for complex reasoning, coding and agentic work. They need no infrastructure, scale instantly and improve over time. The downsides are per-token cost at high volume, data leaving your environment, though enterprise terms and cloud-hosted options help, dependence on a vendor's pricing and deprecation schedule, and limited customisation.

Open-weight models, like the Llama, Mistral, Qwen, Gemma and DeepSeek families, can be self-hosted. You get full control over data and deployment, can run on-premise or air-gapped, can fine-tune deeply, and at high, steady volume they can be much cheaper per token. The costs are GPU infrastructure, MLOps work for serving, scaling and monitoring, and usually some capability gap at the frontier.

I'd decide from requirements: data residency and privacy rules, quality needed on our eval set, latency, volume and total cost of ownership, and team skills. Many companies use both: a frontier API for hard tasks, and a smaller open or cheaper model for high-volume simple tasks. And I'd keep a thin abstraction or gateway so switching models is a configuration change backed by evals, not a rewrite."
