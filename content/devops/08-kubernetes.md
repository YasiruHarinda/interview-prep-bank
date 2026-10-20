@section k8s | Kubernetes Core
@blurb Architecture, workloads, networking, config, probes, resources, scaling, scheduling, storage and security. Expected knowledge for most mid-level roles.

### [1] What is Kubernetes, and what problems does it solve?
@tags kubernetes, basics
@hook A control system that keeps your declared desired state true: it schedules containers, restarts them, scales them, rolls them out, and wires up networking and storage.
@say
"Kubernetes is an open-source container orchestration platform. You declare the desired state of your applications, like 'run three replicas of this image with these resources, reachable on this service name', and Kubernetes continuously works to make the actual state match it.

It solves the problems you hit when running many containers across many machines: scheduling, deciding which node each container runs on based on resources and constraints; self-healing, restarting crashed containers and replacing pods on failed nodes; scaling, manually or automatically based on metrics; rollouts and rollbacks without downtime; service discovery and load balancing, giving groups of pods a stable name and IP; configuration and secret management; and storage orchestration, attaching persistent volumes.

Its real power is the declarative, API-driven model with controllers reconciling state in loops, plus extensibility through custom resources and operators, which is why it became the standard platform layer across clouds. The trade-off is complexity: for a couple of simple services, managed container platforms like Azure Container Apps, Cloud Run or ECS with Fargate can be a better fit."

### [1] Explain the Kubernetes architecture.
@tags architecture, control plane
@hook Control plane: API server, etcd, scheduler, controller manager, cloud controller manager. Each node: kubelet, kube-proxy, container runtime.
@say
"A cluster has a control plane and worker nodes.

The control plane components: the API server is the front door; every component and every kubectl command talks to it through a REST API, and it handles authentication, authorisation and admission control. etcd is a consistent, distributed key-value store that holds the entire cluster state; only the API server talks to it. The scheduler watches for pods without an assigned node and picks a node based on resource requests, affinity rules, taints and other constraints. The controller manager runs the controllers, reconciliation loops like the Deployment, ReplicaSet, Node and Job controllers, each driving actual state toward desired state. The cloud controller manager integrates with the cloud provider, for example creating load balancers and managing node lifecycle.

Each worker node runs the kubelet, the agent that ensures the containers for the pods assigned to its node are running and healthy, and reports status; a container runtime, like containerd, which actually runs the containers; and kube-proxy, which programs the node's networking rules so Services route to the right pods, unless a CNI like Cilium replaces it with eBPF. A CNI plugin provides pod networking, and CoreDNS provides service discovery.

In managed services like AKS, EKS and GKE, the provider runs the control plane for you; you manage the nodes and workloads."

### [2] What happens when you run kubectl apply with a Deployment manifest?
@tags kubernetes internals, controllers
@hook API server validates and stores it in etcd; the Deployment controller makes a ReplicaSet; the ReplicaSet controller makes pods; the scheduler binds them; kubelets start them.
@say
"kubectl reads my kubeconfig, sends the manifest to the API server, and with apply, computes what changed compared with the last applied configuration.

The API server authenticates the request, authorises it with RBAC, runs admission controllers, which can mutate the object, like injecting defaults or sidecars, and validate it, like policy engines rejecting a privileged container. Then it persists the Deployment object in etcd.

Controllers watch the API server. The Deployment controller sees the new or changed Deployment and creates or updates a ReplicaSet for this pod template. The ReplicaSet controller sees it needs, say, three pods, and creates three pod objects, which have no node assigned yet.

The scheduler sees the unscheduled pods, filters nodes that can't fit them, because of resource requests, taints, affinity or volume constraints, scores the rest, and binds each pod to a node by writing the node name to the pod.

On each chosen node, the kubelet sees a pod assigned to it, asks the container runtime to pull the image and start the containers, the CNI plugin sets up the pod's network and IP, and volumes are mounted. The kubelet runs the probes and reports status back.

Once readiness probes pass, the pod's IP is added to the EndpointSlices of any matching Service, and kube-proxy or the CNI updates routing rules on every node, so traffic starts flowing. Everything is asynchronous and level-triggered: each component just keeps reconciling what it sees."

### [1] What is a pod? Why does Kubernetes use pods instead of single containers?
@tags pods, sidecars, init containers
@hook The smallest deployable unit: one or more tightly coupled containers sharing a network namespace and volumes, scheduled together.
@say
"A pod is the smallest unit Kubernetes schedules: one or more containers that are always placed on the same node, share the same network namespace, so the same IP and they can talk over localhost, and can share volumes. Pods are ephemeral and disposable; they get replaced rather than repaired, which is why you manage them through controllers like Deployments rather than directly.

The pod abstraction exists because some helpers must run right next to the main application. Common patterns: a sidecar, like a log shipper, a proxy for a service mesh, or a process that refreshes credentials or config; an adapter that converts the app's output, like metrics, to a standard format; and an ambassador that proxies connections to external services.

Init containers run to completion, in order, before the main containers start, for example waiting for a dependency, running a migration or fetching configuration. Kubernetes also has native sidecar containers, defined as init containers with a restart policy of Always, which start before the main containers and keep running alongside them, and which shut down after them, fixing old ordering problems, like a log shipper exiting before the app finished.

Most pods have just one container; multi-container pods are for genuinely coupled helpers, not for packing unrelated services together."

### [1] Deployment vs StatefulSet vs DaemonSet vs Job and CronJob?
@tags workloads, statefulset, daemonset
@hook Deployment: interchangeable stateless replicas. StatefulSet: stable identity and storage per replica. DaemonSet: one per node. Job: run to completion. CronJob: on a schedule.
@say
"A Deployment manages stateless, interchangeable replicas through ReplicaSets. Pods get random names, can be replaced in any order, and it supports rolling updates and rollbacks. It's the default for web services and APIs.

A StatefulSet is for workloads where each replica needs a stable identity: stable, ordered pod names like db-0, db-1, db-2; stable network identities through a headless service, so each pod has its own DNS name; and a dedicated persistent volume per replica that follows it if it's rescheduled. Pods are created, updated and deleted in order. It's used for databases, Kafka, ZooKeeper, Elasticsearch and other clustered stateful systems, although in production many teams prefer managed database services or operators.

A DaemonSet runs exactly one pod on every node, or on selected nodes, and automatically adds one when a node joins. It's used for node-level agents: log collectors, monitoring agents like the node exporter, CNI plugins and security agents.

A Job runs pods until a task completes successfully, with retries and optional parallelism, like a batch import or a database migration. A CronJob creates Jobs on a schedule, like nightly reports or backups, with settings for concurrency policy, history limits and deadlines."

### [1] What are the Kubernetes Service types?
@tags services, networking
@hook ClusterIP: internal virtual IP. NodePort: a port on every node. LoadBalancer: a cloud load balancer. ExternalName: a DNS alias. Headless: no virtual IP, DNS returns pod IPs.
@say
"A Service gives a changing set of pods, selected by labels, a stable name and virtual IP, and load-balances across the ready ones.

ClusterIP is the default: a virtual IP reachable only inside the cluster, with a DNS name like orders.shop.svc.cluster.local. It's used for service-to-service communication.

NodePort exposes the service on a static port, in the range 30000 to 32767, on every node's IP, forwarding to the service. It's simple but rarely used directly in production; it's often a building block for external load balancers.

LoadBalancer asks the cloud provider to provision an external load balancer, like an Azure Load Balancer or an AWS NLB, that routes to the service. It's the standard way to expose a single service directly, but each one costs money, which is why HTTP services usually share one entry point through Ingress or the Gateway API.

ExternalName maps the service name to an external DNS name with a CNAME, useful for referring to external databases through a cluster-internal name.

A headless service, with clusterIP set to None, has no virtual IP; DNS returns the individual pod IPs instead. StatefulSets use it so each pod gets its own stable DNS name, and it's used for client-side load balancing or peer discovery."

### [2] How does a Service actually route traffic to pods?
@tags services, kube-proxy, endpoints, cni
@hook Labels select pods; ready pod IPs go into EndpointSlices; kube-proxy (or eBPF) programs every node to translate the Service IP to a pod IP.
@say
"A Service has a label selector. The EndpointSlice controller continuously finds pods matching the selector that are ready, meaning their readiness probes pass, and records their IPs and ports in EndpointSlice objects. Pods that aren't ready are left out, which is why readiness probes control traffic.

On every node, kube-proxy watches Services and EndpointSlices and programs the kernel's packet handling. In iptables mode, it writes NAT rules so that traffic to the Service's virtual IP and port gets its destination rewritten to one of the pod IPs, picked roughly at random. IPVS mode does the same with a kernel load balancer that scales better with many services, and newer clusters use nftables mode. Some CNI plugins, like Cilium, replace kube-proxy entirely with eBPF programs, which is more efficient and adds observability.

The Service's virtual IP doesn't belong to any interface; it only exists in these rules, which is why you can't ping a ClusterIP. Pod-to-pod packets then travel over the pod network provided by the CNI plugin, Azure CNI, Calico, Cilium and so on. And CoreDNS resolves the service name to the ClusterIP.

This explains common issues: a Service with no endpoints usually means the selector doesn't match the pod labels, or no pod is ready, which kubectl get endpointslices shows immediately."

### [2] Ingress vs the Gateway API. What should a new platform use in 2026?
@tags ingress, gateway api, networking, 2026
@hook Ingress is simple but limited and now feature-frozen, and the Ingress NGINX controller was retired in March 2026. Gateway API is the expressive, role-oriented successor.
@say
"Ingress is the original API for HTTP routing into a cluster: host and path rules that send traffic to Services, implemented by an ingress controller. Its limitations are that it's HTTP-focused, the core spec is minimal, so advanced features like header-based routing, traffic splitting, timeouts or rewrites ended up in controller-specific annotations that aren't portable, and it mixes responsibilities of cluster operators and application teams in one object.

The Gateway API is the successor. It splits responsibilities into resources: GatewayClass, defined by the infrastructure provider; Gateway, a load balancer instance with listeners, owned by the platform team; and routes, like HTTPRoute, GRPCRoute and TLSRoute, owned by application teams, which attach to Gateways with explicit permission. It natively supports weighted traffic splitting for canaries, header and query matching, request mirroring, timeouts and cross-namespace references, all in the standard spec, with many implementations like Envoy Gateway, Istio, Cilium, NGINX Gateway Fabric and the cloud providers' gateways.

The 2026 context matters: the community Ingress NGINX controller, one of the most widely used, was retired in March 2026, so it no longer receives security fixes. The Ingress API itself still works but is feature-frozen. So for a new platform I'd choose the Gateway API, and for existing Ingress NGINX users, plan a migration, with tools like ingress2gateway helping convert resources."
@deep
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: orders
  namespace: shop
spec:
  parentRefs:
    - name: public-gateway          # owned by the platform team
      namespace: infra
  hostnames: ["api.example.com"]
  rules:
    - matches:
        - path: { type: PathPrefix, value: /orders }
      backendRefs:
        - name: orders-stable
          port: 8080
          weight: 90
        - name: orders-canary       # native traffic splitting, no annotations
          port: 8080
          weight: 10
```

### [1] ConfigMaps vs Secrets. Are Kubernetes Secrets actually secure?
@tags configmaps, secrets, security
@hook ConfigMaps hold plain config; Secrets hold sensitive values, but only Base64-encoded by default. Encrypt etcd, lock down RBAC, and prefer an external secrets manager.
@say
"Both decouple configuration from images and can be consumed as environment variables or mounted as files. ConfigMaps are for non-sensitive settings like feature flags, URLs or config files. Secrets are for sensitive values like passwords, tokens and TLS keys.

Out of the box, Secrets aren't encrypted, just Base64-encoded, which anyone can decode. Their protection comes from a few things you must configure: encryption at rest in etcd, which managed clusters often provide, ideally with a KMS provider so keys live in a cloud key vault; strict RBAC, since anyone who can read Secrets in a namespace, or create pods there that mount them, can see them; and avoiding exposure, since secrets in environment variables can leak through crash dumps or debugging endpoints, so mounted files are slightly safer.

In production I prefer keeping the source of truth in an external secrets manager, like Azure Key Vault, AWS Secrets Manager or HashiCorp Vault, and syncing or mounting it: the External Secrets Operator syncs into Kubernetes Secrets, and the Secrets Store CSI driver mounts secrets directly as files, both authenticating with workload identity. That gives central rotation, auditing and access control. And secrets never go into Git in plain text; if GitOps needs them, I use references to the external store, or encryption tools like Sealed Secrets or SOPS.

One more detail: when a mounted ConfigMap or Secret changes, the files update eventually, but environment variables don't, so apps either reload config or get restarted."

### [1] Liveness vs readiness vs startup probes?
@tags probes, health checks
@hook Readiness: should I get traffic right now? Liveness: am I stuck and should be restarted? Startup: give me time to boot before the others start judging.
@say
"They answer different questions, and mixing them up causes outages.

A readiness probe decides whether the pod should receive traffic. If it fails, the pod is removed from Service endpoints but not restarted. It's for temporary conditions: still warming up a cache, overloaded, or a critical dependency unavailable. It's also what makes rolling updates safe, since new pods only get traffic once they're ready.

A liveness probe decides whether the container is broken beyond recovery, like deadlocked, so the kubelet restarts it. It should check only the process itself, cheaply, never external dependencies; otherwise a database blip makes every pod fail liveness at once and Kubernetes restarts the whole fleet, turning a small problem into an outage.

A startup probe protects slow-starting applications: while it hasn't succeeded, liveness and readiness probes are disabled, so a slow boot isn't mistaken for a hang. Once it succeeds, the other probes take over.

Good practice: separate endpoints, like /health/live and /health/ready; sensible timeouts, periods and failure thresholds; and if in doubt, it's safer to have a readiness probe and no liveness probe than an aggressive liveness probe."
@deep
```yaml
containers:
  - name: api
    image: registry.example.com/orders:3f9a2c1
    ports: [{ containerPort: 8080 }]
    startupProbe:
      httpGet: { path: /health/live, port: 8080 }
      failureThreshold: 30          # up to 30 x 5s = 150s to start
      periodSeconds: 5
    readinessProbe:
      httpGet: { path: /health/ready, port: 8080 }   # may check critical deps
      periodSeconds: 5
      failureThreshold: 3
    livenessProbe:
      httpGet: { path: /health/live, port: 8080 }    # process only, no deps
      periodSeconds: 10
      failureThreshold: 3
```

### [2] Resource requests vs limits. What are QoS classes? CPU throttling vs OOMKilled?
@tags resources, requests, limits, qos
@hook Requests are what the scheduler reserves; limits are the hard ceiling. Over the CPU limit you get throttled; over the memory limit you get killed.
@say
"Requests are the amount of CPU and memory the scheduler reserves for a container; a pod only lands on a node with enough unreserved capacity. They also determine the container's share of CPU under contention. Limits are the maximum the container may use, enforced by cgroups.

The two resources behave differently at the limit. CPU is compressible: a container that tries to exceed its CPU limit is throttled, slowed down, which shows up as increased latency, often at p99, without any error. Memory isn't compressible: a container that exceeds its memory limit is OOM-killed, reported as OOMKilled with exit code 137, and restarted.

QoS classes come from how requests and limits are set. Guaranteed: every container has requests equal to limits for both CPU and memory. Burstable: some requests set, but not equal to limits. BestEffort: nothing set. Under node memory pressure, the kubelet evicts BestEffort pods first, then Burstable pods using more than their requests, and Guaranteed pods last.

My practice: always set requests, based on measured usage, like p90 or p95 from monitoring, because they drive scheduling and autoscaling; set memory limits, often equal to the request for predictability; and be careful with CPU limits, since many teams leave them off for latency-sensitive services to avoid throttling, relying on requests for fair sharing, while others keep them for strict multi-tenant isolation. Then validate with metrics and right-size over time."

### [2] HPA vs VPA vs Cluster Autoscaler vs Karpenter? What does in-place pod resize change?
@tags autoscaling, hpa, vpa, karpenter
@hook HPA adds pods. VPA right-sizes pods. Cluster Autoscaler and Karpenter add nodes. In-place resize lets VPA-style changes happen without restarting pods.
@say
"The Horizontal Pod Autoscaler changes the number of replicas based on metrics: CPU or memory utilisation relative to requests, or custom and external metrics like requests per second or queue length. It's the main tool for stateless services with variable load. KEDA extends it with event-driven scaling from sources like Kafka lag or queue depth, including scaling to zero.

The Vertical Pod Autoscaler adjusts the CPU and memory requests and limits of pods based on observed usage. It's useful for workloads that can't scale horizontally and for right-sizing. It shouldn't scale on the same CPU or memory metric as an HPA on the same workload, since they'd fight; using VPA in recommendation-only mode alongside an HPA is a common compromise. It's especially relevant for memory-constrained workloads, where getting requests right prevents OOM kills.

Node autoscaling adds capacity when pods can't be scheduled: the Cluster Autoscaler grows or shrinks node groups, while Karpenter, popular on AWS and now available for Azure too, provisions right-sized nodes directly based on pending pods' requirements, and consolidates underused nodes, which is faster and often cheaper.

In-place pod resize, which went GA in Kubernetes 1.35, lets you change a running pod's CPU and memory requests and limits without recreating the pod, often without a container restart; memory decreases are best-effort, and some cases still need a restart. That makes vertical scaling far less disruptive, especially for stateful or slow-starting workloads."

### [2] How do you control where pods are scheduled?
@tags scheduling, affinity, taints
@hook nodeSelector and node affinity attract pods to nodes. Taints repel pods unless they tolerate them. Pod anti-affinity and topology spread keep replicas apart.
@say
"nodeSelector is the simplest: the pod only schedules on nodes with specific labels, like a GPU node pool.

Node affinity is the more expressive version, with required rules that must match and preferred rules that the scheduler tries to honour, with operators like In, NotIn and Exists.

Taints and tolerations work the other way around: a taint on a node repels all pods unless they have a matching toleration. That's how you dedicate nodes to specific workloads, like GPU nodes or system pools, and Kubernetes uses taints automatically, for example on nodes that are not ready or under pressure. A toleration only allows scheduling there; to force pods onto those nodes, you combine it with node affinity.

Pod affinity and anti-affinity place pods relative to other pods: affinity to co-locate, like a cache next to its app; anti-affinity to spread, like 'don't put two replicas of this service on the same node or zone'.

Topology spread constraints are the more flexible way to spread replicas evenly across zones and nodes with a maximum skew, which is my default for high availability across availability zones.

Priority classes and preemption decide which pods win when resources are scarce."

### [2] How does persistent storage work in Kubernetes?
@tags storage, pv, pvc, storageclass
@hook A PVC is a request for storage, a PV is the actual volume, and a StorageClass provisions PVs dynamically. Mind access modes and zones.
@say
"A PersistentVolume is a piece of storage in the cluster, like a cloud disk or a network file share, with a lifecycle independent of any pod. A PersistentVolumeClaim is a pod's request for storage: a size, an access mode and optionally a storage class. Kubernetes binds the claim to a suitable volume, and the pod mounts the claim.

A StorageClass enables dynamic provisioning: when a claim references it, the CSI driver automatically creates a matching volume, like an Azure managed disk or an AWS EBS volume, with parameters like disk type, and a reclaim policy, Delete or Retain, that decides what happens to the volume when the claim is deleted. volumeBindingMode WaitForFirstConsumer delays provisioning until the pod is scheduled, so the disk is created in the same availability zone as the pod.

Access modes matter: ReadWriteOnce, mounted read-write by one node, typical for block disks; ReadOnlyMany; ReadWriteMany, mounted read-write by many nodes, which needs a shared file system like Azure Files, EFS or NFS; and ReadWriteOncePod, restricted to a single pod.

Practical gotchas: zonal disks can't follow a pod to another zone, which can leave pods Pending; volume snapshots and backups, with tools like Velero, are needed for recovery; and StatefulSets use volume claim templates so each replica gets its own volume."

### [2] How do rolling updates work, and how do you get true zero-downtime deployments?
@tags rolling update, zero downtime
@hook maxSurge and maxUnavailable pace the rollout; readiness probes gate traffic; graceful shutdown and a preStop delay stop dropped requests.
@say
"A Deployment's rolling update creates a new ReplicaSet and shifts pods from the old one to the new one gradually. maxSurge controls how many extra pods can exist above the desired count during the rollout, and maxUnavailable how many can be unavailable. For example, with 10 replicas, maxSurge 25 percent and maxUnavailable 0, it adds a few new pods, waits until they're ready, then removes old ones, never dropping below 10 ready pods. kubectl rollout status watches it, and kubectl rollout undo rolls back to the previous ReplicaSet.

For real zero downtime, several details matter beyond the strategy. Readiness probes, so new pods only get traffic when they can serve. Graceful shutdown: when a pod is terminated, its removal from endpoints and the SIGTERM happen in parallel, so for a moment traffic can still arrive at a pod that's shutting down. A preStop hook with a short sleep, a few seconds, lets load balancers and kube-proxy catch up before the app stops accepting connections; then the app should handle SIGTERM by finishing in-flight requests, within terminationGracePeriodSeconds. Enough replicas and a PodDisruptionBudget, so voluntary disruptions don't take too many pods at once. Backward-compatible changes, since old and new versions run side by side, including database schema changes. And minReadySeconds and progressDeadlineSeconds to catch pods that crash shortly after becoming ready, and to stop a stuck rollout."

### [2] What is a PodDisruptionBudget, and how does it interact with node maintenance?
@tags pdb, availability, maintenance
@hook A PDB limits how many replicas voluntary disruptions like node drains may take down at once. It protects availability, at the cost of slower maintenance.
@say
"A PodDisruptionBudget declares how many pods of an application must stay available, or how many may be unavailable, during voluntary disruptions: node drains for upgrades or maintenance, cluster autoscaler scale-downs and evictions requested through the eviction API. For example, minAvailable 2 for a three-replica service, or maxUnavailable 1.

When an administrator runs kubectl drain, or a managed cluster upgrades nodes, evictions that would violate the budget are refused, and the drain waits and retries until other replicas are running and ready elsewhere. That prevents maintenance from taking down a service by evicting all replicas at once.

The trade-off is between availability guarantees and maintenance speed. A strict PDB, like maxUnavailable 0, or minAvailable equal to the replica count, blocks drains indefinitely, which stalls node upgrades and is a common cause of stuck cluster upgrades. A single-replica deployment with a PDB of minAvailable 1 has the same problem.

Note that PDBs don't protect against involuntary disruptions, like a node crashing, so they complement, rather than replace, multiple replicas spread across nodes and zones. I set PDBs on every production workload with at least two replicas, typically maxUnavailable 1 or a percentage."

### [2] How does RBAC work in Kubernetes?
@tags rbac, security, service accounts
@hook Roles define verbs on resources; bindings grant them to users, groups or service accounts. Role and RoleBinding are namespaced; ClusterRole and ClusterRoleBinding are cluster-wide.
@say
"Role-based access control decides who can do what to which resources. A Role is a set of permissions, verbs like get, list, watch, create, update and delete on resource types like pods, deployments or secrets, within one namespace. A ClusterRole is the same but cluster-scoped, usable for cluster-wide resources like nodes, or as a reusable template.

A RoleBinding grants a Role, or a ClusterRole, to subjects, users, groups or service accounts, within a namespace. A ClusterRoleBinding grants a ClusterRole across the whole cluster. Permissions are purely additive; there are no deny rules.

Humans usually authenticate through the cloud identity provider, like Microsoft Entra ID for AKS, mapped to groups. Workloads use ServiceAccounts, which get short-lived, automatically rotated tokens.

Best practices: least privilege, granting namespace-scoped roles to teams rather than cluster-admin; avoid wildcard verbs and resources; be careful with sensitive permissions like reading secrets, creating pods, which can mount any secret in the namespace, or binding roles, which allows privilege escalation; give each workload its own ServiceAccount, and disable automounting the token for pods that don't call the API. kubectl auth can-i lets you test permissions, and audit logs record who did what."

### [2] What are network policies?
@tags network policy, security, zero trust
@hook By default every pod can talk to every pod. Network policies are pod-level firewall rules, selected by labels, enforced by the CNI.
@say
"By default, Kubernetes networking is flat and open: any pod can reach any other pod in any namespace. Network policies restrict that. A NetworkPolicy selects pods by label and specifies allowed ingress traffic, from which pods, namespaces or IP blocks and on which ports, and allowed egress traffic.

Once a pod is selected by any policy for a direction, all traffic in that direction that isn't explicitly allowed is denied. A common pattern is a default-deny policy for each namespace, then explicit allows: the frontend may talk to the API on port 8080, the API may talk to the database on 5432, and everything may talk to DNS. Forgetting to allow DNS egress is the classic mistake that breaks everything.

They're enforced by the CNI plugin, so the CNI must support them, like Calico, Cilium or Azure's network policy implementations; with an unsupported CNI, policies are silently ignored. Standard policies work at layers 3 and 4, by IP and port; for layer 7 rules, like HTTP methods and paths, or rules based on DNS names, you need CNI-specific extensions like Cilium's or a service mesh's authorisation policies. They're a key part of limiting the blast radius if a pod is compromised."
@deep
```yaml
# Default deny all ingress in the namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-ingress, namespace: shop }
spec:
  podSelector: {}
  policyTypes: [Ingress]
---
# Allow the API to reach Postgres only on 5432
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: db-from-api, namespace: shop }
spec:
  podSelector: { matchLabels: { app: postgres } }
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector: { matchLabels: { app: orders-api } }
      ports:
        - { protocol: TCP, port: 5432 }
```

### [1] What are namespaces, ResourceQuotas and LimitRanges?
@tags namespaces, multi-tenancy, quotas
@hook Namespaces divide a cluster into named scopes. Quotas cap what a namespace may consume in total. LimitRanges set per-pod defaults and bounds.
@say
"Namespaces partition a cluster into virtual sub-clusters for organising and isolating resources, typically per team, application or environment. Names must be unique within a namespace, and RBAC, network policies, quotas and policies are commonly applied per namespace. Some resources, like nodes, persistent volumes and cluster roles, are cluster-scoped and don't live in any namespace. Namespaces are a soft boundary; they don't isolate the kernel or nodes, so strong multi-tenancy between untrusted tenants needs more, like separate node pools or separate clusters.

A ResourceQuota caps the total resources a namespace can consume: total CPU and memory requests and limits, number of pods, services, load balancers, persistent volume claims and storage. It prevents one team from consuming the whole cluster.

A LimitRange sets default requests and limits for containers that don't specify them, plus minimum and maximum values per container or pod. That's important because when a quota exists, pods without requests are rejected, and defaults keep things working.

Together they're the basic building blocks of a shared cluster where several teams coexist safely."

### [2] What is Helm, and when does it make things worse? Helm vs Kustomize?
@tags helm, kustomize, packaging
@hook Helm: templated, versioned packages with releases and rollback. Kustomize: template-free patches over plain YAML. Helm's templates can become an unreadable programming language.
@say
"Helm is a package manager for Kubernetes. A chart bundles templated manifests with a values file, so one chart can be installed in different environments by changing values. Helm tracks installed releases, so it supports upgrades, rollbacks and dependencies between charts, and there's a huge ecosystem of ready-made charts for things like databases, ingress controllers and monitoring stacks.

It makes things worse when charts become over-engineered: deeply nested Go templating with conditionals for every field turns YAML into a hard-to-read programming language, values files with hundreds of options are confusing, errors only appear after rendering, and it's hard to see what will actually be deployed without running helm template. For a team's own simple services, plain manifests are sometimes clearer.

Kustomize takes a template-free approach: a base of plain, valid YAML, plus overlays per environment that patch it, like changing replicas, images or resources. It's built into kubectl, easy to review, and great for environment variations of your own manifests.

My typical approach: use Helm to install third-party software from well-maintained charts, use Kustomize or a simple internal Helm chart for our own services, and with GitOps tools like Argo CD, which support both. Whatever the tool, I render and diff the final manifests in CI, so reviewers see exactly what changes in the cluster."

### [3] What are CRDs and Operators? When would you use an Operator instead of a Helm chart?
@tags operators, crds, controllers
@hook A CRD adds a new resource type to the API; an Operator is a controller that encodes how to run software, reacting to its state forever. Helm installs once; an Operator keeps managing.
@say
"A CustomResourceDefinition extends the Kubernetes API with a new resource type, like a PostgresCluster or a Certificate, with its own schema, so you can create and manage those objects with kubectl, RBAC and GitOps like any built-in resource.

An Operator is a custom controller, usually paired with CRDs, that encodes the operational knowledge a human operator would have about running a specific application. It runs a reconciliation loop: it watches custom resources and the actual state, and continuously acts to make them match. A database operator, for example, can provision a replicated cluster, handle failover, take scheduled backups, perform version upgrades in the right order and resize storage. cert-manager, Prometheus Operator, Strimzi for Kafka and CloudNativePG are popular examples.

The difference from Helm: Helm renders and installs manifests at deploy time, and then it's done; it doesn't watch or react to what happens later. An Operator keeps managing the application for its whole lifetime and handles day-2 operations.

So I'd use a Helm chart for stateless or simple applications whose desired state is fully described by manifests, and an Operator for complex stateful systems that need ongoing, application-specific automation. Writing your own Operator, with Kubebuilder or Operator SDK, is a real investment, so I'd first check for a mature existing one."

### [3] What is etcd's role, and how do you protect it? What if etcd is overloaded?
@tags etcd, control plane, scale
@hook etcd is the cluster's source of truth. Back it up, give it fast disks and an odd number of members, and keep the API from flooding it with huge or chatty objects.
@say
"etcd is the distributed key-value store holding all cluster state: every object, from pods to secrets. It uses the Raft consensus algorithm, so it needs a majority of members to accept writes; clusters run 3 or 5 members to tolerate 1 or 2 failures. If etcd loses quorum or its data, the cluster's control plane stops working, even though running containers keep running.

Protecting it: regular snapshots with etcdctl snapshot save, stored off-cluster and tested by restoring; encryption at rest for secrets; mutual TLS between members and the API server; and restricted access, since reading etcd directly bypasses RBAC. In managed Kubernetes, the provider handles etcd, but you still need your own backups of cluster resources, with tools like Velero, plus GitOps as the source of truth.

When etcd is overloaded, symptoms are slow API responses, leader elections, 'etcdserver: request timed out' errors and controllers lagging. Causes and fixes: slow disks, since etcd is very sensitive to disk write latency, so it needs fast SSDs, ideally dedicated; a database grown too large, which needs compaction and defragmentation, and checking for the storage quota; too many or too large objects, like huge ConfigMaps, thousands of stale Jobs, or events at very high volume, which can be moved to a separate etcd; and chatty clients doing expensive unpaginated list calls or too many watches, often a misbehaving operator or monitoring tool, which API priority and fairness settings can throttle. 'Just add more members' is the wrong instinct, because more members means more replication work per write."

### [2] How does Kubernetes self-heal, and what are the limits?
@tags self-healing, reliability
@hook It restarts failed containers, replaces lost pods, reschedules from dead nodes and stops sending traffic to unready pods. It can't fix bad code, bad config, or dependencies outside the cluster.
@say
"Self-healing comes from controllers continuously reconciling desired and actual state. The kubelet restarts containers that crash or fail liveness probes, with exponential backoff. ReplicaSets and other controllers replace pods that disappear, for example when a node fails; after the node is marked unhealthy and a toleration timeout passes, pods are rescheduled onto healthy nodes. Readiness probes remove unhealthy pods from load balancing automatically. Node auto-repair in managed services replaces broken nodes, and autoscalers add capacity under load.

The limits are important. It can't fix bad code or bad configuration: a bug that crashes on startup just becomes a CrashLoopBackOff, and restarting a memory leak only buys time. It only checks what probes check, so a badly designed probe can either miss real failures or cause restart storms. Rescheduling after a node failure isn't instant; it can take minutes by default. It doesn't help when there's no capacity, or when persistent volumes can't move across zones. It doesn't protect against cluster-wide problems: control plane outages, etcd failures, bad cluster-wide configuration, or DNS failures. And it knows nothing about dependencies outside the cluster, like a managed database being down.

So self-healing complements, but doesn't replace, good probes, multiple replicas across zones, PodDisruptionBudgets, monitoring and alerting, and incident response."

### [1] What are labels, selectors and annotations?
@tags labels, selectors, metadata
@hook Labels are identifying key-value pairs that selectors match on. Annotations are non-identifying metadata for tools and humans.
@say
"Labels are key-value pairs attached to objects, like app equals orders, tier equals backend, environment equals production, used to identify and group them. Selectors query by labels, and they're the glue of Kubernetes: Services find their pods by selector, Deployments and ReplicaSets manage pods by selector, network policies and affinity rules target pods by selector, and kubectl get pods -l app=orders filters with them. Consistent labelling, like the recommended app.kubernetes.io labels for name, instance, version and component, makes operations and cost allocation much easier.

Annotations are also key-value pairs, but they're not used for selection. They hold non-identifying metadata, often larger or tool-specific: build information, Git commit, owner contacts, configuration for controllers like ingress controllers or Prometheus scraping hints, and the last applied configuration used by kubectl apply.

A classic bug is a Deployment whose pod template labels don't match its Service's selector, so the Service has no endpoints. Also, a Deployment's selector is immutable after creation, so it should be chosen carefully."
