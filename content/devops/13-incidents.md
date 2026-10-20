@section incident | Incident Management and Reliability
@blurb The scenario questions: outages, spikes, slow services, post-mortems, on-call health and keeping promises to users.

### [1] Walk me through your incident response process.
@tags incident response, process
@hook Detect, triage and declare, assemble roles, mitigate first, communicate on a rhythm, resolve, then a blameless post-mortem with owned actions.
@say
"Detection: ideally an alert fires on user-facing symptoms, like an SLO burn-rate alert, before customers report it.

Triage and declare: the on-call engineer acknowledges, assesses impact and severity using clear criteria, and declares an incident, opening a dedicated channel or bridge. Declaring early is cheap; declaring late is expensive.

Roles: for anything significant, an incident commander who coordinates and makes decisions, rather than debugging; operations or subject-matter responders who investigate and act; and a communications lead who updates stakeholders and the status page on a regular rhythm.

Mitigate first: the priority is restoring service, not finding the root cause. The fastest mitigations are usually rolling back a recent change, failing over, scaling up, disabling a feature flag, or shedding load. Root cause can wait until users are safe.

Throughout, keep a timeline in the incident channel: what was observed, what was tried and when, and decisions made.

Resolution: confirm recovery with metrics and user-facing checks, then stand down.

Afterwards, a blameless post-mortem within a few days: timeline, impact, contributing factors, what went well and badly, and action items with owners and due dates, which are tracked to completion. The goal is that the same class of incident doesn't happen again."

### [2] A production deployment just caused a spike in error rates. Walk me through your response.
@tags scenario, deployment, rollback
@hook Confirm the correlation, roll back immediately, verify recovery, then investigate with the evidence you preserved. Don't debug forward in production while users suffer.
@say
"First, I confirm the correlation quickly: the error spike starts right at the deploy time, on the services that were deployed, which deploy markers on the dashboards make obvious.

Then I mitigate immediately by rolling back to the previous version, through the pipeline or a GitOps revert, or by turning off the feature flag if the change was behind one. If it's a canary, I abort it. I don't try to debug and fix forward while users are affected, unless rollback is impossible, for example because of a non-backward-compatible database migration, in which case the fix-forward needs to be very small and well understood.

I declare an incident if the impact warrants it and post updates for stakeholders.

Then I verify recovery: the error rate returns to baseline, and synthetic checks pass.

Then I investigate with the evidence: logs, traces and error messages from the bad version, and the diff of what changed, code, configuration, dependencies and infrastructure. I reproduce it in staging if possible.

Finally, the post-incident work: why didn't tests, staging or the canary catch it? Typical actions are adding a regression test, adding the failing case to the smoke tests, making the canary analysis check the metric that broke, or making rollbacks automatic on error-rate spikes."

### [2] p99 latency just jumped five times higher. Walk me through it.
@tags scenario, latency, troubleshooting
@hook Scope it, check recent changes first, then follow the request: traces show which hop got slow, then saturation and dependencies explain why. Mitigate while investigating.
@say
"First, scope and impact: is it all endpoints or one, all regions or one, all instances or a subset, and how is the error rate? A p99 jump with p50 stable means a slow subset of requests; both jumping means something broad.

Second, what changed: recent deploys, config changes, feature flags, infrastructure changes, traffic patterns, like a spike or a new big customer, and dependencies' status pages. Change is the most common cause, and rollback is the fastest mitigation.

Third, follow the request: traces of slow requests, compared with fast ones, show which span got slower, like a database query, a call to another service, or time spent in the app itself.

Fourth, check saturation and resources for that component: CPU and CPU throttling, memory and garbage collection pauses, thread and connection pool exhaustion, which shows as time waiting for a connection, queue depths, disk I/O, and database metrics, like lock waits, slow queries and replication lag.

Fifth, look for retries and timeouts that amplify load, and noisy neighbours on shared nodes.

Meanwhile, mitigate: roll back, scale out, shed or rate-limit non-critical traffic, or fail over. After, add an alert or dashboard that would have pointed at the cause faster."

### [2] The site is down. What do you do in the first five minutes?
@tags scenario, outage, first response
@hook Confirm and scope, declare and assemble, check what changed, mitigate with the biggest safe lever, communicate. Don't go down a rabbit hole alone.
@say
"Minute one: confirm it's real and scope it. I check from outside, like curl and synthetic checks, plus our dashboards: is it everyone or a region, all pages or some, and since when? I rule out a monitoring false positive.

Minute two: declare the incident and get help. Open the incident channel, page the incident commander or the relevant owners, and post a first status update, even if it's just 'investigating'. Customer-facing status pages get updated early.

Minute three: what changed? Recent deploys, config or infrastructure changes, certificate expiry, DNS changes, cloud provider incidents and dependency status pages. Most outages correlate with a change.

Minute four: check the layers quickly from the edge inward: DNS, CDN, load balancer health and target status, application pods, and the database. Error messages at each layer usually point to the broken one.

Minute five: mitigate with the biggest safe lever available: roll back the recent change, fail over to another region or replica, scale up, or turn off the feature. Then verify recovery.

Throughout, I narrate actions in the incident channel to keep a timeline, and I'm careful not to make several changes at once, so we know what fixed it."

### [1] What is a blameless post-mortem, and what goes into one?
@tags postmortem, culture, learning
@hook Focus on how the system allowed the failure, not who to blame. Timeline, impact, contributing factors, what went well, and owned, tracked action items.
@say
"A blameless post-mortem is a written review of an incident that focuses on understanding how the system, meaning technology, processes and organisation, allowed the failure to happen, rather than on blaming individuals. People act reasonably given the information and tools they had; if one person's mistake can take down production, the real problem is the system that allowed it. Blamelessness creates psychological safety, so people share what actually happened, which is the only way to learn.

A good post-mortem includes: a summary; the impact, meaning who was affected, how long, and how badly, ideally with numbers and error budget consumed; a detailed timeline of detection, response and resolution; the contributing factors, using techniques like the five whys, while recognising that complex incidents rarely have a single root cause; what went well and what didn't, including detection and response; where we got lucky; and action items, each with an owner, a priority and a due date, targeting prevention, faster detection and faster mitigation.

Then it's reviewed with the wider team and shared broadly, and the action items are tracked to completion, because a post-mortem whose actions are never done is just paperwork."

### [2] What does an incident commander do? How do you define severity levels?
@tags incident commander, severity, process
@hook The commander coordinates, decides and communicates; they don't debug. Severity levels need measurable triggers, so nobody argues about them mid-incident.
@say
"The incident commander is the single point of coordination. They establish roles and delegate tasks, keep the response focused on mitigation, make decisions when there's disagreement, like 'we're rolling back now', make sure communication happens on a regular cadence, track who's doing what, and decide when the incident is resolved. Critically, the commander doesn't do hands-on debugging, because someone needs to keep the big picture while responders are heads-down. They can also escalate, bring in more people or hand over the role during long incidents.

Severity levels should be defined in advance with measurable triggers. For example: SEV1, critical, means a full outage of a core service, data loss or a security breach, or a large share of customers affected; it means all hands, executives informed, and updates every 30 minutes. SEV2 means major degradation or a key feature broken for many users, or an SLO burning fast. SEV3 means a minor issue with limited impact or a workaround. SEV4 is low impact and handled through normal tickets.

Clear definitions avoid debating severity during the incident, drive the right level of response and communication, and give consistent data for reviewing trends. Teams should feel free to declare high and downgrade later."

### [1] What are MTTD, MTTR and MTBF? Is MTTR a useful metric?
@tags metrics, mttr, reliability
@hook Mean time to detect, to recover (or restore), and between failures. Useful for trends, misleading as targets, so pair them with impact and SLOs.
@say
"MTTD, mean time to detect, is how long it takes from when a problem starts to when we know about it. MTTR usually means mean time to recover or restore, from detection, or from the start, until service is back. MTBF, mean time between failures, is the average time between incidents. Together they describe reliability: fail less often, notice faster, recover faster.

They're useful for spotting trends: if detection time is consistently long, invest in alerting; if recovery is slow, invest in rollbacks, runbooks and automation.

But they have real limitations. Incidents vary hugely in size and type, so averages are dominated by a few outliers and say little about any single incident. Definitions of when an incident started or ended vary, and they're easy to game, like closing incidents early or not declaring small ones. They also don't capture impact: two hours of minor degradation and two hours of total outage count the same.

So I'd treat them as a rough trend indicator, alongside SLO attainment and error budget consumption, which directly measure user impact, and the qualitative learnings from post-mortems. The DORA research now uses 'failed deployment recovery time' rather than a generic MTTR, focusing specifically on recovering from bad changes."

### [2] What does a healthy on-call rotation look like? What if the team is burning out?
@tags on-call, burnout, sre
@hook Enough people, sustainable shifts, a small number of actionable pages, good runbooks, compensation, and a feedback loop that fixes the causes of pages.
@say
"A healthy rotation has enough people that each person is on call around one week in four to eight, ideally with a primary and a secondary; reasonable shifts, with follow-the-sun handoffs across time zones where possible so nobody is woken nightly; a manageable number of pages, Google's guidance is at most two incidents per 12-hour shift, so each can be handled properly and followed up; every alert actionable with a runbook; clean handoffs between shifts; compensation, whether pay or time off; and the authority to fix problems, not just survive them.

If the team is burning out, I'd first quantify it: pages per shift, how many were actionable, out-of-hours pages and time spent on interrupts. Then act: delete or demote noisy and non-actionable alerts; fix the top recurring causes of pages, prioritised as engineering work, and invoke the error budget policy if reliability is the issue; automate common remediations; improve runbooks; and grow or rebalance the rotation, including making sure development teams share responsibility for the services they build.

If the structural causes are beyond the team, like too many services for too few people or no time allocated for fixes, I'd escalate with the data. Burnt-out on-call engineers make mistakes and leave, which makes reliability worse."

### [2] The error budget is exhausted halfway through the month. What happens?
@tags error budget, slo, policy
@hook Follow the error budget policy agreed in advance: slow or freeze risky releases, shift effort to reliability work, and recover the budget before resuming normal velocity.
@say
"This is exactly the situation the error budget policy exists for, and it should have been agreed in advance between engineering and product, so it's not a negotiation in the moment.

Typical policy steps: freeze or slow down non-essential releases for that service, allowing only bug fixes, security patches and reliability improvements, since changes are the most common cause of incidents; redirect the team's engineering effort to reliability, like fixing the causes of the incidents that consumed the budget, according to the post-mortems; possibly add extra review or testing gates for changes in that period; and resume normal feature work once the service is back within its SLO over the rolling window.

I'd also look at why the budget burned: one big incident or many small ones, our own changes or a dependency, and whether the SLO itself is realistic. If the SLO is consistently missed despite good engineering, and users aren't actually unhappy, the target might be too strict and should be renegotiated. If users are unhappy, it's the right target, and the reliability work is overdue.

The power of the process is that it turns a subjective argument, 'should we ship or stabilise', into an objective, pre-agreed decision based on user impact."

### [2] What is chaos engineering, and how would you introduce it?
@tags chaos engineering, resilience
@hook Deliberately inject failures in a controlled way to find weaknesses before real outages do. Start small, with a hypothesis, in non-production, with a stop button.
@say
"Chaos engineering is the practice of running controlled experiments that inject failures into a system, like killing instances, adding network latency, failing a dependency or filling a disk, to verify that it behaves as expected and to discover weaknesses before they cause real incidents.

Each experiment follows a scientific method: define the steady state with metrics, like checkout success rate and latency; form a hypothesis, like 'if one availability zone's nodes are lost, checkout success stays above 99.9 percent'; inject the failure; observe; and either gain confidence or find a weakness to fix.

To introduce it safely: start with game days in staging, where the team deliberately breaks something and practises the response, which also tests runbooks and alerts. Start with simple, well-understood failures, like killing a single pod or instance, before network partitions or region failures. Limit the blast radius and duration, have an immediate abort mechanism, and inform stakeholders. Only move to production experiments once confidence is high and observability is good, starting with a small percentage of traffic.

Tools include Chaos Mesh and LitmusChaos for Kubernetes, AWS Fault Injection Service, Azure Chaos Studio and Gremlin. The value is turning assumptions, like 'failover works', into tested facts."

### [2] How do you do capacity planning?
@tags capacity planning, scaling
@hook Measure current usage and its drivers, forecast demand, convert it into resources with headroom, account for lead times and failure scenarios, and validate with load tests.
@say
"First, understand the current state: resource usage per service, which resource saturates first, and the business drivers behind load, like active users, orders per minute or data volume, so capacity can be expressed in business terms, like 'each pod handles about 300 requests per second at our latency target'.

Second, forecast demand: organic growth trends from historical data, plus known events like product launches, marketing campaigns and seasonal peaks, plus inorganic growth like onboarding a big customer.

Third, convert demand to resources: using the measured per-unit capacity, calculate instances, nodes, database size, IOPS, network and quotas needed, plus headroom for spikes, and for failure scenarios like losing an availability zone, which means the remaining zones must absorb the load, so N plus 1 or N plus 2 planning.

Fourth, account for lead times and limits: cloud quotas that need requests, reserved capacity for scarce resources like GPUs, database scaling that takes time, and purchasing commitments for cost savings.

Fifth, validate with load tests that the system actually scales as modelled, finding the bottleneck before users do. Autoscaling handles short-term variation, but capacity planning ensures the limits, quotas and architecture can support it. I'd review it regularly, like quarterly, and before big events."

### [2] The database is the bottleneck. How do you scale it?
@tags databases, scaling, performance
@hook Diagnose before scaling: fix queries and indexes, add caching and connection pooling, scale up, add read replicas, and shard only as a last resort.
@say
"I diagnose first, because the fix depends on whether it's CPU, I/O, memory, locks or connections, and on whether it's reads or writes.

Then roughly in order of effort. Query and schema optimisation: find the top queries by total time with pg_stat_statements or Query Store, add missing indexes, fix N+1 patterns and inefficient queries, and stop selecting more data than needed. This often gives the biggest win for the least effort. Connection management: a connection pooler like PgBouncer or RDS Proxy, so hundreds of app pods don't overwhelm the database with connections. Caching: put frequently read, rarely changing data in Redis or an application cache, which removes read load entirely. Vertical scaling: a bigger instance with more memory, CPU or faster storage is simple and buys time. Read replicas: route read-heavy and reporting traffic to replicas, accepting replication lag. Workload separation: move analytics to a data warehouse, and search to a search engine, and use queues to smooth write bursts. Data management: archive or partition old data so hot tables stay small.

Sharding, splitting data across multiple databases by a key, is the last resort for write scaling, because it's complex: cross-shard queries, transactions and rebalancing. Managed distributed databases can take some of that pain away, at a cost."

### [2] A service is slow, but there are no errors. How do you debug it?
@tags latency, troubleshooting
@hook Compare slow and fast requests with traces, then check where the time goes: dependencies, pools and queues, GC, CPU throttling, locks, or a specific input.
@say
"With no errors, the clues are in timing, so traces are my main tool.

First, characterise it: is everything slow or only some requests, which endpoints, and since when, correlated with deploys, traffic or a dependency change.

Then I compare traces of slow requests with fast ones. The difference shows where the time goes. Common findings: a slow dependency, like a database query that changed plan, a cache with a low hit rate, or a slow third-party API; time spent waiting rather than working, like waiting for a database connection from an exhausted pool, a thread pool queue, or a lock, which shows as a gap in the trace before the actual call; retries hidden inside client libraries; and serial calls that could be parallel.

If traces show the time is inside the service itself, I look at runtime metrics and profiling: garbage collection pauses, CPU throttling from container limits, high CPU in a specific code path, which a profiler shows, or thread starvation from blocking calls in async code.

And I look for input-dependent slowness: a specific customer with a huge dataset, a pathological request, or a missing pagination limit. Once found, I fix the cause and add a metric or alert for it, like connection pool wait time, so it's visible next time."

### [2] What are graceful degradation and load shedding?
@tags resilience, load shedding, degradation
@hook When overloaded or a dependency fails, serve a reduced experience instead of falling over. Drop low-priority work first, deliberately.
@say
"Graceful degradation means designing a system so that when parts fail or capacity runs short, it keeps providing its core function with reduced features, rather than failing completely. For example: if the recommendation service is down, the product page shows bestsellers from a cache instead of personalised recommendations; if search is overloaded, results come without facets; if a payment provider is slow, we queue the order and confirm later. That requires timeouts, circuit breakers and fallbacks around non-critical dependencies, and knowing which features are critical.

Load shedding is deliberately rejecting some work when the system is overloaded, so it can still serve the rest well, instead of everything slowing down until it collapses. Techniques: limit concurrency and queue length, returning 429 or 503 quickly when full, which is better than timing out; prioritise traffic, like protecting checkout and logged-in users over background jobs, crawlers or analytics; drop requests that have already waited longer than the client's timeout, since nobody is waiting for the answer anymore; and rate limit per client.

Without these, overload causes cascading failures: latency rises, clients retry, load increases further, and the system enters a death spiral. Both should be designed in advance and tested, for example in load tests and chaos experiments."

### [2] A critical service keeps missing its SLO. How do you handle it?
@tags slo, reliability, prioritisation
@hook Use data to find where the budget goes, invoke the error budget policy, fix the top contributors, and revisit whether the SLO, architecture or ownership is wrong.
@say
"First, I analyse where the unreliability comes from: break down the error budget consumption by cause, like specific incidents, deploys, a particular dependency, certain endpoints, time of day or infrastructure events. Usually a few causes dominate.

Then I apply the error budget policy, so reliability work is prioritised over features until the service recovers, and get product and engineering leadership aligned on that.

Then fix the top contributors: if bad deploys, improve testing, canary analysis and rollback automation; if a flaky dependency, add timeouts, retries, circuit breakers, caching and fallbacks, or work with that team on their reliability; if capacity, fix scaling and saturation; if architectural, like a single point of failure or a design that can't scale, plan the larger change, with interim mitigations.

I'd also question the SLO itself: is it measured correctly, from the user's perspective, and is the target realistic and aligned with what users need? Sometimes the measurement counts things users don't experience as failures, or the target is aspirational rather than based on data.

And ownership: does the service have a clear owning team with the time and authority to fix it? Persistent SLO misses are often an organisational problem as much as a technical one. Throughout, I report progress transparently to stakeholders."

### [1] What is a runbook, and what makes a good one?
@tags runbook, on-call, documentation
@hook Step-by-step instructions for handling a specific alert or task. Good ones are linked from the alert, tested, current, and gradually turned into automation.
@say
"A runbook, or playbook, is a documented procedure for handling a specific operational situation, usually linked directly from an alert: what the alert means, its likely impact, how to verify the problem, the diagnostic steps, the mitigation steps and when and how to escalate.

A good runbook is specific and actionable, written for a tired engineer at 3 a.m. who may not know the service well: exact commands, links to the right dashboards and logs, and clear decision points like 'if the error rate is above X, roll back using this procedure'. It's linked from the alert itself, so nobody has to search for it. It's kept current, reviewed after every incident where it was used, and owned by the service team. And it's tested, through game days or by new team members following it.

Runbooks are also a path to automation: once a procedure is well-defined and executed the same way every time, it's toil, and it's a candidate for automated remediation, like auto-scaling, automatic restarts or self-healing scripts, with the runbook documenting what the automation does. An alert with no possible runbook action is often a sign the alert shouldn't page at all."
