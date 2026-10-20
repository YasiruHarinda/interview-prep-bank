@section cloud | Cloud Platforms: AWS and Azure
@blurb Regions, networking, identity, compute choices, data, disaster recovery and cost. AWS terms with Azure equivalents, since you should go deep on one cloud and speak the other.

### [1] What is the shared responsibility model?
@tags cloud, security, shared responsibility
@hook The provider secures the cloud itself; you secure what you put in it. The split moves as you go from VMs to managed services.
@say
"Security and operations in the cloud are split between the provider and the customer. The provider is responsible for security of the cloud: physical data centres, hardware, the network backbone, the hypervisor and the managed service infrastructure. The customer is responsible for security in the cloud: their data, identities and access management, network configuration like security groups and firewalls, encryption choices, and the configuration of the services they use.

The line moves depending on the service model. With IaaS, like VMs, I'm responsible for the guest operating system, patching, installed software and its configuration. With PaaS, like managed databases or App Service, the provider patches the OS and runtime, and I'm responsible for configuration, access and data. With SaaS, I mainly manage users, access and data.

The important point is that most cloud breaches come from the customer side: misconfigured storage made public, over-permissive IAM, leaked keys and unpatched VMs, not from the provider. So understanding exactly what you own for each service is the starting point of cloud security."

### [1] What are regions and availability zones, and how do you design for high availability?
@tags availability zones, regions, ha
@hook A region is a geographic area; availability zones are separate data centres within it. Spread every tier across zones; add regions only when the business needs it.
@say
"A region is a separate geographic area, like East US or Southeast Asia, with its own set of services and data residency. Within most regions there are multiple availability zones: physically separate data centres with independent power, cooling and networking, connected by low-latency links. A zone can fail, from a power or network problem, without affecting the others.

For high availability within a region, I spread every tier across at least two, ideally three, zones: instances or Kubernetes nodes in multiple zones behind a zone-redundant load balancer; databases with synchronous replication to a standby in another zone, like RDS Multi-AZ or zone-redundant Azure SQL; and zone-redundant storage. Then losing a zone means a short failover, not an outage.

Multi-region is for surviving a whole-region outage, or for serving users globally with low latency, or for regulatory reasons. It's much more complex and expensive: data replication across regions, which is usually asynchronous so it brings consistency trade-offs, global traffic routing, and running or keeping warm capacity in two places. So I'd go multi-zone by default, and multi-region only when the business's availability or recovery requirements justify it."

### [2] What is the difference between high availability and disaster recovery? Explain RPO and RTO.
@tags disaster recovery, rpo, rto
@hook HA keeps you running through component failures; DR gets you back after a disaster. RPO: how much data you can lose. RTO: how long you can be down.
@say
"High availability is about staying up despite routine failures, like a server, disk or zone failing, through redundancy and automatic failover, usually within one region. Disaster recovery is about recovering from major events, like a region outage, data corruption, ransomware or someone deleting a production database, which often HA alone can't fix, since replication faithfully copies a deletion too.

Two numbers define DR requirements. The recovery point objective is the maximum acceptable data loss, measured in time: an RPO of 15 minutes means we may lose up to the last 15 minutes of data, so backups or replication must be at least that frequent. The recovery time objective is the maximum acceptable downtime: an RTO of one hour means service must be restored within an hour.

DR strategies, from cheapest and slowest to most expensive and fastest: backup and restore, where you restore from backups into new infrastructure, with RPO and RTO in hours; pilot light, where core data is replicated continuously and minimal infrastructure is kept ready, to scale up in a disaster; warm standby, a scaled-down but fully working copy in another region; and multi-site active-active, both regions serving traffic, with near-zero RTO and RPO, at the highest cost and complexity.

The business chooses RPO and RTO per system based on the cost of downtime, and the most important practice is actually testing the recovery regularly, including restoring backups, because an untested DR plan is a hope, not a plan."

### [2] How would you design a VPC or VNet for a typical three-tier application?
@tags vpc, networking, design
@hook Non-overlapping CIDR, public and private subnets in each zone, internet gateway for the public tier, NAT for private egress, security groups per tier, private endpoints for cloud services.
@say
"I'd start with an address range that's large enough for growth, like a /16, and doesn't overlap with other VPCs, on-premise networks or VPNs we might connect later.

Subnets per tier, repeated in each availability zone, typically three zones. Public subnets hold only what must be internet-facing: the load balancers, and NAT gateways. Private application subnets hold the application servers or Kubernetes nodes, with no public IPs. Private data subnets hold databases and caches, reachable only from the application tier. In Kubernetes setups, I'd make the application subnets generous, because pods may consume VPC IP addresses.

Routing: public subnets route 0.0.0.0/0 to an internet gateway. Private subnets route internet-bound traffic to a NAT gateway, one per zone for resilience, so instances can reach out for updates and APIs but can't be reached from the internet. Traffic to cloud services like object storage, the container registry or secrets manager goes through VPC endpoints or private endpoints, which keeps it off the internet and saves NAT costs.

Security: security groups per tier that reference each other, like the database only accepting connections from the app tier's security group on port 5432; optional network ACLs as coarse subnet guards; VPC flow logs for auditing; and no SSH from the internet, using a bastion or session manager instead. In Azure, the equivalents are a VNet, subnets, NSGs, a NAT Gateway, Private Endpoints and Azure Bastion."
@deep
```text
VPC 10.0.0.0/16 (3 AZs)
  public-a 10.0.0.0/24   public-b 10.0.1.0/24   public-c 10.0.2.0/24    -> IGW
     [ALB]  [NAT-a]         [NAT-b]                 [NAT-c]
  app-a  10.0.16.0/20    app-b  10.0.32.0/20    app-c  10.0.48.0/20     -> NAT in same AZ
     [EKS/AKS nodes, app servers]  SG: from ALB SG on 8080
  data-a 10.0.64.0/24    data-b 10.0.65.0/24    data-c 10.0.66.0/24     -> no internet route
     [RDS primary / standby, Redis]  SG: from app SG on 5432 / 6379
  VPC endpoints: S3 (gateway), ECR, Secrets Manager, STS (interface)
```

### [2] How does IAM work, and how do you apply least privilege?
@tags iam, security, least privilege
@hook Identities (users, groups, roles) get permissions through policies. Prefer roles with temporary credentials, grant the minimum, and remember explicit deny always wins.
@say
"In AWS IAM, identities are users, groups and roles. Users represent people or, historically, applications with long-term credentials; groups bundle users; roles are identities that can be assumed by trusted principals, like an EC2 instance, a Lambda function, a pod or another account, giving temporary credentials. Policies are JSON documents of allow or deny statements on actions and resources, with optional conditions, attached to identities or to resources, like an S3 bucket policy.

Evaluation logic: everything is denied by default; an explicit allow grants access; and an explicit deny anywhere always wins. Across accounts in an organisation, service control policies set guardrails that even administrators can't exceed, and permission boundaries cap what a role can be granted.

Least privilege in practice: humans log in through SSO from the company identity provider and assume roles, with no long-lived IAM user keys; workloads use roles, like instance profiles and pod identities, never embedded access keys; policies grant specific actions on specific resources, avoiding wildcards; start from narrow permissions and expand based on actual needs, using access analysis tools that generate policies from activity logs and flag unused permissions; use conditions like source VPC or required MFA for sensitive actions; and review regularly. CloudTrail logs every API call for auditing.

In Azure, the equivalent model is Microsoft Entra ID identities with Azure RBAC role assignments at a scope, like a management group, subscription, resource group or resource, plus managed identities for workloads."

### [2] How do workloads access cloud services without storing credentials?
@tags workload identity, managed identity, irsa, security
@hook Give the workload its own identity, managed identity on Azure, IAM roles on AWS, federated to Kubernetes service accounts, and let the platform issue short-lived tokens.
@say
"The goal is that no access keys or passwords for cloud services exist in code, config or environment variables at all.

On VMs and serverless, the platform attaches an identity: an IAM role through an instance profile on EC2 or an execution role on Lambda, and a managed identity on Azure VMs, App Service or Functions. The SDK automatically fetches short-lived credentials from the platform's metadata endpoint and rotates them.

On Kubernetes, it's done per pod through federation between the Kubernetes service account and the cloud identity. On AKS, Microsoft Entra Workload ID: the cluster's OIDC issuer signs the service account token, and a federated credential on a user-assigned managed identity trusts tokens for that specific service account, so the pod exchanges its token for an Entra token. On EKS, IAM Roles for Service Accounts, IRSA, works the same way with an OIDC provider, and EKS Pod Identity is a newer, simpler alternative using an agent and associations. GKE has Workload Identity Federation.

The same federation idea applies to CI/CD: GitHub Actions or other pipelines use OIDC to assume a role or managed identity scoped to a repository and branch.

Benefits: no secrets to leak or rotate, per-workload least privilege rather than one shared node identity, and every API call is attributable in audit logs to the specific workload."

### [2] VMs vs serverless functions vs managed containers vs Kubernetes. How do you choose?
@tags compute, ec2, lambda, fargate, eks
@hook Pick the highest level of abstraction that meets your needs: functions for events, managed containers for most services, Kubernetes when you need its power, VMs when you need the OS.
@say
"I choose based on control needed, workload shape, team skills and cost.

Virtual machines, EC2 or Azure VMs: full control over the OS, needed for legacy software, special kernels or licensing, or very steady workloads where reserved pricing is cheapest. But you own patching, scaling and configuration.

Serverless functions, Lambda or Azure Functions: event-driven, short-lived code that scales from zero and is billed per invocation. Ideal for glue code, event processing, webhooks, scheduled tasks and spiky, low-volume APIs. Limits are execution time, cold starts and cost at high steady volume.

Managed containers without managing a cluster, like ECS with Fargate, Azure Container Apps or Google Cloud Run: you deploy container images and the platform handles servers, scaling and often scale to zero. It's a sweet spot for many web services and APIs with little operational overhead.

Kubernetes, EKS, AKS or GKE: maximum flexibility and portability, a rich ecosystem for service mesh, operators, GitOps and policy, and efficient bin-packing of many services. It's worth it for many microservices, platform teams, and complex scheduling or networking needs, but it's the most operationally demanding.

My default for a small team's new service would be managed containers, moving to Kubernetes when the number of services, the need for custom platform capabilities or cost efficiency at scale justifies it."

### [2] How do auto scaling groups or VM scale sets work?
@tags autoscaling, asg, vmss
@hook Keep a fleet of identical instances between a minimum and maximum, replace unhealthy ones, and scale on metrics, schedules or predictions.
@say
"An auto scaling group in AWS, or a virtual machine scale set in Azure, manages a fleet of identical instances created from a launch template or image. You set a minimum, a maximum and a desired capacity, and spread instances across availability zones.

It provides self-healing, since instances that fail health checks, either EC2 status checks or load balancer health checks, are terminated and replaced, and scaling. Scaling policies include target tracking, the most common, like 'keep average CPU at 50 percent' or 'requests per target at 1,000'; step scaling based on alarm thresholds; scheduled scaling for predictable patterns, like business hours; and predictive scaling, which forecasts from historical load.

Important details: cooldowns or warm-up times, so it doesn't overreact while new instances start; lifecycle hooks, to run actions when instances launch or terminate, like draining connections or registering in a system; instance refresh for rolling out a new image; mixing on-demand and spot instances for cost; and choosing scaling metrics that track real demand, since CPU isn't always the bottleneck.

For Kubernetes, the node groups or node pools are backed by these, with the cluster autoscaler or Karpenter deciding the capacity based on pending pods."

### [2] ALB vs NLB, and the Azure equivalents?
@tags load balancers, aws, azure
@hook ALB: layer 7 HTTP routing. NLB: layer 4, extreme performance, static IPs. In Azure: Application Gateway (L7), Load Balancer (L4), Front Door (global L7).
@say
"In AWS, the Application Load Balancer works at layer 7 for HTTP and HTTPS. It routes by host, path, headers and query strings to target groups of instances, IPs, containers or Lambda functions, terminates TLS, supports WebSockets and gRPC, integrates with a web application firewall and authentication, and is the default for web applications and APIs.

The Network Load Balancer works at layer 4, TCP, UDP and TLS. It handles millions of requests per second with very low latency, provides static IP addresses per zone, preserves the client's source IP, and is used for non-HTTP protocols, extreme performance needs, or exposing services through PrivateLink. The Gateway Load Balancer is for inserting third-party network appliances like firewalls into the traffic path.

In Azure: Azure Load Balancer is layer 4, regional; Application Gateway is layer 7, regional, with an optional WAF, and Application Gateway for Containers serves Kubernetes ingress and the Gateway API; Azure Front Door is a global layer 7 entry point with CDN, WAF and multi-region failover; and Traffic Manager is DNS-based global routing. On AWS, the global options are CloudFront and Global Accelerator, plus Route 53 routing policies."

### [1] What should you know about object storage like S3 or Azure Blob Storage?
@tags s3, blob storage, storage classes
@hook Virtually unlimited, highly durable objects with storage tiers, lifecycle rules, versioning, and security settings that must be locked down from day one.
@say
"Object storage stores files as objects in buckets or containers, accessed over HTTP APIs. It's designed for very high durability, AWS quotes eleven nines for S3, scales practically without limit, and is used for static assets, backups, logs, data lakes, ML datasets and user uploads. Since 2020, S3 provides strong read-after-write consistency.

Storage classes trade storage price against access cost and speed: S3 Standard for frequently accessed data, Intelligent-Tiering, which moves objects automatically based on access patterns, Standard-IA and One Zone-IA for infrequent access, and the Glacier tiers for archives, from milliseconds to hours of retrieval time. Azure has Hot, Cool, Cold and Archive tiers. Lifecycle rules move or delete objects automatically, like moving logs to archive after 90 days and deleting them after a year.

Security is where people get burned: keep block public access enabled at the account level, use bucket policies and IAM with least privilege, encrypt at rest, which is now the default, enforce TLS, use pre-signed URLs for temporary access instead of making things public, and serve public content through a CDN with origin access control. Versioning, plus object lock for immutable backups, protects against accidental deletion and ransomware. And access logging or data events record who accessed what."

### [2] RDS Multi-AZ vs read replicas?
@tags rds, databases, high availability
@hook Multi-AZ is for availability: a synchronous standby that takes over on failure. Read replicas are for scaling reads: asynchronous copies you can query.
@say
"Multi-AZ deployment keeps a synchronous standby copy of the database in another availability zone. Every write is committed in both places, so there's no data loss on failover. If the primary fails, or during maintenance, RDS automatically fails over to the standby, typically within a minute or two, and the DNS endpoint points to the new primary, so applications just reconnect. In the classic setup, the standby doesn't serve reads; it exists purely for high availability. Newer Multi-AZ cluster deployments add readable standbys.

Read replicas are asynchronous copies used to scale read traffic, like reporting queries or read-heavy endpoints. They have their own endpoints, can be in other regions, which helps with global reads and disaster recovery, and can be promoted to standalone databases. Because replication is asynchronous, they can lag behind, so applications must tolerate slightly stale reads, and they're not an automatic failover mechanism.

So they solve different problems, and production databases often use both: Multi-AZ for resilience, and read replicas for scale. Aurora works differently, with storage replicated across three zones and up to fifteen low-lag replicas that can also act as failover targets. Azure's equivalents are zone-redundant high availability and read replicas in Azure Database for PostgreSQL or MySQL, and Azure SQL's geo-replication."

### [2] How do you reduce cloud costs without hurting reliability?
@tags finops, cost optimisation
@hook Visibility first (tags and cost allocation), then rightsize, scale with demand, use commitments and spot wisely, clean up waste, and fix architecture-level costs like data transfer.
@say
"I approach it as FinOps: make costs visible, optimise, and keep it continuous.

Visibility: consistent tagging or labels for team, service and environment, cost allocation reports and dashboards, Kubernetes cost tools like OpenCost or Kubecost, and budgets with anomaly alerts. Teams that see their own costs optimise them.

Quick wins: delete waste, like unattached disks, old snapshots, idle load balancers, unused public IPs and forgotten test environments; schedule non-production environments to shut down outside working hours; and apply storage lifecycle policies.

Rightsizing: compare provisioned resources with actual usage. Oversized VMs and inflated Kubernetes requests are usually the biggest waste. Autoscaling, both pods and nodes, so capacity follows demand.

Pricing: savings plans or reserved instances for the steady baseline, spot or preemptible instances for fault-tolerant work like batch jobs, CI runners and stateless replicas, and newer, cheaper instance families, like ARM-based ones, after testing.

Architecture: data transfer and NAT gateway charges are often surprisingly large, so use private endpoints and keep chatty services in the same zone; choose managed services or serverless where it's genuinely cheaper; cache to reduce expensive calls.

And reliability guardrails: keep headroom for peaks and failover, keep multi-zone redundancy for production, and measure SLOs before and after each change."

### [1] What is the Well-Architected Framework?
@tags well-architected, best practices
@hook A provider checklist for good cloud design across six pillars: operational excellence, security, reliability, performance efficiency, cost optimisation and sustainability.
@say
"The Well-Architected Framework is a set of design principles and questions published by AWS, with equivalents from Azure and Google Cloud, for evaluating cloud architectures. AWS's version has six pillars.

Operational excellence: running and monitoring systems, infrastructure as code, small reversible changes, and learning from failures. Security: identity and least privilege, traceability, protecting data in transit and at rest, and preparing for incidents. Reliability: recovering automatically from failure, scaling horizontally, testing recovery, and managing change. Performance efficiency: choosing the right resources, using managed services, and experimenting with new options. Cost optimisation: paying only for what you need, measuring efficiency, and attributing costs. And sustainability: minimising the environmental impact of workloads, like improving utilisation.

Azure's Well-Architected Framework has five pillars: reliability, security, cost optimisation, operational excellence and performance efficiency. There's a review tool that walks through the questions for a workload and produces improvement recommendations. In interviews, it's a good structure for evaluating any design: go through the pillars and name the trade-offs."

### [2] Map the main AWS services to their Azure equivalents.
@tags aws, azure, mapping
@hook Know one cloud deeply and be able to translate. Most concepts map one to one, with different names.
@say
"Most concepts translate directly. Compute: EC2 is Azure Virtual Machines; auto scaling groups are VM scale sets; Lambda is Azure Functions; ECS and Fargate are roughly Azure Container Apps or Container Instances; EKS is AKS. Containers: ECR is Azure Container Registry.

Networking: a VPC is a VNet; security groups are network security groups; an ALB is Application Gateway; an NLB is Azure Load Balancer; CloudFront is Azure Front Door or Azure CDN; Route 53 is Azure DNS plus Traffic Manager for routing; PrivateLink is Private Link and private endpoints; Direct Connect is ExpressRoute.

Identity and security: IAM roles and policies map to Microsoft Entra ID identities, Azure RBAC and managed identities; Secrets Manager and KMS map to Azure Key Vault; AWS Organizations and SCPs map to management groups and Azure Policy.

Storage and data: S3 is Blob Storage; EBS is managed disks; EFS is Azure Files; RDS is Azure SQL Database and Azure Database for PostgreSQL or MySQL; DynamoDB is roughly Cosmos DB; ElastiCache is Azure Cache for Redis, now Azure Managed Redis.

Messaging: SQS is Service Bus queues or Storage queues; SNS is Service Bus topics or Event Grid; EventBridge is Event Grid; Kinesis is Event Hubs.

Operations: CloudWatch is Azure Monitor with Log Analytics and Application Insights; CloudTrail is the Activity Log; CloudFormation is ARM and Bicep."

### [2] What should you know about running AKS in production?
@tags aks, azure, kubernetes
@hook Separate system and user node pools across zones, Entra ID for access, workload identity for pods, ACR attached, a deliberate network model, planned upgrades, and Azure Monitor or Prometheus.
@say
"A few areas matter most.

Node pools: a system node pool for critical cluster add-ons like CoreDNS, tainted so application pods don't land there, and user node pools for workloads, sized and specialised per need, like general purpose, memory-optimised or spot pools, spread across availability zones. The cluster autoscaler or node auto-provisioning scales them.

Identity and access: integrate the cluster with Microsoft Entra ID and use Azure RBAC for Kubernetes authorisation, so access follows company groups and no shared admin kubeconfigs exist; disable local accounts. Pods use Microsoft Entra Workload ID with federated managed identities to access Key Vault, storage or databases without secrets.

Registry: attach Azure Container Registry so nodes pull images with their managed identity, ideally over a private endpoint.

Networking: choose the network model deliberately. Azure CNI Overlay is the common default, giving pods addresses from a separate overlay range so they don't exhaust VNet addresses; Azure CNI powered by Cilium adds eBPF dataplane and network policy; plus a private cluster or authorised IP ranges for the API server, and egress through a NAT Gateway or Azure Firewall.

Operations: plan upgrades, since AKS supports a limited window of Kubernetes versions, using maintenance windows, auto-upgrade channels, PodDisruptionBudgets and surge settings; monitoring with Azure Monitor managed Prometheus and Grafana or Container Insights; and Azure Policy for Kubernetes for guardrails. Given the Ingress NGINX retirement, ingress choices like Application Gateway for Containers or a Gateway API implementation also need planning."

### [2] Queues vs topics vs event buses: SQS, SNS, EventBridge and the Azure equivalents?
@tags messaging, sqs, sns, service bus
@hook Queue: one consumer group pulls work. Topic: fan out a message to many subscribers. Event bus: route events by content rules. Event stream: replayable high-volume log.
@say
"SQS is a managed message queue: producers send messages, consumers poll and delete them after processing. It decouples services and buffers load. Standard queues offer at-least-once delivery with best-effort ordering; FIFO queues give ordering and deduplication at lower throughput. Visibility timeouts and dead-letter queues handle failures.

SNS is publish-subscribe: a message published to a topic is pushed to all subscribers, like SQS queues, Lambda functions, HTTP endpoints, email or SMS. The classic fan-out pattern is SNS to several SQS queues, so each consumer gets its own durable copy.

EventBridge is an event bus with content-based routing rules: events from your services, AWS services and SaaS integrations are matched against rules and routed to targets, with schema registry, archive and replay, and scheduling.

Kinesis Data Streams, or Kafka through MSK, are for high-throughput ordered event streams that multiple consumers can read and replay.

In Azure: Service Bus provides enterprise queues and topics with sessions for ordering, transactions and dead-lettering, so it covers both SQS and SNS-style use; Storage Queues are a simpler, cheaper queue; Event Grid is the event routing service, like EventBridge, for reactive, push-based events; and Event Hubs is the high-throughput streaming platform, Kafka-compatible, like Kinesis."

### [2] How do you keep traffic to cloud services off the public internet?
@tags private endpoints, privatelink, networking, security
@hook Private endpoints give a service a private IP inside your network; service or gateway endpoints route privately without one. Combine with private DNS and disable public access.
@say
"By default, managed services like storage, databases, key vaults and registries have public endpoints, even if they're protected by authentication. For sensitive environments, I keep traffic on private networks.

Private endpoints, AWS PrivateLink interface endpoints or Azure Private Endpoints, create a network interface with a private IP address inside my VPC or VNet for a specific service instance. Traffic stays on the provider's backbone, and I can then disable public network access on the service entirely, so it's unreachable from the internet. The tricky part is DNS: the service's normal hostname must resolve to the private IP inside the network, using private DNS zones linked to the VNets, or Route 53 private hosted zones, including for on-premise clients over VPN.

Lighter options: AWS gateway endpoints for S3 and DynamoDB, which are free and work through route tables; and Azure service endpoints, which keep traffic on the backbone and let the service restrict access to specific subnets, but still use the service's public IP.

Benefits: reduced exposure, compliance, and often lower cost, since traffic no longer goes through NAT gateways, which charge per gigabyte. Combined with egress firewalls, it's how you build networks where workloads can only talk to approved destinations."

### [3] How do you organise cloud accounts or subscriptions for a growing company?
@tags landing zone, multi-account, governance
@hook Separate accounts or subscriptions per environment and workload, organised under a hierarchy with central identity, logging, networking and guardrail policies: a landing zone.
@say
"Putting everything in one account or subscription quickly becomes a problem: no blast-radius isolation, messy permissions, unclear costs and quota contention. The best practice is a multi-account structure, often called a landing zone.

In AWS, AWS Organizations with organisational units, like security, infrastructure, workloads split into production and non-production, and sandbox, and separate accounts per workload and environment. Service control policies apply guardrails across OUs, like denying unapproved regions, preventing disabling of CloudTrail, or blocking public S3. Control Tower can automate the setup.

In Azure, management groups form the hierarchy above subscriptions, with Azure Policy and RBAC assigned at management group level and inherited, and subscriptions per workload and environment; the Azure landing zone reference architecture describes it.

Shared foundations: central identity with SSO from the company identity provider; a dedicated log archive account or workspace collecting audit logs from everywhere, protected from deletion; a security tooling account; centralised networking, like a hub-and-spoke or transit gateway topology with shared egress and inspection; and account vending, automated creation of new accounts with the baseline applied through infrastructure as code.

The result is that a mistake or compromise in one workload's sandbox can't affect production, permissions are simpler, and costs are naturally separated."

### [3] Design a highly available, multi-region web application.
@tags design, multi-region, high availability
@hook Global entry point with health-based failover, stateless app tier in each region across zones, a data strategy that matches your RPO, and regular failover testing.
@say
"I'd start by clarifying the targets: availability SLO, RTO and RPO, whether users are global, and whether we need active-active or whether active-passive is enough, because the data layer complexity depends on it.

Global layer: a global entry point like Azure Front Door, AWS CloudFront with Route 53, or Global Accelerator, routing users to the nearest healthy region with health probes, plus CDN caching and a web application firewall. DNS-based failover works too, but TTLs slow down the switch.

Regional layer: in each region, the same stack deployed from the same infrastructure code and pipeline: zone-redundant load balancers, a stateless application tier across three availability zones with autoscaling, and regional caches.

Data layer, the hard part. Active-passive: a primary database in one region with asynchronous replication to the other, like cross-region read replicas, Aurora Global Database or Azure SQL failover groups. RPO is seconds, and failover promotes the secondary. Active-active: either a globally distributed database like DynamoDB global tables, Cosmos DB or Spanner, accepting conflict resolution and consistency trade-offs, or partitioning users by home region. Object storage uses cross-region replication. Sessions live in a store available in both regions, or tokens make the app stateless.

Operations: automated, rehearsed failover runbooks, regular game days that actually fail over a region, capacity in the passive region to take full load, or fast scale-up, monitoring per region, and making sure dependencies, like identity, secrets and CI/CD, don't have a single-region weak point."

### [1] How do you securely access servers in private subnets?
@tags bastion, access, security
@hook Avoid open SSH. Use a managed session service (SSM Session Manager, Azure Bastion), or a hardened bastion with SSO, MFA and logging, or a zero-trust access proxy.
@say
"Servers in private subnets have no public IP, so you need a controlled path in.

The traditional approach is a bastion host, or jump box: a small, hardened instance in a public subnet, with SSH allowed only from known IP ranges, MFA, and session logging, used to hop into private instances. It works, but it's an exposed server to maintain, and SSH keys need managing.

Better today are managed options with no inbound ports open at all. AWS Systems Manager Session Manager gives shell access through the SSM agent, authenticated with IAM, with sessions logged to CloudWatch or S3. Azure Bastion provides browser-based or native-client RDP and SSH through the Azure portal, integrated with Entra ID. GCP has Identity-Aware Proxy TCP forwarding. Zero-trust access tools like Teleport, Boundary, Tailscale or Cloudflare Access provide identity-based, short-lived, audited access across environments.

Best practice beyond the tool: just-in-time access that expires, access through SSO groups rather than shared keys, full session auditing, and asking why people need to log into servers at all. With immutable infrastructure and good observability, routine production SSH should be rare."
