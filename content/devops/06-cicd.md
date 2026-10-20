@section cicd | CI/CD Pipelines and Deployment Strategies
@blurb Pipeline design, secrets, speed, GitOps and safe rollouts. The core of most DevOps loops.

### [1] What are the stages of a typical CI/CD pipeline?
@tags pipeline, stages
@hook Commit, build, test, scan, package, publish, deploy to staging, verify, promote to production, monitor. Fast checks first, slow ones later.
@say
"A typical pipeline runs in stages, ordered so that the fastest, cheapest checks fail first.

On every pull request: checkout, restore dependencies from cache, compile or build, run linters and static analysis, run unit tests, and run security checks like dependency scanning, secret scanning and SAST. Then integration tests, often with real dependencies in containers.

On merge to main: build the deployable artefact once, usually a container image, tagged with the commit SHA; scan the image; sign it and generate an SBOM; and push it to a registry.

Delivery: deploy that same artefact to a staging environment, run smoke tests and sometimes end-to-end or performance tests, then promote to production, through a manual approval, an approved pull request in a GitOps repository, or automatically with continuous deployment. Production rollout is progressive, like a canary or rolling update, with automated health checks and rollback.

After deployment: monitoring and alerting watch the release, and the pipeline records which version is where. The key principles are build once and deploy the same artefact everywhere, keep the pipeline itself as code, and keep feedback fast, ideally under ten minutes for the pull request checks."

### [2] How would you design a CI/CD pipeline for a microservices application?
@tags pipeline design, microservices
@hook Independent pipeline per service from shared templates, contract tests between services, build once and promote, GitOps deploys, progressive rollouts per service.
@say
"Each service should be independently buildable, testable and deployable, otherwise microservices lose their main benefit.

Structure: each service has its own pipeline, built from shared, versioned pipeline templates or reusable workflows, so there's consistency without copy-paste. Whether the code is in a monorepo or many repos, a change to one service triggers only that service's pipeline.

CI per service: build, unit tests, integration tests with its own dependencies in containers, and contract tests, consumer-driven contracts with something like Pact, which catch breaking API changes between services without spinning up the whole system. Then security scans, and building, scanning and signing an image tagged with the commit SHA.

CD: GitOps, with a configuration repository describing what version of each service runs in each environment. Promoting a version is a pull request; Argo CD or Flux syncs it. Each service rolls out progressively, with canaries and automated analysis on its own metrics.

Cross-cutting: a lightweight end-to-end smoke suite in staging for critical journeys, backward-compatible API and schema changes so services can deploy in any order, feature flags for coordinated launches, and observability so each release's impact is visible per service."

### [2] How would you design a pipeline for a monorepo with fifteen services, without rebuilding everything on every change?
@tags monorepo, ci performance
@hook Detect what changed (path filters or a dependency graph), build and test only affected services, cache aggressively, parallelise, and keep a full build on a schedule.
@say
"The goal is that a change to one service only builds and tests that service and anything that depends on it.

Change detection: the simplest approach is path-based triggers, where each service's workflow runs only when files under its directory change. But shared libraries complicate it: a change in a shared library must trigger every service that uses it. So for anything beyond simple cases I'd use a build tool that understands the dependency graph, like Nx, Turborepo, Bazel or Pants, or a script that maps changed files to affected services, and then generate a dynamic matrix of jobs.

Speed: cache dependencies and build outputs, with remote caching so CI reuses results from previous runs; use Docker layer caching; run affected services' jobs in parallel; and split slow test suites across runners.

Safety nets: a nightly or scheduled full build and test of everything, to catch anything the change detection missed; and treat shared pipeline config changes as affecting all services.

Cost: parallel jobs cost runner minutes, so I'd balance parallelism against budget and watch queue times. And I'd measure pipeline duration per service as a metric, since that's what developers feel."

### [2] How do you handle secrets in CI/CD pipelines?
@tags secrets, security, oidc
@hook No long-lived keys: use OIDC federation to get short-lived cloud credentials, fetch app secrets from a vault at runtime, scope by environment, and never print them.
@say
"My principles are: no secrets in code, as few long-lived secrets as possible, least privilege, and rotation that doesn't require pipeline changes.

For cloud access, I use OIDC workload identity federation: GitHub Actions, GitLab and Azure DevOps can present a short-lived signed token that the cloud provider, AWS, Azure or GCP, trusts and exchanges for temporary credentials. The trust is scoped to a specific repository, branch or environment, so only the main branch's production job can assume the production deployment role. No cloud keys are stored anywhere.

For application secrets, like database passwords or API keys, they live in a secrets manager, such as Azure Key Vault, AWS Secrets Manager or HashiCorp Vault. Ideally the pipeline doesn't handle them at all: the running workload fetches them at runtime using its own identity, for example with workload identity and the Secrets Store CSI driver or External Secrets Operator in Kubernetes. Rotation then happens in the vault without touching pipelines.

When the pipeline itself needs a secret, it uses the platform's encrypted secrets, scoped to environments that require approval, and masked in logs. I also avoid exposing secrets to workflows triggered by pull requests from forks, pin third-party actions to commit SHAs, and give the pipeline token minimal permissions."
@deep
```yaml
# GitHub Actions: deploy to Azure with OIDC, no stored client secret
permissions:
  id-token: write      # allow requesting the OIDC token
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production          # protected: required reviewers
    steps:
      - uses: actions/checkout@<pinned-sha>
      - uses: azure/login@<pinned-sha>
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

### [1] Compare rolling, blue-green and canary deployments.
@tags deployment strategies
@hook Rolling: replace instances gradually. Blue-green: run a full new copy, switch traffic at once, switch back instantly. Canary: send a small slice of real traffic first and watch.
@say
"A rolling deployment replaces old instances with new ones a few at a time, keeping the service up throughout. It needs no extra infrastructure and is Kubernetes' default. The downsides are that for a while both versions serve traffic, so they must be compatible, and rollback means rolling back the same gradual way.

Blue-green runs two complete environments: blue serves production, green gets the new version and is tested; then traffic switches all at once, at the load balancer, DNS or service level. Rollback is instant, by switching back. The costs are double infrastructure during the switch, and database changes need care, since both versions share data.

A canary release sends a small percentage of real traffic, like 1 or 5 percent, to the new version, compares its metrics, like error rate, latency and business KPIs, against the stable version, and gradually increases the share if healthy, or rolls back automatically if not. It limits the blast radius of a bad release and catches problems that only appear with real traffic.

Related techniques: feature flags, which separate deploying code from releasing features, and shadow deployments, which mirror traffic to the new version without returning its responses to users.

My default for services is a canary with automated analysis, using Argo Rollouts or Flagger, falling back to rolling updates for low-risk internal services, and blue-green when instant full cutover and rollback matter."

### [2] How do you do a blue-green deployment when there's a database schema migration?
@tags migrations, blue-green, databases
@hook Both versions must work with the same schema. Use expand and contract: add compatible changes first, migrate, switch, then remove the old parts later.
@say
"The core problem is that blue and green share one database. During the switch, and in any rollback, both the old and new application versions must work with the current schema. A migration that renames or drops a column breaks the old version, and rollback becomes impossible.

So I use the expand-and-contract pattern, also called parallel change, spread across several deployments.

Expand: add the new structure in a backwards-compatible way, like adding a new nullable column or table, without removing anything. The old version ignores it.

Migrate: deploy application code that writes to both old and new columns and reads from the new one with a fallback, and backfill existing data in batches, so tables aren't locked.

Switch: once everything reads from the new structure, switch traffic to green. Rollback to blue is still safe, because the old columns still exist and are kept up to date.

Contract: in a later release, after the new version has proven itself, stop writing the old column and drop it.

Additional practices: migrations run as a separate, versioned pipeline step, not on app startup; large table changes use online schema change tools; every migration is tested against a production-sized copy; and destructive changes are never in the same release as the code change that depends on them."

### [2] How do you implement rollbacks in automated deployments?
@tags rollback, reliability
@hook Make rollback a fast, boring, rehearsed operation: redeploy the previous immutable artefact, ideally automatically when health checks or canary analysis fail.
@say
"Rollback should be fast, automated where possible, and rehearsed, not something improvised during an incident.

The foundation is immutable, versioned artefacts: every release is an image tagged with its commit, and the previous version is still in the registry, so rolling back means redeploying a known-good artefact, not rebuilding old code.

Mechanisms by deployment style: with Kubernetes, kubectl rollout undo or redeploying the previous image; with GitOps, reverting the commit in the configuration repository, so Git stays the source of truth and Argo CD syncs back; with blue-green, switching traffic back; with canaries, aborting the rollout, which shifts traffic back to stable.

Automation: progressive delivery tools like Argo Rollouts or Flagger run analysis against metrics during the rollout, like error rate and p99 latency compared with the baseline, and abort automatically when thresholds are breached. Readiness probes and Kubernetes' progress deadline stop a rollout of pods that never become healthy.

The hard part is state: database migrations must be backward-compatible, using expand and contract, so the old version still works; and feature flags let you turn off a problematic feature without any deployment at all. I'd also test rollbacks regularly, because an untested rollback path often fails when you finally need it."

### [2] Your pipeline takes 35 minutes, and developers have started pushing straight to main. How do you fix it?
@tags pipeline performance, developer experience
@hook Measure where the time goes, then cache, parallelise, run only what's affected, move slow suites off the critical path, and restore the guardrails once it's fast.
@say
"Two problems: a slow pipeline, and broken guardrails. I'd fix the speed first, so following the process is the easy option, then re-enable branch protection.

Diagnose: look at the timing of each job and step across recent runs, not one run, and separate queue time from run time. Typical culprits are installing dependencies from scratch every time, building Docker images without layer caching, one huge sequential test suite, slow or flaky end-to-end tests, waiting for runners, and steps that run on every commit but don't need to.

Fixes: cache dependencies and build outputs; enable Docker layer caching and order Dockerfile instructions well; split tests into parallel shards; run only the tests and builds affected by the change; move slow end-to-end and performance suites off the pull request critical path, running them after merge or nightly, with fast smoke tests kept on the pull request; fix or quarantine flaky tests, since retries waste time; and add runner capacity or larger runners if queueing is the problem.

The target is pull request feedback in under about ten minutes. Then I'd re-enable required checks, explain the change, and track pipeline duration as a metric, so it doesn't creep back up. The trade-off discussion is test coverage: what gets moved off the critical path has to still run, and its failures have to be acted on."

### [2] Your pipeline started failing intermittently with no code changes. How do you debug it?
@tags pipeline, troubleshooting, flaky
@hook If the code didn't change, something else did: dependencies, base images, runners, external services, time, or shared state. Compare a failing run with a passing one.
@say
"If the code hasn't changed, the cause is in the environment, so I look at what else changes between runs.

First, I gather data: which jobs and steps fail, how often, on which runners, and the exact errors, and I compare a failing run's logs with a passing run's.

Common causes: floating dependency versions, like a library or a base image tag that was updated upstream; lock files and pinned image digests prevent this. Changes to hosted runner images or tool versions. Rate limits or outages in external services, like the container registry, package registries or a third-party API used in tests. Flaky tests with timing assumptions, shared state between parallel jobs, or tests depending on the current date and time. Resource exhaustion on runners, like disk space or memory, especially on self-hosted runners that aren't cleaned between jobs. Expired credentials or certificates. And cache corruption, which clearing the cache confirms.

Then I fix the root cause: pin versions, add retries with backoff only around genuinely flaky network calls, isolate test data, clean self-hosted runners or make them ephemeral, and mirror critical dependencies, like base images, in our own registry. I'd also start tracking failure rates per job, so new flakiness is spotted early."

### [2] GitHub Actions vs Jenkins vs GitLab CI vs Azure DevOps: which would you choose?
@tags tools, ci platforms, opinion
@hook Take a position based on context: use the CI built into wherever the code lives, unless you have a specific reason for Jenkins.
@say
"My default is to use the CI system integrated with where the code lives, because tight integration with pull requests, permissions, secrets and the developer workflow matters more than small feature differences.

If the code is on GitHub, I'd pick GitHub Actions: huge marketplace of actions, reusable workflows for shared templates, OIDC federation to all major clouds, environments with approvals, and managed runners with the option of self-hosted ones.

If the company is on GitLab, GitLab CI is excellent and very cohesive, with built-in registry, security scanning and environments in one product.

Azure DevOps Pipelines makes sense for organisations already invested in Azure DevOps boards and repos, and it integrates well with Azure.

Jenkins is the most flexible, self-hosted and extensible through plugins, which suits unusual requirements, on-premise or air-gapped environments, and companies with large existing investments. But it has a real operational cost: managing the controller, agents, plugin upgrades and security, so I wouldn't choose it for a new greenfield setup without a specific reason.

Whatever the tool, I'd keep pipelines as code, keep build logic in scripts or Makefiles that run locally too, so we're not locked into one CI's syntax, and use GitOps tools like Argo CD for the deployment side."

### [1] What are the main concepts in GitHub Actions?
@tags github actions, ci
@hook Workflow (YAML file), triggered by events, contains jobs (run on runners, in parallel by default), made of steps (shell commands or reusable actions).
@say
"A workflow is a YAML file in .github/workflows, triggered by events like a push, a pull request, a schedule, a manual dispatch or a release.

A workflow contains jobs. Each job runs on a runner, a fresh virtual machine or container, either GitHub-hosted or self-hosted. Jobs run in parallel by default, and needs creates dependencies between them, so a deploy job waits for the build. A matrix runs the same job across combinations, like several Node versions or operating systems.

Each job has steps, which are either shell commands or actions: reusable units like actions/checkout or setup-dotnet, from the marketplace or your own repositories.

Other key features: secrets and variables, at repository, environment or organisation level; environments, which can require reviewers and restrict which branches can deploy, which is how approvals are done; artifacts and caching to pass files between jobs and speed up builds; reusable workflows and composite actions for sharing pipeline logic across repositories; concurrency groups to prevent overlapping deployments; and the permissions block to limit the GITHUB_TOKEN to the minimum needed. For security, I pin third-party actions to full commit SHAs."
@deep
```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        dotnet: ["8.0.x", "10.0.x"]
    steps:
      - uses: actions/checkout@<pinned-sha>
      - uses: actions/setup-dotnet@<pinned-sha>
        with:
          dotnet-version: ${{ matrix.dotnet }}
      - uses: actions/cache@<pinned-sha>
        with:
          path: ~/.nuget/packages
          key: nuget-${{ hashFiles('**/packages.lock.json') }}
      - run: dotnet test --configuration Release
  image:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<pinned-sha>
      - run: docker build -t registry.example.com/orders:${{ github.sha }} .
```

### [1] What does "build once, deploy many" mean?
@tags artefacts, promotion
@hook Build the artefact one time, then promote that exact artefact through every environment. Only configuration changes between environments.
@say
"It means the pipeline builds the deployable artefact, like a container image, exactly once, from a specific commit, and then promotes that same artefact through every environment: development, staging and production. Only the configuration, injected at deploy time through environment variables, config maps or secrets, differs between environments.

Rebuilding for each environment is risky because builds aren't perfectly reproducible: dependency versions, base images or build tools can change between builds, so what you tested in staging might not be what you deploy to production.

To make it work: artefacts are immutable and uniquely versioned, like an image tagged with the commit SHA, or pinned by digest; they're stored in an artefact registry; environment-specific settings are never baked into the image; and promotion is recorded, so you can always see which version is in which environment. Signing images and verifying signatures at deploy time adds assurance that the artefact wasn't tampered with between build and deploy."

### [2] What is GitOps? Push-based vs pull-based deployment?
@tags gitops, argo cd, flux
@hook Git holds the desired state; an agent inside the cluster pulls and reconciles it continuously. CI never needs cluster credentials.
@say
"GitOps is an operating model where the desired state of the system, like Kubernetes manifests, Helm values or Kustomize overlays, is declared in a Git repository, and an automated agent continuously reconciles the actual state of the environment to match it. Git becomes the single source of truth and the audit log: every change is a commit with an author, a review and a history, and rollback is a revert.

In a push-based model, the CI pipeline deploys directly, running kubectl apply or helm upgrade against the cluster. That means CI needs credentials to the cluster, so a compromised pipeline can do anything to production, and nothing corrects drift if someone changes the cluster by hand.

In the pull-based model, an agent running inside the cluster, Argo CD or Flux, watches the Git repository and pulls changes in. Benefits: CI no longer holds cluster credentials, which shrinks the blast radius of a pipeline compromise; drift is detected and can be auto-corrected; the state of every cluster is visible and diffable; and multi-cluster management scales well.

A typical flow: CI builds and pushes an image, then updates the image tag in the GitOps config repository, often through a pull request for production; Argo CD detects the change and syncs it, with health checks and optional progressive rollout."

### [2] What quality gates belong in a pipeline?
@tags quality gates, testing, security
@hook Automated checks that must pass before moving on: tests, coverage on new code, linting, security scans with severity thresholds, policy checks, and approvals where needed.
@say
"Quality gates are checks that block a change from progressing unless they pass. I'd typically include:

On every pull request: compilation and linting; unit and integration tests; coverage thresholds on new code, rather than a global number; static analysis for bugs and code smells; dependency and license scanning with a severity threshold, like fail on critical or high vulnerabilities with a fix available; secret scanning; and for infrastructure code, terraform validate, a plan, and policy checks with tools like Checkov, tfsec or OPA.

On the artefact: container image scanning, signature and SBOM generation.

Before production: smoke tests in staging, possibly performance tests for critical services, and approvals where risk or compliance requires them, using environment protection rules.

During rollout: automated canary analysis on error rates and latency.

The important nuance is calibration: gates that are too noisy or slow get bypassed, so I tune thresholds, allow documented exceptions with expiry dates, and track how long gates take and how often they produce false positives."

### [2] How do you secure the pipeline itself, the software supply chain?
@tags supply chain, pipeline security
@hook Treat the pipeline as production: least-privilege tokens, pinned and vetted dependencies and actions, ephemeral isolated runners, signed artefacts with provenance, and protected pipeline definitions.
@say
"The pipeline has the keys to production, so attackers target it, as several well-known supply chain attacks have shown.

Identity and permissions: short-lived credentials through OIDC, minimal token permissions, environment-scoped secrets with approvals, and separation so pull-request builds can't access deploy credentials, especially for pull requests from forks.

Dependencies: pin third-party actions and plugins to full commit SHAs rather than mutable tags, since a tag can be repointed to malicious code; use lock files; scan dependencies; and mirror critical packages and base images in an internal registry.

Runners: prefer ephemeral runners that are destroyed after each job, so nothing persists between builds; isolate self-hosted runners and never use them for untrusted public pull requests.

Artefact integrity: sign images with Sigstore cosign, generate SBOMs and build provenance attestations, aiming at SLSA levels, and verify signatures at deploy time with an admission policy, so only images built by our pipeline can run.

Protecting the pipeline definition: CODEOWNERS and required reviews on workflow files, so nobody can quietly add a step that exfiltrates secrets or skips checks. And audit logs for all of it."

### [2] Self-hosted vs hosted CI runners?
@tags runners, ci infrastructure
@hook Hosted: zero maintenance, clean every time, pay per minute. Self-hosted: custom hardware and network access, cheaper at scale, but you own security and upkeep.
@say
"Hosted runners are managed by the CI provider: a fresh, clean virtual machine for every job, no maintenance or patching, and pay-per-minute pricing. They're the right default for most teams.

Self-hosted runners run on your own machines or clusters. Reasons to use them: access to private networks, like deploying into a VPC or reaching internal services without exposing them; special hardware, like GPUs or ARM machines, or large machines for heavy builds; compliance requirements; and cost at high volume. Persistent caches can also make builds faster.

The trade-offs are operational and security responsibility. You must patch and maintain them, scale them for peak demand, and isolate them carefully, because a job can run arbitrary code: a persistent runner can leak secrets or be tampered with between jobs. Never use self-hosted runners for public repositories where anyone can open a pull request.

My preferred self-hosted setup is ephemeral, autoscaling runners on Kubernetes, like GitHub's Actions Runner Controller, where every job gets a fresh pod that's destroyed afterwards, combining the isolation of hosted runners with the network access and cost benefits of self-hosting."

### [3] What is progressive delivery with automated canary analysis?
@tags progressive delivery, argo rollouts, flagger
@hook Shift traffic in steps, compare the canary's metrics with the stable version at each step, and promote or abort automatically.
@say
"Progressive delivery extends continuous delivery with gradual, metric-driven rollouts, so a bad release affects as few users as possible and is caught automatically.

With a tool like Argo Rollouts or Flagger in Kubernetes, a rollout is defined as steps: for example, send 5 percent of traffic to the new version, pause for five minutes, run an analysis, then 25 percent, 50 percent and 100 percent. Traffic splitting is done by the ingress controller, Gateway API implementation or service mesh.

At each step, an analysis queries the monitoring system, like Prometheus or Datadog, comparing the canary's error rate, latency percentiles and possibly business metrics like checkout success, against thresholds or against the stable version's baseline. If the metrics are healthy, the rollout continues; if not, it aborts and shifts traffic back to stable automatically, without anyone being paged at 2 a.m.

To make it work, you need good per-version metrics, enough traffic for the comparison to be statistically meaningful, sensible thresholds that avoid false alarms, and backward-compatible changes, since both versions run at once. It can also be combined with feature flags, for user-segment targeting, like internal users first."
