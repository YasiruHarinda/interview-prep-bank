@section playbook | The DevOps Interview Playbook
@blurb Openers, project deep dives and the live troubleshooting round, where narration matters as much as the fix.

### [1] Tell me about yourself. (DevOps version)
@tags opener, pitch
@hook Present, past, future. Lead with something you automated or ran, the scale, and a before-and-after number.
@say
"I'm a DevOps engineer who likes making delivery boring, in the good sense: fast, repeatable and safe. Right now I'm [finishing my degree / working at X], and my main project is [a .NET microservices system running on Azure Kubernetes Service]. I built the platform side end to end: Terraform for the infrastructure, GitHub Actions pipelines that build, test, scan and push images, and GitOps with Argo CD for deployments, plus Prometheus and Grafana for monitoring. Deployments went from [a manual, hour-long process] to [a merge-triggered rollout in under ten minutes], with automatic rollback when health checks fail.

Before that I [internship or earlier project], where I learned [Linux administration and scripting / production support].

I'm looking for a team where I can own reliability and delivery for real production systems and keep learning from experienced SREs. That's why this role stood out: [specific reason, like their scale or their platform engineering work]."
@trap
A tool list ("Docker, Kubernetes, Jenkins, Terraform, Ansible, AWS, Azure...") with no story. Interviewers want to hear what you built, what it improved, and how you knew.

### [2] How do you approach a live troubleshooting round?
@tags troubleshooting, live round, method
@hook Narrate everything. Clarify the symptom, check the obvious and recent changes, work layer by layer, form a hypothesis, test it, fix, verify, and say what you'd prevent next time.
@say
"I talk through every step, because the interviewer is grading my reasoning, and silence is the most common way people fail these rounds.

I start by clarifying the symptom: what exactly is broken, for whom, since when, and what 'working' looks like. Then I check the obvious things first: is the service running, recent changes like deploys or config edits, disk space, and the logs.

Then I go layer by layer rather than guessing randomly. For a web service that's unreachable: is DNS resolving, is the host reachable, is the port listening, is a firewall or security group blocking it, is the process healthy, what do the application logs say, and are its dependencies, like the database, reachable. At each step I say what I'm checking, why, and what I expect to see, for example 'I'm running ss -tlnp to see whether anything is listening on port 8080; if nothing is, the app probably crashed on startup.'

When I find the cause, I fix it in the least risky way, verify the fix from the user's point of view, for example with curl from outside, and finish by saying what I'd change so it doesn't happen again, like an alert, a health check or a runbook entry."
@deep
A layered checklist for "the service is down":
1. **Scope:** one user or everyone? One region or all?
2. **Recent change:** deploy, config, certificate, DNS, infrastructure?
3. **Name resolution:** `dig app.example.com`
4. **Reachability:** `ping`, `traceroute`, `nc -vz host 443`
5. **Listening:** `ss -tlnp | grep 8080`
6. **Process:** `systemctl status app`, `docker ps`, `kubectl get pods`
7. **Logs:** `journalctl -u app -n 200`, `kubectl logs --previous`
8. **Resources:** `df -h`, `free -m`, `top`, `dmesg | tail` (OOM kills)
9. **Dependencies:** database, cache, external APIs reachable from the host?
10. **Verify the fix** from outside, then name the prevention.
@trap
Typing commands silently, or jumping straight to "I'd restart it". Restarting may be a valid mitigation, but say why, and say you would capture logs first.

### [2] Walk me through a CI/CD pipeline or platform you built.
@tags project deep dive, pipelines
@hook Problem, architecture from commit to production, your decisions and why, a failure you fixed, the numbers, and what you'd change.
@say
"[Example: CI/CD and GitOps for a microservices order system on AKS.]

The problem: four .NET services deployed by hand with kubectl, no consistent testing, and secrets in config files.

The flow I built: on every pull request, GitHub Actions runs the build, unit tests and integration tests with Testcontainers, a linter, a dependency vulnerability scan and a secret scan. On merge to main, it builds a container image with a multi-stage Dockerfile, scans it with Trivy, signs it, and pushes it to Azure Container Registry, tagged with the commit SHA. The pipeline authenticates to Azure with OIDC federation, so there are no stored cloud credentials.

Deployment is GitOps: the pipeline opens a commit to a separate configuration repository updating the image tag in the Helm values for staging. Argo CD, running in the cluster, syncs it. After smoke tests pass, promotion to production is a reviewed pull request in the same repo. Secrets come from Azure Key Vault through the Secrets Store CSI driver and workload identity.

A failure I fixed: deployments occasionally caused a minute of 502 errors because pods were killed before the load balancer stopped routing to them. I added proper readiness probes, a preStop hook and graceful shutdown handling, which removed the errors.

Results: deploy time from about an hour of manual work to around eight minutes from merge, with rollback being a git revert. If I did it again, I'd add progressive delivery with automated canary analysis earlier."
@trap
Describing the YAML instead of the decisions. Interviewers want to know why pull-based GitOps, why OIDC, why those quality gates.

### [1] What does a DevOps engineer actually do day to day?
@tags role, culture
@hook Build and run the paved road: pipelines, infrastructure as code, observability, reliability and developer experience, in close partnership with developers.
@say
"The job is to help teams ship changes quickly and safely, and keep them running.

Day to day, that's a mix of: building and maintaining CI/CD pipelines; provisioning and managing infrastructure as code, like networks, clusters, databases and permissions; running container platforms such as Kubernetes; setting up monitoring, logging, alerting and dashboards; responding to incidents and doing post-incident reviews; automating repetitive work, the toil; improving security across the pipeline and infrastructure; managing cloud costs; and supporting developers, whether that's debugging a failing deployment or designing how a new service should run.

The 'DevOps' part is cultural as much as technical: breaking down the wall between development and operations, so developers own their services in production and operations work is done through code and automation. In many companies the role overlaps with SRE, which focuses more on reliability targets, and platform engineering, which builds self-service internal platforms."

### [2] Which recent changes in the DevOps ecosystem are you paying attention to?
@tags trends, 2026, currency
@hook Pick three you can actually discuss: Gateway API after the Ingress NGINX retirement, OpenTelemetry everywhere, and platform engineering. Add one Kubernetes release detail.
@say
"A few that affect day-to-day work.

First, Kubernetes networking: the community retired the Ingress NGINX controller in March 2026, so it no longer gets security fixes. The recommended direction is the Gateway API, which is more expressive than Ingress, with role separation between platform and application teams and native traffic splitting. The Ingress API itself still exists but is feature-frozen, so new platforms should plan for Gateway API.

Second, Kubernetes itself keeps adding operational features. For example, in-place pod resize went GA in version 1.35, so CPU and memory requests and limits can be changed on a running pod, often without restarting it, which makes vertical scaling much less disruptive.

Third, OpenTelemetry has become the default for instrumentation, with the Collector routing metrics, logs and traces to any backend, which reduces vendor lock-in.

Fourth, platform engineering: internal developer platforms with golden paths, using tools like Backstage and Crossplane, so teams can self-serve infrastructure safely.

And fifth, AI in operations: assistants for writing infrastructure code and pipelines, and AI-assisted incident triage, which raises the bar on reviewing generated configs carefully."
@pro
Pick the ones that match the company's stack. Mentioning the Ingress NGINX retirement to a team running it is an instant credibility signal.

### [1] How do you stay current in DevOps and cloud?
@tags learning, career
@hook Release notes and changelogs of the tools you run, a home lab to try things, public post-mortems, and a habit of writing down what you learn.
@say
"I follow the release notes and blogs of the tools I actually use, like the Kubernetes blog, cloud provider updates, and CNCF project announcements, because that's where breaking changes and deprecations show up first. The Ingress NGINX retirement is a good example of something you need to hear about early.

I keep a small home lab, a local Kubernetes cluster and a cheap cloud account with budget alerts, where I try new things hands-on, like the Gateway API or a new Terraform feature, before I'd recommend them at work.

I read public post-mortems from large companies, which teach more about real failure modes than most tutorials.

And I write short notes or blog posts about what I learn, or present it to my team, which forces me to understand it properly. Certifications like CKA were useful for structured learning, but I treat them as a side effect of hands-on practice, not the goal."
