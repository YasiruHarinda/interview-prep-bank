@section k8sdebug | Kubernetes Troubleshooting Scenarios
@blurb The "it's broken, what do you do?" questions. Each answer is a method you can narrate in a live round.

### [1] Which kubectl commands do you reach for when debugging?
@tags kubectl, cheat sheet
@hook get, describe, logs (with --previous), events, exec, debug, top, rollout. Describe and events answer half of all questions.
@say
"My standard sequence: kubectl get pods with -o wide to see status, restarts, node and IP. kubectl describe pod, which shows the scheduling decision, container states, last termination reason and exit code, probe failures and, at the bottom, the events, which explain most problems. kubectl get events sorted by timestamp for the wider namespace picture.

Logs: kubectl logs for the current container, with --previous for the container that crashed, -c for a specific container in a multi-container pod, and -f to follow.

Inside the pod: kubectl exec to run commands like curl or nslookup; and for distroless images with no shell, kubectl debug to attach an ephemeral debug container sharing the pod's namespaces, or to create a copy of the pod for debugging, or to open a shell on a node.

Networking: kubectl get svc and kubectl get endpointslices to confirm a Service actually has ready endpoints, and kubectl port-forward to test a pod or service directly from my machine.

Resources: kubectl top pods and nodes for live usage, and describe node for allocated requests and conditions.

Rollouts: kubectl rollout status, history and undo. And kubectl auth can-i for permission problems."
@deep
```bash
kubectl get pods -n shop -o wide
kubectl describe pod orders-7d9c-x2kfp -n shop        # events at the bottom
kubectl logs orders-7d9c-x2kfp -n shop --previous     # the crashed container
kubectl get events -n shop --sort-by=.lastTimestamp
kubectl get endpointslices -n shop -l kubernetes.io/service-name=orders
kubectl exec -it orders-7d9c-x2kfp -n shop -- sh
kubectl debug -it orders-7d9c-x2kfp -n shop --image=busybox:1.36 --target=api
kubectl top pods -n shop --containers
kubectl rollout status deploy/orders -n shop
kubectl rollout undo deploy/orders -n shop
```

### [1] A pod is stuck in Pending. How do you troubleshoot it?
@tags pending, scheduling
@hook Pending means it hasn't been scheduled (or can't start volumes). kubectl describe pod and read the scheduler's event: resources, taints, affinity, or volumes.
@say
"Pending means the pod has been accepted but not yet scheduled onto a node, or it's scheduled but waiting on something like a volume. The scheduler explains itself, so I run kubectl describe pod and read the events, which say things like '0 of 5 nodes are available: 3 Insufficient cpu, 2 node(s) had untolerated taint'.

The common causes: insufficient resources, meaning no node has enough unreserved CPU or memory for the pod's requests; fix by lowering inflated requests, freeing capacity, or adding nodes, and check whether the cluster autoscaler is working or capped at its maximum. Taints the pod doesn't tolerate, like a dedicated or GPU node pool. Node selectors or affinity rules that no node satisfies, often a typo in a label. Topology spread or anti-affinity constraints that can't be met with the current nodes. Volume problems: a PersistentVolumeClaim that isn't bound, no matching storage class, or a zonal disk that exists in a zone where no node has capacity. ResourceQuota limits, which usually prevent creation rather than leaving the pod Pending, but show up in the ReplicaSet's events. And, less often, the scheduler itself being unhealthy.

Then I fix the constraint and confirm the pod schedules."

### [1] A pod is in CrashLoopBackOff. How do you troubleshoot it?
@tags crashloopbackoff, troubleshooting
@hook The container keeps starting and dying, and Kubernetes waits longer between retries. Get the previous container's logs and the exit code; they almost always tell you why.
@say
"CrashLoopBackOff means the container starts, exits, and the kubelet restarts it with an increasing back-off delay, up to five minutes. It's a symptom, not a cause.

First, kubectl logs with --previous, to see the output of the container instance that crashed, because the current one may not have logged anything yet. Then kubectl describe pod for the last state: the exit code, the reason, like Error or OOMKilled, and probe failure events.

Then by cause. Application errors on startup, exit code 1: missing environment variables or config, a secret or config map not mounted or with a wrong key, failure to connect to a database at startup, a migration failing, or an unhandled exception. The logs usually say which. OOMKilled, exit code 137: it exceeds its memory limit, often during startup. Liveness probe failures: the app is fine but slow to start, and an aggressive liveness probe kills it; that shows as probe failure events, and the fix is a startup probe or more generous timing. Wrong command or image: exit codes 126 or 127, like a wrong entrypoint or a binary missing for the CPU architecture, such as an arm64 image on amd64 nodes, which shows 'exec format error'. Permission problems, like a non-root user writing to a read-only path.

If logs are empty, I override the command to sleep, exec in and run the start command manually, or use kubectl debug with a copy of the pod. Once fixed, I check whether a recent deploy caused it and roll back if it's production."

### [1] A pod shows ImagePullBackOff or ErrImagePull. What do you check?
@tags images, registry, troubleshooting
@hook The node can't pull the image: wrong name or tag, missing registry credentials, network or rate limits, or the wrong platform.
@say
"kubectl describe pod shows the exact pull error in the events, which points to the cause.

'Not found' or 'manifest unknown': the image name, tag or registry path is wrong, or the tag was never pushed, often a typo or a pipeline that failed before pushing. I check that the tag exists in the registry.

'Unauthorized' or 'access denied': the node can't authenticate to a private registry. Either the imagePullSecrets is missing, wrong, in a different namespace or expired, or the node's cloud identity lacks permission, like an AKS cluster not attached to the ACR, missing the AcrPull role, or an EKS node role lacking ECR permissions.

Network errors or timeouts: nodes can't reach the registry, because of egress firewall rules, a missing NAT gateway or private endpoint, or DNS issues.

'Too many requests': registry rate limits, famously Docker Hub's limits for anonymous pulls, fixed by authenticating, mirroring images into our own registry, or using a pull-through cache.

'No matching manifest for platform': the image wasn't built for the node's architecture, like an arm64-only image on amd64 nodes; build multi-architecture images.

After fixing the cause, the kubelet retries automatically, or I delete the pod to retry immediately."

### [2] A pod was OOMKilled with exit code 137. What do you do?
@tags oom, memory, resources
@hook It exceeded its memory limit and the kernel killed it. Decide whether it genuinely needs more memory, has a leak, or the runtime doesn't know its limit.
@say
"Exit code 137 is 128 plus 9, meaning the process received SIGKILL, and the OOMKilled reason confirms it hit its container memory limit. It can also be the node running out of memory, in which case the pod is evicted.

I look at memory usage over time in monitoring, not just the moment of death. A sudden spike at startup or under a specific request, with a flat baseline otherwise, suggests a genuine need, like loading a large file or a big batch, or a too-low limit. A steady climb over hours until the limit suggests a memory leak, which needs profiling with heap dumps; raising the limit only delays it.

Then I check the runtime. Managed runtimes need to respect the container limit: modern JVMs and .NET are container-aware, but options like a fixed Java heap size, or a heap percentage that leaves no room for off-heap memory, threads and native buffers, can still push total usage over the limit. Node.js has its own heap limit setting.

Fixes depend on the cause: right-size the memory request and limit based on measured peak usage plus headroom; fix leaks; tune runtime memory settings; reduce memory use, like streaming instead of loading whole files; or, for a legitimately variable workload, use the vertical pod autoscaler's recommendations. And I set alerts on containers approaching their memory limit, and on OOM kill counts, so it's caught before users notice."

### [1] What do common container exit codes mean?
@tags exit codes, troubleshooting
@hook 0 done, 1 app error, 126 can't execute, 127 not found, 137 SIGKILL (often OOM), 139 segfault, 143 SIGTERM.
@say
"Exit codes above 128 mean the process was killed by a signal: 128 plus the signal number.

0: the process finished successfully. If that's a long-running service, it means the main process exited, maybe because it backgrounded itself or had nothing to do, which leads to restarts or a 'Completed' status.

1, and other small numbers: the application exited with an error. The meaning is application-specific, so the logs matter.

126: the command was found but couldn't be executed, like missing execute permissions.

127: command not found, a wrong path, typo, or binary missing from the image.

137: SIGKILL, signal 9. Most often OOMKilled for exceeding the memory limit; also a forced kill after the termination grace period expired.

139: SIGSEGV, signal 11, a segmentation fault, usually a bug in native code or an incompatible library.

143: SIGTERM, signal 15, the process exited in response to a normal termination request, typical during rollouts or scale-down, and fine when expected.

kubectl describe pod shows the last state with exit code and reason, which together with logs from --previous is usually enough to know where to look."

### [2] A Service isn't reachable from other pods. How do you debug it?
@tags services, networking, troubleshooting
@hook Check the chain: DNS name, Service, selector, endpoints, pod readiness, target port, then network policies.
@say
"I check each link in the chain from a client pod.

DNS: does the name resolve? From a debug pod, nslookup orders.shop.svc.cluster.local. If not, check the name and namespace, and CoreDNS health.

Endpoints: kubectl get endpointslices for the service. If there are no endpoints, the problem is almost always that the Service's selector doesn't match the pod labels, often a typo or a mismatch like app: orders versus app: order-api, or that the pods exist but aren't ready because readiness probes fail.

Ports: the Service's targetPort must match the port the container actually listens on. A common bug is the app listening on 8080 while targetPort says 80, or the app binding to 127.0.0.1 instead of 0.0.0.0, so it's unreachable from outside its own pod.

Direct test: curl the pod IP and port directly from another pod. If that works but the Service IP doesn't, look at kube-proxy or the CNI. If the pod IP doesn't work either, it's the application or a network policy.

Network policies: a default-deny policy without an allow rule for this traffic blocks it, including egress rules on the client side, and DNS egress.

Then cross-namespace naming, and for external access, the load balancer, ingress or gateway configuration and cloud firewall rules."

### [2] A service passes its health checks but returns 503 errors. How do you investigate?
@tags 503, health checks, troubleshooting
@hook The probe checks something different from what users hit. Find where the 503 is generated, then compare what the probe tests with what the failing requests need.
@say
"First I find out who is generating the 503: the application itself, or something in front of it, like the ingress controller, gateway, service mesh proxy or cloud load balancer. Response headers, the response body format and the proxy's access logs usually tell me. A 503 from the proxy with 'no healthy upstream' points to routing and endpoints; a 503 from the app points to the app.

If the proxy generates it: check whether its view of backends matches reality, like the route pointing to the wrong service or port, endpoints missing in the mesh, or a circuit breaker or outlier detection ejecting backends. Rate limiting or overload protection can also return 503.

If the app generates it: the health check endpoint is probably too shallow. It returns 200 because the process is up, but the requests users make depend on something broken, like a database connection pool that's exhausted, a downstream dependency failing, a feature-specific configuration missing, or the app shedding load because its thread pool or queue is full. I check application logs and traces for the failing requests, and metrics like pool utilisation and dependency error rates.

I'd also check whether it's all pods or a subset, since one bad pod with stale config can produce intermittent 503s, and whether it correlates with deployments, where pods receive traffic before they're truly ready or keep receiving it while shutting down.

The fix is the specific cause, plus improving the readiness check to reflect the ability to serve real traffic, without making liveness depend on dependencies."

### [2] A node shows NotReady. What do you do?
@tags nodes, kubelet, troubleshooting
@hook The control plane stopped hearing from the kubelet, or the kubelet reports a problem. Check node conditions, then the kubelet, runtime, resources and network on the node.
@say
"NotReady means the kubelet isn't posting healthy status to the API server. First I protect workloads: if it's production, I cordon the node so nothing new schedules there, and check that its pods are being rescheduled elsewhere, which happens automatically after a timeout.

Then I diagnose. kubectl describe node shows the conditions, like MemoryPressure, DiskPressure, PIDPressure and NetworkUnavailable, the last heartbeat time, and events.

Common causes: the kubelet has stopped or is crash-looping, so I check systemctl status kubelet and journalctl -u kubelet on the node; the container runtime is unhealthy, checked with systemctl status containerd and crictl; resource exhaustion, like the disk full with images and logs, memory exhausted or PID exhaustion; network problems between the node and the control plane, like a security group change or DNS; expired kubelet certificates; the CNI plugin failing on that node; or the VM itself is unhealthy, which the cloud console shows.

In managed clusters, node auto-repair often replaces the node automatically, and with immutable infrastructure, the fastest fix is often to drain and replace the node rather than repair it by hand. I'd still find the root cause, like disk filling up from logs, so the replacement doesn't fail the same way."

### [2] A pod is stuck in Terminating. Why, and what do you do?
@tags terminating, finalizers, troubleshooting
@hook Usually a finalizer that never clears, a node that's unreachable, or a process ignoring SIGTERM. Find which before reaching for force delete.
@say
"A pod in Terminating has a deletion timestamp but hasn't been removed. The common causes:

The node is unreachable or NotReady, so the kubelet can't confirm the containers have stopped; the API server waits, because it can't know whether the pod is still running.

Finalizers on the pod that haven't been cleared: a controller is supposed to do cleanup and remove its finalizer, but the controller is broken, uninstalled or failing. kubectl get pod -o yaml shows the finalizers.

The application ignores SIGTERM and takes until the grace period expires, which is temporary, or volumes fail to unmount or detach, which the kubelet logs show.

What I do: check the events, the node status and the finalizers. If the node is gone for good, delete the node object, and pods are cleaned up. If a finalizer is stuck, fix the responsible controller, or as a last resort remove the finalizer with a patch, understanding what cleanup is being skipped. kubectl delete with --grace-period=0 and --force removes the object from the API server immediately, but for a pod on an unreachable node, the containers may still be running there, which is dangerous for StatefulSets, because a second copy could start and write to the same data. So force deletion is a last resort, used with that risk in mind."

### [2] A Deployment rollout is stuck. How do you troubleshoot it?
@tags rollout, deployment, troubleshooting
@hook New pods aren't becoming ready, or old ones can't be replaced. Check rollout status, the new ReplicaSet's pods and events, and constraints like quotas and PDBs.
@say
"kubectl rollout status shows it waiting, and after progressDeadlineSeconds the Deployment's condition says ProgressDeadlineExceeded. The question is why new pods aren't becoming available.

I look at the new ReplicaSet and its pods. If the new pods are crashing or not ready, it's a CrashLoopBackOff, failing readiness probes, or an image problem; with maxUnavailable at zero, the rollout waits forever for them, which is actually the safety feature working. Logs and describe show why, and the usual fix is to roll back with kubectl rollout undo, then fix the release.

If the new pods are Pending, there may not be capacity for the surge pods, so check scheduling events, quotas and node autoscaling.

If the ReplicaSet can't create pods at all, a ResourceQuota or an admission policy may be rejecting them, which shows in the ReplicaSet's events, not the pods'.

Also check that a PodDisruptionBudget or a paused Deployment, from kubectl rollout pause, isn't blocking progress.

In GitOps setups, Argo CD shows the app as Progressing or Degraded with the same underlying cause. And if a canary tool is in use, its analysis may have paused or aborted the rollout on purpose because metrics were bad."

### [2] Pods can't resolve DNS names. How do you troubleshoot DNS inside a cluster?
@tags dns, coredns, troubleshooting
@hook Test from a debug pod, check CoreDNS health and logs, check the pod's resolv.conf, network policies allowing port 53, and the ndots lookup amplification.
@say
"I start from a debug pod in the same namespace: nslookup kubernetes.default and a service name, plus an external name like example.com. That tells me whether all DNS fails, only cluster names fail, or only external names fail.

If everything fails: check that CoreDNS pods are running and ready in kube-system, their logs for errors, that the kube-dns Service has endpoints, and that network policies allow egress to the DNS service on UDP and TCP port 53, a very common cause after someone adds default-deny egress policies.

If only external names fail: CoreDNS's upstream forwarding, meaning the node's or VPC's resolver, egress rules or a custom forward configuration in the CoreDNS Corefile.

If only some names fail: check the pod's /etc/resolv.conf, which lists the search domains and the ndots option. With ndots 5, the default, a name like api.example.com with fewer than five dots is first tried with every cluster search domain appended, causing several failed lookups before the real one. That's slow and can overload CoreDNS. Using fully qualified names with a trailing dot, or lowering ndots in the pod's dnsConfig, fixes it.

Under heavy load, intermittent timeouts can come from CoreDNS being under-scaled, or from conntrack race conditions with UDP; NodeLocal DNSCache, which runs a caching DNS agent on each node, is the standard mitigation. I'd also check CoreDNS metrics for latency and errors."

### [2] Latency jumped right after a deploy, but CPU usage looks low. What might be going on?
@tags latency, cpu throttling, troubleshooting
@hook Classic suspect: CPU throttling from limits, invisible in average CPU graphs. Also check the change itself, cold caches, connection pools and dependencies.
@say
"First, since it started with a deploy, I'd consider rolling back immediately to protect users, then investigate.

A classic cause of latency with apparently low CPU in Kubernetes is CPU throttling. CPU limits are enforced in short periods, 100 milliseconds by default. A multi-threaded app can use its whole quota in the first part of a period, and then all its threads are paused until the next period, adding tail latency, even though average CPU usage over a minute looks low. I'd check the container_cpu_cfs_throttled_periods_total metric relative to total periods. If throttling is high, the new version might use more CPU, the limits might have changed in the deploy, or the runtime might be using more threads than its quota supports. Fixes are raising or removing CPU limits, keeping requests realistic, and tuning thread pools to the CPU quota.

Other candidates: the code change itself, like a new query without an index, an N+1 pattern or a synchronous call to a slow dependency, which traces comparing old and new versions reveal; cold caches or JIT warm-up in new pods; smaller connection pools or a changed timeout configuration; a dependency that's slower now, like the database under different load; garbage collection pressure from higher allocation, visible in runtime metrics; or the new pods landing on overloaded or different node types.

I'd use traces, comparing span timings between versions, to find which part of the request got slower."
