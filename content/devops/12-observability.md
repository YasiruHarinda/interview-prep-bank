@section obs | Monitoring and Observability
@blurb Metrics, logs and traces, Prometheus and PromQL, OpenTelemetry, cardinality, and alerting that wakes people only when users are hurting.

### [1] Monitoring vs observability?
@tags observability, monitoring
@hook Monitoring watches known failure modes against thresholds. Observability lets you ask new questions about unknown failures from the telemetry you already have.
@say
"Monitoring is collecting predefined metrics and checking them against known thresholds: CPU above 90 percent, error rate above 1 percent, disk almost full. It answers questions you knew to ask in advance, and it's essential for alerting on known failure modes.

Observability is a property of the system: how well you can understand its internal state from its external outputs. A highly observable system emits rich telemetry, structured logs, metrics with useful dimensions and distributed traces, all correlated, so when something new and weird happens, you can explore and ask questions you didn't anticipate, like 'why are requests from this one customer on this app version slow only when they hit this region?', without shipping new code to find out.

In microservices, most incidents are novel combinations of factors, so dashboards of known metrics aren't enough. You need to slice by any dimension and follow a request across services. Monitoring is a subset of what an observable system enables: you still need good alerts, but they sit on top of telemetry rich enough for investigation."

### [1] What are the three pillars of observability, and how do they fit together?
@tags metrics, logs, traces
@hook Metrics tell you that something is wrong, traces tell you where, logs tell you why. Correlate them with shared IDs.
@say
"Metrics are numeric measurements aggregated over time, like request rate, error count, latency histograms, CPU and queue depth. They're cheap to store and query at scale, ideal for dashboards, trends and alerts, but they lose individual detail.

Logs are timestamped records of discrete events, ideally structured as JSON with consistent fields. They carry rich detail, like the error message, user ID and parameters, so they explain why something happened. But they're expensive at high volume and hard to aggregate.

Traces follow a single request through a distributed system as a tree of spans, each with a service, operation, duration and attributes. They show where time goes and which service in the chain failed.

They work best together through correlation. An alert fires on a metric, like p99 latency on checkout; I jump to exemplar traces from that time window showing that the payment service's database call is slow; and from the trace ID I pull the logs for those exact requests, which show lock timeout errors. That requires propagating trace context and including trace IDs in every log line, which OpenTelemetry handles.

Some people add a fourth pillar, continuous profiling, which shows which code paths consume CPU and memory in production, and events like deploys and config changes, which are invaluable to overlay on graphs."

### [1] What are the four golden signals, RED and USE?
@tags golden signals, red, use, metrics
@hook Golden signals: latency, traffic, errors, saturation. RED for request-driven services: rate, errors, duration. USE for resources: utilisation, saturation, errors.
@say
"The four golden signals, from Google's SRE book, are the minimum to monitor for any user-facing system: latency, how long requests take, separating successful from failed requests and using percentiles; traffic, the demand, like requests per second; errors, the rate of failed requests, including explicit errors and wrong or slow responses that count as failures; and saturation, how full the service is, like CPU, memory, connection pools or queue length, often the leading indicator of trouble.

The RED method is a simplification for request-driven services: rate, errors and duration. If every service exposes RED metrics in a consistent way, you can build one standard dashboard for all of them.

The USE method, from Brendan Gregg, is for resources: for every resource, like CPUs, memory, disks, network interfaces, and also software resources like thread pools, check utilisation, how busy it is; saturation, how much work is queued waiting; and errors.

In practice, I use RED for services, USE for the infrastructure and resources beneath them, and the golden signals as the overall framing for user-facing SLOs and alerts. Consistency across teams matters more than which acronym you choose."

### [2] How does Prometheus work?
@tags prometheus, metrics, architecture
@hook A pull-based time-series database: it discovers targets, scrapes their /metrics endpoints on an interval, stores samples by labels, evaluates rules, and sends alerts to Alertmanager.
@say
"Prometheus is an open-source monitoring system with a time-series database. It uses a pull model: applications and exporters expose metrics over HTTP, usually at /metrics, in a simple text format, and Prometheus scrapes them at a regular interval, like every 15 or 30 seconds.

Service discovery finds the targets dynamically, from the Kubernetes API, cloud APIs or Consul, so new pods are scraped automatically; the Prometheus Operator makes this declarative with ServiceMonitor and PodMonitor resources. Exporters translate metrics from systems that don't expose them natively, like the node exporter for host metrics, or exporters for Postgres, Redis or Nginx.

Each time series is identified by a metric name plus labels, like http_requests_total with method, route and status labels. PromQL queries them. Recording rules precompute expensive queries, and alerting rules evaluate conditions continuously and send firing alerts to Alertmanager, which handles grouping, deduplication, silencing, inhibition and routing to Slack, PagerDuty or email.

Pull suits dynamic environments and makes target health visible, since a failed scrape is itself a signal. For short-lived batch jobs that end before being scraped, there's the Pushgateway, used sparingly. A single Prometheus is meant to be simple and local, so for long-term storage, high availability and a global view across clusters, you add Thanos, Cortex or Grafana Mimir, or a managed Prometheus service."

### [2] Write PromQL for request rate, error ratio and p99 latency.
@tags promql, prometheus, queries
@hook rate() over counters for throughput, a ratio of two rates for errors, histogram_quantile over rate of buckets for percentiles. Always aggregate with sum by.
@say
"For request rate, I take the per-second rate of the request counter over a window and sum it: sum by service of rate of http_requests_total over 5 minutes. rate handles counter resets, which is why you never graph a raw counter.

For the error ratio, I divide the rate of requests with 5xx status codes by the rate of all requests, both summed by service, which gives the fraction of failed requests, the basis for an availability SLI.

For p99 latency, Prometheus histograms store counts in cumulative buckets. I take the rate of the bucket counters, sum by the le label, which is the bucket boundary, and by service, and apply histogram_quantile with 0.99. The sum must keep the le label, otherwise the quantile can't be computed. And the result's accuracy depends on how well the bucket boundaries fit the latency range; native histograms in newer Prometheus versions improve this.

For dashboards and alerts that are queried often, I'd turn these into recording rules, so they're precomputed once rather than recalculated on every dashboard load."
@deep
```promql
# Requests per second per service
sum by (service) (rate(http_requests_total[5m]))

# Error ratio (5xx / all)
sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))
  /
sum by (service) (rate(http_requests_total[5m]))

# p99 latency from a histogram
histogram_quantile(0.99,
  sum by (le, service) (rate(http_request_duration_seconds_bucket[5m])))

# Containers being CPU throttled (share of periods throttled)
sum by (pod) (rate(container_cpu_cfs_throttled_periods_total[5m]))
  /
sum by (pod) (rate(container_cpu_cfs_periods_total[5m]))
```

### [1] Counter vs gauge vs histogram vs summary?
@tags metric types, prometheus
@hook Counter only goes up (use rate). Gauge goes up and down. Histogram buckets observations so you can compute percentiles across instances. Summary computes quantiles per instance.
@say
"A counter only increases, or resets to zero on restart: total requests, total errors, bytes sent. You almost never look at its raw value; you apply rate or increase to get per-second rates or totals over a window.

A gauge is a value that goes up and down: current memory usage, temperature, queue length, number of active connections, in-flight requests.

A histogram counts observations, like request durations, into configurable buckets, and also tracks the sum and count. Because buckets are just counters, they can be aggregated across all instances of a service, so you can compute an accurate service-wide p99 with histogram_quantile. The cost is choosing bucket boundaries and more time series, one per bucket.

A summary calculates quantiles, like p50 and p99, on the client side, per instance. They're accurate for that instance, but quantiles can't be meaningfully averaged across instances, so they're much less useful in distributed systems.

So for latency in services, I use histograms, with buckets around the SLO thresholds, so I can compute the share of requests faster than, say, 300 milliseconds directly."

### [2] What is high cardinality, and why does it matter?
@tags cardinality, metrics, cost
@hook Every unique label combination is a separate time series. Labels like user ID or request ID explode the series count, memory and cost. Keep those in logs and traces.
@say
"In metric systems like Prometheus, each unique combination of metric name and label values is a separate time series that must be stored and indexed. Cardinality is the number of those series.

Labels with a small, bounded set of values, like HTTP method, status code class, service and region, are fine. Labels with unbounded or huge sets of values, like user ID, email, request ID, full URL path with IDs in it, or pod IPs in a high-churn environment, multiply the number of series enormously. A metric with a user ID label for a million users becomes a million series.

That causes high memory usage and slow queries in Prometheus, sometimes crashes, and very large bills in hosted metrics services that charge per series.

So I keep metric labels low-cardinality: normalise URL paths to route templates, like /orders/{id}; avoid unique identifiers entirely; and watch the series count per metric. High-cardinality detail belongs in logs and traces, which are designed for it, or in observability tools built for wide events. Exemplars, which attach a trace ID to a sample metric value, are a good bridge between low-cardinality metrics and high-cardinality traces."

### [2] What is OpenTelemetry, and how does the Collector fit in?
@tags opentelemetry, otel, instrumentation
@hook One vendor-neutral standard for generating and shipping traces, metrics and logs. Instrument once with OTel SDKs; route anywhere through the Collector.
@say
"OpenTelemetry is a CNCF project that standardises how telemetry is produced and transported: APIs and SDKs for many languages, automatic instrumentation for common frameworks and libraries, semantic conventions so attributes like http.request.method mean the same thing everywhere, and the OTLP protocol for sending data. It's become the default for new instrumentation, and nearly every observability vendor accepts it.

The key benefit is decoupling instrumentation from the backend: you instrument your code once, and can send the data to Prometheus, Grafana's stack, Jaeger, Datadog, Azure Monitor or anything else, and switch vendors without re-instrumenting.

The Collector is a standalone service that receives telemetry, processes it and exports it. Its pipelines have receivers, like OTLP, Prometheus scraping or log files; processors, like batching, memory limiting, adding Kubernetes metadata, filtering, redacting sensitive attributes, and tail-based sampling; and exporters to one or several backends. It's typically deployed as an agent on each node, plus a gateway layer for central processing.

Using the Collector instead of sending straight from applications keeps credentials and backend configuration out of apps, enables sampling and filtering to control cost, and lets you send the same data to multiple destinations during a migration."
@deep
```yaml
receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }
processors:
  memory_limiter: { check_interval: 1s, limit_percentage: 80 }
  k8sattributes: {}
  batch: {}
  tail_sampling:
    policies:
      - { name: errors, type: status_code, status_code: { status_codes: [ERROR] } }
      - { name: slow, type: latency, latency: { threshold_ms: 1000 } }
      - { name: sample-rest, type: probabilistic, probabilistic: { sampling_percentage: 10 } }
exporters:
  otlphttp/traces: { endpoint: https://tempo.internal:4318 }
  prometheusremotewrite: { endpoint: https://mimir.internal/api/v1/push }
service:
  pipelines:
    traces:  { receivers: [otlp], processors: [memory_limiter, k8sattributes, tail_sampling, batch], exporters: [otlphttp/traces] }
    metrics: { receivers: [otlp], processors: [memory_limiter, k8sattributes, batch], exporters: [prometheusremotewrite] }
```

### [2] How does distributed tracing work? Head vs tail sampling?
@tags tracing, sampling
@hook Each request gets a trace ID passed in headers between services; each hop records a span. Head sampling decides at the start, cheaply; tail sampling decides at the end, smartly.
@say
"When a request enters the system, it's assigned a trace ID. Each operation along the way, like an HTTP handler, a database query or a call to another service, records a span with a start time, duration, status, attributes and a parent span ID. The trace context is propagated between services in headers, using the W3C traceparent standard, so downstream spans attach to the same trace. Assembled, the spans form a tree showing the full path and timing of the request, which makes it obvious which call was slow or failed.

Tracing every request at high volume is expensive, so we sample.

Head-based sampling decides at the start of the trace, for example keep 10 percent, and the decision propagates so a trace is either fully kept or fully dropped. It's simple and cheap, but random: it drops most of the interesting traces, like rare errors.

Tail-based sampling waits until a trace is complete, then decides based on what happened: keep all traces with errors, all slow traces, and a small percentage of normal ones. It keeps the valuable traces, but requires buffering complete traces in a collector layer, which costs memory and needs all spans of a trace to reach the same collector instance.

A common setup is light head sampling plus tail sampling in the OpenTelemetry Collector, with metrics computed before sampling, so request rates and latencies remain accurate."

### [2] How should logging be done in a modern system? ELK vs EFK vs Loki?
@tags logging, elk, loki
@hook Structured JSON logs to stdout, with trace IDs and no secrets; collected by an agent, stored centrally with retention tiers. Elasticsearch indexes everything; Loki indexes only labels and is cheaper.
@say
"Good logging starts in the application: structured logs, usually JSON, with consistent fields like timestamp, level, service, environment, trace ID, request ID and a clear message; written to standard output in containers, so the platform collects them; logging levels used sensibly; and never logging secrets, tokens or unnecessary personal data.

Collection: an agent on every node, like Fluent Bit, Fluentd, Vector, or the OpenTelemetry Collector, reads container logs, adds Kubernetes metadata, parses and filters them, and ships them to a backend.

Backends: the ELK stack is Elasticsearch, Logstash and Kibana, and EFK swaps Logstash for Fluentd or Fluent Bit. Elasticsearch, or OpenSearch, indexes the full content of every log line, which makes arbitrary full-text search fast but is expensive in storage and compute at high volume. Grafana Loki takes a different approach: it only indexes a small set of labels, like namespace, app and level, and stores the log content compressed in object storage, searching it by brute force at query time. That's far cheaper to run, and pairs naturally with Prometheus labels and Grafana, but full-text queries over large time ranges are slower. Cloud services like CloudWatch Logs and Azure Log Analytics are managed alternatives.

Cost control matters: drop noisy debug logs in production, sample high-volume success logs, set retention tiers, like hot for a few days and archive for compliance, and turn frequently queried patterns into metrics."

### [2] What makes a good alert? How do you reduce alert fatigue?
@tags alerting, on-call, alert fatigue
@hook Page only for urgent, actionable, user-impacting problems. Alert on symptoms, not causes. Every page needs a runbook. Delete or demote alerts nobody acts on.
@say
"A good paging alert is urgent, actionable and tied to user impact: if it fires at 3 a.m., someone needs to do something now, and they know what to do. Everything else should be a ticket, a dashboard or a lower-priority notification.

Principles I follow: alert on symptoms rather than causes. 'Checkout error rate is above SLO' or 'error budget burning fast' pages; 'CPU is at 85 percent on one node' usually doesn't, because it may not affect anyone. Causes belong on dashboards for investigation. Use SLO-based burn-rate alerts, which fire based on how fast the error budget is being consumed, catching both fast severe failures and slow degradation, with few false alarms. Include context in every alert: what's wrong, the impact, a link to the dashboard and a runbook with first steps. Route alerts to the owning team, and group and deduplicate related alerts, so one outage doesn't produce fifty pages.

To reduce fatigue: review every page in a regular on-call review. For each alert, ask whether it was actionable and whether it was urgent. Delete alerts nobody acts on, demote non-urgent ones to tickets, tune thresholds and durations to remove flapping, and automate the response for alerts that always get the same fix. Track pages per shift as a health metric for the on-call rotation itself."

### [2] What are SLO burn-rate alerts, and why are they better than threshold alerts?
@tags slo, burn rate, alerting
@hook Alert on how fast you're spending the error budget, across two windows: fast burns page, slow burns create tickets. Catches real problems, ignores blips.
@say
"A simple threshold alert, like 'error rate above 1 percent for 5 minutes', is either too sensitive, paging on short blips that don't matter, or too slow, missing slow degradations that quietly consume the whole month's budget.

Burn rate measures how fast the error budget is being consumed relative to the SLO. A burn rate of 1 means you'd use exactly the whole budget by the end of the window; a burn rate of 14.4 sustained for an hour means 2 percent of a 30-day budget gone in that hour.

The recommended approach from Google's SRE workbook uses multiple windows and burn rates. Page if the burn rate over the last hour is above 14.4 and also over the last 5 minutes, meaning it's still happening, which catches severe incidents within minutes. Page, or ticket, if the burn rate over the last 6 hours is above 6, with a shorter confirmation window. And ticket if the burn rate over 3 days is above 1, catching slow leaks.

The short confirmation window makes the alert reset quickly once the problem is fixed. The result is alerts that directly reflect user impact against an agreed objective, with high precision, and a clear link between alerting and business priorities. Tools like Sloth or Pyrra generate these Prometheus rules from SLO definitions."
@deep
```promql
# Page: fast burn (2% of a 30-day budget in 1 hour), still happening in the last 5 minutes
(
  sum(rate(http_requests_total{service="checkout",status=~"5.."}[1h]))
    / sum(rate(http_requests_total{service="checkout"}[1h]))
) > (14.4 * 0.001)
and
(
  sum(rate(http_requests_total{service="checkout",status=~"5.."}[5m]))
    / sum(rate(http_requests_total{service="checkout"}[5m]))
) > (14.4 * 0.001)
# 0.001 = error budget for a 99.9% SLO
```

### [2] How would you design an observability stack for 40 microservices?
@tags design, observability, architecture
@hook Standardise first: OpenTelemetry everywhere, RED metrics and structured logs by convention, a Collector pipeline, scalable backends, SLOs per service, and templated dashboards and alerts.
@say
"With 40 services, consistency matters more than any single tool choice.

Instrumentation standards: every service uses OpenTelemetry, with automatic instrumentation for HTTP, gRPC, database and messaging libraries, plus a few custom spans and business metrics. Every service exposes RED metrics with the same names and labels, logs structured JSON with trace IDs, and propagates W3C trace context. A shared library or service template makes this the default, so teams get it for free.

Pipeline: OpenTelemetry Collectors as node agents plus a gateway tier, which add Kubernetes metadata, redact sensitive attributes, apply tail sampling to traces, and route data to backends.

Backends: metrics in Prometheus with long-term storage, using Mimir, Thanos or a managed Prometheus service; logs in Loki or a cloud logging service; traces in Tempo, Jaeger or a vendor; and Grafana on top, with links from metrics to traces through exemplars, and from traces to logs through trace IDs. Or one commercial platform if the budget allows and the team prefers less operational work.

What we measure, and why: SLIs and SLOs per user-facing service, with burn-rate alerts that page the owning team; templated RED dashboards per service, generated automatically; USE dashboards for infrastructure; and deploy markers on graphs.

Governance: cardinality limits, sampling and retention policies to control cost, and ownership metadata so every alert routes to the right team."

### [2] What should a good dashboard show?
@tags dashboards, grafana
@hook Start with user-facing health (SLOs and RED), then drill down to dependencies and resources. Every panel should answer a question someone actually asks.
@say
"A good dashboard is designed for a specific audience and question, rather than showing every metric available.

For a service dashboard, I put the most important information at the top: SLO status and remaining error budget, then the RED metrics, request rate, error rate and latency percentiles, p50, p95 and p99, rather than averages, which hide tail latency. Below that, saturation: CPU, memory, connection and thread pools, queue depth. Then dependencies: latency and errors for each downstream call, like the database, cache and other services. And infrastructure details at the bottom, like pod restarts and node health.

Good practices: overlay deployment and config change annotations on graphs, since 'what changed?' is the first question in any incident; use consistent units, colours and time ranges; show thresholds or SLO targets as reference lines; use template variables, like service, namespace and environment, so one dashboard works for every service; link panels to traces, logs and runbooks; and keep dashboards as code in Git, using Grafana provisioning or tools like Grafonnet, so they're reviewed and reproducible.

And I prune: a dashboard with eighty panels gets ignored during an incident, when clarity matters most."

### [1] Synthetic monitoring vs real user monitoring?
@tags synthetic, rum, monitoring
@hook Synthetic: robots test key journeys on a schedule, even at 3 a.m. with no traffic. RUM: measures what real users actually experience.
@say
"Synthetic monitoring runs scripted checks against the system from outside, on a schedule, from multiple locations: a simple uptime ping, an API call that checks the response, or a full browser journey like logging in, searching and adding to the cart. Because it runs continuously, it detects outages even when there's no real traffic, like overnight or in a newly deployed region, tests critical journeys end to end, and gives consistent baselines. It also verifies things like certificate expiry and DNS. The limitation is that it only tests what you scripted, from a few locations.

Real user monitoring collects performance and error data from actual users' browsers or mobile apps: page load times, Core Web Vitals, JavaScript errors and API latency, segmented by country, device, browser and network. It shows the real experience, including problems you'd never script, like a slow CDN edge in one country or a broken browser version.

They complement each other: synthetics for proactive, consistent detection and alerting on critical paths; RUM for understanding real impact and frontend performance. Both feed SLIs for user-facing services."

### [2] What does the Grafana observability stack consist of?
@tags grafana, loki, tempo, mimir
@hook Grafana for visualisation, Prometheus or Mimir for metrics, Loki for logs, Tempo for traces, Alloy or the OTel Collector for collection, with links between them.
@say
"The open-source Grafana stack, often nicknamed LGTM, covers each signal with a horizontally scalable backend that stores data in cheap object storage.

Grafana is the visualisation layer: dashboards, exploration, and alerting across many data sources, not just Grafana's own.

Metrics: Prometheus for collection and short-term storage, with Grafana Mimir as a horizontally scalable, multi-tenant, long-term metrics store that accepts Prometheus remote write.

Logs: Grafana Loki, which indexes labels rather than full text, so it's cost-effective at scale, and queried with LogQL, which feels like PromQL.

Traces: Grafana Tempo, which stores traces cheaply in object storage, looked up by trace ID, with TraceQL for searching, and can generate RED metrics from spans.

Profiles: Grafana Pyroscope for continuous profiling.

Collection: Grafana Alloy, Grafana's distribution of the OpenTelemetry Collector with Prometheus-native features, or the plain OpenTelemetry Collector.

The power is in the correlations: exemplars link a latency spike on a metric to an example trace, traces link to the logs for that request, and logs can link back to traces. It's a strong vendor-neutral option, either self-hosted or as Grafana Cloud."
