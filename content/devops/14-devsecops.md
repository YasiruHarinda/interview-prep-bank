@section secops | DevSecOps and Platform Security
@blurb Security built into the pipeline and platform: scanning, secrets, supply chain, Kubernetes hardening, zero trust and responding to a critical CVE.

### [1] What is DevSecOps?
@tags devsecops, culture
@hook Security as everyone's job, automated into the pipeline and platform from the start, instead of a gate at the end.
@say
"DevSecOps integrates security into every stage of the DevOps lifecycle, rather than treating it as a separate review at the end, which slows releases and finds problems when they're most expensive to fix.

In practice it means: threat modelling during design; secure defaults in templates and platforms, so the easy path is the secure one; automated security checks in CI, like static analysis, dependency scanning, secret scanning, infrastructure-as-code scanning and container image scanning, with fast feedback in pull requests; policy as code enforced at deployment, like admission controllers that reject privileged containers or unsigned images; secrets management and short-lived credentials everywhere; runtime protection and monitoring; and shared responsibility, with security teams providing tools, guardrails and expertise rather than acting only as gatekeepers.

The cultural part matters as much as the tools: developers get training and context, findings are prioritised by real risk so people aren't drowned in noise, and security incidents get blameless post-mortems like any other incident."

### [1] SAST vs DAST vs SCA vs IAST? What about secret scanning?
@tags sast, dast, sca, security testing
@hook SAST reads your code. DAST attacks the running app. SCA checks your dependencies. IAST watches from inside while tests run. Secret scanning finds leaked credentials.
@say
"Static application security testing analyses source code or binaries without running them, looking for vulnerable patterns like SQL injection, unsafe deserialisation or hardcoded secrets. It runs early, in the IDE and on pull requests, with tools like CodeQL, Semgrep or SonarQube. It can produce false positives and can't see runtime configuration.

Dynamic application security testing tests the running application from the outside, like an attacker, sending malicious inputs to find issues like injection, broken authentication and misconfigured headers. Tools like OWASP ZAP or Burp Suite run against staging. It finds real, exploitable issues but runs later and has less code-level detail.

Software composition analysis scans third-party dependencies for known vulnerabilities and license problems, using vulnerability databases. Since most code in modern applications is open-source dependencies, it's one of the highest-value checks; tools include Dependabot, Snyk, Trivy and OWASP Dependency-Check. It works best when it can tell whether the vulnerable function is actually reachable, to cut noise.

Interactive testing instruments the application from inside while tests or traffic run, combining code context with runtime behaviour.

Secret scanning detects credentials in code and Git history, with pre-commit hooks like gitleaks and platform push protection. In practice I combine SCA, secret scanning and SAST on every pull request, image and IaC scanning in the build, and DAST in staging."

### [2] How do you manage secrets across a platform?
@tags secrets management, vault, key vault
@hook One central secrets manager, workload identity to access it, short-lived or dynamic secrets where possible, automatic rotation, least privilege and audit logs.
@say
"I centralise secrets in a dedicated secrets manager, like HashiCorp Vault, Azure Key Vault, AWS Secrets Manager or Google Secret Manager, rather than scattering them across config files, CI variables and Kubernetes manifests.

Access: workloads authenticate with their platform identity, like managed identity or workload identity in Kubernetes, IAM roles, or Vault's Kubernetes auth method, so there's no 'secret zero' to bootstrap. Policies grant each workload access only to the secrets it needs.

Delivery to applications: the External Secrets Operator syncing into Kubernetes Secrets, the Secrets Store CSI driver mounting them as files, or the application SDK fetching at runtime. Mounted files are preferred over environment variables, which leak more easily.

Lifetime: prefer short-lived and dynamic secrets. Vault can generate a unique database credential per application instance that expires automatically, and cloud identities issue short-lived tokens. For static secrets, automate rotation, with applications able to pick up new values without redeploying.

Governance: audit logs for every access, alerts on unusual access patterns, separation between environments, encryption with keys in a hardware-backed key management service, and a documented break-glass process. And secrets never appear in Git, images, logs or CI output, with secret scanning to catch mistakes."

### [2] Describe a secure container image pipeline.
@tags container security, supply chain, signing
@hook Minimal pinned bases, scan in CI with severity gates, generate an SBOM, sign with cosign, store in a private registry, verify the signature at admission, rescan continuously.
@say
"Build: start from minimal, trusted base images, like distroless or official slim images, pinned by digest, mirrored into our private registry; multi-stage builds so build tools don't ship; non-root user; and no secrets in layers.

Scan in CI: scan the image with Trivy or Grype for OS and language package vulnerabilities, and fail the build on critical or high vulnerabilities that have a fix available, with documented, time-limited exceptions for the rest. Also scan the Dockerfile and manifests for misconfigurations.

Attest: generate an SBOM, a software bill of materials listing every component, and a build provenance attestation describing how and where the image was built; and sign the image and attestations with Sigstore cosign, ideally keyless signing tied to the CI's OIDC identity.

Store: push to a private registry with immutable tags, and deploy by digest.

Admit: in Kubernetes, an admission policy with Kyverno, Gatekeeper or Sigstore's policy controller only allows images from our registry with valid signatures from our pipeline, rejecting anything else, even if someone has cluster access.

Continuously: rescan images in the registry and running in clusters, since new CVEs are published every day for images that were clean when built, and rebuild regularly to pick up base image patches."

### [2] What is software supply chain security? Explain SBOMs and SLSA.
@tags supply chain, sbom, slsa
@hook Securing everything that goes into your software and how it's built: dependencies, build systems and artefacts. SBOMs list what's inside; SLSA grades how trustworthy the build is.
@say
"Software supply chain security protects everything that goes into producing and delivering software: source code, third-party dependencies, build tools, CI/CD pipelines, artefact registries and deployment. Attacks have increasingly targeted it: compromised build systems, like the SolarWinds attack; malicious or hijacked packages and typosquatting in npm and PyPI; dependency confusion, where a public package with the same name as an internal one gets installed instead; and the xz utils backdoor in 2024, where an attacker spent years gaining maintainer trust in an open-source project before inserting a backdoor. It's now number three in the OWASP Top 10 for 2025.

An SBOM, software bill of materials, is a machine-readable inventory of all components and versions in an artefact, in formats like SPDX or CycloneDX. When a new vulnerability is announced, SBOMs let you answer 'which of our services contain this library?' in minutes rather than days, and they're increasingly required by regulation and customers.

SLSA, Supply-chain Levels for Software Artifacts, is a framework of increasing levels of build integrity: scripted builds with provenance, then hosted build platforms with signed, non-forgeable provenance, then hardened, isolated builds. Provenance attestations record which source, which builder and which process produced an artefact, so consumers can verify it.

Practical controls: pin and verify dependencies with lock files and checksums, use private registries and scoped package names to block dependency confusion, require reviews and protected branches, ephemeral isolated build runners, sign artefacts and verify signatures at deploy time, and monitor dependencies continuously."

### [2] How do you secure a Kubernetes cluster?
@tags kubernetes security, hardening
@hook Lock down the API and identity, enforce pod security, segment the network, protect secrets, control what images run, keep it patched, and watch at runtime.
@say
"I think in layers.

Control plane and access: a private API server endpoint, or authorised IP ranges; authentication through the company identity provider with RBAC following least privilege, no shared admin credentials, and local accounts disabled; and audit logging enabled and shipped centrally.

Workloads: enforce Pod Security Standards at the restricted level where possible, so containers run as non-root, without privilege escalation, with capabilities dropped, a read-only root filesystem and the default seccomp profile; set resource requests and limits; and disable service account token automounting where not needed.

Network: default-deny network policies with explicit allows, restricted egress, and mTLS between services through a service mesh where needed.

Secrets: encryption at rest with a KMS key, external secrets management, and workload identity rather than static cloud credentials.

Supply chain: only signed images from approved registries, enforced by admission policies with Kyverno or Gatekeeper, plus image scanning.

Nodes: minimal, hardened node images, automatic security patching and node upgrades, no SSH access where possible, and the metadata endpoint protected from pods.

Runtime and detection: tools like Falco or cloud defender services to detect suspicious behaviour, like a shell in a container or unexpected outbound connections. Plus regular Kubernetes version upgrades and CIS benchmark scans with kube-bench or Kubescape."

### [2] What are Pod Security Standards and Pod Security Admission?
@tags pod security, admission, kubernetes
@hook Three built-in profiles: privileged, baseline, restricted. Pod Security Admission enforces them per namespace with labels, in enforce, audit or warn mode.
@say
"Pod Security Standards define three levels of security for pods. Privileged is unrestricted, for trusted system components like CNI plugins or storage drivers. Baseline prevents known privilege escalations, like privileged containers, host networking, host paths and dangerous capabilities, while staying compatible with most applications. Restricted follows hardening best practices: it requires running as non-root, disallows privilege escalation, drops all capabilities and requires a seccomp profile, which some applications need changes to meet.

Pod Security Admission is the built-in admission controller that enforces them, replacing the old PodSecurityPolicy, which was removed in Kubernetes 1.25. You apply it with labels on each namespace, choosing a level for each of three modes: enforce, which rejects violating pods; audit, which records violations in audit logs; and warn, which shows warnings to users.

A good rollout is to set warn and audit to restricted on all namespaces first, see what would break, fix the workloads, then enforce restricted for application namespaces, with baseline or privileged only for specific system namespaces. For more granular or custom rules, like requiring specific labels or image registries, you add a policy engine like Kyverno or Gatekeeper."
@deep
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: shop
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
---
# A container spec that satisfies "restricted"
securityContext:
  runAsNonRoot: true
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities: { drop: ["ALL"] }
  seccompProfile: { type: RuntimeDefault }
```

### [1] What is zero trust?
@tags zero trust, security model
@hook Never trust based on network location; verify every request's identity, device and context, grant least privilege, and assume breach.
@say
"Zero trust is a security model that drops the idea of a trusted internal network. In the traditional castle-and-moat model, anything inside the corporate network or VPN was trusted, so an attacker who got in could move freely. Zero trust assumes the network is already compromised.

Its principles: verify explicitly, so every request is authenticated and authorised based on identity, device health and context, regardless of where it comes from; least privilege, giving users and services only the access they need, ideally just-in-time and time-limited; and assume breach, so segment everything to limit blast radius, encrypt all traffic, and monitor continuously.

In practice for users: SSO with strong MFA, device posture checks, and identity-aware proxies for internal applications instead of a broad VPN. For services: workload identities, mutual TLS between services, often through a service mesh, authorisation policies per service, network policies and micro-segmentation. For infrastructure: no standing admin access, just-in-time elevation, and full audit logging.

It's not a product you buy but a direction, implemented incrementally, starting with identity, the most important control."

### [2] A cloud access key was found in a public GitHub repository. What do you do?
@tags incident, credentials, cloud security
@hook Revoke the key immediately, investigate what it did, contain and clean up any damage, then remove the root cause: long-lived keys.
@say
"I treat it as a security incident, because automated scanners find exposed cloud keys within minutes.

Contain: immediately deactivate and delete the key, or rotate the credential, in the cloud console or CLI, after recording its details. If it belonged to a user or role with broad permissions, consider temporarily restricting that identity further.

Investigate: search the audit logs, CloudTrail or the Azure Activity Log and sign-in logs, for all activity using that key since it was created, or at least since the push, from unexpected IPs or regions. Look for typical attacker actions: creating new users or access keys for persistence, launching instances, often for crypto mining, in unusual regions, reading or exporting data from storage, and changing security settings or disabling logging.

Remediate: delete anything the attacker created, revoke any credentials they created, restore modified configurations, and assess data exposure, which may trigger legal or customer notification obligations. Check the billing dashboard for unexpected usage, and contact the cloud provider's support.

Then the root cause: remove the key from the repository and its history, add secret scanning with push protection, and more importantly replace long-lived access keys with short-lived credentials: SSO for humans, roles and workload identity for applications, and OIDC federation for pipelines, so there's no key to leak next time. A blameless post-mortem covers why the key existed and how it got committed."

### [1] Encryption at rest vs in transit? What is envelope encryption with a KMS?
@tags encryption, kms, data protection
@hook In transit: TLS on every connection. At rest: encrypted storage. Envelope encryption: data keys encrypt data, a master key in the KMS encrypts the data keys.
@say
"Encryption in transit protects data moving over networks from eavesdropping and tampering, using TLS for client connections, internal service calls and database connections, ideally everywhere, not just at the edge, with modern TLS versions and mutual TLS for service-to-service traffic where possible.

Encryption at rest protects stored data, like disks, databases, object storage and backups, so stolen disks or snapshots, or unauthorised storage access, don't expose plaintext. Most cloud services now encrypt at rest by default with provider-managed keys; customer-managed keys in a KMS give more control, such as rotation policies, access policies, audit logs and the ability to revoke access by disabling the key.

Envelope encryption is how KMS-based encryption scales. You don't send large data to the KMS. Instead, a unique data encryption key is generated and used locally to encrypt the data. Then that data key is itself encrypted by a master key, the key encryption key, which never leaves the KMS or its hardware security module. The encrypted data key is stored next to the data. To decrypt, you ask the KMS to decrypt the data key, which requires permission and is logged, then decrypt the data locally. Rotating the master key doesn't require re-encrypting all the data, and access to the data is controlled through access to the master key. Azure Key Vault, AWS KMS and Google Cloud KMS all work this way."

### [2] What is runtime security, and how do tools like Falco work?
@tags runtime security, falco, detection
@hook Watch what containers actually do at the kernel level, and alert on suspicious behaviour like shells, unexpected network connections, or writes to system paths.
@say
"Scanning and admission policies protect what gets deployed, but they can't stop a zero-day exploit or a compromised dependency acting at run time. Runtime security watches what workloads actually do while running and detects or blocks suspicious behaviour.

Falco, a CNCF project, monitors system calls from the kernel, using eBPF, enriched with container and Kubernetes metadata. It evaluates them against rules, like a shell spawned inside a container, a process reading sensitive files like /etc/shadow or service account tokens, unexpected outbound connections, package managers running in production containers, writes to binary directories, or privilege escalation attempts, and sends alerts to a SIEM, Slack or an automated response system.

Related tools: Tetragon from Cilium, which can also enforce policies and kill processes in the kernel; cloud services like Microsoft Defender for Containers and Amazon GuardDuty runtime monitoring; and commercial platforms.

To make it useful: tune rules to the environment to avoid alert fatigue, using profiles of normal behaviour, since immutable containers should be very predictable; route alerts with context to the security team or on-call; and have response playbooks, like isolating the pod with a network policy and capturing forensics before killing it. A read-only root filesystem and minimal images make both attacks and detection easier."

### [2] How do you support compliance and audit requirements in a DevOps environment?
@tags compliance, audit, governance
@hook Make compliance automatic and evidenced: everything as code with reviews, policy as code, immutable audit logs, and continuous compliance checks instead of yearly screenshots.
@say
"The DevOps approach to compliance, sometimes called continuous compliance or compliance as code, is to build controls into the platform and collect evidence automatically, instead of manual checklists before an annual audit.

Change management: every change to code, infrastructure and configuration goes through version control with pull request reviews, protected branches and automated tests, which provides an auditable record of who changed what, who approved it and when; and deployments go through pipelines, with production access restricted.

Policy as code: rules like encryption required, no public storage, approved regions and required tags are enforced automatically through cloud policies, Azure Policy or AWS Config, IaC scanning and Kubernetes admission control, with continuous compliance dashboards against frameworks like CIS, ISO 27001, SOC 2 or PCI DSS.

Audit logs: cloud control-plane logs, Kubernetes audit logs, identity and access logs, and CI/CD logs, centralised in a protected, immutable store with retention matching the requirements, so they can't be tampered with.

Access: least privilege, just-in-time elevation, periodic access reviews, and MFA everywhere.

Evidence: generated automatically from these systems, like reports of policy compliance, SBOMs and vulnerability scan results, deployment approvals and access reviews. That makes audits less painful and, more importantly, makes the controls actually effective day to day."

### [2] How do you protect public applications with a WAF and DDoS protection?
@tags waf, ddos, edge security
@hook Put a CDN or edge layer with WAF rules and rate limiting in front, rely on the cloud's network DDoS protection, and design the app to scale and shed load.
@say
"A web application firewall inspects HTTP traffic and blocks common attacks, like SQL injection, cross-site scripting, path traversal and known exploit patterns, using managed rule sets such as the OWASP core rule set, plus custom rules: rate limiting per IP or API key, geo-blocking where appropriate, bot management and blocking known bad IPs. It's deployed at the edge, like Azure Front Door or Application Gateway WAF, AWS WAF on CloudFront or ALB, or Cloudflare. I start new rules in detection mode, tune false positives, then switch to blocking. A WAF is a safety net, not a replacement for secure code.

DDoS protection works at several layers. Network and transport-layer floods are absorbed by the cloud provider's infrastructure, with basic protection included and enhanced tiers, like Azure DDoS Network Protection or AWS Shield Advanced, adding tuning, monitoring and response support. Application-layer floods, which look like legitimate HTTP requests, are handled by the WAF's rate limiting, bot detection and CDN caching, which keeps load off the origin.

Architecture matters too: serve as much as possible from the CDN, hide the origin so it only accepts traffic from the edge, autoscale with sensible maximums and cost alerts, and design load shedding and graceful degradation, so the critical paths survive a large attack."

### [2] A critical vulnerability like Log4Shell is announced. How do you respond across the fleet?
@tags vulnerability response, cve, incident
@hook Find everywhere it exists fast (SBOMs, scanners), mitigate immediately where you can't patch, patch and redeploy by priority, verify, and hunt for signs of exploitation.
@say
"I'd treat it as an incident with a coordinator, because speed and tracking matter.

First, assess: understand the vulnerability, which versions are affected, how it's exploited, and whether there are mitigations short of patching. Then find exposure: query SBOMs and image scanning results for the affected library across all images, repositories and running workloads, including transitive dependencies and third-party products and appliances we run. This is exactly where an up-to-date SBOM inventory pays off; without one, it's days of grepping.

Prioritise by exposure: internet-facing services and those processing untrusted input first.

Mitigate immediately where patching takes time: WAF rules blocking known exploit patterns, configuration flags that disable the vulnerable feature, restricting outbound network egress, which blocked the second stage of Log4Shell exploits, or taking a service offline if the risk is extreme.

Patch: update the dependency, rebuild images, run the pipeline and redeploy, prioritised, with progress tracked in a shared list until everything is done, including base images and vendor products.

Verify: rescan to confirm fixed versions are running.

Hunt: check logs and network data for indicators of exploitation during the exposure window, and if found, escalate to full incident response.

Afterwards: improve whatever slowed us down, like missing SBOMs, slow pipelines or unknown ownership of services."
