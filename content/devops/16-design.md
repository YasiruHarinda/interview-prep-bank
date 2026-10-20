@section opsdesign | DevOps Design Scenarios
@blurb Open-ended platform and migration design questions. Show structure, trade-offs and a phased plan, not a tool list.

### [3] Design the CI/CD and infrastructure for a new microservices product from scratch.
@tags design, platform, greenfield
@hook Start small and paved: IaC for everything, one managed cluster or container platform, a golden-path service template, GitOps delivery, observability and security built in from day one.
@say
"I'd clarify first: team size, expected scale, compliance needs, cloud preference and budget. Say a team of 15 engineers, a handful of services to start, on Azure.

Foundations: separate subscriptions for production and non-production, Terraform for all infrastructure with remote state, and a hub network with private endpoints for managed services. Managed services wherever possible: a managed Postgres, a managed cache, a message broker like Service Bus, Key Vault, and a container registry.

Compute: AKS with system and user node pools across zones, or Azure Container Apps if the team is small and wants less to operate. With Kubernetes: Gateway API ingress, cert-manager, External Secrets with workload identity, and Kyverno policies enforcing the security baseline.

Golden path: a service template that new services start from, including a Dockerfile, health endpoints, OpenTelemetry instrumentation, structured logging, a Helm chart or Kustomize base, and a reusable CI workflow. Creating a service should take an hour, not a week.

CI: GitHub Actions with reusable workflows: build, test, scan, sign, push to ACR, with OIDC to Azure. CD: GitOps with Argo CD, environment promotion through pull requests, and Argo Rollouts canaries for production.

Observability: OpenTelemetry to managed Prometheus, Grafana, and a log store, with RED dashboards and SLO burn-rate alerts per service from day one.

Security and cost: secret scanning, dependency and image scanning, budgets and tagging. I'd build it in phases, getting one service to production end to end quickly, then templating it, rather than designing the perfect platform before anything ships."

### [3] How would you migrate a monolith running on VMs to Kubernetes?
@tags migration, kubernetes, strangler
@hook Containerise first without re-architecting, prove it in non-production, move traffic gradually with a rollback path, and only then start extracting services.
@say
"I'd separate two things that people often combine: changing the runtime platform, and changing the architecture. Doing both at once multiplies risk.

Phase one, assess: dependencies, state, like local files, sessions and scheduled jobs, configuration, how it scales today, and non-functional requirements. Fix twelve-factor issues: externalise configuration and secrets, move sessions to Redis, move file storage to object storage, log to stdout, and add health endpoints and graceful shutdown.

Phase two, containerise the monolith as is: a Dockerfile, CI that builds and scans the image, Kubernetes manifests with probes, resources and autoscaling, and observability. Run it in a test environment, then load test to set resource requests and verify behaviour under scale.

Phase three, migrate traffic gradually: run the Kubernetes deployment in parallel with the VMs, both pointing at the same database, and shift traffic with weighted load balancing, 5 percent, then 25, 50 and 100, watching error rates and latency, with instant rollback by shifting weights back. Scheduled jobs move to CronJobs carefully, so they don't run twice.

Phase four, decommission the VMs once stable.

Only then, and only where it's justified, start extracting services with the strangler fig pattern: route specific paths to new services through the gateway, one bounded context at a time, each with its own data. The database migration is usually the hardest and slowest part, so I'd plan it explicitly."

### [3] How do you achieve zero-downtime deployments for a stateful application?
@tags zero downtime, stateful, databases
@hook Make the app tier stateless, keep schema changes backward compatible (expand and contract), drain connections gracefully, and use the database's own replication for failovers.
@say
"I'd start by pushing state out of the application tier: sessions in a shared store, files in object storage, and caches that can be rebuilt. Then the application tier can use normal rolling or canary deployments with readiness probes, preStop delays, graceful shutdown handling SIGTERM, connection draining at the load balancer, and PodDisruptionBudgets.

The data tier is where it gets hard.

Schema changes: always backward compatible with the previous application version, using the expand-and-contract pattern across several releases: add new columns or tables, deploy code that writes to both and reads the new one, backfill in batches, then remove the old structures in a later release. Large table changes use online schema change tools, so tables aren't locked.

Database upgrades or maintenance: use the database's replication: upgrade or patch the replica first, fail over to it, which takes seconds with managed services, then upgrade the former primary. Applications need retry logic for the brief failover.

Long-lived connections, like WebSockets: drain gradually, telling clients to reconnect, with reconnect logic and jitter on the client side.

Background workers and consumers: finish or checkpoint in-flight jobs on shutdown, and make processing idempotent, so a job interrupted and retried doesn't cause duplicates.

And I'd test the whole procedure under realistic load in staging, measuring errors during the deploy, because zero downtime is easy to claim and hard to prove."

### [3] How would you build an internal developer platform?
@tags platform engineering, idp, backstage
@hook Treat the platform as a product: find developers' biggest pains, build golden paths with self-service, keep guardrails invisible, measure adoption and satisfaction.
@say
"I'd start with the users, the developers, not the tools. Interview teams and look at the data: where do they wait? Common answers are getting a new service set up, waiting on tickets for infrastructure, understanding Kubernetes, slow pipelines and debugging production.

Then build a thin platform focused on golden paths, the recommended, supported way to do common tasks, offered through self-service.

A service catalogue and portal, like Backstage, where developers create a new service from templates that include the repository, CI pipeline, deployment configuration, observability and documentation, and see ownership, docs, deployments and on-call for every service.

Self-service infrastructure: developers request a database or a queue through a simple interface, like a portal form or a short YAML claim reviewed in Git, and the platform provisions it with the right security, backups and tagging, using Terraform modules or Crossplane compositions behind the scenes.

Standardised delivery: shared CI templates, GitOps deployments, progressive rollouts and preview environments per pull request.

Built-in guardrails: security policies, cost tags, SLO templates and dashboards come by default rather than as review gates.

Product mindset: a roadmap, documentation, support channels, and metrics like time to first deployment for a new service, adoption of golden paths, DORA metrics and developer satisfaction surveys. The paved road should be optional but so convenient that teams choose it."

### [2] Your company wants to cut its cloud bill by 30 percent this quarter. What's your plan?
@tags cost, finops, plan
@hook Week one: visibility and quick wins. Then rightsizing, scheduling, commitment discounts and architecture fixes, sequenced by savings versus risk, with reliability guardrails.
@say
"First two weeks, visibility: make sure resources are tagged by team, service and environment, build a cost breakdown, and find the top cost drivers. Usually a handful of services, environments or resource types make up most of the bill. I'd agree a baseline and a way to track progress weekly.

Quick wins, low risk: delete idle and orphaned resources, like unattached disks, old snapshots, unused IPs and load balancers, forgotten test environments; shut down non-production environments at night and weekends, which alone can cut their cost by more than half; apply storage lifecycle policies; and reduce log ingestion and retention for noisy sources.

Rightsizing: compare provisioned capacity with actual usage for VMs, databases and Kubernetes requests, and right-size, plus tune autoscaling minimums. Over-provisioned Kubernetes requests are often the biggest hidden waste.

Pricing: savings plans or reservations for the steady baseline, after rightsizing so we don't commit to waste; spot instances for CI runners, batch jobs and fault-tolerant stateless workloads; and cheaper instance families after testing.

Architecture: data transfer and NAT costs, private endpoints, caching, and moving suitable workloads to cheaper managed or serverless options.

Guardrails: SLOs monitored throughout, changes rolled out gradually, budgets and anomaly alerts so costs don't creep back, and showback reports so teams own their spend. Thirty percent in a quarter is ambitious but often realistic when there's been no previous optimisation."

### [3] Design the infrastructure for a self-hosted LLM inference service.
@tags gpu, mlops, inference, design
@hook GPU node pools with the right drivers, a high-throughput serving engine, autoscaling on queue and latency rather than CPU, model artefacts cached close to nodes, and cost controls on very expensive hardware.
@say
"Requirements first: which models and sizes, expected requests per second, latency targets like time to first token, context lengths, data residency, and budget, because GPUs dominate the cost.

Compute: a Kubernetes cluster with dedicated GPU node pools, tainted so only inference workloads land there, with the NVIDIA GPU operator handling drivers, the device plugin and monitoring. Node types chosen to fit the model in GPU memory with room for the KV cache; large models need multiple GPUs per replica with tensor parallelism.

Serving: a high-throughput engine like vLLM, SGLang or TensorRT-LLM, using continuous batching, prefix caching and quantisation where the quality evals allow, behind an OpenAI-compatible API. In front, an LLM gateway for authentication, rate limiting, quotas per team and routing between models.

Model artefacts: weights are tens or hundreds of gigabytes, so startup time matters. Store them in object storage or a model registry, cache them on node-local NVMe or a shared high-throughput volume, and pre-pull images, otherwise scaling up takes many minutes.

Autoscaling: CPU utilisation is meaningless here. Scale on queue depth, number of waiting requests or latency metrics exposed by the server, with KEDA or custom metrics for the HPA, plus node autoscaling for GPU nodes, accepting that new GPU nodes are slow to arrive and sometimes scarce, so keep warm capacity for the baseline.

Observability: GPU utilisation and memory, tokens per second, time to first token, queue length, error rates and cost per million tokens. And cost controls: right-sized replicas, scale-down outside peak hours, spot GPUs for batch workloads, and comparing the total cost against using a managed API."

### [2] How would you set up ephemeral preview environments for every pull request?
@tags preview environments, developer experience
@hook Each pull request gets its own short-lived namespace with its build deployed and a unique URL, created and destroyed automatically, with shared or seeded data and strict cost limits.
@say
"The goal is that every pull request automatically gets a working, isolated environment, so reviewers, QA and product people can try the change before merge.

Flow: when a pull request is opened or updated, the pipeline builds and pushes the image, then creates or updates a namespace named after the pull request, like pr-482, and deploys the service there with Helm or Kustomize, using the same manifests as other environments with small overrides. A unique URL, like pr-482.preview.example.com, is created through a wildcard DNS record and certificate on the gateway, and posted as a comment on the pull request. When the pull request is closed or merged, the namespace is deleted. Argo CD's ApplicationSet pull request generator can automate all of this GitOps-style.

Dependencies: other services the change doesn't touch can point to a shared staging instance, or run as lightweight versions; databases are either a small per-environment instance seeded with anonymised test data, or a per-PR schema in a shared database server.

Controls: resource quotas per preview namespace, time-to-live cleanup for anything left behind, scale-to-zero when idle, limits on the number of concurrent previews, no production data or secrets, and access restricted to the company's identity provider. The benefit is faster feedback and fewer surprises in staging; the cost needs to be watched, which is why automatic cleanup matters."
