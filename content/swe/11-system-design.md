@section sysdesign | System Design Building Blocks
@blurb The Lego bricks of every design round: what each piece does, when to reach for it, and what it costs.

### [1] Vertical vs horizontal scaling?
@tags scaling
@hook Vertical: a bigger machine. Horizontal: more machines. Vertical is simple but has a ceiling; horizontal needs stateless design.
@say
"Vertical scaling, or scaling up, means giving one machine more CPU, memory or faster disks. It's simple, because the code doesn't change, but there's a hard ceiling on machine size, it gets expensive at the top end, and that one machine is still a single point of failure.

Horizontal scaling, or scaling out, means adding more machines and spreading load across them with a load balancer. It has no practical ceiling and improves fault tolerance, since losing one node isn't fatal. But it requires the application to be designed for it: services should be stateless, with session data in a shared store like Redis, and the data layer needs replication or sharding.

In practice I scale the stateless application tier horizontally from the start, since it's cheap with containers and autoscaling, and scale the database vertically for as long as it's reasonable, because sharding a database is a big step."

### [1] What does a load balancer do? Which algorithms are common?
@tags load balancing, availability
@hook Spreads traffic across healthy servers and removes the sick ones. Round robin, least connections, hashing.
@say
"A load balancer sits in front of a group of servers and distributes incoming requests among them. It also runs health checks and stops sending traffic to unhealthy instances, which is how you get high availability. It often terminates TLS, so backend servers don't each manage certificates.

Common algorithms are round robin, which rotates through servers in order; weighted round robin, for servers of different sizes; least connections, which sends each request to the server with the fewest active connections and suits requests with very different durations; and IP or consistent hashing, which sends the same client or key to the same server, useful for caches or sticky sessions.

There are two main types. A layer 4 load balancer routes on IP addresses and ports without looking inside the traffic, so it's very fast and protocol-agnostic. A layer 7 load balancer understands HTTP, so it can route by path, host or header, for example sending /api to one service and /images to another, and do things like rate limiting and authentication. And the load balancer itself must not be a single point of failure, so it runs as a redundant pair or a managed cloud service."

### [1] What is caching, and where can you cache in a system?
@tags caching, performance
@hook Keep a copy of expensive results closer to where they are needed. Cache at every layer, from the browser to the database.
@say
"Caching stores the result of an expensive operation, like a database query, a computation or a remote call, so later requests can reuse it. It cuts latency and reduces load on the backend.

You can cache at many layers. In the browser, using HTTP headers like Cache-Control and ETag. At a CDN, for static assets and even API responses close to users. At the API gateway or reverse proxy. In the application, either in-process memory, which is fastest but per instance, or a distributed cache like Redis or Memcached shared by all instances. And inside the database, which has its own buffer cache.

The hard parts are invalidation and consistency, meaning how stale data is allowed to be, plus choosing what to cache. Good candidates are read-heavy data that changes rarely and is expensive to compute. And every cache needs a TTL, a size limit and an eviction policy, usually LRU."

### [2] Explain the caching strategies: cache-aside, read-through, write-through and write-behind.
@tags caching, consistency
@hook Cache-aside: the app checks the cache then the DB. Write-through: write both now. Write-behind: write the cache now, the DB later.
@say
"Cache-aside, or lazy loading, is the most common. The application checks the cache; on a miss it reads from the database, stores the result in the cache with a TTL, and returns it. On a write, it updates the database and deletes the cache key. It's simple and resilient, because if the cache is down the app still works, but the first request after a miss is slow.

Read-through is similar, but the cache library itself loads from the database on a miss, so the application only talks to the cache.

Write-through writes to the cache and the database at the same time on every write. The cache is always fresh, but writes are slower, and you may cache data nobody reads.

Write-behind, or write-back, writes to the cache immediately and flushes to the database asynchronously in batches. Writes are very fast, but if the cache node dies before flushing, data is lost, so it's only for data that can tolerate that, like view counters.

For invalidation, I prefer deleting the key on writes over updating it, because two concurrent updates can leave a stale value in the cache if they race."
@deep
```python
def get_product(pid):
    key = f"product:{pid}"
    cached = redis.get(key)
    if cached:
        return json.loads(cached)
    product = db.fetch_product(pid)                       # miss
    redis.set(key, json.dumps(product), ex=300)           # TTL 5 min
    return product

def update_product(pid, data):
    db.update_product(pid, data)
    redis.delete(f"product:{pid}")                        # invalidate, don't update
```
Eviction policies: LRU (least recently used), LFU (least frequently used), FIFO, TTL-based. Redis supports several via `maxmemory-policy`.

### [3] What are cache stampedes, hot keys and cache penetration? How do you prevent them?
@tags caching, scale, reliability
@hook Stampede: everyone misses at once. Hot key: one key melts one node. Penetration: requests for things that don't exist bypass the cache.
@say
"A cache stampede, or thundering herd, happens when a popular key expires and thousands of requests miss at the same moment and all hit the database together. I prevent it with request coalescing, where only one request recomputes the value and the others wait for it, using a lock or a single-flight mechanism; with TTL jitter, so keys don't all expire together; and with early refresh, where a background job or a probabilistic early expiry renews hot keys before they expire.

A hot key is a single key so popular that it overloads the one cache node holding it, like a celebrity's profile. Fixes are a small in-process cache in front of Redis for that key, or replicating it under several keys like key-1 to key-10 and reading one at random.

Cache penetration is when requests ask for data that doesn't exist, so the cache never has it and every request hits the database, sometimes as an attack with random IDs. I cache the 'not found' result with a short TTL, validate IDs early, and can use a Bloom filter of existing keys to reject impossible ones."

### [1] What is a CDN, and how does it work?
@tags cdn, performance
@hook Copies of your content on servers close to users. Shorter distance, less origin load, better resilience.
@say
"A CDN, a content delivery network, is a globally distributed set of edge servers that cache content close to users. When a user in Sri Lanka requests an image, DNS or anycast routing sends them to a nearby edge location. If the edge has it cached, it's served in a few milliseconds; if not, the edge fetches it from the origin server once, caches it, and serves later users from the cache.

It cuts latency dramatically, since round trips across continents take over 100 milliseconds, reduces load and bandwidth costs on the origin, and absorbs traffic spikes and DDoS attacks.

CDNs are mainly for static assets like images, video, JavaScript and CSS, but they can also cache API responses and run code at the edge. Caching is controlled by Cache-Control headers. For deploys, I use versioned file names with content hashes, like app.3f9a2c.js, so I can cache them for a year and never need to purge."

### [2] Why use a message queue? Kafka vs RabbitMQ? What delivery guarantees exist?
@tags messaging, kafka, rabbitmq, async
@hook Queues decouple producers from consumers, absorb spikes and enable async work. RabbitMQ routes messages; Kafka keeps a replayable log.
@say
"A message queue lets one service hand work to another asynchronously. The producer doesn't wait for processing and doesn't even need the consumer to be up. That gives decoupling, smoothing of traffic spikes, since the queue buffers bursts, retries for failed work, and fan-out to multiple consumers. Typical uses are sending emails after signup, processing uploads, and propagating events between microservices.

RabbitMQ is a traditional message broker. It has flexible routing with exchanges, and once a consumer acknowledges a message it's removed. It's great for task queues and complex routing. Kafka is a distributed, append-only log. Messages are stored durably for a retention period and consumers track their own offset, so many consumer groups can read the same stream independently and even replay history. It's built for very high throughput event streaming, with ordering guaranteed within a partition.

Delivery guarantees: at-most-once can lose messages; at-least-once never loses them but can deliver duplicates, which is the common practical choice; exactly-once is very hard end to end. So in practice I use at-least-once delivery with idempotent consumers, for example tracking processed message IDs, so a duplicate has no extra effect."
@deep
| | RabbitMQ | Kafka |
|---|---|---|
| Model | Queue with routing (exchanges) | Partitioned, replicated log |
| After consumption | Message removed on ack | Message kept until retention expires |
| Replay | No (by default) | Yes, reset the offset |
| Ordering | Per queue | Per partition |
| Throughput | High | Very high |
| Sweet spot | Task queues, RPC, complex routing | Event streaming, analytics, event sourcing |

Also know: a **dead-letter queue** receives messages that fail repeatedly so they don't block the queue, and **consumer lag** (how far behind consumers are) is the key metric to alert on.

### [2] Monolith vs microservices. When does each make sense?
@tags architecture, microservices
@hook Start with a well-structured monolith. Split into services when team size, scaling or deployment independence force it.
@say
"A monolith is one deployable application containing all the functionality. It's simple to develop, test, deploy and debug, function calls are fast and transactions are easy. The downsides appear at scale: a large codebase where many teams step on each other, long build and deploy cycles, and having to scale everything together.

Microservices split the system into small, independently deployable services, each owning its own data and communicating over the network. Teams can deploy independently, scale services separately and choose different technologies. But you pay a lot: network calls that can fail, distributed transactions, eventual consistency, harder debugging that needs tracing, and serious operational overhead for CI/CD, monitoring and service discovery.

My default for a new product or a small team is a modular monolith: one deployable, but with strong internal module boundaries and no shared tables across modules. Then, when there's a real reason, like a component needing to scale differently, a team needing to deploy independently, or a different reliability requirement, I extract that module into a service along the boundary that already exists."
@trap
Saying microservices are simply "better" or "more scalable." Many companies have publicly moved parts back to monoliths after paying the operational cost.

### [2] What is an API gateway? How does service discovery work?
@tags microservices, api gateway
@hook The gateway is the front door that handles cross-cutting concerns. Discovery is the phone book services use to find each other.
@say
"An API gateway is a single entry point for clients in front of many backend services. It routes requests to the right service and handles cross-cutting concerns in one place: authentication, rate limiting, TLS termination, request logging, caching, and sometimes aggregating calls from several services into one response for mobile clients. Without it, every service would reimplement those, and clients would need to know every service's address. Examples are Kong, AWS API Gateway, Azure API Management, or an Envoy-based gateway.

Service discovery solves how services find each other when instances come and go with autoscaling and deploys. Services register themselves in a registry, and callers look up healthy instances. In Kubernetes, it's built in: a Service gets a stable DNS name like orders.default.svc.cluster.local and a virtual IP that load-balances across healthy pods. Outside Kubernetes, tools like Consul do the same job.

The gateway itself must be highly available and kept thin. If you put business logic in it, it becomes a bottleneck that every team has to change."

### [2] How would you design a rate limiter? Compare the algorithms.
@tags rate limiting, design, redis
@hook Token bucket allows bursts at a steady average. Sliding window counts are precise. Store counters centrally, in Redis, so every instance agrees.
@say
"Rate limiting caps how many requests a client can make in a time window. It protects the system from abuse and overload and enforces fair use. I'd identify clients by API key, user ID or IP, and return 429 Too Many Requests with a Retry-After header when the limit is hit.

The main algorithms: Fixed window counts requests per calendar window, like per minute. It's simple, but allows double the limit at window boundaries. Sliding window log stores every request timestamp, which is precise but memory-heavy. Sliding window counter blends the current and previous window counts weighted by overlap, which is a good, cheap approximation. Token bucket adds tokens at a steady rate up to a maximum, and each request spends one; it allows short bursts while enforcing an average rate, and it's what most APIs use. Leaky bucket processes requests at a constant rate, smoothing output.

In a distributed system with many API servers, the counters must be shared, so I'd keep them in Redis and update them atomically with a Lua script or INCR plus EXPIRE. To avoid a Redis round trip on every request at huge scale, each server can keep a small local allowance and sync periodically, accepting slight inaccuracy. I'd also decide whether to fail open or fail closed if Redis is down; usually fail open, so the limiter doesn't cause an outage."
@deep
```python
import time

class TokenBucket:
    def __init__(self, rate_per_sec, capacity):
        self.rate, self.capacity = rate_per_sec, capacity
        self.tokens, self.last = capacity, time.monotonic()

    def allow(self):
        now = time.monotonic()
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
```
Return headers like `RateLimit-Limit`, `RateLimit-Remaining` and `Retry-After` so well-behaved clients can back off.

### [3] What is consistent hashing, and why is it useful?
@tags distributed systems, hashing, sharding
@hook Put servers and keys on a ring; a key belongs to the next server clockwise. Adding a node moves only about 1/N of the keys.
@say
"With naive hashing, you assign a key to a server with hash of key modulo N. The problem is that when N changes, because you add or remove a server, almost every key maps to a different server. For a cache that means a near-total cache miss storm.

Consistent hashing places both servers and keys on a hash ring. Each key belongs to the first server found going clockwise from the key's position. When a server is added, it only takes over keys from its immediate neighbour; when one is removed, only its keys move to the next server. So on average only 1 over N of the keys move.

To avoid uneven load, since servers might land unevenly on the ring, each physical server gets many virtual nodes at different positions, which spreads keys evenly and also spreads a failed server's load across many others instead of one. It's used in distributed caches, in Cassandra and DynamoDB for partitioning, and in load balancers that need key affinity."

### [1] Stateless vs stateful services. Why do we prefer stateless?
@tags scaling, architecture
@hook A stateless server keeps nothing between requests, so any instance can serve anyone and instances are disposable.
@say
"A stateless service doesn't keep client-specific data in memory between requests. Everything needed comes with the request, like a token, or from a shared store, like a database or Redis. That means any instance can handle any request, so I can add or remove instances freely, load-balance with simple round robin, and lose a server without losing user data.

A stateful service keeps data locally, like in-memory sessions or WebSocket connections. If that instance dies, the state is lost, and you need sticky sessions to route each user back to the same instance, which leads to uneven load and makes deploys and scaling harder.

So I push state out to purpose-built systems: sessions in Redis, files in object storage, and data in the database, and keep the application tier stateless. Some things are inherently stateful, like databases, Kafka brokers and WebSocket gateways, and those need specialised handling, like replication, or StatefulSets in Kubernetes."

### [1] What do availability "nines" mean, and how do you design for high availability?
@tags availability, reliability
@hook 99.9% is about 43 minutes of downtime a month; 99.99% is about 4. Remove single points of failure and fail over automatically.
@say
"Availability is the percentage of time a system is working. Three nines, 99.9 percent, allows about 8.8 hours of downtime a year, or roughly 43 minutes a month. Four nines, 99.99 percent, allows about 52 minutes a year. Each extra nine is roughly ten times harder and more expensive.

Designing for high availability means eliminating single points of failure: multiple instances of every service behind a load balancer, across several availability zones; databases with replicas and automatic failover; health checks that remove bad instances; and no single critical dependency without a fallback.

Also remember that availability multiplies across dependencies. If a request needs five services, each with 99.9 percent availability, the combined availability is about 99.5 percent. That's why I add timeouts, retries, circuit breakers and graceful degradation, like showing cached recommendations if the recommendation service is down, so one failing dependency doesn't take down the whole request."
@deep
| Availability | Downtime per year | Per month |
|---|---|---|
| 99% | 3.65 days | 7.3 hours |
| 99.9% | 8.77 hours | 43.8 minutes |
| 99.95% | 4.38 hours | 21.9 minutes |
| 99.99% | 52.6 minutes | 4.4 minutes |
| 99.999% | 5.26 minutes | 26 seconds |

### [2] Walk me through a back-of-the-envelope estimate.
@tags estimation, system design
@hook Users, actions per user, divide by 10^5 seconds, multiply by a peak factor. Then storage per item times items per year.
@say
"Let's estimate a photo-sharing app with 100 million daily active users. Say each user views 50 photos and uploads 0.1 photos a day.

Reads: 100 million times 50 is 5 billion views a day. A day is roughly 10 to the 5 seconds, so that's about 50,000 reads per second on average. With a peak factor of about 3, around 150,000 per second. That clearly needs a CDN and caching; no single database serves that.

Writes: 100 million times 0.1 is 10 million uploads a day, about 100 per second, maybe 300 at peak. That's modest for metadata writes.

Storage: if an average photo, with a few resized versions, is about 2 megabytes, 10 million a day is 20 terabytes a day, or about 7 petabytes a year. So photos go in object storage like S3, never in the database, and metadata is small, maybe 1 kilobyte per photo, 10 gigabytes a day.

Bandwidth: 5 billion views times, say, 200 kilobytes per displayed image is 1 petabyte a day out, which again says CDN. The point isn't precision; it's that these numbers tell me which components the design needs."

### [3] How do you handle transactions across microservices? 2PC vs Saga, and the outbox pattern.
@tags distributed transactions, saga, outbox, microservices
@hook 2PC locks everyone until all agree, which is fragile. Sagas run local steps with compensations. The outbox makes "save and publish" atomic.
@say
"When an operation spans services with their own databases, like order, payment and inventory, you can't use one ACID transaction.

Two-phase commit uses a coordinator: in the prepare phase every participant votes and locks resources; in the commit phase the coordinator tells them all to commit or abort. It gives atomicity, but it's slow, holds locks across the network, and if the coordinator fails at the wrong time, participants are stuck. It's rarely used between microservices.

The usual answer is a saga: a sequence of local transactions, each publishing an event or command that triggers the next step. If a step fails, earlier steps are undone with compensating actions, like refunding a payment or releasing reserved stock. It can be choreographed, where services react to each other's events, or orchestrated, where a central coordinator tells each service what to do, which is easier to follow for complex flows. The trade-off is eventual consistency and designing compensations carefully.

The transactional outbox pattern solves a related problem: saving to your database and publishing an event must both happen or neither. Instead of publishing directly, the service writes the event to an outbox table in the same local transaction as the business change. A separate relay, polling or using change data capture like Debezium, reads the outbox and publishes to the broker. Combined with idempotent consumers, that gives reliable at-least-once messaging."
@deep
```text
Orchestrated saga for "place order":
  1. Order service:     create order (PENDING)
  2. Payment service:   charge card        -- fail? --> cancel order
  3. Inventory service: reserve stock      -- fail? --> refund payment, cancel order
  4. Order service:     mark CONFIRMED

Outbox (one local transaction):
  BEGIN;
    INSERT INTO orders (...);
    INSERT INTO outbox (event_type, payload) VALUES ('OrderPlaced', '{...}');
  COMMIT;
  -- relay publishes outbox rows to Kafka, marks them sent
```

### [2] What resilience patterns do you use when calling other services?
@tags resilience, retries, circuit breaker
@hook Timeouts always. Retries with exponential backoff and jitter, only for idempotent calls. Circuit breakers stop hammering a dead dependency. Bulkheads contain the blast.
@say
"Every remote call can be slow or fail, so I use a standard set of patterns.

Timeouts on every call, always. Without one, a slow dependency ties up threads until the whole service stalls.

Retries for transient failures, but only for idempotent operations, with exponential backoff, like 100, 200, 400 milliseconds, plus random jitter so thousands of clients don't retry in sync, and a maximum number of attempts. Retries at every layer multiply, so I retry at one layer only.

A circuit breaker tracks failures to a dependency. After too many, it opens and fails fast for a while instead of calling, giving the dependency room to recover. Then it half-opens and lets a few test requests through, and closes if they succeed.

Bulkheads isolate resources, like separate connection pools or thread pools per dependency, so one slow dependency can't consume everything.

And graceful degradation: a fallback like cached data or a default response, so the user gets a reduced experience instead of an error. In .NET, Polly implements all of these; in Java, Resilience4j; and service meshes can apply them at the network level."
@deep
```text
CLOSED  --(failure rate > threshold)-->  OPEN  --(cooldown elapses)-->  HALF-OPEN
   ^                                                                   |
   +-------------------(test requests succeed)-------------------------+
                         (test requests fail) --> back to OPEN
```
@trap
Retrying non-idempotent calls like "charge card" without an idempotency key, or retrying with no backoff, which turns a small blip into a self-inflicted outage (a retry storm).

### [3] What are event sourcing and CQRS?
@tags architecture, event sourcing, cqrs
@hook Event sourcing stores every change as an event and rebuilds state by replaying them. CQRS uses separate models for writes and reads.
@say
"In event sourcing, instead of storing the current state of an entity, you store the full sequence of events that happened to it: AccountOpened, MoneyDeposited, MoneyWithdrawn. The current state is derived by replaying the events, usually with periodic snapshots for speed. You get a complete audit trail, the ability to rebuild state at any point in time, and the ability to create new views of old data. The costs are complexity, event schema versioning, and eventual consistency for the read side.

CQRS, Command Query Responsibility Segregation, separates the write model, which handles commands and enforces business rules, from the read model, which is optimised for queries, often denormalised and stored separately, like in a search index or a reporting database. The read model is updated from the write side's events.

They're often used together, because event sourcing produces exactly the event stream needed to build read models. But each is useful alone, and both add real complexity, so I'd reserve them for domains that genuinely need audit history or very different read and write patterns, like finance, logistics or collaboration tools, not a basic CRUD app."

### [3] How do you generate unique IDs in a distributed system?
@tags distributed systems, ids
@hook Auto-increment needs one coordinator. UUIDs need none but are random. Snowflake-style and UUIDv7 give unique, time-sortable IDs.
@say
"A database auto-increment ID is simple and compact, but it requires a single source, which becomes a bottleneck and a problem across shards, and it leaks business information, like how many orders you have.

UUIDv4 is random, 128 bits, and can be generated anywhere with practically no collision risk. But random IDs scatter inserts across B-tree indexes, which hurts write performance, and they don't sort by time.

Snowflake-style IDs, from Twitter, pack a timestamp, a machine or worker ID, and a per-machine sequence number into 64 bits. They're unique without coordination, roughly time-ordered, and compact. You need to assign worker IDs uniquely and handle clock skew.

UUIDv7, standardised in 2024, puts a millisecond timestamp in the first bits followed by random bits, so you get UUID compatibility plus time ordering and index-friendly inserts. For new systems that's my default unless I need 64-bit IDs. And for public-facing IDs, I avoid exposing sequential numbers that make enumeration easy."

### [2] What should an engineer instrument in a service? Logs, metrics and traces.
@tags observability
@hook Metrics tell you something is wrong, traces tell you where, logs tell you why. Correlate them with one request ID.
@say
"I instrument three kinds of signals.

Metrics are cheap numeric time series for dashboards and alerts. For a service I always have the RED metrics: request rate, error rate and duration as a histogram, so I can see p50, p95 and p99 latency, plus saturation like CPU, memory, queue depth and pool usage.

Logs are detailed event records for debugging. I use structured JSON logs with consistent fields, like timestamp, level, service, request ID and user ID, never log secrets or personal data, and log at the right level so the important lines aren't buried.

Traces follow a single request across services as a tree of spans with timings, which shows exactly where time goes in a distributed call chain.

The glue is correlation: a trace ID that's propagated across service calls and included in every log line, so I can jump from a latency spike in a metric, to a slow trace, to the exact log lines for that request. I'd instrument with OpenTelemetry, which is the vendor-neutral standard, so the backend can be Prometheus and Grafana, Datadog or anything else."

### [2] How would you handle file uploads in a scalable system?
@tags storage, s3, design
@hook Don't stream big files through your API servers. Hand out a pre-signed URL so the client uploads straight to object storage.
@say
"For anything beyond small files, I keep large binary data out of both the application servers and the database.

The flow: the client asks my API for permission to upload, with the file name, size and type. The API validates that, creates a metadata record in the database with status pending, and returns a pre-signed URL for object storage like S3, Azure Blob Storage or Google Cloud Storage. That URL is time-limited and only allows uploading that one object. The client uploads directly to object storage, so my servers don't carry the bandwidth. For big files I'd use multipart uploads so they can resume after failures.

When the upload completes, an event from the storage service, or a callback from the client, triggers post-processing through a queue: virus scanning, generating thumbnails, transcoding video, and marking the record as ready. Downloads go through a CDN, with signed URLs if the content is private. This scales well because object storage and the CDN do the heavy lifting."

### [2] How does full-text search work? Why not just use LIKE?
@tags search, inverted index, elasticsearch
@hook An inverted index maps each word to the documents that contain it, then ranks matches by relevance. LIKE '%word%' scans everything and can't rank.
@say
"LIKE with a leading wildcard can't use a normal index, so it scans every row, and it has no idea about relevance, word forms or typos.

Search engines like Elasticsearch, OpenSearch or Lucene build an inverted index. At indexing time, each document's text goes through an analysis pipeline: tokenising into words, lowercasing, removing stop words, and stemming, so 'running' and 'runs' both become 'run'. The index then maps each term to the list of documents containing it, with positions and frequencies.

At query time, the query goes through the same analysis, the engine looks up each term's document list, intersects or unions them, and ranks results by a relevance score, typically BM25, which rewards terms that are frequent in the document but rare across the collection. It also supports fuzzy matching for typos, phrase queries, filters and facets.

For moderate needs, Postgres full-text search with a GIN index is often enough. And today many search systems are hybrid, combining keyword BM25 with vector similarity search on embeddings, so they match both exact terms and meaning."

### [3] What is leader election and consensus? How does Raft work at a high level?
@tags distributed systems, consensus, raft
@hook Consensus lets a cluster agree on one value or log despite failures. Raft elects a leader by majority vote, and the leader replicates a log that commits once a majority has it.
@say
"In a distributed system, nodes need to agree on things, like who the leader is or the order of writes, even when some nodes crash or messages are delayed. Consensus algorithms like Paxos and Raft solve that, as long as a majority of nodes are up and can talk to each other.

Raft splits it into leader election and log replication. Nodes start as followers. If a follower doesn't hear a heartbeat from a leader within a randomised timeout, it becomes a candidate, increments the term number and asks others for votes. A candidate that gets votes from a majority becomes leader for that term. The randomised timeouts make split votes rare.

The leader accepts all writes, appends them to its log and replicates them to followers. An entry is committed once a majority has stored it, and only then is it applied and acknowledged. Because any two majorities overlap, a new leader always has every committed entry.

That's why clusters use odd numbers like 3 or 5 nodes: 3 nodes tolerate 1 failure, 5 tolerate 2. etcd, which stores all of Kubernetes' state, and Consul use Raft, and Kafka now uses it too in KRaft mode, replacing ZooKeeper."
