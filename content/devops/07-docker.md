@section docker | Docker and Containers
@blurb How containers really work, writing good Dockerfiles, image security, and debugging containers that won't stay up.

### [1] Container vs virtual machine?
@tags containers, vms
@hook A VM virtualises hardware and runs a whole guest OS. A container is an isolated process sharing the host's kernel. Lighter and faster, with weaker isolation.
@say
"A virtual machine runs on a hypervisor that virtualises hardware, and each VM has its own full guest operating system, kernel included. That gives strong isolation, and you can run different operating systems on the same host, but each VM is heavy, gigabytes in size, and takes tens of seconds or minutes to boot.

A container is a set of isolated processes running directly on the host's kernel. Isolation comes from kernel features, namespaces for what the process can see and cgroups for what it can use, and the container image packages only the application and its user-space dependencies. Containers are typically megabytes, start in milliseconds to seconds, and you can pack many more onto a host.

The trade-off is isolation: all containers share the host kernel, so a kernel vulnerability can affect all of them, and you can't run a Windows container on a Linux kernel. For untrusted, multi-tenant workloads, there are stronger options, like gVisor or Kata Containers, or micro-VMs like Firecracker that serverless platforms use.

In practice they're complementary: in the cloud, containers usually run inside VMs, with Kubernetes nodes being VMs."

### [2] How do containers work under the hood?
@tags namespaces, cgroups, union filesystem
@hook Namespaces control what a process can see, cgroups control what it can use, and a layered filesystem gives it its own root. That's it, no magic.
@say
"A container is an ordinary Linux process with three kernel features applied.

Namespaces isolate what the process can see. The PID namespace gives it its own process tree, where it's PID 1. The network namespace gives it its own network interfaces, IP and ports. The mount namespace gives it its own filesystem view. The UTS namespace gives it its own hostname, IPC isolates inter-process communication, and the user namespace can map root inside the container to an unprivileged user on the host.

Control groups, cgroups, limit and account for what it can use: CPU, memory, disk I/O and number of processes. That's how memory limits are enforced, and why exceeding one gets the container OOM-killed.

A layered, union filesystem, usually OverlayFS, provides the root filesystem: the image's read-only layers stacked together, plus a thin writable layer per container. Multiple containers share the same image layers on disk, and changes are copy-on-write.

On top, security features like seccomp profiles that restrict system calls, dropped Linux capabilities and AppArmor or SELinux profiles reduce what a compromised process could do. A container runtime, like runc, sets all this up according to the OCI specification, and higher-level tools like Docker and containerd manage images and lifecycles."

### [1] What is the difference between an image and a container? What are layers?
@tags images, layers
@hook An image is a read-only, layered template. A container is a running instance of it, with a thin writable layer on top.
@say
"An image is a read-only template: a stack of filesystem layers plus metadata like the default command, environment variables, exposed ports and the user to run as. A container is a running instance of an image, a process with its own writable layer on top of the image's layers. You can run many containers from one image, like objects from a class.

Layers come from the Dockerfile: roughly each instruction that changes the filesystem, like RUN, COPY or ADD, creates a new layer containing just the changes. Layers are content-addressed by a hash, so they're shared between images and cached: if ten images use the same base image, its layers are stored and downloaded once.

Two practical consequences. Anything written in the container's writable layer disappears when the container is removed, so persistent data goes in volumes. And deleting a file in a later layer doesn't shrink the image, because the file still exists in the earlier layer, which is why you clean up in the same RUN instruction that created the files, or use multi-stage builds."

### [1] What are Dockerfile best practices?
@tags dockerfile, best practices
@hook Small trusted base, multi-stage build, cache-friendly ordering, pinned versions, non-root user, exec-form entrypoint, no secrets, a .dockerignore.
@say
"My checklist:

Use a small, trusted, pinned base image: official or distroless or slim images, with a specific version tag, or a digest for full reproducibility, never latest.

Use multi-stage builds, so compilers and build tools stay in the build stage and the final image contains only the runtime and the application.

Order instructions for caching: copy dependency manifests and install dependencies first, then copy the source code, so code changes don't invalidate the dependency layer.

Combine related commands in a single RUN and clean package manager caches in the same step.

Run as a non-root user, with a USER instruction.

Use the exec form of CMD and ENTRYPOINT, the JSON array syntax, so the application is PID 1 and receives signals for graceful shutdown.

Never put secrets in the image, not in ENV, ARG or copied files, because they persist in the layers; use BuildKit secret mounts for build-time secrets and runtime injection for app secrets.

Add a .dockerignore to keep out .git, local builds, node_modules, .env files and anything sensitive, which also speeds up builds.

And add metadata labels, a HEALTHCHECK where relevant, and scan the resulting image in CI."
@deep
```dockerfile
# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore                          # cached until the project file changes
COPY . .
RUN dotnet publish -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .
USER app                                    # non-root user provided by the base image
EXPOSE 8080
ENTRYPOINT ["dotnet", "OrdersApi.dll"]      # exec form: receives SIGTERM
```

### [1] What are multi-stage builds, and why use them?
@tags multi-stage, image size, security
@hook Build in a fat image with all the tools, copy only the output into a slim runtime image. Smaller, faster, fewer vulnerabilities.
@say
"A multi-stage Dockerfile has several FROM instructions, each starting a new stage. Typically the first stage uses a full SDK image with compilers and build tools to compile the application and run tests, and the final stage starts from a minimal runtime image and copies in only the built artefacts with COPY --from.

The benefits: much smaller images, often by hundreds of megabytes, so faster pulls, faster scaling and lower storage costs; a smaller attack surface, since compilers, package managers, source code and build-time secrets don't ship to production, which also means fewer vulnerabilities flagged by scanners; and a single Dockerfile that describes the whole build reproducibly.

You can also have intermediate stages, like a test stage that the CI pipeline targets with the --target flag, or stages that build different variants. For compiled languages like Go or Rust, the final image can even be scratch or distroless, containing little more than the binary."

### [1] CMD vs ENTRYPOINT? Shell form vs exec form?
@tags dockerfile, cmd, entrypoint
@hook ENTRYPOINT is the executable; CMD supplies default arguments you can override. Use exec form so your app is PID 1 and gets signals.
@say
"ENTRYPOINT defines the executable that always runs when the container starts. CMD provides default arguments, or a default command if there's no ENTRYPOINT, and it's easily overridden by arguments to docker run or the args field in Kubernetes. A common pattern is ENTRYPOINT for the program and CMD for its default flags, so the image behaves like a command-line tool.

The form matters just as much. The exec form, a JSON array like ENTRYPOINT ["dotnet", "app.dll"], runs the program directly as PID 1. The shell form, a plain string, runs it via /bin/sh -c, so the shell is PID 1 and your application is a child process. The shell doesn't forward SIGTERM to the app, so on docker stop or a Kubernetes rollout, the app never gets the chance to shut down gracefully and gets SIGKILLed after the grace period, dropping in-flight requests.

So I use the exec form. If I need a startup script, the script ends with exec followed by the application, so the app replaces the shell as PID 1."

### [1] COPY vs ADD?
@tags dockerfile
@hook Use COPY. ADD also extracts local tar archives and downloads URLs, which is magic you rarely want.
@say
"Both copy files into the image. COPY does exactly that: copies local files or directories from the build context into the image. It's explicit and predictable.

ADD does the same plus two extra behaviours: it automatically extracts local tar archives into the destination, and it can download files from remote URLs. Those make builds less predictable and less secure: a remote download isn't cached sensibly, isn't verified, and the content can change between builds.

So the recommendation is to use COPY by default, and only use ADD when you specifically want automatic tar extraction. For downloading files, a RUN instruction with curl plus checksum verification, in the same layer as any cleanup, is more transparent and secure."

### [2] How do you reduce a container image's size?
@tags image size, optimisation
@hook Smaller base, multi-stage builds, fewer and cleaner layers, only runtime dependencies, a good .dockerignore. Then inspect with docker history or dive.
@say
"Start with the base image, which usually dominates: switch from a full OS image to a slim variant, Alpine, which is tiny but uses musl libc, which can cause compatibility or performance surprises, or distroless images that contain only the runtime with no shell or package manager. For statically compiled binaries, scratch.

Use multi-stage builds, so build tools, SDKs, source code and test dependencies stay out of the final stage.

Install only what's needed: production dependencies only, no recommended extras, for example apt-get install --no-install-recommends, and remove package manager caches in the same RUN instruction, because deleting them in a later layer doesn't reduce the size.

Use a .dockerignore so the build context doesn't drag in .git, node_modules or local build output.

Then measure: docker images for the size, docker history to see which layers are big, and a tool like dive to explore what's inside each layer. Smaller images mean faster deploys and autoscaling, lower registry costs and fewer vulnerabilities. That said, a distroless image without a shell is harder to debug, which ephemeral debug containers in Kubernetes solve."

### [2] How does Docker layer caching work, and how should you order Dockerfile instructions?
@tags caching, build performance
@hook Each instruction is cached until its inputs change; once one layer changes, every layer after it rebuilds. Put rarely changing things first.
@say
"Docker caches the result of each build instruction. On the next build, it reuses the cached layer if the instruction and its inputs are unchanged; for COPY and ADD, that means the checksums of the copied files. The moment one layer's cache is invalidated, every subsequent instruction must rebuild.

So instructions should be ordered from least to most frequently changing. Base image and OS packages first, then dependency manifests, like package.json and its lock file, a csproj file or requirements.txt, then the dependency install step, and only then COPY of the application source. That way, editing code only rebuilds the final layers, and the slow dependency install stays cached. Copying the whole source tree before installing dependencies is the classic mistake that makes every build reinstall everything.

In CI, the local cache is often empty because runners are fresh, so I use BuildKit's remote cache, exporting and importing cache to the registry or the CI cache, and cache mounts for package manager directories, like mounting the NuGet or npm cache during RUN, which speeds up installs without bloating layers."

### [2] Explain Docker networking modes.
@tags docker networking
@hook Bridge: private network with port mapping (default). Host: shares the host's network stack. None: no network. Overlay: spans multiple hosts. User-defined bridges give you DNS by name.
@say
"Bridge is the default. Containers get an IP on a private virtual network on the host, and reach the outside world through NAT. To accept traffic from outside, you publish ports, like -p 8080:80. On user-defined bridge networks, containers can reach each other by container name through Docker's built-in DNS, which is why Docker Compose creates one per project.

Host mode removes network isolation: the container uses the host's network stack directly, so there's no port mapping and no NAT overhead, but port conflicts are possible and isolation is weaker. It's used for performance-sensitive or network-monitoring workloads.

None gives the container no network at all, only loopback, for isolated batch jobs.

Overlay networks span multiple Docker hosts, used by Docker Swarm. Macvlan gives containers their own MAC address on the physical network, appearing as separate devices.

In Kubernetes, Docker's networking isn't used: the CNI plugin gives every pod its own IP on a flat cluster network, and pods can reach each other directly without NAT."

### [1] Volumes vs bind mounts vs tmpfs?
@tags storage, volumes
@hook Volumes: Docker-managed persistent storage, the default choice. Bind mounts: a host path mapped in, great for development. tmpfs: in memory only.
@say
"A container's writable layer is lost when the container is removed and isn't designed for heavy writes, so persistent or shared data goes elsewhere.

Volumes are managed by Docker, stored in Docker's area on the host, and referenced by name. They persist independently of containers, work the same on any host, can use volume drivers for network or cloud storage, and are the recommended choice for databases and application data.

Bind mounts map a specific path on the host into the container. They're perfect for local development, like mounting source code for live reload, or for giving a container access to specific host files, like a config file or the Docker socket. But they depend on the host's directory structure, and they can expose sensitive host paths, so they should be used sparingly in production, and mounting the Docker socket effectively grants root on the host.

tmpfs mounts live only in memory and vanish when the container stops, useful for sensitive temporary data or fast scratch space.

In Kubernetes, the equivalents are persistent volumes and claims, hostPath, which is discouraged, and emptyDir, optionally memory-backed."

### [2] What are container security best practices?
@tags container security, hardening
@hook Minimal trusted images, scan and sign them, run as non-root with least privilege, read-only filesystem, no secrets inside, patch continuously.
@say
"I think about it in three phases.

Build: use minimal, trusted base images, like distroless or slim official images, pinned by version or digest; keep build tools out with multi-stage builds; never bake secrets into images; scan images for vulnerabilities in CI with tools like Trivy or Grype and fail on critical issues with fixes available; generate an SBOM and sign images with cosign.

Deploy: only allow images from trusted registries, with verified signatures, enforced by admission policies in Kubernetes; avoid the latest tag.

Run: run as a non-root user, and in Kubernetes set runAsNonRoot, disallow privilege escalation and drop all Linux capabilities, adding back only what's needed; use a read-only root filesystem with writable volumes only where necessary; never run privileged containers or mount the Docker socket unless absolutely required; apply seccomp profiles, the runtime default at minimum; set CPU and memory limits to contain denial of service; restrict network access with network policies; and use runtime detection, like Falco, to alert on suspicious behaviour like a shell spawning in a container.

And patch continuously: rebuild images regularly to pick up base image fixes, not only when the application changes."

### [2] A container exits immediately after starting. How do you debug it?
@tags troubleshooting, docker
@hook Read the exit code and the logs first. Then check the command, the config and permissions, and run it interactively with the entrypoint overridden.
@say
"First, the exit code and logs: docker ps -a shows the exit code, and docker logs shows what the process printed before dying. docker inspect shows the exit code, OOM-killed status, and the exact command, environment and mounts it ran with.

The exit code narrows it down. 0 means the main process simply finished: a container lives only as long as its main process, so a command that runs and exits, or a service that starts in the background and returns, makes the container stop. The fix is to run the process in the foreground. 1 or other application codes mean the app errored, so the logs usually show a missing environment variable, a config file not found, or a failure to connect to a dependency. 126 means the command isn't executable, often a permissions issue or a script with Windows line endings. 127 means command not found, a wrong path or a binary missing from a slim image. 137 means it was SIGKILLed, often by the OOM killer. 139 means a segmentation fault.

If it's still unclear, I override the entrypoint and get a shell, like docker run -it --entrypoint sh image, to inspect the filesystem, check paths and permissions, and run the command manually to see the error. In Kubernetes, the same investigation is kubectl logs --previous and kubectl describe pod, plus ephemeral debug containers for distroless images."

### [2] What is the PID 1 problem in containers?
@tags pid 1, signals, init
@hook PID 1 doesn't get default signal handling and must reap zombies. Many apps aren't written for that, so use the exec form and a tiny init like tini.
@say
"Inside a container, the main process runs as PID 1, which has two special responsibilities in Linux that normal applications don't expect.

First, signals: the kernel doesn't apply default signal handlers to PID 1. If the process hasn't explicitly installed a handler for SIGTERM, the signal is simply ignored, instead of terminating it. So docker stop or a Kubernetes rollout sends SIGTERM, nothing happens, and after the grace period the process is SIGKILLed, losing in-flight work.

Second, reaping zombies: PID 1 inherits orphaned processes and must reap them when they exit. If the application spawns child processes, like shelling out to tools, and doesn't reap them, zombies accumulate.

The fixes: make sure the application handles SIGTERM properly for graceful shutdown, which most web frameworks do; use the exec form of ENTRYPOINT and CMD, so the app is really PID 1 and not a shell that swallows signals; and if the app spawns children or doesn't handle signals well, use a minimal init like tini, which Docker can add with --init, which forwards signals to the app and reaps zombies. In Kubernetes, sharing the process namespace between containers in a pod is another option."

### [1] What is Docker Compose used for?
@tags docker compose, local development
@hook Define a multi-container application in one YAML file and start it with one command. Ideal for local development and CI integration tests.
@say
"Docker Compose defines and runs multi-container applications from a single YAML file: the services, their images or build contexts, ports, environment variables, volumes, networks and dependencies. docker compose up starts everything on a shared network where services find each other by name.

Its sweet spot is local development and testing: a developer can start the application with its database, cache, message broker and observability tools in one command, with consistent versions across the team. It's also great in CI for spinning up dependencies for integration tests, and for small single-host deployments or demos.

It's not an orchestrator for production clusters: it doesn't do multi-host scheduling, self-healing across nodes, rolling updates at scale or autoscaling, which is Kubernetes' job. A useful detail: depends_on only controls start order, not readiness, so you combine it with health checks and the service_healthy condition, or retry logic in the app, so a service doesn't try to use a database that's still starting."
@deep
```yaml
services:
  api:
    build: .
    ports: ["8080:8080"]
    environment:
      ConnectionStrings__Db: "Host=db;Database=orders;Username=app;Password=dev-only"
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: dev-only
      POSTGRES_USER: app
      POSTGRES_DB: orders
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10
volumes:
  pgdata:
```

### [2] Image tags vs digests. Why avoid "latest"?
@tags images, registry, immutability
@hook Tags are movable labels; digests are content hashes that never change. Deploy by immutable tag or digest so you always know exactly what's running.
@say
"A tag is a human-readable, mutable label pointing to an image, like orders:1.4.2 or latest. Anyone with push access can move a tag to a different image. A digest is the SHA-256 hash of the image manifest, like orders@sha256:..., and it's immutable: the same digest always means exactly the same content.

latest is problematic for several reasons: it's just the default tag, not necessarily the newest image; different nodes can pull different images under the same tag at different times; rollbacks are unclear, because you don't know what 'the previous latest' was; and with an IfNotPresent pull policy, nodes may keep running a stale cached version.

So in deployments I use unique, immutable tags, like the Git commit SHA or a semantic version, and configure the registry to make tags immutable, which ACR, ECR and others support. For the strongest guarantees, I pin by digest, which is also what signature verification works against. Base images in Dockerfiles can be pinned by digest too, with tools like Renovate or Dependabot proposing updates, so upgrades are deliberate."

### [2] Docker vs containerd vs CRI-O? What is OCI? Why was dockershim removed?
@tags container runtimes, oci, kubernetes
@hook OCI standardises images and runtimes. containerd and CRI-O are the runtimes Kubernetes talks to; Docker is a developer toolchain built on containerd.
@say
"The Open Container Initiative defines open standards for container image formats, runtimes and distribution, so images built with one tool run with any compliant runtime.

The layers: runc is the low-level runtime that actually creates containers using namespaces and cgroups, following the OCI runtime spec. containerd is a high-level runtime and daemon that manages images, storage and container lifecycles, and calls runc. CRI-O is a lightweight high-level runtime built specifically for Kubernetes. Docker Engine is a full developer platform, with the CLI, build tooling and networking, built on top of containerd.

Kubernetes talks to runtimes through the Container Runtime Interface, CRI. Docker Engine didn't implement CRI, so Kubernetes maintained an adapter called dockershim, which was removed in Kubernetes 1.24. Since then, clusters use containerd or CRI-O directly, which is simpler and more efficient.

For users, almost nothing changed: images built with Docker are OCI images and run fine on containerd. What changed was for workloads that depended on the Docker daemon on nodes, like mounting the Docker socket for builds, which now use alternatives like BuildKit, Kaniko or buildah. For node-level debugging, crictl replaces the docker CLI."

### [1] What do HEALTHCHECK and restart policies do?
@tags health checks, restart policy, docker
@hook HEALTHCHECK tells Docker whether the app inside actually works. Restart policies decide what happens when the container dies.
@say
"A HEALTHCHECK instruction, or the healthcheck option in Compose, defines a command Docker runs periodically inside the container, like curling a health endpoint, to determine whether the application is actually working, not just whether the process exists. The container's status becomes healthy or unhealthy, which Compose can use for startup dependencies and Docker Swarm uses to replace unhealthy containers.

Restart policies decide what Docker does when a container exits: no, the default; on-failure, which restarts only on a non-zero exit code, optionally with a maximum retry count; always; and unless-stopped, which restarts unless someone explicitly stopped it, and is common for long-running services on a single host.

Note that plain Docker doesn't restart a container just because it's unhealthy; the health status is informational. In Kubernetes, the Dockerfile HEALTHCHECK is ignored entirely, and liveness, readiness and startup probes defined in the pod spec take over, with the kubelet restarting containers that fail liveness checks."
