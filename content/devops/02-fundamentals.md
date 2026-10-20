@section culture | DevOps and SRE Fundamentals
@blurb The concepts behind the tools: CI vs CD, DORA metrics, SLOs and error budgets, toil, and how DevOps, SRE and platform engineering relate.

### [1] What is DevOps?
@tags devops, culture, calms
@hook A culture and set of practices where the people who build software also run it, with automation and fast feedback. Not a job title or a tool.
@say
"DevOps is a set of cultural practices and technical habits that bring development and operations together, so teams can deliver changes quickly, safely and reliably. Before DevOps, developers threw code 'over the wall' to operations, which created slow releases, blame and fragile systems.

A useful way to describe it is CALMS. Culture: shared ownership of the whole lifecycle, 'you build it, you run it', and blameless learning from failures. Automation: CI/CD, infrastructure as code and automated testing, so changes are repeatable and fast. Lean: small batches, limiting work in progress, removing waste and waiting. Measurement: tracking delivery and reliability metrics, like the DORA metrics, to improve with data. Sharing: knowledge, tools and responsibilities shared across teams.

The tools, like pipelines, containers and Kubernetes, support it, but buying tools doesn't make an organisation DevOps. The outcome is what matters: frequent, low-risk releases and fast recovery when things go wrong."

### [1] How do DevOps and Agile relate?
@tags devops, agile
@hook Agile speeds up building software in small increments. DevOps extends that flow all the way to production and operations.
@say
"Agile focuses on how teams plan and build software: short iterations, close collaboration with customers, and responding to change. It made development faster and more adaptive.

But if a team finishes features every two weeks and then waits months for a release, or a deployment takes a weekend of manual work, the value still doesn't reach users quickly. DevOps extends Agile's ideas beyond development, across testing, release, infrastructure and operations, so the whole path from commit to production is fast and reliable, and feedback from production flows back to the team.

So they're complementary: Agile shortens the planning and building loop, DevOps shortens the delivery and feedback loop. A team can be Agile without DevOps, but it will hit a bottleneck at release time."

### [1] Continuous integration vs continuous delivery vs continuous deployment?
@tags ci, cd, definitions
@hook CI: merge and test constantly. Continuous delivery: every change is releasable, a human presses the button. Continuous deployment: no button, it ships automatically.
@say
"Continuous integration means developers merge small changes into the main branch frequently, at least daily, and every merge triggers an automated build and test run. Problems are caught within minutes, and the main branch stays healthy.

Continuous delivery means every change that passes the pipeline is automatically packaged and deployed to a production-like environment, so it's always in a releasable state. Releasing to production is a business decision triggered manually, often with one click or an approved pull request.

Continuous deployment goes a step further: every change that passes all the automated checks goes to production automatically, with no manual approval. It requires strong automated testing, monitoring, progressive rollouts like canaries, and fast automated rollback.

Many organisations practise continuous delivery for most services, and continuous deployment for services with excellent test coverage and low blast radius."

### [2] What are the DORA metrics?
@tags dora, metrics, performance
@hook Two speed metrics (deployment frequency, lead time for changes) and two stability metrics (change failure rate, time to restore). Elite teams are fast and stable at once.
@say
"The DORA metrics come from the DevOps Research and Assessment programme, years of research into what distinguishes high-performing software delivery teams.

The four key metrics are: Deployment frequency, how often you successfully release to production. Lead time for changes, how long it takes a commit to reach production. Change failure rate, the percentage of deployments that cause a failure in production needing a fix or rollback. And time to restore service, sometimes called failed deployment recovery time, how long it takes to recover from a failure in production. More recent reports added a rework rate, unplanned deployments made to fix production issues, as a further stability measure.

The key finding is that speed and stability aren't a trade-off: elite performers deploy on demand, many times a day, with lead times under a day, and also have low failure rates and recover within an hour. Small batches, trunk-based development, automated testing and good observability drive both.

When using them, I'd measure at the team or service level, track trends rather than compare teams, and never turn them into targets for individuals, because that invites gaming."

### [1] DevOps vs SRE vs platform engineering?
@tags sre, platform engineering, roles
@hook DevOps is the philosophy. SRE implements it with reliability engineering, SLOs and error budgets. Platform engineering builds the self-service paved road.
@say
"They overlap heavily, but each has a different emphasis.

DevOps is the broad culture and set of practices: shared ownership, automation and fast feedback between development and operations.

Site reliability engineering, which came from Google, is a concrete implementation that treats operations as a software engineering problem. SREs define reliability targets with SLIs and SLOs, use error budgets to balance release speed against reliability, cap and automate toil, run incident response and blameless post-mortems, and do capacity planning. Google's phrase is 'class SRE implements interface DevOps'.

Platform engineering builds and runs an internal developer platform: self-service tools, golden paths and paved roads that let product teams provision infrastructure, create services, deploy and observe them without becoming experts in Kubernetes or cloud networking. The platform is treated as a product, with developers as its customers. Tools like Backstage, Crossplane and Argo CD are common.

In interviews I'd check which flavour the role really is, because the questions shift: SRE roles lean on SLOs and incidents, platform roles on developer experience and abstractions, and DevOps roles on pipelines and infrastructure."

### [1] What are SLIs, SLOs and SLAs?
@tags sre, slo, sla, sli
@hook SLI: what you measure. SLO: the internal target. SLA: the contractual promise with penalties, deliberately looser than the SLO.
@say
"A service level indicator is a carefully chosen measurement of the service's behaviour as users experience it. Typically a ratio of good events to total events, like the proportion of requests that succeed, or the proportion served in under 300 milliseconds.

A service level objective is the target for an SLI over a time window, like '99.9 percent of requests succeed over a rolling 30 days'. It's an internal goal that the team uses to make decisions.

A service level agreement is a contract with customers that specifies consequences, usually service credits or refunds, if the promised level isn't met. It's set looser than the SLO, say 99.5 percent, so the team gets an early warning and can react before contractual penalties kick in.

Good SLIs measure what users care about, ideally close to the user, like at the load balancer or with synthetic checks, rather than internal metrics like CPU. And not every service needs an SLA, but every important service benefits from SLOs."

### [2] What is an error budget? What does 99.9% availability mean in real numbers?
@tags sre, error budget, slo
@hook The error budget is 100% minus the SLO: the unreliability you're allowed to "spend". 99.9% over 30 days is about 43 minutes.
@say
"The error budget is the amount of unreliability an SLO allows: 100 percent minus the SLO. With a 99.9 percent availability SLO, the budget is 0.1 percent of requests, or of time. Over a 30-day window, 0.1 percent of 43,200 minutes is about 43 minutes of full downtime, or the equivalent in partial failures. 99.99 percent allows about 4.3 minutes a month.

The power of the error budget is that it turns reliability into a shared, objective decision tool between product and engineering. While budget remains, the team can ship features, run experiments and take reasonable risks. When the budget is exhausted, the agreed error budget policy kicks in: for example, freeze non-critical releases, and redirect effort to reliability work, like fixing the causes of recent incidents, until the service is back within its SLO.

It also tells you not to over-invest: if a service consistently uses almost none of its budget, you might be moving too slowly, or the SLO might be stricter than users need. 100 percent is never the right target, because every extra nine costs a lot and users can't tell the difference beyond a point, since their own networks and devices are less reliable than that."
@deep
| SLO | Allowed downtime per 30 days | Per year |
|---|---|---|
| 99% | 7.2 hours | 3.65 days |
| 99.5% | 3.6 hours | 1.83 days |
| 99.9% | 43.2 minutes | 8.77 hours |
| 99.95% | 21.6 minutes | 4.38 hours |
| 99.99% | 4.3 minutes | 52.6 minutes |

Burn rate is how fast you are spending the budget relative to plan. A burn rate of 1 uses exactly the whole budget over the window; a burn rate of 14.4 sustained for one hour uses 2% of a 30-day budget, a common threshold for paging.

### [2] How would you define an SLO for a payment processing service?
@tags slo, design, payments
@hook Start from the user journey, pick SLIs for success and latency measured at the edge, set achievable targets with a window, and attach a policy to the error budget.
@say
"I'd start from what users and the business care about: a customer submits a payment and it either completes correctly and quickly, or fails clearly. Partial or duplicate charges are the worst outcome.

SLIs: availability, the proportion of payment requests that return a successful or correct, non-5xx response, excluding legitimate declines like insufficient funds, which are correct behaviour; latency, the proportion of payment requests completed within, say, 1 second; and for this domain, a correctness indicator, like the proportion of payments reconciled without discrepancy, measured by a reconciliation job.

I'd measure at the API gateway or load balancer, closest to the user, and use synthetic transactions to catch failures when traffic is low.

Targets: based on historical performance and business needs, say 99.95 percent availability and 99 percent of requests under 1 second, over a rolling 28 or 30-day window. I'd start slightly below current performance so the target is achievable, then tighten.

Policy: alert with multi-window burn-rate alerts, page when the budget burns fast, ticket when it burns slowly; and if the budget is exhausted, freeze risky releases and prioritise reliability fixes. External dependencies like the card networks get their own SLIs, so we can see where failures come from."

### [1] What is toil, and why do SREs try to limit it?
@tags sre, toil, automation
@hook Manual, repetitive, automatable work with no lasting value that grows with the service. Cap it and automate it away.
@say
"Toil is operational work that is manual, repetitive, automatable, tactical rather than strategic, has no enduring value, and grows linearly as the service grows. Examples: manually restarting a service when it hangs, resizing disks by hand, copying logs to answer the same support question, or running a manual checklist for every deployment.

It's not the same as all operational work: incident response or designing a migration isn't toil, and neither are meetings, which are overhead.

SREs limit it, with Google's guideline being under 50 percent of an SRE's time, because toil doesn't scale: if the service doubles, the toil doubles, and the team ends up unable to do any engineering. It's also demoralising and error-prone.

So I track it, roughly measuring how much time goes to it, prioritise automating the most frequent and painful items, fix root causes so the work isn't needed at all, and build self-service tools so other teams don't need to file tickets for routine requests."

### [1] What does "shift left" mean?
@tags shift left, quality, security
@hook Move testing, security and quality checks earlier in the lifecycle, where problems are cheapest to fix.
@say
"Shift left means moving activities like testing, security checks and quality checks earlier in the software lifecycle, 'left' on a timeline that runs from design to production.

The reasoning is that defects are far cheaper to fix when found early: a vulnerable dependency flagged in the developer's pull request takes minutes to fix, while the same issue found in production can mean an incident, an emergency patch and possibly a breach.

In practice it means: linting, unit tests and static analysis on every commit; security scanning of code, dependencies, container images and infrastructure-as-code in the CI pipeline; pre-commit hooks for secrets and formatting; policy checks on Terraform plans before apply; threat modelling at the design stage; and giving developers fast feedback in their own tools.

It doesn't mean dumping all responsibility on developers. Good shift-left provides automation and sensible defaults, so the secure, correct path is the easy one. And it complements 'shift right' practices, like monitoring, canary analysis and chaos testing in production."

### [1] Immutable vs mutable infrastructure? Pets vs cattle?
@tags immutable infrastructure, iac
@hook Mutable: patch servers in place and they drift. Immutable: never change, replace with a freshly built image. Cattle, not pets.
@say
"With mutable infrastructure, servers are long-lived and changed in place: you SSH in, install updates, edit configs. Over time each server accumulates unique changes, so-called configuration drift, and you end up with 'snowflake' servers nobody can reproduce, which makes failures and scaling risky.

With immutable infrastructure, you never modify running servers. To change anything, you build a new image, like a container image or a machine image built with Packer, test it, and replace the old instances with new ones. Rollback means redeploying the previous image. Everything is reproducible from code.

The 'pets versus cattle' analogy captures it: pets have names, are unique and are nursed back to health when sick; cattle are numbered and identical, and when one is sick, it's replaced. Modern infrastructure treats servers and containers as cattle: automated, disposable and identical.

Containers and Kubernetes push you naturally toward immutability. Stateful data still needs care, kept on managed services or persistent volumes separate from the disposable compute."

### [2] What is the Twelve-Factor App?
@tags twelve factor, cloud native, design
@hook A checklist for cloud-ready services: config in the environment, stateless processes, backing services as attachments, logs as streams, dev and prod alike.
@say
"The Twelve-Factor App is a methodology, originally from Heroku, for building applications that are easy to deploy, scale and operate in the cloud. The factors I find most important day to day:

Config in the environment: settings like database URLs and credentials come from environment variables or a secrets store, not from code, so the same build runs in every environment.

Build, release, run as separate stages: build one immutable artefact, combine it with environment config to make a release, then run it. Build once, deploy many.

Stateless processes: no local state between requests; sessions and files go to backing services, so instances can be added, removed or replaced freely.

Backing services as attached resources: databases, queues and caches are accessed via URLs and can be swapped without code changes.

Disposability: fast startup and graceful shutdown on SIGTERM, which is exactly what Kubernetes rolling updates rely on.

Logs as event streams: write to stdout and let the platform collect and route them.

Dev and prod parity: keep environments as similar as possible.

The others cover a single codebase per app, explicitly declared dependencies, port binding, scaling out via processes, and running admin tasks as one-off processes. Most of this maps directly onto containers and Kubernetes."

### [2] How do you measure whether a DevOps transformation is working?
@tags metrics, transformation, leadership
@hook Track DORA delivery and stability metrics, plus reliability, developer experience and business outcomes. Trends, not targets.
@say
"I'd measure outcomes across a few dimensions, before and after, as trends.

Delivery performance: the DORA metrics, meaning deployment frequency, lead time for changes, change failure rate and time to restore.

Reliability: SLO attainment, incident count and severity, and customer-facing downtime.

Developer experience: time to set up a new service or environment, build and pipeline duration, time spent waiting on other teams or tickets, and periodic developer surveys. Frameworks like SPACE help cover satisfaction and collaboration, not just activity.

Efficiency: toil hours, cost per deployment or per environment, and cloud cost relative to usage.

Business outcomes: time from idea to customer, and how quickly the company can respond to incidents or market changes.

The cultural signals matter too: are post-mortems blameless and acted on, do developers own their services in production? I'd avoid vanity metrics like number of pipelines or tools adopted, and avoid using the metrics to rank teams, because that leads to gaming and destroys trust."
