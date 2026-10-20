@section net | Networking for DevOps
@blurb Subnets, DNS, load balancers, proxies, TLS and the art of finding out why A can't talk to B.

### [1] How do you use the OSI model when troubleshooting?
@tags osi, troubleshooting, networking
@hook Work bottom-up (or top-down) layer by layer, with one tool per layer, so you never guess.
@say
"I use it as a checklist, so I don't jump to conclusions. For 'the app can't reach the database', I'd go up the layers.

Layer 1 and 2, physical and link: in the cloud, mostly 'is the instance up and is the interface attached', checked with ip link and the console.

Layer 3, network: does the host have an IP and a route to the destination? ip addr, ip route, ping, if ICMP is allowed, and traceroute or mtr to see where packets stop. In the cloud, route tables, VPC peering and NAT gateways live here.

Layer 4, transport: can I open a TCP connection to the port? nc -vz host 5432 or telnet. 'Connection refused' versus 'timeout' already tells me a lot. Security groups, network ACLs and firewalls usually show up here. ss -tlnp on the server shows whether anything is listening.

Layer 7, application: DNS resolution with dig, TLS with openssl s_client, and HTTP with curl -v, checking status codes, headers, certificates and response times. Then the application and its logs, like authentication failures or connection pool limits.

Once I find the lowest layer that's broken, I know which team, config or component to look at."

### [1] Explain subnetting and CIDR notation.
@tags subnetting, cidr, ip
@hook The number after the slash is how many bits are the network. Hosts = 2 to the power of the remaining bits, minus reserved addresses.
@say
"An IPv4 address is 32 bits. CIDR notation, like 10.0.1.0/24, says how many leading bits identify the network; the rest identify hosts within it. A /24 leaves 8 bits for hosts, so 256 addresses; a /16 leaves 16 bits, 65,536 addresses; a /26 leaves 6 bits, 64 addresses; and a /32 is a single address.

Traditionally, two addresses per subnet are reserved, the network address and the broadcast address, so a /24 has 254 usable hosts. In AWS, five addresses are reserved per subnet, so a /24 gives 251 usable. Azure also reserves five.

The private ranges, defined in RFC 1918 and not routed on the internet, are 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16.

In cloud design this matters a lot: I plan VPC or VNet ranges so they don't overlap with other VPCs, on-premise networks or VPNs I may need to connect later, because overlapping ranges can't be peered or routed. And I size subnets generously for Kubernetes, since many CNI setups give every pod a real VPC IP address, which can exhaust a small subnet quickly."
@deep
| CIDR | Addresses | Usable (classic) | Usable (AWS / Azure) |
|---|---|---|---|
| /16 | 65,536 | 65,534 | 65,531 |
| /20 | 4,096 | 4,094 | 4,091 |
| /24 | 256 | 254 | 251 |
| /26 | 64 | 62 | 59 |
| /28 | 16 | 14 | 11 |
| /32 | 1 | single host | n/a |

Quick formula: addresses = 2^(32 - prefix). Each step down in prefix doubles the size.

### [1] What DNS record types should you know, and how do you troubleshoot DNS?
@tags dns, troubleshooting
@hook A, AAAA, CNAME, MX, TXT, NS, SRV, plus TTLs. Troubleshoot with dig: which server answered, what it returned, and how long it's cached.
@say
"The core record types: A maps a name to an IPv4 address, AAAA to IPv6. CNAME makes a name an alias of another name; it can't be used at the zone apex, which is why providers offer alias or flattening records for root domains pointing to load balancers. MX lists mail servers. TXT holds text used for domain verification and email security like SPF, DKIM and DMARC. NS delegates a zone to name servers. SRV specifies service host and port, used by some service discovery systems. And PTR does reverse lookups.

TTL controls how long resolvers cache a record. Before a migration, I lower the TTL well in advance, so the switch propagates quickly, and raise it again afterwards.

For troubleshooting I use dig: dig example.com shows the answer, the TTL and which server answered; dig @8.8.8.8 example.com queries a specific resolver to compare what different resolvers see; dig +trace follows the delegation from the root, which finds broken delegation or wrong NS records; and checking /etc/resolv.conf shows which resolver and search domains the host uses. In Kubernetes, DNS problems often come from CoreDNS, its configuration, or the ndots setting causing many extra lookups."

### [2] Layer 4 vs layer 7 load balancing. When do you use each?
@tags load balancing, l4, l7
@hook L4 routes connections by IP and port, fast and protocol-agnostic. L7 understands HTTP, so it can route by path or host, terminate TLS and do smart retries.
@say
"A layer 4 load balancer works at the transport level: it distributes TCP or UDP connections based on IP addresses and ports, without looking inside the traffic. It's very fast, handles any protocol, like databases, gRPC over raw TCP, game servers or MQTT, and can preserve the client's source IP. Examples are AWS Network Load Balancer, Azure Load Balancer and a Kubernetes Service of type LoadBalancer in many setups.

A layer 7 load balancer understands the application protocol, usually HTTP. It can route by hostname, path, headers or cookies, so one entry point serves many services; terminate TLS and manage certificates; add headers; do retries, rate limiting, authentication and web application firewall rules; and gather rich request metrics. Examples are AWS Application Load Balancer, Azure Application Gateway, Nginx, Envoy, and Kubernetes ingress or Gateway API implementations.

So I'd use L7 for HTTP-based web apps and APIs, especially with many services behind one domain, and L4 for non-HTTP protocols, extreme throughput or very low latency needs, or when TLS must pass through end to end to the backend. Often they're combined: an L4 load balancer in front of a fleet of L7 proxies."

### [1] Reverse proxy vs forward proxy? What does Nginx do as a reverse proxy?
@tags proxy, nginx
@hook A forward proxy acts for clients going out. A reverse proxy acts for servers, receiving traffic coming in.
@say
"A forward proxy sits in front of clients and makes requests to the internet on their behalf. Companies use them to control and log outbound traffic, cache content, or enforce egress policies; the destination server sees the proxy, not the client.

A reverse proxy sits in front of servers and receives requests from clients on their behalf; clients think they're talking to the real server. It's used for load balancing across backends; TLS termination; caching and compression; serving static files; routing different paths to different services; adding security headers, rate limiting and request size limits; and hiding the internal topology.

Nginx is the classic reverse proxy: an upstream block lists the backend servers, and location blocks route requests to them with proxy_pass, passing headers like X-Forwarded-For so the backend knows the real client IP. Envoy, HAProxy, Traefik and Caddy do similar jobs, and in Kubernetes, ingress controllers and Gateway API implementations are reverse proxies configured from Kubernetes resources."
@deep
```nginx
upstream orders_api {
    least_conn;
    server 10.0.1.10:8080 max_fails=3 fail_timeout=10s;
    server 10.0.1.11:8080 max_fails=3 fail_timeout=10s;
}
server {
    listen 443 ssl;
    server_name api.example.com;
    ssl_certificate     /etc/ssl/api.crt;
    ssl_certificate_key /etc/ssl/api.key;

    location /orders/ {
        proxy_pass http://orders_api;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
```

### [1] What is NAT, and why does a private subnet need a NAT gateway?
@tags nat, cloud networking
@hook NAT rewrites addresses so many private hosts share one public IP. A NAT gateway lets private instances reach out to the internet without being reachable from it.
@say
"Network address translation rewrites the IP addresses in packets as they pass through a router. Source NAT changes the source address of outgoing traffic, letting many machines with private addresses share one or a few public IP addresses; the NAT device tracks connections so replies are translated back to the right machine. Destination NAT changes the destination of incoming traffic, like port forwarding to an internal server.

In cloud networks, instances in private subnets have no public IP, which is good for security, since nothing on the internet can initiate connections to them. But they often still need outbound internet access, to download packages, pull images or call external APIs. A NAT gateway in a public subnet provides that: private subnets route internet-bound traffic to it, it source-NATs the traffic using its public IP, and responses come back through it. Inbound connections from the internet aren't possible.

Things worth knowing: NAT gateways cost money per hour and per gigabyte processed, so heavy traffic to cloud services is better routed through private endpoints; you need one per availability zone for high availability; and at very high connection rates you can hit SNAT port exhaustion, because each destination IP and port pair only has so many source ports available."

### [2] How do TLS certificates work in operations? How do you avoid expired certificates?
@tags tls, certificates, automation
@hook A certificate binds a domain to a public key, signed through a chain back to a trusted root. Automate issuance and renewal, and monitor expiry anyway.
@say
"A TLS certificate binds a domain name to a public key and is signed by a certificate authority. Clients trust it if they can build a chain from the server's certificate, through intermediate certificates, to a root CA in their trust store, and if it's valid for the hostname and not expired or revoked. A very common misconfiguration is serving only the leaf certificate without the intermediates, which works in some browsers but breaks other clients.

Expired certificates are one of the most common causes of outages, because renewal used to be a manual, yearly task that people forgot. Certificate lifetimes are also getting shorter across the industry, so manual renewal is becoming impossible anyway.

So I automate: Let's Encrypt or a cloud certificate service with the ACME protocol for automatic issuance and renewal; cert-manager in Kubernetes, which issues and renews certificates as Kubernetes resources; and managed certificates on cloud load balancers, which renew themselves. And I still monitor expiry with alerts 30 days and 7 days out, with synthetic checks against the real endpoints, because automation can fail silently.

For internal service-to-service traffic, mutual TLS, where both sides present certificates, is often handled by a service mesh with short-lived certificates rotated automatically. To debug, openssl s_client -connect host:443 -servername host shows the chain and expiry."

### [2] "Connection refused" vs "connection timed out". What does each tell you?
@tags troubleshooting, tcp, networking
@hook Refused: you reached the host, but nothing is listening (or a firewall actively rejected). Timeout: packets are being dropped somewhere, usually a firewall, security group or routing.
@say
"They point to different problems.

Connection refused means the TCP SYN reached the destination host, and it replied with a reset. Usually nothing is listening on that port: the service is down, crashed, listening on a different port, or bound only to localhost, 127.0.0.1, instead of all interfaces, which is a classic container mistake. Some firewalls also actively reject with a reset. The network path is working.

Connection timed out means the client sent SYN packets and got nothing back. Something is silently dropping the traffic: a security group or network ACL, a host firewall, a missing route, the wrong IP address, a NAT or peering problem, or the host itself is down.

So for 'refused', I check the service on the target: is the process running, ss -tlnp to see what it's listening on and which address. For 'timeout', I check the path: security groups, firewall rules, route tables and whether the IP is right, using traceroute and, if needed, tcpdump on both ends to see whether the packets arrive at all."

### [2] Service A can't reach service B. How do you troubleshoot?
@tags troubleshooting, connectivity
@hook From A's point of view: resolve, route, connect, then speak the protocol. Find the first step that fails.
@say
"I test from where service A actually runs, the same host, container or pod, because the network view differs between my laptop and the workload.

Step one, DNS: does B's name resolve, and to the right address? dig or nslookup. Wrong answers point to DNS records, stale caches or search domains.

Step two, network path: is there a route? ping if ICMP is allowed, traceroute or mtr to see where it stops.

Step three, the port: nc -vz B 443 or curl -v. Refused means B isn't listening, or it's bound to localhost. Timeout means something is dropping packets: security groups, network ACLs, firewall rules, Kubernetes network policies, or missing peering routes.

Step four, the protocol: curl -v to check TLS, certificates, the HTTP status and headers. Problems here are often certificate errors, the wrong host header, authentication failures or a proxy in between.

Step five, B's side: B's logs, whether requests arrive at all, and B's own dependencies.

If it's still unclear, tcpdump on both sides shows definitively whether packets leave A and arrive at B. And I check what changed recently, because a new network policy, security group edit or certificate rotation is often the cause."

### [2] Stateful vs stateless firewalls? Security groups vs network ACLs?
@tags firewall, security groups, nacl
@hook Stateful firewalls remember connections, so replies are allowed automatically. Stateless ones check every packet both ways. Security groups are stateful; NACLs are stateless.
@say
"A stateful firewall tracks connections. If an outbound connection is allowed, the return traffic for that connection is automatically allowed back in, so you only write rules for the direction the connection starts. Linux iptables and nftables with connection tracking, and cloud security groups, are stateful.

A stateless firewall evaluates every packet independently against its rules, with no memory of connections. You must explicitly allow both directions, including return traffic on ephemeral ports, typically 1024 to 65535. AWS network ACLs are stateless.

In AWS, security groups attach to network interfaces, like instances or load balancers, contain only allow rules, are stateful, and can reference other security groups, like 'allow port 5432 from the app tier's security group', which is cleaner than IP ranges. Network ACLs apply to whole subnets, support both allow and deny rules evaluated in numbered order, and are stateless. Azure's equivalent of security groups is network security groups, which are also stateful.

In practice I do most access control with security groups, following least privilege, and use NACLs sparingly as a coarse subnet-level guardrail, like blocking a known bad range."

### [1] Which common ports should you know?
@tags ports, basics
@hook 22 SSH, 53 DNS, 80/443 HTTP/HTTPS, 3306 MySQL, 5432 Postgres, 6379 Redis, 6443 Kubernetes API, 2379 etcd, 9090 Prometheus.
@say
"The ones I use constantly: 22 for SSH, 53 for DNS over UDP and TCP, 80 for HTTP and 443 for HTTPS, 25 and 587 for SMTP mail, and 123 for NTP time sync.

Databases and caches: 3306 for MySQL, 5432 for PostgreSQL, 1433 for SQL Server, 27017 for MongoDB, 6379 for Redis, and 9092 for Kafka.

Kubernetes: 6443 for the API server, 2379 and 2380 for etcd, 10250 for the kubelet, and the NodePort range 30000 to 32767.

Monitoring: 9090 for Prometheus, 3000 for Grafana, 9100 for the node exporter, and 4317 and 4318 for OpenTelemetry's OTLP over gRPC and HTTP.

Knowing them speeds up reading firewall rules, security group configs and netstat output, and spotting things that shouldn't be exposed, like a database port open to the internet."

### [2] A load balancer returns 502, 503 or 504. What do you check for each?
@tags http errors, load balancer, troubleshooting
@hook 502: the backend answered badly or hung up. 503: no healthy backend or overloaded. 504: the backend was too slow.
@say
"These come from the proxy or load balancer itself, describing a problem with the backend behind it.

502 Bad Gateway means the proxy got an invalid response or the connection failed: the backend crashed, refused the connection, closed it unexpectedly, or there's a protocol mismatch, like the proxy speaking HTTP to a backend expecting HTTPS. A classic intermittent cause is the backend's keep-alive timeout being shorter than the load balancer's, so the backend closes idle connections the proxy is about to reuse. During deploys, 502s often mean pods are killed before being removed from rotation. I check backend logs, crashes and restarts, the target port and protocol, and timeout settings.

503 Service Unavailable means there's no healthy backend to send the request to, or the service is deliberately shedding load: all targets failing health checks, a deployment with zero ready pods, a Kubernetes Service with no endpoints, or rate limits and circuit breakers tripping. I check target health, readiness probes and kubectl get endpoints.

504 Gateway Timeout means the backend didn't respond within the proxy's timeout: slow queries, a slow downstream dependency, thread or connection pool exhaustion, or a timeout set too low for a legitimately long operation. I check backend latency, traces, dependency health and timeout configuration across each hop."

### [2] What is a service mesh, and when is it worth it?
@tags service mesh, istio, linkerd, mtls
@hook A dedicated infrastructure layer that handles service-to-service traffic: mTLS, retries, timeouts, traffic splitting and telemetry, without changing app code. Powerful, but not free.
@say
"A service mesh moves networking concerns out of application code and into the infrastructure. Traditionally a sidecar proxy, usually Envoy or Linkerd's proxy, runs next to every service instance and intercepts all its traffic, managed by a central control plane. Newer designs, like Istio's ambient mode, use shared per-node proxies plus optional waypoint proxies instead of a sidecar in every pod, which cuts resource overhead.

What it gives you: automatic mutual TLS between services, with identity-based authorisation policies, which is a big part of zero-trust networking; traffic management like retries, timeouts, circuit breaking, canary splits and fault injection; and uniform golden-signal metrics and tracing for every service without instrumenting each one.

The costs: operational complexity, another critical system to upgrade and debug; resource overhead and some added latency; and a steep learning curve.

So it's worth it when you have many services, strict security requirements like mandatory mTLS, or complex traffic management needs, and a team that can run it. For a handful of services, I'd use simpler options: TLS in the apps or at the ingress, Kubernetes network policies, client libraries for retries, and OpenTelemetry instrumentation."

### [3] What is ephemeral or SNAT port exhaustion, and how do you fix it?
@tags tcp, nat, scale, troubleshooting
@hook Every outbound connection to the same destination needs a unique source port. Open and close too many short connections and you run out. Reuse connections.
@say
"A TCP connection is identified by source IP, source port, destination IP and destination port. When many connections go from the same source IP to the same destination IP and port, each needs a unique source port, and there are only about 64,000, fewer in the default ephemeral range. After a connection closes, the side that closed first keeps the port in TIME_WAIT for a while, typically 60 seconds on Linux.

So an application that opens a new connection for every request, like creating a new HTTP client per call, to the same service can run out of ports. Behind a cloud NAT gateway or a load balancer's outbound SNAT, the shared public IP has a limited port allocation per destination, which makes this much easier to hit. The symptoms are intermittent connection failures or timeouts under load, which look like the destination is flaky.

Fixes: reuse connections with keep-alive and connection pooling, which is the real fix, like using a single shared HttpClient or IHttpClientFactory in .NET; add more outbound IP addresses to the NAT; use private endpoints for cloud services so traffic doesn't go through NAT at all; and on Linux hosts, widen the ephemeral port range. Monitoring NAT port allocation metrics catches it before it causes outages."
