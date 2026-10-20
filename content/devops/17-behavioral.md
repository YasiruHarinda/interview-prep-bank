@section opsbehav | Behavioral Questions for DevOps and SRE
@blurb Incidents, outages you caused, pushback and influence. Every answer is an example story in STAR form; replace the facts with your own.

### [1] Tell me about a major production incident you handled.
@tags incident, story
@hook Detection, your role, how you mitigated before fully understanding it, communication, root cause, and the lasting change.
@say
"During a sale event on a project I supported, the checkout service's error rate jumped to about 30 percent. Our burn-rate alert paged me within three minutes of the start.

I was on call, so I declared an incident, opened a channel and pulled in the service owner. The dashboards showed database connection timeouts, and the deploy history showed nothing new that day, so rollback wasn't the answer. Traffic was about three times normal, and the connection pool on each pod was exhausted: we had scaled the pods to 40 replicas, and together they exceeded the database's connection limit, so new connections were being refused.

Mitigation first: I scaled the deployment back down to a number whose total connections fit the database limit, and raised each pod's pool slightly. Errors dropped below 1 percent within about ten minutes. The communications lead posted updates every 15 minutes.

The post-mortem identified two contributing factors: autoscaling had no awareness of the database's connection limit, and nobody had load tested beyond twice normal traffic. Actions: we added PgBouncer between the pods and the database, capped the autoscaler, added an alert on connection pool saturation, and ran a load test at four times normal before the next sale, which went without incident."
@pro
Mention the exact time to detect and to mitigate. Numbers make an incident story credible.

### [2] Tell me about a time a change you made caused an outage.
@tags failure, ownership
@hook Own it plainly, show quick detection and rollback, then the systemic fix that made the mistake impossible to repeat.
@say
"I changed a Kubernetes network policy to tighten egress for a namespace, as part of a security improvement. I tested it in staging, where everything passed, and applied it to production through our GitOps pipeline.

About ten minutes later, a background worker in that namespace started failing, because in production it called an external payment reconciliation API that didn't exist in staging, so my default-deny egress rule blocked it. Payments weren't lost, but reconciliation stopped.

The alert on the job's failure rate fired, and I connected it to my change from the deploy markers. I reverted the commit, Argo CD synced it within a minute, and the job recovered and caught up on its backlog. Total impact was about 25 minutes of delayed reconciliation.

In the post-mortem, which I wrote, the issue was clear: our staging environment didn't reflect production's external dependencies, and we had no way to see what a policy would block before enforcing it. We changed the process so that new network policies first run in audit mode, using our CNI's flow logs to show what would be dropped, for a few days before enforcement. We also documented every service's external dependencies in the service catalogue. I learned that 'it passed in staging' only means as much as staging resembles production."

### [1] Tell me about a time you disagreed with an infrastructure decision.
@tags disagreement, influence
@hook Disagree with data and a proposal, focus on the shared goal, then commit fully to the decision.
@say
"Our team planned to run a self-managed Kafka cluster on Kubernetes for a new event-driven feature. I was concerned that we were a small team with no Kafka operational experience, and the feature's volume was modest.

Rather than just objecting, I put together a short comparison: expected message volume, the operational tasks we'd be taking on, like upgrades, broker failures, disk management and monitoring, and the cost of a managed alternative, Azure Service Bus, which met the feature's requirements. I also listed what we'd lose: Kafka's replay capability, which we didn't need yet.

I presented it in our architecture review, framed around the shared goal of shipping the feature reliably with a small team. The tech lead agreed to start with the managed service behind an internal interface, so we could switch to Kafka later if replay or volume required it.

We shipped two weeks earlier than planned, with no messaging incidents in the first six months. And if the decision had gone the other way, I would have committed to making Kafka work, and proposed a training plan and runbooks to reduce the risk."

### [2] How do you spread DevOps practices and mentor less experienced engineers?
@tags mentoring, culture, influence
@hook Make the right way easy (templates, docs), teach through pairing and real incidents, and celebrate others' wins.
@say
"I focus on making good practices easy rather than lecturing about them.

First, paved roads: when I wanted every service to have proper health checks, resource limits and dashboards, I added them to the service template and the shared Helm chart, so new services got them by default, and existing services could adopt them with a small change. Adoption went much faster than any guideline document would have achieved.

Second, learning by doing: I pair with junior engineers on real work, like debugging a failed deployment or writing their first Terraform module, letting them drive while I explain my reasoning. For on-call, new engineers shadow first, then take reverse-shadow shifts with me as backup, and we review every incident together.

Third, sharing knowledge: short lunch-and-learn sessions on topics people asked about, like 'how our deployment pipeline actually works', runbooks written so a newcomer can follow them, and blameless post-mortems shared widely, which teach more than any course.

And I make sure credit goes to the people who did the work. One junior engineer I mentored ended up owning our observability dashboards and presenting them to the wider engineering team, which did more for adoption than anything I said."

### [2] A team wants to bypass the pipeline or skip a check to hit a deadline. What do you do?
@tags pushback, process, judgement
@hook Understand the real blocker, offer a faster safe path, make any exception explicit and temporary, and fix whatever made bypassing tempting.
@say
"First I'd find out what's actually blocking them, because 'skip the pipeline' is usually a symptom. On one occasion, a team wanted to deploy a hotfix manually because the security scan was failing on a vulnerability in an unrelated dependency, and a customer launch was hours away.

I didn't just say no, and I didn't just say yes. I looked at the finding with them: it was a medium-severity issue in a test-only dependency, not shipped in the production image. So instead of bypassing the pipeline, we added a documented, time-limited exception for that specific finding, approved by the security lead, with a ticket to upgrade the dependency within a week. The hotfix went through the normal pipeline, with all other checks, in about 20 minutes.

Afterwards, I addressed the root causes: the scanner was flagging test-only dependencies in a blocking way, so we tuned it to focus on what ships; and we created an expedited hotfix path in the pipeline, which runs the critical checks only, for real emergencies, with an audit trail.

My principle is that the safe path has to be the fast path. If people feel they need to bypass a process, the process needs fixing, but the bypass still needs to be explicit, approved and temporary."

### [1] Tell me about something you automated that made a real difference.
@tags automation, impact
@hook The manual pain, measured; what you built; adoption; the measured result; what it freed people to do.
@say
"In our team, setting up a new developer environment took about two days: installing tools at specific versions, getting access to several systems, configuring local databases, and following a long wiki page that was always slightly out of date. New joiners lost their first days, and senior engineers lost time helping them.

I automated it in stages. First, a dev container definition with all the tools at pinned versions, so the editor opened a ready-to-use environment. Then a Docker Compose setup for the local dependencies, with seeded test data. Then a bootstrap script that checked access, cloned the repositories and ran a smoke test, printing clear next steps for anything that needed a manual approval.

I tested it with the next two new joiners, watching where they got stuck, and fixed those parts.

Setup time went from about two days to under an hour, and the wiki page shrank to a few lines. It also removed 'works on my machine' differences between developers, since everyone used the same versions as CI. The biggest win was less visible: senior engineers stopped losing time to setup support, and new joiners shipped their first pull request on day one."
