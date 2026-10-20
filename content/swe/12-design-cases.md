@section sdcases | System Design Case Studies
@blurb Full walkthroughs of the prompts that come up again and again. Learn the shape, then practise driving it yourself.

### [2] Design a URL shortener like bit.ly.
@tags system design, case study, hashing, caching
@hook Read-heavy key-value lookup. Generate short unique keys, store key to URL, cache hot links, redirect fast.
@say
"Requirements first. Functional: create a short link for a long URL, optionally with a custom alias and expiry, and redirect short links to the original. Non-functional: redirects must be very fast and highly available, and links must never collide. It's heavily read-dominated, maybe 100 reads per write.

Estimates: say 100 million new links a month, about 40 writes a second, and 4,000 redirects a second on average. Over 5 years that's 6 billion links. With base62 characters, 7 characters give 62 to the 7th, about 3.5 trillion combinations, which is plenty.

API: POST /urls with the long URL returns the short code; GET /{code} returns a 301 or 302 redirect. I'd use 302 if we want analytics on every click, since browsers cache 301s.

Key generation is the core decision. Hashing the URL and truncating risks collisions. I prefer a unique numeric ID encoded in base62. To avoid one counter becoming a bottleneck, each app server reserves ranges of IDs, say 1,000 at a time, from a central counter in a database or ZooKeeper, then hands them out locally.

Storage is a simple key-value mapping, code to long URL plus metadata, so a key-value store like DynamoDB or Cassandra, or Postgres with an index on code at this scale. Redirects go through a Redis cache, since a small fraction of links get most of the traffic, and a CDN can cache redirects too. Click analytics are written asynchronously to a queue, so they never slow down the redirect."
@deep
```text
Client -> CDN -> Load balancer -> Redirect service -> Redis (hot codes)
                                         |                 | miss
                                         v                 v
                                   Kafka (clicks)     URL store (code -> url)
                                         v
                                   Analytics workers -> warehouse

Create: API -> ID range allocator -> base62(id) -> URL store
```
```python
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
def base62(n):
    s = []
    while n:
        n, r = divmod(n, 62)
        s.append(ALPHABET[r])
    return "".join(reversed(s)) or "0"
```
Extras worth mentioning: custom aliases need a uniqueness check; expiry via TTL and a cleanup job; abuse protection (rate limits, malware URL scanning); sequential IDs are guessable, so shuffle or encrypt the ID if that matters.
@follow How would you prevent the same long URL from getting many short codes?
Optionally store a hash of the long URL with a unique index and return the existing code. Many products deliberately allow duplicates, since different users want separate analytics.

### [2] Design a notification system (email, SMS, push).
@tags system design, case study, queues
@hook Accept fast, queue everything, fan out per channel with retries, respect user preferences and rate limits, track delivery.
@say
"Requirements: other services send notifications through one API, delivered by email, SMS or mobile push; users control preferences and opt-outs; notifications can be immediate or scheduled; delivery must be reliable with retries, without spamming duplicates.

The notification service exposes an API like POST /notifications with the user, a template ID, data and priority. It validates the request, checks the user's preferences and opt-outs, renders the template, and writes a notification record with status queued. Then it publishes to a queue per channel, so a slow email provider can't block push notifications.

Channel workers consume from their queue and call third-party providers: an email provider like SES or SendGrid, an SMS provider like Twilio, and Apple and Google push services. They retry failures with exponential backoff, move persistent failures to a dead-letter queue, and can fail over to a backup provider. Each notification has an idempotency key, so retries don't send duplicates.

I'd add rate limiting per user, so nobody gets 50 pushes an hour, priority queues so password resets jump ahead of marketing, a scheduler for delayed sends, and delivery tracking through provider webhooks for delivered, bounced and opened, which also feeds analytics. Device tokens and contact details live in a user profile store."
@deep
```text
Services -> Notification API -> preference check -> template render -> DB (status)
                                       |
                    +------------------+------------------+
                    v                  v                  v
               email queue         sms queue         push queue
                    v                  v                  v
             email workers        sms workers        push workers (APNs, FCM)
                    \__________ retries, DLQ, provider failover __________/
                                       v
                          provider webhooks -> status updates, analytics
```

### [2] Design search autocomplete (typeahead).
@tags system design, case study, trie, caching
@hook Precompute the top suggestions for every prefix offline, serve them from memory in milliseconds, refresh periodically.
@say
"Requirements: as the user types, return the top 5 to 10 suggestions for the current prefix, ranked by popularity, within about 100 milliseconds. Suggestions can be a little stale.

The key insight is to do the heavy work offline. A data pipeline aggregates search logs, say over the last week with recent searches weighted higher, and counts query frequencies. Then it builds a trie where every node stores the precomputed top-k completions for that prefix. Lookups become: walk to the prefix's node and return its list, which is O(length of prefix) with no ranking at query time.

Serving: the trie is loaded into memory on a fleet of suggestion servers, sharded by prefix range if it's too big for one machine, with replicas for availability. Results for short, popular prefixes are cached at the CDN and in the browser. On the client, I'd debounce keystrokes, around 100 to 200 milliseconds, and cancel outdated requests.

Updates: rebuild the trie every hour or day and swap it in atomically. For trending queries, a separate real-time stream can boost new terms. I'd also filter offensive or unsafe suggestions before they're published, and personalise by blending in the user's own recent searches on the client."

### [3] Design a chat application like WhatsApp.
@tags system design, case study, websockets, messaging
@hook Persistent connections via a gateway, a message service that stores then routes, offline delivery, receipts, and partitioning by conversation.
@say
"Requirements: one-to-one and group chat, delivery to online users in real time, offline users get messages when they reconnect, delivery and read receipts, message history across devices. Non-functional: low latency, messages never lost, ordering within a conversation.

Clients keep a persistent WebSocket connection to a chat gateway. Gateways are stateful, so I keep a presence and session registry in Redis mapping user ID to the gateway currently holding their connection.

When Alice sends a message to Bob: her gateway forwards it to the message service, which assigns a message ID and a per-conversation sequence number, persists it, and acknowledges to Alice, showing one tick. Persisting before routing is what guarantees no loss. Then it looks up Bob's gateway in the registry and pushes the message there. If Bob is online, his device receives it and sends a delivery receipt, two ticks. If he's offline, the message waits in storage and a push notification is sent; when he reconnects, his client syncs everything after the last sequence number it has.

Storage is write-heavy and accessed by conversation and time, so a wide-column store like Cassandra, partitioned by conversation ID and clustered by sequence number, fits well. For groups, the service fans out to each member's gateway; for very large groups, fan-out goes through a queue. End-to-end encryption, like the Signal protocol, means the server only stores ciphertext. Media goes to object storage, and messages just carry a reference."
@deep
```text
Alice --ws--> Gateway A --> Message service --> Message store (Cassandra: conv_id, seq)
                                 |   \--> Kafka (fan-out, push notifications)
                                 v
                        Session registry (Redis: user -> gateway)
                                 v
Bob <--ws-- Gateway B <----------+
```
Ordering: per-conversation sequence numbers from the message service (or the partition owner) give a total order inside each chat, which is all users need.
@follow How do you handle a user on several devices?
Each device has its own connection and a last-synced sequence number. The registry maps a user to all active device sessions, and each device syncs independently. With end-to-end encryption, messages are encrypted per device.

### [3] Design a news feed like Twitter or Instagram.
@tags system design, case study, fan-out, caching
@hook Fan-out on write for normal users, fan-out on read for celebrities, precomputed feeds in a cache, ranking on top.
@say
"Requirements: users post, follow others, and see a feed of posts from people they follow, newest or ranked first. It's extremely read-heavy, and the feed must load fast; it can be a few seconds stale.

The central decision is when to build feeds. Fan-out on write, or push: when someone posts, write the post ID into each follower's precomputed feed list, stored in Redis. Reading a feed is then one fast lookup. The problem is celebrities: a post from an account with 100 million followers means 100 million writes.

Fan-out on read, or pull: build the feed at read time by fetching recent posts from everyone the user follows and merging them. No write amplification, but reads are slow and expensive.

So I'd use a hybrid. Normal users' posts are pushed to followers' feeds asynchronously through a queue. Posts from accounts above a follower threshold aren't pushed; at read time, the feed service merges the user's precomputed feed with recent posts from the celebrities they follow.

Storage: posts in a sharded database or wide-column store keyed by post ID, the follow graph in its own store, media in object storage behind a CDN, and feeds as capped lists in Redis holding only the latest few hundred post IDs. The feed endpoint hydrates IDs into full posts from a post cache. Ranking, if needed, is a separate step: fetch candidates, score them with a model using engagement signals, and return the top ones, with cursor pagination for scrolling."
@deep
```text
POST /posts -> Post service -> Post DB + object storage (media)
                     \-> Kafka "post_created" -> Fan-out workers
                               (skip if author followers > threshold)
                               -> Redis feed:{follower_id} (LPUSH, LTRIM 0 799)

GET /feed -> Feed service -> Redis feed:{user} (post IDs)
                         + recent posts from followed celebrities (pull)
                         -> merge, rank -> hydrate from post cache -> response
```

### [3] Design a file storage and sync service like Dropbox or Google Drive.
@tags system design, case study, storage, sync
@hook Split files into content-hashed chunks, upload only changed chunks to object storage, keep metadata separate, notify other devices.
@say
"Requirements: upload and download files of any size, sync changes across a user's devices, share files, and keep version history. Non-functional: never lose data, use bandwidth efficiently, handle large files and flaky connections.

The key idea is chunking. The client splits each file into chunks of a few megabytes and computes a hash of each chunk. Chunks are stored in object storage keyed by their hash, and a file version is just an ordered list of chunk hashes. That gives three wins: resumable uploads, since only missing chunks are retried; delta sync, since editing a large file only uploads the changed chunks; and deduplication, since identical chunks are stored once.

The flow: the client asks the metadata service which chunks it needs to upload, uploads those directly to object storage through pre-signed URLs, then commits a new file version to the metadata service. Metadata, meaning files, folders, versions, chunk lists, sharing permissions and the user's change journal, lives in a strongly consistent relational database, sharded by user or workspace.

For sync, each device keeps a cursor into the user's change journal. A notification service holds long-poll or WebSocket connections and tells devices 'something changed'; the device then pulls changes since its cursor and downloads the needed chunks. Conflicts, where two devices edit the same file offline, are handled by keeping both and creating a 'conflicted copy', which is simple and never loses data."

### [3] Design a ride-hailing service like Uber.
@tags system design, case study, geospatial, matching
@hook Drivers stream locations into a geo index, riders query nearby drivers, a matching service assigns and locks one, trips are a state machine.
@say
"Requirements: riders request a ride and see an ETA and price; nearby drivers are matched; both see live locations during the trip; payment at the end. Non-functional: low-latency matching, high availability, and a very high volume of location updates.

Location updates are the big load. Say 1 million active drivers sending GPS every 4 seconds is 250,000 writes a second. These don't need durable storage per point, so they go into an in-memory geospatial index. I'd divide the map into cells using geohash or a hexagonal grid like Uber's H3, and keep, per cell, the set of available drivers, in Redis or in-memory location servers sharded by region.

When a rider requests a ride, the matching service looks up drivers in the rider's cell and neighbouring cells, ranks them by ETA from a routing service rather than straight-line distance, and offers the trip to the best driver. The offer must be exclusive, so the matching service atomically marks the driver as reserved with a short timeout; if the driver declines or doesn't answer, it moves to the next candidate.

The trip itself is a state machine, requested, accepted, arrived, in progress, completed, stored durably in a database, with every transition recorded as an event. During the trip, locations flow over WebSockets to both apps. Pricing, including surge based on supply and demand per cell, and payments are separate services consuming trip events. Everything is partitioned by city or region, since rides are local, which also limits the blast radius of failures."

### [3] Design a ticket booking system like Ticketmaster.
@tags system design, case study, concurrency, inventory
@hook The hard part is contention: hold seats with a short-lived reservation, confirm on payment, and put a virtual queue in front of hot events.
@say
"Requirements: browse events, view a seat map, pick seats, pay, and receive tickets. The non-negotiable rule is that a seat is never sold twice. And popular on-sales bring huge spikes, millions of users in the first minute for very little inventory.

Booking is a two-step reservation. When a user selects seats, I place a temporary hold, say 10 minutes. The hold must be atomic: a conditional update like 'set status to held, held_by user, expires_at now plus 10 minutes, where status is available', and if zero rows change, someone else got there first. Alternatively a Redis lock per seat with a TTL, but the database stays the source of truth. Payment goes through the payment provider with an idempotency key, and on success the seats move from held to sold in a transaction. Expired holds are released by a background job or lazily on read.

For the spike, I protect the core with a virtual waiting room. Users enter a queue and are admitted in batches at a rate the booking system can handle, which turns a stampede into a steady flow and is fairer than whoever refreshes fastest. Seat maps and event details are cached heavily and served from a CDN, with availability updated every few seconds rather than live.

Data model: events, venues, seats and a seat_inventory table per event with status, hold owner, hold expiry and a version number. Bot protection, rate limits per account and purchase limits per user round it out."
@deep
```sql
-- Hold seats atomically: succeeds only if every seat is still free
UPDATE seat_inventory
SET status = 'HELD', held_by = :user, hold_expires_at = now() + interval '10 minutes'
WHERE event_id = :event AND seat_id = ANY(:seats) AND status = 'AVAILABLE';
-- Check affected rows == number of requested seats, otherwise roll back
```
