@section eval | Evaluation and Testing of LLM Systems
@blurb The skill that separates demo builders from production engineers. Eval sets, graders, LLM judges, error analysis and ship decisions.

### [1] Why is evaluating LLM applications hard?
@tags evaluation, basics
@hook Outputs are open-ended, many answers can be right, results vary run to run, and the real failure modes only show up on real data.
@say
"Traditional ML has a held-out test set and a single metric like accuracy. LLM applications break that in several ways.

Open-ended outputs: for a summary or a support answer, there are many correct responses, so exact-match metrics don't work, and judging quality needs rubrics, references or human judgement.

Multiple quality dimensions at once: correctness, faithfulness to sources, helpfulness, tone, format, safety, latency and cost, which can trade off against each other.

Non-determinism: the same input can give different outputs, so one run isn't reliable evidence.

Distribution shift: users ask things the developers never imagined, so a test set built from the team's assumptions misses the real failure modes.

Moving parts: prompts, retrieval, tools and model versions all change, and the provider can update models.

So evaluation becomes an engineering system in its own right: a curated eval dataset that grows from real failures, a mix of deterministic checks, model-based graders and human review, repeated runs, per-slice reporting, and monitoring in production. Without it, every prompt change is a guess."

### [2] How would you build an eval set and decide whether a change can ship?
@tags evaluation, release gates
@hook Start from the product decision, use production-like data and edge cases, mix code checks, rubric judges and human calibration, run repeated trials, and gate on explicit thresholds.
@say
"I start from the product decision the eval supports: for a support assistant, 'can this change go to all customers without increasing wrong answers or escalations?' That defines what to measure.

Data: I collect real or production-like inputs, sampled across the main categories of usage, plus deliberately hard cases: ambiguous questions, unanswerable ones, adversarial inputs, long inputs, other languages, and every past production failure. A few hundred well-chosen cases beat thousands of random ones. Where there's a correct answer, I write a reference; otherwise, a rubric of what a good answer must contain or avoid.

Graders: deterministic checks wherever possible, like schema validity, exact values, citations pointing to real sources, or tests passing; LLM-based rubric graders for qualities like faithfulness or helpfulness, calibrated against human ratings on a sample; and periodic human review for the most important slices.

Running it: several trials per case because of non-determinism, results broken down by slice, and comparisons against the current production version, not just absolute scores, with latency and cost tracked alongside quality.

Ship decision: explicit gates agreed in advance, like no regression beyond noise on critical slices, zero failures on safety cases, faithfulness above a threshold, and cost per request within budget. Then a canary rollout with online metrics before going to everyone."

### [2] Can you trust an LLM-as-judge? How do you build a good one?
@tags llm as judge, evaluation
@hook Treat the judge as a measuring instrument: give it a precise rubric, check it against human labels, watch its biases, and prefer verifiable checks when they exist.
@say
"An LLM judge is useful because it scales qualitative evaluation, but I treat it as a measurement instrument that must be calibrated, not as ground truth.

Building a good one: give it a specific rubric with clear criteria and examples of each score, rather than 'rate quality 1 to 10'; prefer binary or small-scale judgements on one criterion at a time, like 'is every claim supported by the context, yes or no', which are more reliable than holistic scores; ask for a short justification before the verdict; and give it the context it needs, like the source documents or a reference answer.

Known biases to control: position bias in pairwise comparisons, preferring the first or second option, which I handle by swapping the order and averaging; verbosity bias, preferring longer answers; self-preference, rating outputs from its own model family higher, so I may use a different model as the judge; and sensitivity to formatting.

Calibration: I have humans, ideally domain experts, label a sample, and measure the judge's agreement with them, using accuracy or Cohen's kappa. I refine the rubric until agreement is good, and recheck it whenever the judge model, rubric or data changes.

And whenever something can be verified directly, like a calculation, a database state or a passing test, I use that instead of a judge."

### [1] Offline vs online evaluation?
@tags evaluation, monitoring
@hook Offline: test changes on a fixed dataset before shipping. Online: measure real behaviour with real users after shipping. You need both.
@say
"Offline evaluation runs the system on a fixed, curated dataset before deployment. It's repeatable, cheap and safe, which makes it ideal for comparing prompts, models and retrieval settings, and for regression gates in CI. Its limitation is that the dataset is only an approximation of reality.

Online evaluation measures the system with real users in production. Implicit signals include task completion, conversation abandonment, retries and rephrasing, escalation to humans, copy or accept rates for suggestions, and downstream business metrics like resolution rate. Explicit signals include thumbs up or down and ratings, though they're sparse and biased toward unhappy users. Plus automated scoring of sampled production traces with the same graders used offline, and A/B tests comparing versions on real traffic.

They feed each other: online monitoring finds new failure modes, which become new offline test cases, and offline evals make sure fixes don't break other things before the next release."

### [1] What are BLEU, ROUGE and BERTScore, and why are they limited for LLM evaluation?
@tags metrics, nlp
@hook They measure overlap with a reference answer. Useful for translation-style tasks; poor for open-ended answers where wording can differ but meaning is right.
@say
"BLEU measures n-gram precision: how many word sequences in the generated text also appear in the reference, with a penalty for being too short. It was designed for machine translation.

ROUGE measures n-gram recall: how much of the reference's content appears in the output. It was designed for summarisation, with variants like ROUGE-L based on the longest common subsequence.

BERTScore compares contextual embeddings of the tokens in the output and the reference, so it rewards semantic similarity even with different wording.

Their limitation is that they all compare against a reference, assuming good outputs look like it. For open-ended LLM tasks, a correct answer can be worded completely differently and score low, while a fluent answer that copies the reference's wording but gets a key fact wrong, or adds a hallucination, can score high. They don't measure faithfulness, helpfulness, safety or reasoning.

So they're still reasonable for narrow tasks with constrained outputs, like translation, or as cheap sanity checks, but for most LLM applications I rely on task-specific checks, rubric-based judges and human evaluation."

### [2] What role do public benchmarks play, and what is benchmark contamination?
@tags benchmarks, contamination
@hook Benchmarks help shortlist models; your own evals decide. Contamination means test questions leaked into training data, so scores overstate ability.
@say
"Public benchmarks measure general capabilities on standard tasks. Examples are MMLU and its harder successors for broad knowledge, GPQA for expert-level science questions, maths competition benchmarks, SWE-bench for resolving real GitHub issues, and agentic or tool-use benchmarks, plus human-preference leaderboards like LMArena.

They're useful for tracking progress and shortlisting models. But I don't choose a model for a product based on them, for three reasons. Relevance: my task and data are different, and rankings often change on specific tasks. Saturation: frontier models score near the ceiling on many older benchmarks, so differences are noise. And contamination: benchmark questions and answers appear on the internet and can end up in pretraining data, so a model may have partially memorised the test, inflating its score. Labs try to filter this, but it's hard to rule out, which is why newer benchmarks use held-out, private or recently created questions.

So my process is: use benchmarks and leaderboards to pick two or three candidates, then decide with my own eval set, which also has to stay private, so it doesn't leak into future training data or into the prompts I iterate on."

### [2] How do you do error analysis on an LLM application?
@tags error analysis, evaluation, process
@hook Read lots of real traces, write down what went wrong in your own words, group the notes into failure categories, count them, and fix the biggest bucket first.
@say
"Error analysis is the most valuable and most skipped activity in AI engineering. Metrics tell you that something is wrong; reading outputs tells you what.

My process: sample a meaningful number of traces, say 50 to 100, from production or the eval run, including both failures and random cases. For each, I read the full trace, input, retrieved context, tool calls and output, and write a short free-text note about the first thing that went wrong. This is like open coding in qualitative research. Then I group those notes into failure categories, like 'retrieval missed the relevant policy', 'answered from general knowledge instead of the context', 'wrong date format', 'too verbose', and count how often each occurs.

That gives a ranked list of what to fix. I fix the biggest category first, often with targeted changes like a retrieval improvement or a clarified instruction, then turn those examples into eval cases and, where possible, automated checks for that specific failure, so it's tracked over time.

Doing this regularly, ideally with a domain expert who knows what a good answer looks like, is how the eval suite stays relevant. It's much more effective than adopting a generic list of metrics up front."

### [2] When do you need human evaluation, and how do you make it reliable?
@tags human evaluation, annotation
@hook Use humans for ground truth, subtle quality and calibrating automated graders. Make it reliable with clear guidelines, trained raters and agreement checks.
@say
"Human evaluation is needed when quality depends on expert judgement, like medical, legal or educational correctness; when establishing ground truth labels for an eval set; for subjective qualities like tone and helpfulness; and for calibrating LLM judges, since a judge is only trustworthy if it agrees with humans.

To make it reliable: write clear annotation guidelines with definitions, examples of each label, and rules for edge cases; use domain experts where correctness requires expertise; prefer simple judgements, like pass or fail per criterion, or pairwise 'which is better', over vague 1-to-10 scores; blind the raters to which system produced each output; and measure inter-annotator agreement, using Cohen's or Fleiss' kappa, on overlapping samples. Low agreement usually means the guidelines are ambiguous, and fixing them is part of the process.

Since human evaluation is slow and expensive, I use it strategically: label a gold set once, use it to calibrate automated graders, and then spot-check samples periodically and for high-risk releases."

### [2] How do you measure hallucination?
@tags hallucination, faithfulness, metrics
@hook Split answers into claims and check each against the source (faithfulness) or against known facts (correctness). Track the rate per slice, and include questions with no answer.
@say
"First, I define what counts as a hallucination for the application. In RAG, the main concern is faithfulness: statements not supported by the provided context. In open-domain answering, it's factual incorrectness against the world.

For faithfulness, a common approach is claim-level checking: break the answer into individual claims, then verify each against the retrieved context with an entailment model or an LLM judge asking 'is this claim supported by these passages?' The score is the share of supported claims, and any unsupported claim in a critical field can be treated as a failure. Citation checks complement this: does each cited source actually support the sentence that cites it?

For factual correctness, I compare against reference answers or trusted data, using exact checks for structured facts like numbers, dates and IDs.

Two important additions: unanswerable questions in the eval set, to measure whether the system admits it doesn't know rather than inventing an answer; and slicing results by topic and question type, since hallucination concentrates in specific areas, like rare entities or numeric questions. In production, I sample traces and run the same faithfulness checks to monitor the rate over time."

### [2] How do you A/B test an LLM feature?
@tags ab testing, experimentation, online evaluation
@hook Randomise users, define one primary success metric plus guardrail metrics in advance, run long enough for significance, and watch cost and latency too.
@say
"I treat it like any product experiment, with some LLM-specific care.

Before starting: define the hypothesis and one primary metric tied to user value, like task completion or resolution without escalation, plus guardrail metrics that must not get worse: complaint or thumbs-down rate, escalations, safety flags, latency and cost per request. Estimate the sample size needed to detect the expected effect.

Randomise at the user or session level, not per request, so each person has a consistent experience and conversations aren't mixed across variants. Start with a small percentage of traffic to limit risk.

During the test: monitor guardrails daily with automatic stop conditions, and sample traces from both variants for qualitative review, since numbers alone can hide new failure types.

Analysis: run the test for its planned duration, use proper significance testing, and look at segments, like new versus returning users, because averages can hide a variant that helps one group and hurts another. Also watch for novelty effects, where users react to change itself.

Before any A/B test, the change should already have passed the offline eval suite, so the experiment is about user impact, not catching obvious regressions."

### [2] How do you handle non-determinism in evaluations?
@tags non-determinism, statistics, evaluation
@hook Run multiple trials, report means with confidence intervals, compare against run-to-run noise, and fix what you can (temperature, seeds, versions).
@say
"LLM outputs vary between runs, and even at temperature zero, server-side batching and floating-point effects can change results. If I run an eval once and see a two-point improvement, it may just be noise.

So I run each case several times, three to five or more for important comparisons, and report the mean pass rate with a confidence interval or standard error. I also measure the baseline's run-to-run variance, by running the same version twice; any difference smaller than that isn't meaningful. For comparing two versions on the same cases, paired statistical tests are more sensitive than comparing overall averages.

For reliability-critical behaviour, I look beyond averages to consistency metrics, like the share of cases that pass on every trial, since users experience the failures, not the average.

To reduce noise where possible: pin model versions, fix decoding parameters, use deterministic graders, and use a fixed dataset version. And larger eval sets narrow the confidence intervals, so for decisions that matter, more cases beat more runs on a tiny set."

### [2] What is red teaming for LLM applications?
@tags red teaming, safety, security
@hook Deliberately attack your own system before others do: jailbreaks, prompt injection, data leakage, harmful output and abuse of tools.
@say
"Red teaming is adversarial testing: deliberately trying to make the system behave badly, to find vulnerabilities before real users or attackers do.

For an LLM application, I'd test several categories. Jailbreaks: attempts to bypass safety guidelines with role-play, hypotheticals, encoding tricks or many-turn manipulation. Prompt injection: direct, where the user tries to override instructions, and indirect, where malicious instructions are hidden in documents, web pages or tool outputs the system processes. Data leakage: extracting the system prompt, other users' data, or confidential documents the user shouldn't access. Harmful or off-brand output: toxic, biased or legally risky content, or making commitments the company can't honour, like an unauthorised discount. Tool misuse: tricking an agent into dangerous actions or excessive spending. And resource abuse: very long inputs or loops that drive up cost.

It combines manual testing by creative people, ideally including domain and security experts, with automated attack generation using libraries and LLMs that generate adversarial prompts at scale. Successful attacks become regression test cases, and the findings feed into guardrails, permission design and the threat model. It should be repeated for each significant release, not done once."

### [2] How do you run LLM evals in CI?
@tags ci, regression testing, llmops
@hook Fast deterministic checks on every pull request, a fuller model-graded suite before merge or nightly, results compared against the main branch, and gates on critical cases.
@say
"I treat evals like tests, in tiers.

On every pull request that touches prompts, retrieval, tools or model configuration: a fast smoke suite of a few dozen critical cases with deterministic checks, like schema validity, required facts present, forbidden content absent and tool calls correct, which runs in minutes.

Before merge, or nightly: the full suite with model-based graders and multiple trials, reporting per-slice scores compared with the main branch, plus cost and latency per case. The results are posted on the pull request, so reviewers see 'faithfulness 0.94 to 0.95, refund-policy slice down 4 points' rather than just a diff of prompt text.

Gating rules: hard failures on safety cases or critical cases block the merge; statistically meaningful regressions on key metrics need an explicit sign-off.

Practical details: cache model responses for unchanged cases to save cost; version the eval dataset alongside the code; keep secrets and production data out of CI logs; and make it easy to add a new case, because every production bug should become one. Tools like promptfoo, Braintrust, LangSmith or DeepEval support this, or a simple pytest-based harness."

### [2] How do you evaluate multi-turn conversations?
@tags conversation, chatbots, evaluation
@hook Single-turn tests miss context loss, contradictions and drift. Replay scripted conversations, simulate users with an LLM, and grade the whole dialogue against goals.
@say
"Many chatbot failures only appear across turns: forgetting earlier information, contradicting itself, losing track of a follow-up's meaning, drifting from instructions in long conversations, or being manipulated gradually over several turns.

I use three approaches. Scripted multi-turn test cases: fixed conversation histories with a final user turn, checking that the response uses earlier context correctly, for example the user mentioned their plan type in turn two and asks a question in turn six. These are deterministic and cheap.

Simulated users: an LLM plays a user with a defined persona and goal, like 'a frustrated customer who wants a refund for a late order and gives the order number only when asked', and converses with the system for up to N turns. The whole transcript is then graded on goal completion, number of turns, policy adherence, tone and correctness. Running many personas and goals gives broad coverage, and I run several trials because both sides are stochastic.

Production conversation analysis: sampling real conversations and grading them at the conversation level, looking at signals like repeated rephrasing, abandonment and escalations.

The grading rubric is conversation-level: did the user achieve their goal, was everything said correct and consistent, and was it efficient."
