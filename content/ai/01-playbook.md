@section playbook | The AI Interview Playbook
@blurb How AI engineering loops run in 2026, and the openers, project deep dives and judgement calls that frame the whole day.

### [1] Tell me about yourself. (AI engineer version)
@tags opener, pitch
@hook Present, past, future. Lead with a shipped AI system, a number, and how you measured it.
@say
"I'm an AI engineer focused on building LLM-powered applications that actually hold up in production. Right now I'm [finishing my degree / working at X], where my main project is [an AI tutoring and feedback system for university courses]. I built the [agent orchestration and the evaluation pipeline]: a retrieval layer over course material, agents that generate feedback on student submissions, and an eval suite that compares the agent's feedback against marking from teaching staff. That eval work [raised agreement with human markers from about 60 to 80 percent] and caught two regressions before they reached students.

Before that, I [built classic ML projects / did an internship in X], which gave me the fundamentals: data pipelines, model evaluation and Python engineering.

I'm looking for a team that ships AI features to real users, where I can own systems end to end, from retrieval and prompting to evals, cost and monitoring. That's why this role stood out: [specific product or problem]."
@trap
Listing every model, framework and buzzword you have touched. Interviewers want one system you understand end to end, and how you knew it worked.
@pro
Mention evaluation in your first 60 seconds. It immediately separates you from candidates who only built demos.

### [2] Walk me through an AI system you shipped.
@tags project deep dive
@hook Problem and user, baseline, architecture, your part, how you evaluated it, a failure you fixed, what you'd change.
@say
"[Example: an AI feedback assistant for programming assignments.]

The problem: teaching staff couldn't give detailed feedback to 400 students quickly, so feedback arrived after the next assignment was due.

The baseline we measured against was a single prompt to an LLM with the assignment and the rubric. It was fast but often vague and sometimes wrong about the code.

What we built: a pipeline that first runs the student's code against tests, retrieves the relevant rubric items and lecture material with hybrid search, then has one agent draft feedback per rubric item and a second, checker step that verifies every claim against the test results before anything is shown. My part was the agent orchestration and the evaluation harness.

Evaluation: we built a golden set of 150 submissions with feedback written by tutors, scored outputs with a rubric-based LLM judge that we calibrated against tutor ratings, and tracked factual errors separately as a hard gate.

A failure we fixed: the model praised code that didn't compile in about 1 in 20 cases. Adding the test results as ground truth in the context and the checker step brought that close to zero on our set.

Results: [feedback turnaround from a week to minutes, and tutors accepted around 80 percent of suggestions with light edits]. If I did it again, I'd build the eval set before writing the first prompt, not after."
@deep
Interviewers drill into the deep dive. Prepare crisp answers to:
- What was the baseline, and how much better was the final system, measured how?
- Why that model? What did you try that didn't work?
- What does a request cost, and what is the p95 latency?
- What were the top failure modes in production, and how did you detect them?
- How do you know a prompt or model change didn't make things worse?
- What exactly did **you** build versus the team?
@trap
"We used GPT and LangChain and it worked really well." No baseline, no metric, no failure story. This answer fails most AI loops.

### [2] How do you approach an LLM system design question?
@tags system design, framework
@hook Users and success metric, simplest baseline, architecture, evaluation plan, cost and latency budget, safety, rollout.
@say
"I start with the user and the success metric: who uses it, what task they're trying to complete, and how we'd know it's working. For a support bot, that might be resolution rate without human handoff, and customer satisfaction, while keeping wrong answers below a threshold.

Then I propose the simplest thing that could work, often a well-prompted model with retrieval, and only add complexity like agents, fine-tuning or multi-step pipelines when I can say what failure it fixes.

Next I sketch the architecture: data ingestion and indexing, retrieval, the model call with a structured output contract, validation, tools if needed, and the fallback path to a human or a safe response.

Then I spend real time on evaluation, which is where most candidates are thin: an offline eval set built from real or realistic queries, with separate metrics for retrieval and generation, plus online monitoring and feedback signals after launch.

After that, cost and latency: tokens per request, which model tier, caching, streaming, routing easy requests to cheaper models. Then safety and security: permissions on retrieved data, prompt injection, PII. And finally the rollout: shadow mode or a small cohort, with abort thresholds."
@deep
A reusable checklist for any LLM design prompt:

| Step | Questions to answer out loud |
|---|---|
| Scope | Users, task, volume, latency target, languages, what "good" means |
| Baseline | What's the simplest approach, and why isn't it enough? |
| Architecture | Ingestion, retrieval, model calls, tools, memory, validation, fallbacks |
| Evals | Golden set, metrics per stage, graders, regression gate, online signals |
| Cost and latency | Tokens per request, cost per 1,000 requests, p95 latency, caching, routing |
| Safety | Data permissions, prompt injection, PII, harmful output, human review |
| Ops | Tracing, versioning prompts and models, alerts, incident response |
| Rollout | Shadow, canary cohort, A/B, abort criteria |

### [1] What is the difference between an AI engineer, an ML engineer, a data scientist and a research scientist?
@tags roles, career
@hook Research invents models, ML engineers train and serve them, data scientists find insight, AI engineers build products on top of foundation models.
@say
"They overlap, but the centre of gravity differs.

A research scientist advances the state of the art: new architectures, training methods, papers. A data scientist analyses data to answer business questions and builds statistical or predictive models, with a lot of experimentation and communication. An ML engineer builds and operates the infrastructure to train, deploy and monitor models at scale: data pipelines, feature stores, training jobs, serving, MLOps.

An AI engineer, the role that grew with foundation models, builds products on top of pretrained models, usually LLMs, accessed through APIs or self-hosted. The work is retrieval, prompting and context design, agents and tool integration, evaluation, guardrails, and optimising cost and latency in production. It's closer to software engineering than to model training, though fine-tuning and some ML fundamentals are still part of the job.

In practice, job titles are inconsistent, so I read the job description: if it mentions RAG, evals and agents, it's AI engineering; if it mentions training pipelines and feature stores, it's ML engineering."

### [1] How do you stay current in a field that changes every month?
@tags learning, career
@hook Follow a few primary sources, reproduce instead of just reading, and judge new things by your own evals.
@say
"I filter hard, because the volume is overwhelming. I follow primary sources: model and API release notes from the major labs, a handful of researchers and practitioners who publish careful work, and engineering blogs from teams that run AI in production. For papers, I skim abstracts weekly and only read deeply when something is relevant to what I'm building.

The key habit is to try things rather than just read about them. When a new model, technique or framework appears, I test it against my own eval set on a task I care about, because benchmark headlines often don't transfer.

And I write short notes on what worked and what didn't, sometimes as a post or a team demo. That forces me to understand it properly and builds a personal knowledge base I actually use."

### [2] A stakeholder wants to ship an AI feature, but your evaluation evidence is weak. What do you say?
@tags judgement, stakeholders, risk
@hook Turn uncertainty into a decision: name the biggest unknown, the cheapest test, and a bounded launch option.
@say
"I wouldn't just say 'we're not ready' or 'ship it'. I'd turn the uncertainty into a concrete decision.

First, I'd name the biggest unknown precisely, for example: 'we don't know how often it gives wrong refund amounts on real customer questions, because our eval set is only 40 synthetic examples.'

Second, I'd propose the cheapest way to reduce it: two days to label 200 real tickets from last month and run the system on them.

Third, I'd offer a bounded launch so we don't lose momentum: shadow mode, where the AI drafts answers that agents review before sending; or a small cohort of low-risk question types; or read-only mode with no actions. Each with clear abort thresholds, like 'if the wrong-answer rate on reviewed drafts exceeds 2 percent, we pause.'

And I'd state the residual risk in product terms, like 'roughly 1 in 50 customers might get an incorrect policy answer', and make sure the decision has a named owner. That way the stakeholder gets a path to ship, and we get the evidence we need."
@pro
Bring the risk back to users and money, not model metrics. "One in fifty customers gets a wrong refund amount" lands; "faithfulness of 0.82" doesn't.
