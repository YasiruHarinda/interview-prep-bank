@section agents | AI Agents, Tool Use and MCP
@blurb The hottest interview area of 2026: when to use an agent at all, how tool calling works, MCP and A2A, and how to keep agents safe and measurable.

### [1] What is an AI agent? How is it different from a chatbot or a workflow?
@tags agents, definitions
@hook A workflow follows code-defined steps. An agent is an LLM in a loop that chooses its own next action, uses tools, observes results, and decides when it's done.
@say
"A chatbot takes a message and returns a reply; any tools or steps around it are fixed.

A workflow orchestrates LLM calls and tools through predefined code paths: step one extract, step two classify, step three draft. The developer decides the control flow, so it's predictable, testable and cheap.

An agent is an LLM running in a loop where the model itself decides what to do next. Given a goal and a set of tools, it plans, calls a tool, observes the result, updates its approach and repeats until it decides the task is complete or hits a limit. The control flow is chosen by the model at run time, based on what it observes.

That autonomy is what makes agents powerful for open-ended tasks where the steps can't be known in advance, like debugging a codebase, researching a question across many sources, or resolving a support case that needs several lookups. It's also what makes them more expensive, slower and harder to predict and test. So I think of it as a spectrum, from a single call, to a workflow, to a constrained agent, to a fully autonomous agent, and I move along it only as far as the task requires."

### [2] When would you use an agent instead of a deterministic workflow?
@tags agents, design, workflows
@hook Use a fixed workflow when you know the steps. Use an agent only when flexible planning is worth the cost, latency and unpredictability.
@say
"My default is the simplest thing that works: a single well-prompted call, then a workflow, and only then an agent.

Workflows are better when the steps are known in advance. There are a few well-known patterns: prompt chaining, where each step processes the previous output; routing, where a classifier sends inputs to specialised handlers; parallelisation, running independent sub-tasks at once or voting across several attempts; orchestrator-workers, where a central LLM breaks a task into sub-tasks dynamically and delegates them; and evaluator-optimiser loops, where one call generates and another critiques until it passes.

I reach for an agent when the path genuinely can't be predicted: the number and order of steps depends on what's discovered along the way, like investigating a bug, multi-source research, or handling customer cases with many possible branches; when the environment gives reliable feedback, like test results or tool outputs, that the agent can use to check progress; and when the value of the task justifies the extra cost and latency.

And when I do use an agent, I constrain it: least-privilege tools, step and token budgets, clear stop conditions, approval gates for high-impact actions, and verification of the final outcome in the system of record, not just trusting the agent's claim that it succeeded."

### [1] How does tool or function calling work under the hood?
@tags tool calling, function calling
@hook You describe tools with JSON schemas. The model replies with a structured call; your code runs it and returns the result; the model continues. The model never executes anything itself.
@say
"Tool calling has four steps.

First, the application sends the model the conversation plus a list of tool definitions: each has a name, a description of what it does and when to use it, and a JSON schema for its parameters.

Second, the model, which has been trained to use tools, decides whether a tool would help. If so, instead of a normal text answer, it outputs a structured tool call: the tool name and arguments as JSON matching the schema.

Third, the application, not the model, validates those arguments, checks permissions, executes the actual function, like a database query or an API call, and sends the result back to the model as a tool result message.

Fourth, the model reads the result and either calls another tool or writes the final answer.

The important engineering points: the model only proposes calls, so all security and validation happens in my code; tool descriptions are effectively prompts, so their quality strongly affects whether the model picks the right tool with the right arguments; models can request several tool calls in parallel; and tool results go back into the context, so they should be concise to save tokens and attention."
@deep
```python
tools = [{
    "name": "get_order_status",
    "description": "Look up the current status of a customer's order. Use when the user asks where their order is.",
    "input_schema": {
        "type": "object",
        "properties": {"order_id": {"type": "string", "description": "Order ID like ORD-12345"}},
        "required": ["order_id"],
    },
}]

messages = [{"role": "user", "content": "Where is my order ORD-88812?"}]
while True:
    resp = llm.create(messages=messages, tools=tools)
    messages.append({"role": "assistant", "content": resp.content})
    calls = [b for b in resp.content if b.type == "tool_use"]
    if not calls:
        break                                     # final answer
    results = []
    for call in calls:
        output = run_tool(call.name, call.input)  # validate + authorise inside run_tool
        results.append({"type": "tool_result", "tool_use_id": call.id, "content": output})
    messages.append({"role": "user", "content": results})
```

### [2] What is the ReAct pattern?
@tags react, agents, reasoning
@hook Reason, Act, Observe, repeat. Thinking between tool calls lets the agent plan, react to results and recover from errors.
@say
"ReAct, short for reasoning and acting, interleaves reasoning steps with actions. In each iteration, the model first reasons about the current state and what to do next, then takes an action, typically a tool call, then observes the result, and reasons again with that new information. It continues until it can answer.

The insight from the original paper was that combining the two beats either alone. Reasoning without actions hallucinates facts it can't check; actions without reasoning lack a plan and can't recover from surprises. With ReAct, if a search returns nothing useful, the model can notice that and try a different query.

ReAct is essentially the basic agent loop that most frameworks and native tool-calling APIs implement today, and modern models do the reasoning part natively, often in a separate thinking phase between tool calls. Its weaknesses are that it's greedy, deciding one step at a time, which can wander on long tasks, and each step adds latency and tokens. That's why for longer tasks it's often combined with an explicit upfront plan, progress tracking and periodic reflection."

### [2] What planning strategies do agents use?
@tags planning, agents
@hook Plan-and-execute for structured tasks, reflection to learn from mistakes, search over alternatives for hard problems, and to-do lists for long horizons.
@say
"There are several strategies, and they trade flexibility against cost.

Step-by-step, as in ReAct, decides one action at a time. It's adaptive but can be short-sighted.

Plan-and-execute has the model produce a full plan first, then execute the steps, possibly with cheaper models, re-planning only when something fails or new information changes the picture. It's more efficient and easier to monitor for structured tasks.

Reflection adds a self-review step after an attempt or a failure: the agent critiques what went wrong and writes lessons into its context or memory, then tries again. It works best with concrete feedback, like failed tests.

Search-based approaches, like tree of thoughts or Monte Carlo tree search, explore several alternative reasoning paths and evaluate them, keeping the most promising. They're powerful for puzzles and hard problems but expensive.

In practice, for long-horizon agents, a very effective technique is simple: have the agent maintain an explicit, structured task list or progress file that it updates as it works and re-reads each step, which keeps it oriented and makes its progress visible to humans."

### [2] How do you give an agent memory?
@tags memory, agents, context
@hook Short-term memory is the context window. Long-term memory is an external store the agent writes to and retrieves from. Decide what deserves to be remembered.
@say
"I separate memory into layers.

Working memory is the current context window: the conversation, tool results and scratchpad for this task. It's managed with compaction, summarising older steps, and by keeping tool outputs small.

Task state is structured progress for the current task, like a plan, a to-do list, intermediate results and decisions made, stored outside the context, in a file or database, and re-injected so the agent can resume after interruptions or context resets.

Long-term memory persists across sessions. Semantic memory holds facts about the user, the domain or the environment, like preferences or project conventions. Episodic memory holds records of past tasks and their outcomes, useful for learning what worked. It's usually stored in a database or vector store and retrieved by relevance when needed, or loaded as a small curated memory file at the start of each session.

The hard parts are deciding what's worth storing, keeping memories accurate as things change, resolving contradictions, and privacy: users should be able to see and delete what's remembered, and one user's memory must never leak into another's context. I also evaluate memory: does recalling it actually improve task success?"

### [2] When are multi-agent systems worth it?
@tags multi-agent, orchestration
@hook Use several agents when a task naturally splits into independent parallel parts or needs isolated contexts. Otherwise one agent is cheaper and easier to debug.
@say
"A multi-agent system splits work across several LLM agents, typically an orchestrator that plans and delegates, and specialised worker agents or sub-agents that each handle a piece with their own instructions, tools and context.

They're worth it in a few situations. Parallelisable breadth: research across many sources, where sub-agents explore different directions at the same time and return condensed findings, which is faster and covers more ground. Context isolation: each sub-agent works in a clean context window on a focused task, so the main agent's context isn't flooded with details; it only receives a summary. And separation of concerns, like a separate reviewer agent that checks the work of a builder agent, or different tool permissions for different roles.

The costs are significant: many times the token usage of a single agent, coordination overhead, error propagation between agents, duplicated work, and much harder debugging and evaluation. Tasks that need tight shared context and lots of back-and-forth, like most coding on one feature, often work better with a single agent.

So I start with one agent, and introduce sub-agents for clearly separable, parallel or context-heavy sub-tasks, with clear task descriptions, output formats and boundaries for each."

### [2] What is the Model Context Protocol (MCP), and how does it work?
@tags mcp, protocol, tools
@hook A standard, like USB-C for AI apps: any MCP host can plug into any MCP server's tools, resources and prompts. It turns N times M custom integrations into N plus M.
@say
"MCP is an open protocol, introduced by Anthropic in late 2024 and now widely adopted across AI tools and vendors, that standardises how AI applications connect to external tools and data. Without it, every AI app needed a custom integration for every service, an N times M problem. With MCP, a service implements one server, and any compatible app can use it.

The architecture has three roles. The host is the AI application, like a chat app, an IDE or an agent. Inside it, an MCP client manages the connection to one server. The MCP server exposes capabilities from some system, like GitHub, a database, a file system or a company API.

Servers offer three main primitives. Tools are actions the model can call, like 'create issue' or 'run query', each with a name, description and JSON schema. Resources are data the application can read and provide as context, like files or records, identified by URIs. Prompts are reusable templates the user can pick, like slash commands.

Messages use JSON-RPC 2.0. There are two standard transports: stdio for local servers running as a subprocess, and Streamable HTTP for remote servers, which use OAuth-based authorisation. The value for engineers is reuse and ecosystem: build an integration once, and it works across many hosts, while keeping security decisions in the host and server."
@deep
```text
Host (AI app: chat, IDE, agent)
 ├── MCP client ──stdio──────────────▶ local server (filesystem, git)
 ├── MCP client ──Streamable HTTP────▶ remote server (GitHub, Jira, internal API)
 └── LLM sees: tools (model-controlled), resources (app-controlled), prompts (user-controlled)
```
Discovery and use, conceptually: the client lists the server's tools (`tools/list`), the host passes those definitions to the model, the model proposes a call, and the client sends `tools/call` with the arguments and returns the result to the model.

### [3] What changed in the MCP specification revision of 2026-07-28?
@tags mcp, protocol, 2026
@hook MCP became stateless: no initialize handshake, no protocol sessions. Every request carries its own version and capabilities, and servers must implement server/discover.
@say
"The 2026-07-28 revision made MCP stateless, which mainly helps remote servers scale behind ordinary load balancers.

In earlier revisions, up to 2025-11-25, a client opened a connection with an initialize handshake to negotiate the protocol version and capabilities, and Streamable HTTP used protocol-level sessions identified by an Mcp-Session-Id header, so requests had to reach the server holding that session.

In the new revision, the handshake and protocol sessions are gone. Every request carries the protocol version and client capabilities in its metadata, and the server accepts or rejects each request independently, returning an unsupported-version error if needed. Servers must implement a server/discover method that advertises their supported versions, capabilities and identity, which clients can call up front or use as a compatibility probe. If a server needs state across calls, it mints explicit handles and passes them as ordinary tool arguments.

Other notable changes: server-initiated requests, like asking the client for user input, now use a multi-round-trip pattern where the server returns an 'input required' result and the client retries with the answers; change notifications moved to a single subscriptions/listen stream; tasks moved out of the core into an official extension; tool lists should be returned in a deterministic order to help prompt caching; and Roots, Sampling and Logging are deprecated. For authorisation, Client ID Metadata Documents are now preferred over dynamic client registration. Many deployed servers still speak the older handshake-based versions, so clients need backward compatibility for a while."
@pro
Mention the practical consequence: a stateless remote MCP server can run as plain horizontally scaled HTTP replicas without sticky sessions, which makes it much easier to operate in Kubernetes or serverless environments.

### [2] MCP vs native function calling. What's the difference?
@tags mcp, tool calling
@hook Function calling is how a model asks for a tool. MCP is how tools are packaged, discovered and connected across apps. They work together.
@say
"They operate at different layers, and they're complementary.

Function calling is a model capability and API feature: you describe tools in the request, and the model responds with a structured call. It says nothing about where those tools come from or how they're implemented; each application wires its own tools directly into its code.

MCP is a protocol for packaging and connecting tools and context. An MCP server exposes tools, resources and prompts in a standard way; any MCP-compatible host can discover them at run time and connect, locally or remotely, with standard authorisation. Under the hood, the host still uses the model's function calling to let it invoke the MCP tools.

So the choice is about integration architecture. If I have a few tools specific to one application, defining them directly with function calling is simplest. If I want tools to be reusable across many AI applications and agents, maintained by the team that owns the underlying system, discoverable, and governed centrally, MCP is the better fit. A useful analogy: function calling is the model's ability to use a plug; MCP is the standard socket."

### [2] MCP vs A2A. How do they relate?
@tags mcp, a2a, multi-agent, protocols
@hook MCP connects an agent to tools and data. A2A connects agents to other agents, as peers that delegate tasks.
@say
"MCP standardises how an AI application or agent connects to tools and context: the agent is in control and calls tools that do well-defined things.

A2A, the Agent2Agent protocol, started by Google in 2025 and now hosted by the Linux Foundation, standardises how independent agents, possibly built by different vendors on different frameworks, communicate and collaborate as peers. An agent publishes an Agent Card, a JSON document at a well-known URL describing its skills, endpoint and authentication requirements. Another agent can discover it and send it a task. Tasks have a lifecycle, like submitted, working, input-required and completed, can be long-running with streaming updates, and produce artifacts as results. It's built on HTTP, JSON-RPC and server-sent events.

The key difference is opacity: an MCP tool is a function with a schema; an A2A agent is an autonomous system that reasons on its own, and the caller doesn't see its internals, tools or memory.

They're complementary: a travel-planning agent might use A2A to delegate to a partner's booking agent, and each agent uses MCP internally to reach its own tools and data. In practice, MCP adoption is much broader today; A2A matters most for cross-organisation agent ecosystems."

### [2] How do you design good tools for an agent?
@tags tool design, agents
@hook Tools are a user interface for the model. Few, well-named, clearly described, with helpful errors and concise outputs.
@say
"I treat tool design like designing an interface for a new colleague who can only read the documentation.

Clear names and descriptions: say what the tool does, when to use it and when not to, what each parameter means with examples and formats, and how it differs from similar tools. Ambiguity between overlapping tools is a top cause of wrong tool choices.

Right granularity: fewer, higher-level tools that match real tasks, like 'schedule_meeting', often beat many low-level ones that the agent must chain correctly, like 'list_users', 'list_events' and 'create_event'.

Constrained inputs: enums, required fields and strict schemas, so invalid calls are hard to make.

Concise, meaningful outputs: return what the agent needs, with human-readable identifiers, not huge raw payloads; support pagination and filtering; and truncate with a note when results are large.

Actionable errors: return messages that tell the model how to fix the call, like 'date must be in YYYY-MM-DD format', instead of a stack trace.

Safety: idempotent operations where possible, read-only versions of tools, explicit confirmation for destructive actions, and least privilege.

And I evaluate tools with the agent itself: run realistic tasks, read the transcripts to see where it misused tools, and iterate on the descriptions and design."

### [2] What are the common failure modes of agents, and how do you prevent them?
@tags agents, reliability, failure modes
@hook Loops, wrong tools or arguments, compounding errors, context overload, premature "done", and wandering off-task. Budgets, validation, verification and good context hygiene.
@say
"The failure modes I plan for:

Infinite or repetitive loops, like retrying the same failing call. Prevention: step and token budgets, timeouts, detection of repeated identical actions, and escalation to a human when stuck.

Wrong tool or invalid arguments. Prevention: clear tool descriptions, strict schemas, validation with helpful error messages, and fewer overlapping tools.

Compounding errors: an early mistake, like a wrong assumption or a misread result, carries through every later step. Prevention: checkpoints where the agent verifies intermediate results, and plans that are reviewed or re-evaluated.

Context overload: long tool outputs and history push out instructions or cause the model to lose track. Prevention: concise tool outputs, compaction, and sub-agents for large sub-tasks.

Premature or false success: claiming the task is done when it isn't, like saying tests pass without running them. Prevention: verify the outcome independently, by checking the actual system state or running the tests, never just trusting the final message.

Goal drift and unsafe actions, including from prompt injection in tool results. Prevention: least-privilege tools, approval gates for irreversible actions, and treating tool outputs as untrusted data.

And across all of these: full tracing of every step, so failures can be diagnosed and added to the eval suite."

### [2] How do you add guardrails and human-in-the-loop controls to an agent?
@tags guardrails, human in the loop, safety
@hook Gate actions by risk: read freely, write with checks, do irreversible or high-impact things only with human approval. Enforce it in code, not prompts.
@say
"I classify each tool and action by risk and apply controls proportionally.

Read-only actions, like searching or reading records, can run automatically within the user's permissions. Reversible writes, like drafting an email or creating a ticket, run automatically with validation and logging. High-impact or irreversible actions, like sending money, deleting data, sending external messages or deploying code, require explicit human approval: the agent pauses, shows exactly what it intends to do with the concrete parameters, and continues only when a person approves.

These controls are enforced in the tool layer and the orchestration code, never only by instructions in the prompt, because a prompt can be overridden by injection or ignored by mistake.

Other guardrails: input and output filters for harmful content and personal data; limits on spending, number of actions, rate and scope; allow-lists of domains or recipients; sandboxes for code execution with no network or credentials by default; and policy checks on arguments, like a refund amount not exceeding the order value.

Good human-in-the-loop design also means making approvals easy and informed, with a clear summary and diff, not a wall of JSON, otherwise people rubber-stamp them. And every action is logged for audit."

### [3] How do you evaluate an agent?
@tags evaluation, agents, harness
@hook Run realistic tasks in a reproducible sandbox, check the final state of the world, grade the trajectory, run multiple trials, and track cost and latency.
@say
"Agents are harder to evaluate than single calls because they take many steps, are non-deterministic, and can reach the right outcome in different ways.

I build an evaluation harness. A set of realistic tasks with clear success criteria, drawn from real usage and known hard cases. Each runs in a reproducible sandbox environment, with mocked or test instances of the tools and data, reset between runs.

Outcome-based grading comes first: check the actual end state, not the agent's claim. Did the ticket get the right status in the database? Do the tests pass? Is the file correct? Deterministic checks are preferred wherever possible.

Then trajectory analysis: did it use the right tools, avoid unnecessary or forbidden actions, recover from errors, and stay within budgets? This can be checked with rules and with an LLM judge reading the transcript, calibrated against human review.

Because agents are stochastic, I run each task several times and report pass rates. Metrics like pass at k, succeeding at least once in k tries, and pass to the power k, succeeding every time in k tries, capture reliability, which matters a lot for production.

I also track efficiency: steps, tokens, cost and wall-clock time per task. And I read transcripts regularly; failure analysis of real transcripts is where most improvements come from. In production, I add online signals like task completion, human escalation rate and user corrections."

### [2] How do you observe and debug agents in production?
@tags observability, tracing, agents
@hook Trace every run as a tree of spans: each model call, tool call, input, output, tokens and latency, tied to versions. Then you can replay and explain any failure.
@say
"Each agent run is captured as a trace: a tree of spans where every LLM call, tool call and retrieval is a span with its inputs, outputs, model and prompt version, token counts, latency, cost and errors. That lets me answer, for any bad outcome, exactly what the agent saw, what it decided and why it went wrong.

On top of traces I build dashboards and alerts: task success rate, escalation rate, steps and cost per task, tool error rates, loop detections, latency percentiles, and guardrail triggers. Sudden changes often point to a model update, a broken tool or a shift in user behaviour.

For debugging, I want to replay a failed run deterministically against the same versions, ideally with recorded tool responses, and then turn it into an eval case.

The tooling is maturing: OpenTelemetry now has semantic conventions for generative AI, so LLM and agent spans can flow into standard observability backends, alongside LLM-specific platforms like Langfuse, LangSmith, Arize Phoenix or Braintrust. Two cautions: traces contain user data and possibly secrets from tool outputs, so redaction, access control and retention policies are essential; and log volume is large, so sample wisely while keeping all failures."

### [3] How do you build long-running agents that work for hours?
@tags long-running, state, context management
@hook Persist state outside the model, checkpoint progress, compact context, use sub-agents, and make every step resumable and idempotent.
@say
"Long-running agents hit three walls: context limits, interruptions and drift. I design for each.

State outside the model: the plan, progress, decisions, and intermediate artefacts live in durable storage, like files, a database or a git branch, not just in the conversation. The agent re-reads them to orient itself, and a new session can pick up where the last left off.

Checkpointing and resumability: the orchestration persists after each step, so a crash, deploy or timeout doesn't lose work. Durable workflow engines like Temporal, or framework checkpointers, handle this. Tool calls should be idempotent, so a retried step doesn't, for example, send a duplicate email.

Context management: compact the history periodically into summaries that preserve key decisions and unresolved issues, clear old tool outputs, and delegate large sub-tasks to sub-agents with fresh contexts that return concise results.

Staying on track: an explicit task list that the agent updates, periodic self-checks against the original goal, and verification steps like running tests.

And oversight: progress reporting, budgets, and the ability for a human to pause, inspect, correct and resume. For asynchronous work, the agent should notify people when it needs input rather than blocking silently."

### [2] How do computer-use and browser agents work, and what are the risks?
@tags computer use, browser agents
@hook The model sees screenshots, decides where to click or type, and the harness executes the action. Powerful for apps without APIs, risky because every web page is untrusted input.
@say
"A computer-use agent operates a graphical interface like a person would. In a loop, the harness takes a screenshot, sometimes plus an accessibility tree or the page's DOM, and sends it to a multimodal model with the goal. The model decides on an action, like click at these coordinates, type this text, scroll or press a key. The harness executes it and captures the new screen, and the loop continues.

It's valuable for automating tasks in applications that have no API, legacy systems, testing user interfaces, and web research tasks.

The risks are significant. Reliability: it's slower and more brittle than APIs; layouts change, and actions can misfire. Prompt injection: every web page, email or document the agent sees is untrusted content, and hidden instructions could hijack it, like a page telling it to send data elsewhere. Unintended actions: purchases, sending messages or deleting data.

So I'd prefer APIs or structured tools whenever they exist, and for computer use: run in an isolated VM or container with minimal credentials, restrict the domains it can visit, require human confirmation for any purchase, submission or message, never let it enter passwords or payment details itself, log screenshots for audit, and treat everything it reads on screen as data, not instructions."

### [2] Should you use an agent framework or build on the raw API?
@tags frameworks, langgraph, architecture
@hook Start close to the raw API so you understand the loop. Adopt a framework when you need what it genuinely provides: state, checkpointing, orchestration, tracing.
@say
"Frameworks like LangGraph, the OpenAI Agents SDK, the Claude Agent SDK, CrewAI, LlamaIndex and Semantic Kernel provide building blocks: agent loops, tool integration, state management, checkpointing and resumability, multi-agent orchestration, streaming and tracing hooks.

The trade-off is abstraction. A framework can speed up development and give you robust plumbing, but it can also hide the actual prompts and control flow, make debugging harder, add dependency churn, and push you toward more complexity than the task needs.

My approach: for a new use case, I start with direct API calls and a simple loop, because an agent loop is not much code, and it makes me understand exactly what's sent to the model. If I adopt a framework, I make sure I can inspect the exact prompts and tool calls it sends.

I'd choose a framework when its specific features solve real problems: durable state and human-in-the-loop interrupts, as in LangGraph's graph and checkpointing model; a production agent harness with context management and tools already built, as with the agent SDKs; or team standardisation. In every case, the evaluation suite and tracing should be framework-independent, so changing frameworks or models doesn't mean losing the ability to measure quality."

### [3] How do AI coding agents work?
@tags coding agents, agents
@hook A tool-using loop over a real repository: search and read files, edit, run commands and tests, read the results, iterate. Tests are the feedback signal that makes it work.
@say
"A coding agent is an LLM in a loop with tools for working on a codebase: searching and reading files, editing or writing files, running shell commands such as builds, tests and linters, and sometimes using a browser or version control.

Given a task, it explores the repository to find relevant code, often using search tools rather than embedding the whole codebase, plans changes, edits files, then runs tests or the build and reads the output. Failures become feedback for the next iteration. That tight feedback loop, with tests and compilers as objective verifiers, is a big reason coding is where agents work best today.

Key design elements: context management, since codebases are larger than any context window, so the agent retrieves just-in-time, reads selectively and keeps notes; project instructions in a file, like conventions, build and test commands; sandboxing and permission modes for running commands; and checkpoints or git so changes can be reviewed and rolled back.

Evaluation uses benchmarks like SWE-bench, which gives agents real GitHub issues and checks whether hidden tests pass, plus internal task suites. Limitations I'd mention: agents can make plausible but wrong changes, over-engineer, or claim success without verifying, so human review of diffs remains essential, and the best results come from clear task specifications and good test coverage."

### [3] What security risks do MCP servers and tool integrations introduce?
@tags mcp, security, prompt injection
@hook Untrusted tool descriptions and outputs can carry injected instructions; over-broad tokens turn a confused agent into a confused deputy. Least privilege, review, isolation and per-user auth.
@say
"Connecting agents to tools through MCP or similar integrations expands the attack surface in several ways.

Tool poisoning: a malicious or compromised server can put hidden instructions in its tool descriptions, which the model reads, telling it to exfiltrate data or misuse other tools. Rug pulls are a variant where a server changes its tool definitions after it was approved.

Indirect prompt injection through tool outputs: content returned by a tool, like a web page, an email or a GitHub issue, may contain instructions that hijack the agent. Combined with access to private data and a way to send data out, this is sometimes called the lethal trifecta, and it's the core risk.

Confused deputy and over-privileged tokens: a server acting with broad credentials can be tricked into doing things on behalf of a user who shouldn't have that access. The spec forbids token passthrough, meaning servers must not accept and forward tokens that weren't issued for them, and remote servers should use proper OAuth-based authorisation scoped per user.

Local server risks: a stdio server runs with the user's privileges on their machine, so installing an untrusted one is like running untrusted code.

Mitigations: only install vetted servers from trusted sources and pin versions; review tool descriptions and alert on changes; apply least privilege, with per-user, narrowly scoped credentials; run servers in sandboxes or containers; treat all tool output as untrusted data; require human approval for sensitive actions; and log every tool call for audit."
