@section modern | Modern Engineering: AI Tools, Cloud and Craft
@blurb The 2026 questions: working with AI assistants, reading unfamiliar code, cloud basics and performance work.

### [1] How do you use AI coding tools in your work, and what are the risks?
@tags ai tools, productivity, 2026
@hook Use AI to go faster on the boring parts while keeping ownership of design, correctness and security.
@say
"I use AI assistants daily, but deliberately. They're great for boilerplate and scaffolding, writing first drafts of tests, explaining unfamiliar code or error messages, translating between languages or frameworks, regex and SQL drafts, and quick prototypes. For larger tasks, I use agentic tools that can edit several files and run the tests, but I give them a clear plan and small, reviewable steps.

The risks are real, so I manage them. AI output can be confidently wrong: invented APIs, subtle logic errors, missing edge cases. It can introduce security issues, like SQL built with string formatting or outdated crypto. It can suggest outdated library versions or patterns. And there's a privacy risk if proprietary code or secrets are pasted into tools the company hasn't approved.

So my rules are: I only accept code I understand and could have written myself; I review it as carefully as a colleague's pull request, or more; tests and CI are the judge, not the AI's confidence; and I follow the company's policy on which tools and data are allowed. Used that way, it makes me noticeably faster without lowering quality."
@pro
Give one concrete example of AI being wrong and how you caught it. It proves calibrated trust rather than blind enthusiasm.

### [2] How do you make sure AI-generated code is correct and secure?
@tags ai tools, code review, testing
@hook Treat it as untrusted code from a fast stranger: read it, test it, scan it, and check every API it calls actually exists.
@say
"I treat AI-generated code as untrusted input from a very fast contributor I've never met.

First, I define correctness before generating: what the function should do, its edge cases, ideally as tests. Then I read every line of the output. I check that the APIs and packages it uses actually exist and are current, because hallucinated or look-alike package names are a known supply-chain attack vector. I check input validation, error handling and resource cleanup, and look for classic security problems: injection, missing authorisation checks, secrets in code, weak crypto.

Then I verify behaviour: run the tests, add edge-case tests the AI didn't think of, and run it against realistic input. In CI, the same gates apply as for any code: linters, static analysis, dependency scanning and secret scanning.

And for anything non-trivial, I ask the AI to explain its reasoning or suggest failure cases. If the explanation doesn't match the code, that's a red flag."

### [2] In a code comprehension round, you're given a large unfamiliar codebase. How do you approach it?
@tags code reading, onboarding, 2026
@hook Start from the outside: what it does, how it runs, where a request enters. Follow one real flow end to end before reading anything else.
@say
"I don't try to read everything. I start from the outside in.

First, the big picture: the README, the folder structure, the build files and dependencies, and the configuration, to learn what the system does, what it's built with and how it runs.

Then I find the entry points: the main function, the HTTP routes or controllers, message consumers or CLI commands. I pick one concrete, important flow, like 'create an order', and trace it end to end: from the route, through the service layer, into the data access code and back. Following one real path teaches me the architecture and conventions faster than reading files alphabetically.

Tests are my second map: they show how components are meant to be used and what behaviour is expected. If I can run the code, I set a breakpoint or add logging and step through the flow, which beats static reading. Git history and blame show why tricky code exists.

Throughout, I narrate what I'm finding and my hypotheses, like 'this looks like a repository pattern, so I expect the SQL to be in this folder', and I ask the interviewer to confirm assumptions. An AI assistant is useful here for summarising modules, but I verify its summary against the code."

### [1] What are IaaS, PaaS, SaaS and serverless?
@tags cloud, basics
@hook The higher you go, the less you manage. IaaS: you get VMs. PaaS: you bring code. SaaS: you just use it. Serverless: you bring a function and pay per call.
@say
"They describe how much of the stack the cloud provider manages for you.

With IaaS, Infrastructure as a Service, you rent virtual machines, networks and storage, like AWS EC2 or Azure Virtual Machines. You manage the operating system, runtime, patching and scaling. Maximum control, maximum responsibility.

With PaaS, Platform as a Service, you deploy your application code and the platform handles servers, runtime, scaling and patching, like Azure App Service, Heroku or Google App Engine.

With SaaS, Software as a Service, you just use finished software over the internet, like Gmail, Slack or Salesforce.

Serverless, or Functions as a Service, like AWS Lambda or Azure Functions, goes further than PaaS: you deploy individual functions that run in response to events, scale automatically from zero, and you pay only per execution. Managed services like serverless databases and queues follow the same idea.

Containers on managed Kubernetes, like AKS, EKS or GKE, sit somewhere between IaaS and PaaS: you control the workloads, the provider runs the control plane."

### [2] What are the trade-offs of serverless functions?
@tags serverless, cloud
@hook Great for spiky, event-driven work and zero idle cost. Watch out for cold starts, time limits, statelessness and cost at steady high load.
@say
"The advantages: no servers to manage or patch, automatic scaling from zero to thousands of concurrent executions, paying only for actual use, which is great for spiky or low-traffic workloads, and a natural fit for event-driven work like processing uploads, queue messages, webhooks and scheduled jobs.

The trade-offs: cold starts, the extra latency when a new instance initialises, which matters for latency-sensitive APIs; mitigations include provisioned concurrency, keeping deployment packages small and choosing fast-starting runtimes. Execution time limits, so long-running work doesn't fit. Statelessness, so all state goes to external services. Harder local testing and debugging. Vendor lock-in through triggers and integrations. And cost: at steady, high throughput, always-on containers or VMs are often much cheaper than paying per invocation.

So I'd use serverless for glue code, event processing, low or unpredictable traffic APIs and scheduled tasks, and containers for steady high-traffic services or anything long-running."

### [1] Why do developers use Docker and containers?
@tags docker, containers
@hook Package the app with everything it needs so it runs the same on a laptop, in CI and in production.
@say
"A container packages an application with its runtime, libraries and configuration into a standard image that runs the same way everywhere. That kills 'it works on my machine' problems.

For developers, the main benefits are: a consistent environment across laptops, CI and production; fast onboarding, since one docker compose up starts the app with its database, cache and message broker; isolation, so different projects can use different versions of Node or Postgres without conflict; and fast, reproducible deployments, since the image you tested is exactly the image you ship.

Compared with virtual machines, containers share the host's kernel instead of running a full guest OS, so they start in seconds and are much lighter. The Dockerfile describes how to build the image, and an orchestrator like Kubernetes runs and scales containers in production. I'd mention basic hygiene too: small base images, multi-stage builds and not running as root."

### [2] Monorepo vs polyrepo?
@tags repository, tooling
@hook Monorepo: one repo, atomic cross-project changes, needs strong tooling. Polyrepo: independent repos, clear ownership, harder to change things across them.
@say
"A monorepo keeps many projects, services and libraries in one repository. Benefits: atomic changes across projects in a single commit, like updating a shared library and all its callers together; easy code sharing and consistent tooling; and one place to search. Costs: it needs build tooling that only builds and tests what changed, like Nx, Turborepo, Bazel or path-based CI triggers, otherwise CI gets slow; access control is coarser; and the repo can get very large.

A polyrepo gives each service or library its own repository. Benefits: clear ownership, independent versioning and release cycles, simple per-repo CI, and fine-grained access. Costs: cross-cutting changes need coordinated pull requests across many repos, shared code needs to be versioned and published as packages, and tooling and standards drift apart.

Google and Meta famously use monorepos with heavy custom tooling. For a small team I'd lean monorepo for simplicity; for many independent teams with separate release cycles, polyrepo, or a few domain-aligned monorepos, can be cleaner."

### [2] How do you approach a performance problem?
@tags performance, profiling
@hook Measure, find the bottleneck, fix the biggest one, measure again. Never optimise on a hunch.
@say
"First I define the problem in numbers: which operation, what latency or throughput, at what percentile, and what the target is. 'Checkout p99 is 2.5 seconds and should be under 800 milliseconds' is actionable; 'it feels slow' isn't.

Then I measure where time actually goes. In a distributed system, traces show which service or query dominates. Within a service, a profiler shows which functions consume CPU or allocate memory. Database tools like EXPLAIN ANALYZE show slow queries.

The bottleneck is usually one of a few things: slow database queries or N+1 patterns, too many network round trips, missing caching, inefficient algorithms or data structures, excessive allocation and GC pressure, lock contention, or blocking I/O on request threads. I fix the biggest contributor first, because optimising something that takes 2 percent of the time is wasted effort, which is Amdahl's law in practice.

After each change, I measure again under the same conditions, ideally with a benchmark or load test, and I keep performance tests or alerts in place to catch regressions. And I weigh the cost: an optimisation that makes code much harder to maintain needs a real payoff."

### [1] How do you stay up to date with technology?
@tags learning, growth
@hook A system, not vibes: a few trusted sources, hands-on experiments, and sharing what you learn.
@say
"I keep a small, sustainable routine rather than trying to follow everything.

I follow a few high-signal sources: engineering blogs from companies like Cloudflare, Netflix and Stripe, release notes for the tools I use, a couple of newsletters, and conference talks on topics I'm working on.

But reading isn't enough, so I learn by building: when something looks useful, I try it in a small side project or a spike at work. For example, [recent example: when I wanted to understand Kubernetes autoscaling, I set up a small cluster and load-tested it].

And I share what I learn, through short write-ups or demos for my team or study group, because explaining something is the best test of whether I understand it. I also try to separate hype from substance by asking what problem a new tool solves and what it costs, before adopting it."
