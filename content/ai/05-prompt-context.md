@section prompt | Prompt and Context Engineering
@blurb Prompts as production code: clear instructions, structured outputs, versioning, and deciding what goes into the context window.

### [1] What prompting techniques do you rely on?
@tags prompting, techniques
@hook Be clear and specific, give context and the why, show the output format, use examples, separate sections, and let the model think when the task is hard.
@say
"My core techniques, roughly in order of impact.

Clear, specific instructions: state the task, the audience, the constraints and what a good answer looks like, as I would brief a smart new colleague who has no context. Explaining why a constraint exists helps the model generalise it correctly.

Context: give the relevant facts, documents or data the model needs, rather than relying on its memory.

Structure: separate instructions, context and input clearly, for example with XML-style tags or headings, so the model doesn't confuse a document's content with my instructions.

Output specification: describe the exact format, ideally a schema, or use the API's structured output feature.

Examples: a few diverse examples, including edge cases, when format or judgement is subtle.

Room to reason: for complex tasks, ask the model to think through the problem before answering, or use a reasoning model or thinking budget.

And then the most important part: I iterate against an eval set, not against a single example I happen to be looking at. Prompting without evals is guesswork."
@deep
```xml
<role>You are a support assistant for Acme Bank's credit cards.</role>

<instructions>
Answer the customer's question using only the policy excerpts below.
If the excerpts don't contain the answer, say so and offer to connect a human agent.
Customers are often stressed, so keep answers short and plain, and never guess fees.
</instructions>

<policy_excerpts>
{{retrieved_chunks}}
</policy_excerpts>

<customer_question>
{{question}}
</customer_question>

<output_format>
JSON: {"answer": string, "cited_excerpt_ids": string[], "needs_human": boolean}
</output_format>
```

### [1] System prompt vs user prompt?
@tags prompting, roles
@hook The system prompt sets durable identity, rules and context for the whole conversation. User messages carry the turn-by-turn request.
@say
"The system prompt is set by the developer and frames the whole conversation: the assistant's role, the rules it must follow, tone, output format, tools it can use, and background context like product information. Models are trained to give it high priority and to keep following it across turns.

User messages contain the actual requests from the end user, turn by turn. Assistant messages are the model's previous replies, which the application sends back each time, because the API is stateless.

In practice, I put stable instructions, policies and persona in the system prompt, and the variable data, like the question and retrieved documents, in the user turn. Keeping the stable part identical across requests also maximises prompt caching. One important point for security: the system prompt is not a security boundary. Users can try to override it through prompt injection, and system prompts can leak, so I never put secrets in them, and I enforce real permissions in code."

### [2] How do you get reliable structured output, like JSON, from an LLM?
@tags structured output, json, reliability
@hook Use the API's schema-constrained output or tool calling, validate with a schema in code, and retry or repair on failure.
@say
"I layer several techniques.

First, use the provider's native structured output support where available: you pass a JSON schema and the model is constrained to produce output that matches it, often through constrained decoding that only allows tokens that keep the output valid. Tool or function calling achieves the same by having the model fill in a tool's argument schema. That eliminates most malformed JSON.

Second, always validate in application code, with Pydantic in Python or Zod in TypeScript, because schema-valid doesn't mean semantically valid: an amount can be negative, a date can be impossible, an enum can be plausible but wrong for this case.

Third, handle failures: on a validation error, retry once with the error message fed back to the model, and if it still fails, fall back to a safe path, like a human queue or a default response, and log it.

Fourth, design the schema well: clear field names and descriptions, enums instead of free text where possible, an explicit field for 'unknown' or 'not found' so the model isn't forced to invent a value, and keep it as flat as possible. And I track the validation failure rate as a metric, because a sudden rise usually means a model or prompt change broke something."
@deep
```python
from pydantic import BaseModel, Field, ValidationError
from typing import Literal

class Ticket(BaseModel):
    category: Literal["billing", "technical", "account", "other"]
    urgency: Literal["low", "medium", "high"]
    summary: str = Field(max_length=200)
    order_id: str | None = Field(None, description="Only if explicitly mentioned")

def classify(text, llm, max_attempts=2):
    error = None
    for _ in range(max_attempts):
        raw = llm.structured(prompt(text, error), schema=Ticket.model_json_schema())
        try:
            return Ticket.model_validate_json(raw)
        except ValidationError as e:
            error = str(e)             # feed the error back on retry
    return None                        # caller routes to the fallback path
```

### [2] How would you put an LLM behind a reliable application contract?
@tags reliability, api design, production
@hook Define the contract like any API: schema in, schema out, validation, timeouts, bounded retries, explicit error paths, and versioned prompts and models.
@say
"I treat the LLM as an unreliable dependency behind a well-defined interface, the same way I'd wrap a flaky third-party API.

The contract: a typed input and a typed output schema, with explicit states for success, 'cannot answer', refusal and error. The rest of the application only ever sees validated objects, never raw model text.

Inside the wrapper: structured output with schema validation; business rules verified in code, not trusted to the model, like checking that a refund amount doesn't exceed the order total; timeouts on every call; retries with backoff for transient errors only, with a cap; a fallback model or provider for outages; and a clear degraded path, like a template response or human handoff.

Versioning: the prompt, model ID, decoding parameters and schema are versioned together as one unit, so I can tell exactly what produced any output, and roll back as a unit.

Observability: every call is traced with inputs, outputs, version, latency, token counts and validation results, with PII handled appropriately.

And tests: an eval suite runs in CI against that contract, so a prompt tweak or model upgrade that breaks the contract fails the build before it ships."

### [2] What is context engineering, and how is it different from prompt engineering?
@tags context engineering, agents
@hook Prompt engineering is writing good instructions. Context engineering is deciding everything that goes into the window at each step: instructions, retrieved data, tools, memory and history.
@say
"Prompt engineering focuses on wording the instructions well. Context engineering is the broader discipline of curating everything that goes into the model's context window at each call, because the model can only act on what's in front of it.

That includes the system instructions, retrieved documents, tool definitions and their results, conversation history, memory from previous sessions, examples, and the current task state. The core problem is that context is finite and attention degrades as it fills, so more isn't better; the goal is the smallest set of high-signal tokens that lets the model do the task.

Techniques I use: retrieve just-in-time instead of preloading everything; keep tool outputs concise and return references, like file paths or IDs, instead of dumping full data; compact or summarise long histories while keeping key decisions; give agents a scratchpad or notes file for long tasks; use sub-agents with clean contexts for focused sub-tasks, returning only summaries; and order content so key instructions and evidence aren't buried in the middle.

It's become the central skill for building agents, because in long-running agent loops, poor context management, not model capability, is the most common cause of failure."

### [2] How do you manage, version and test prompts in production?
@tags prompt management, llmops, testing
@hook Prompts are code: version control, code review, eval suites in CI, staged rollout, and the ability to roll back.
@say
"I treat prompts as code. They live in version control, ideally as templates separate from application logic, and changes go through pull requests and review like any other code. Each prompt version is tied to the model ID and parameters it was tested with.

Every change runs against an eval suite in CI: a set of representative and edge-case inputs with automated graders. The pull request shows the scores compared with the current version, including per-category results, so a change that helps one slice but hurts another is visible. Regressions on critical cases block the merge.

For rollout, I use feature flags or a prompt registry, so a new version can go to a small percentage of traffic first, or run in shadow mode, while I watch online metrics like user feedback, escalation rates, validation failures, latency and cost. If something goes wrong, rolling back is a configuration change.

Every production trace records which prompt and model version produced it, which makes debugging and comparisons possible. Tools like Langfuse, LangSmith, Braintrust or an internal registry can help, but the discipline matters more than the tool."

### [2] A model upgrade made your outputs worse. How do you handle model changes?
@tags model upgrades, regression, drift
@hook Never upgrade blind: pin model versions, run the eval suite on the new model, fix prompts per slice, roll out gradually with rollback ready.
@say
"First, prevention: I pin explicit model versions rather than floating aliases, so the model never changes underneath me without a deliberate decision, and I track providers' deprecation schedules so upgrades are planned, not forced at the last minute.

When upgrading, I run the full eval suite on the new model with the current prompts and compare per slice, not just the overall average. New models often differ in style, verbosity, instruction-following strictness, or how they handle formatting and tools, so prompts tuned for the old model may need adjusting. For example, a newer model may follow instructions more literally, so vague instructions that used to work need to be made explicit.

Then I iterate on the prompts for the new model until it meets or beats the old one on the evals, check cost and latency, since token usage can change, and roll out gradually: shadow traffic or a canary, with online metrics and a quick rollback path.

If it's already in production and degraded, I roll back to the previous pinned version first, then investigate by adding the failing cases to the eval set, so the same regression can't slip through again."

### [2] How do you handle long conversations and memory?
@tags memory, context, chat
@hook The model is stateless. You decide what to resend: recent turns verbatim, older turns summarised, durable facts in a memory store retrieved when relevant.
@say
"LLM APIs are stateless, so the application sends the conversation history every turn, and it can't grow forever because of context limits, cost and degraded attention.

I use a layered approach. Short-term memory: keep the most recent turns verbatim, because they matter most. Compaction: when the history gets long, summarise older turns into a compact running summary that preserves decisions, user preferences, open questions and facts, and drop the raw text. Long-term memory: extract durable facts, like 'user prefers Python' or 'their order number is X', into a memory store, often a database or vector store, and retrieve the relevant ones into context when needed. Task state: for agents, keep structured state, like a plan or to-do list, outside the conversation and inject it each turn.

The important design decisions are what to remember, privacy and consent for stored memories, letting users view and delete them, and evaluating whether the summarisation loses critical details, which I test with long-conversation eval cases. Prompt caching also helps keep the cost of a long but stable prefix down."

### [2] When do you split a task into a chain of prompts instead of one big prompt?
@tags prompt chaining, workflows
@hook Chain when the task has distinct steps, each needing different instructions or checks. You gain accuracy and debuggability, and pay in latency.
@say
"One big prompt is simpler and faster, and with strong models it works well for many tasks. I split into a chain when the task has clearly distinct stages, like extract, then analyse, then write; when one stage needs a different model, temperature or tools; when I want to validate or check the output between steps; or when a single prompt is doing so many things that quality suffers on some of them.

The benefits are that each step is simpler and more accurate, each can be evaluated and improved separately, and failures are easier to locate. I can also insert programmatic checks between steps, like verifying extracted fields before generating a report, and run independent steps in parallel.

The costs are more latency, more total tokens, more orchestration code, and errors that can compound across steps. So I start with the simplest approach that passes the evals and decompose only where the evals show a specific weakness."

### [1] What is chain-of-thought prompting, and when does it help?
@tags chain of thought, reasoning
@hook Asking the model to reason step by step before answering improves multi-step problems. Reasoning models now do this natively.
@say
"Chain-of-thought prompting asks the model to work through intermediate reasoning steps before giving its final answer, either with an instruction like 'think step by step', or with examples that show the reasoning. Because each token is generated with the previous ones as context, writing out intermediate steps gives the model more computation and a scratchpad, which significantly improves multi-step tasks like maths, logic, planning and complex classification.

It helps less on simple tasks, like lookups or short rewrites, where it just adds latency and tokens.

Today, reasoning models do this natively with a separate thinking phase, often with a controllable budget, so I rely on that rather than hand-written 'think step by step' prompts for hard problems. When I do use chain of thought with a regular model, I ask for the reasoning inside tags and the answer in a separate, structured field, so the application can parse the answer reliably and log the reasoning for debugging. One caution: the visible reasoning isn't guaranteed to be a faithful explanation of how the model reached its answer, so I don't treat it as proof of correctness."

### [2] How do you cut prompt cost and length without losing quality?
@tags cost, tokens, optimisation
@hook Measure where the tokens go, cache the stable prefix, retrieve less but better, trim verbose instructions and examples, and route to smaller models.
@say
"I start by measuring which part of the prompt and output uses the tokens: system prompt, examples, retrieved context, history or output length.

Then the main levers. Prompt caching: put stable content, like system instructions, tool definitions and examples, at the start and keep it byte-identical, so the provider caches it and repeated requests are much cheaper and faster. Retrieval quality: send fewer, better chunks, using a reranker, rather than many loosely relevant ones. History: compact older turns into summaries. Examples: keep only the ones that measurably help, or select a few relevant ones dynamically. Instructions: remove redundancy, but carefully, checking evals after each cut. Output: ask for concise, structured output and set sensible max tokens, since output tokens are usually more expensive than input tokens. And model routing: send simple requests to a smaller, cheaper model.

Every cut gets checked against the eval suite, because it's easy to save 30 percent of tokens and silently lose 5 percent of accuracy."

### [2] Self-consistency, reflection and self-critique: when are they worth it?
@tags reasoning, verification, quality
@hook Sample several answers and vote, or have the model critique and revise. They buy accuracy with extra calls, so use them where errors are expensive.
@say
"Self-consistency samples several independent answers to the same question, at a non-zero temperature, and takes the majority answer. It works well for problems with a single checkable answer, like maths or classification, because errors tend to scatter while correct reasoning converges.

Reflection, or self-critique, has the model review its own output against criteria, find problems and revise it. Generator-evaluator loops are a structured version: one call produces, another evaluates against a rubric or tests, and the loop repeats until it passes or hits a limit. They work best when the evaluation is concrete, like running unit tests on generated code or checking a summary against the source.

The costs are multiples of the latency and token cost, and self-critique without external signals can just rationalise mistakes; models aren't always reliable judges of their own work.

So I use them selectively: for high-value, error-sensitive outputs, preferring external verification like tests, validators or a different model as the checker, and I confirm with evals that the extra cost actually buys accuracy."
