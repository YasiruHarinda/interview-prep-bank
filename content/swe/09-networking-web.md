@section net | Networking and the Web
@blurb From typing a URL to a rendered page: protocols, APIs, auth and the status codes everyone mixes up.

### [1] What happens when you type a URL into the browser and press Enter?
@tags networking, classic, dns, http
@hook Parse, DNS, TCP, TLS, HTTP request, server work, response, render. Go as deep as they let you.
@say
"First the browser parses the URL into scheme, host, path and query, and checks its caches, including HSTS, which can force HTTPS.

Then it resolves the domain to an IP address with DNS: browser cache, OS cache, then a recursive resolver, which asks the root servers, then the top-level domain servers like .com, then the domain's authoritative name server, and caches the answer for its TTL.

Next it opens a connection: a TCP three-way handshake, SYN, SYN-ACK, ACK, to port 443, then a TLS handshake where the server proves its identity with a certificate and both sides agree on encryption keys. With HTTP/3 this happens over QUIC on UDP, combining the transport and TLS handshakes.

Then the browser sends an HTTP GET request with headers like Host, cookies and Accept. On the server side, it typically hits a CDN or load balancer, then a web server or reverse proxy, then the application, which may query caches and databases and builds a response.

The response comes back with a status code, headers and HTML. The browser parses the HTML into the DOM and the CSS into the CSSOM, fetches sub-resources like scripts, styles and images, often in parallel over the same HTTP/2 connection, runs JavaScript, then does layout and paint to show the page."
@deep
```text
URL -> HSTS/cache check -> DNS (browser > OS > resolver > root > TLD > authoritative)
    -> TCP handshake (SYN, SYN-ACK, ACK) -> TLS 1.3 handshake (1 round trip)
    -> HTTP request -> CDN / load balancer -> reverse proxy -> app -> cache / DB
    -> HTTP response -> parse HTML (DOM) + CSS (CSSOM) -> render tree
    -> layout -> paint -> composite -> JS runs, more requests
```
Places to add depth if the interviewer is interested: DNS record types and TTLs, how TLS certificates are validated, keep-alive and connection reuse, CDN cache hits, the critical rendering path and why scripts block parsing (`defer`, `async`).
@pro
Ask "which layer would you like me to go deeper on?" This question has no bottom, and steering it toward your strengths is part of the test.

### [1] What are the OSI and TCP/IP models?
@tags networking, layers
@hook Seven OSI layers in theory, four TCP/IP layers in practice. Know where HTTP, TCP, IP and Ethernet sit.
@say
"They're models for splitting networking into layers, where each layer relies on the one below.

The OSI model has seven: physical, data link, network, transport, session, presentation and application. The TCP/IP model, which is what the internet actually uses, collapses them into four: link, internet, transport and application.

In practice I think in terms of: Ethernet and Wi-Fi at the link layer with MAC addresses; IP at the network layer, which handles addressing and routing between networks; TCP and UDP at the transport layer, which handle ports, and for TCP, reliability; and application protocols like HTTP, DNS and SMTP on top, with TLS sitting between transport and application.

The model is useful for debugging. 'Is it layer 3 or layer 7?' is a real question: can I ping the host at all, versus is the HTTP request getting a 500 back. And load balancers are described this way too: a layer 4 load balancer routes on IP and port, a layer 7 one routes on HTTP paths and headers."
@deep
| OSI layer | TCP/IP layer | Examples | Debug with |
|---|---|---|---|
| 7 Application, 6 Presentation, 5 Session | Application | HTTP, DNS, TLS, SSH, gRPC | curl, dig, browser devtools |
| 4 Transport | Transport | TCP, UDP, QUIC | ss, netstat, nc |
| 3 Network | Internet | IP, ICMP, routing | ping, traceroute, ip route |
| 2 Data link | Link | Ethernet, Wi-Fi, ARP, MAC | arp, ip link |
| 1 Physical | Link | Cables, radio | Is it plugged in? |

### [1] TCP vs UDP?
@tags networking, tcp, udp
@hook TCP: reliable, ordered, connection-based, slower. UDP: fire-and-forget datagrams, fast, no guarantees.
@say
"TCP is connection-oriented. It sets up a connection with a handshake, then guarantees delivery and order using sequence numbers, acknowledgements and retransmissions. It also does flow control, so a fast sender doesn't overwhelm a slow receiver, and congestion control, so it backs off when the network is busy. That reliability costs latency and overhead. It's used for web traffic, APIs, databases, email and file transfer.

UDP is connectionless. It just sends datagrams with no handshake, no acknowledgements, no ordering and no retransmission. Packets can be lost, duplicated or arrive out of order. But it's fast and lightweight, and there's no head-of-line blocking, where one lost packet stalls everything behind it. It's used where speed matters more than perfection, or where the application handles reliability itself: video calls, online games, DNS lookups, and QUIC, which is the transport under HTTP/3."
@deep
| | TCP | UDP |
|---|---|---|
| Connection | Yes (handshake) | No |
| Delivery | Guaranteed, ordered | Best effort |
| Header | 20+ bytes | 8 bytes |
| Flow / congestion control | Yes | No (app must handle it) |
| Use cases | HTTP/1.1, HTTP/2, databases, SSH | DNS, video, VoIP, games, QUIC |

### [1] Explain the TCP three-way handshake and connection teardown.
@tags tcp, handshake
@hook SYN, SYN-ACK, ACK to open. FIN and ACK from each side to close.
@say
"To open a connection, the client sends a SYN with its initial sequence number. The server replies with a SYN-ACK, acknowledging the client's number and sending its own initial sequence number. The client replies with an ACK. Now both sides have agreed on sequence numbers and the connection is established. It costs one round trip before any data flows, which is why connection reuse with keep-alive and connection pooling matters so much for performance.

To close, each side shuts down its direction independently. One side sends FIN, the other ACKs it, then the other side sends its own FIN and gets an ACK, so usually four segments. The side that closed first waits in TIME_WAIT for a while, to make sure delayed packets from the old connection don't confuse a new one. On busy servers that open lots of short outbound connections, piles of TIME_WAIT sockets can exhaust ports, which is another reason to pool connections."
@follow Why three steps and not two?
Both sides need to know that the other can send and receive, and both initial sequence numbers need to be acknowledged. Two steps would leave the server unsure that the client received its sequence number.

### [1] What are the main HTTP methods? What do safe and idempotent mean?
@tags http, rest
@hook Safe: doesn't change anything. Idempotent: doing it twice equals doing it once. GET is both, POST is neither.
@say
"GET retrieves a resource. POST creates a resource or triggers a process. PUT replaces a resource entirely at a known URL. PATCH partially updates a resource. DELETE removes it. HEAD is like GET without the body, and OPTIONS asks what's allowed, which browsers use for CORS preflight requests.

A safe method doesn't change server state: GET, HEAD and OPTIONS. An idempotent method has the same effect whether you call it once or ten times: GET, PUT and DELETE are idempotent. Deleting something twice leaves it deleted; putting the same full representation twice leaves the same state. POST isn't idempotent: sending 'create order' twice creates two orders. PATCH may or may not be, depending on the operation; 'set the name to Bob' is, 'increment the counter' isn't.

This matters for retries. Clients, proxies and load balancers can safely retry idempotent requests after a timeout. For POST, you need an idempotency key, so the server can recognise and ignore a duplicate."
@deep
| Method | Safe | Idempotent | Typical response |
|---|---|---|---|
| GET | Yes | Yes | 200 |
| POST | No | No | 201 Created + Location header |
| PUT | No | Yes | 200 or 204 |
| PATCH | No | Not guaranteed | 200 or 204 |
| DELETE | No | Yes | 204 |

### [1] What do the HTTP status code classes mean? Which ones are commonly confused?
@tags http, status codes
@hook 2xx worked, 3xx go elsewhere, 4xx you messed up, 5xx we messed up. Know 401 vs 403 and 502 vs 503 vs 504.
@say
"1xx is informational, 2xx is success, 3xx is redirection, 4xx is a client error and 5xx is a server error.

The common ones: 200 OK, 201 Created, 204 No Content; 301 permanent redirect and 302 or 307 temporary; 304 Not Modified for caching; 400 Bad Request for invalid input; 404 Not Found; 409 Conflict, for example a version clash; 422 for semantically invalid data; 429 Too Many Requests for rate limiting; and 500 Internal Server Error.

The pairs people mix up: 401 Unauthorized actually means unauthenticated, as in 'I don't know who you are, log in', while 403 Forbidden means 'I know who you are, and you're not allowed'. And at a gateway or load balancer: 502 Bad Gateway means the upstream returned an invalid response or refused the connection, 503 Service Unavailable means it's overloaded or in maintenance, often with Retry-After, and 504 Gateway Timeout means the upstream didn't respond in time."
@deep
| Code | Meaning | Typical cause |
|---|---|---|
| 301 / 308 | Moved permanently | Domain or URL change (308 keeps the method) |
| 302 / 307 | Temporary redirect | Login redirect (307 keeps the method) |
| 304 | Not modified | ETag / If-None-Match cache hit |
| 400 | Bad request | Malformed JSON, failed validation |
| 401 | Not authenticated | Missing or expired token |
| 403 | Not authorised | Valid user, wrong permissions |
| 404 | Not found | Wrong ID or route |
| 409 | Conflict | Duplicate, stale version |
| 429 | Too many requests | Rate limit hit |
| 500 | Server error | Unhandled exception |
| 502 | Bad gateway | Upstream crashed or refused the connection |
| 503 | Unavailable | Overloaded, no healthy backends |
| 504 | Gateway timeout | Upstream too slow |

### [2] What are the differences between HTTP/1.1, HTTP/2 and HTTP/3?
@tags http, performance, quic
@hook 1.1: one request at a time per connection. 2: many streams multiplexed over one TCP connection. 3: the same over QUIC on UDP, no TCP head-of-line blocking.
@say
"HTTP/1.1 is text-based and handles one request at a time per connection. Browsers worked around that by opening around six connections per domain, and developers used hacks like bundling files and domain sharding.

HTTP/2 is binary and multiplexes many requests as parallel streams over a single TCP connection. It also compresses headers with HPACK and supports stream prioritisation. The remaining problem is TCP head-of-line blocking: if one TCP packet is lost, every stream on that connection waits for the retransmission.

HTTP/3 runs over QUIC, which is built on UDP. QUIC implements reliability per stream, so a lost packet only stalls its own stream. It also merges the transport and TLS 1.3 handshakes, so a new connection takes one round trip, or zero with resumption, and connections survive network changes, like switching from Wi-Fi to mobile data, because they're identified by a connection ID rather than the IP and port. It helps most on lossy mobile networks."

### [2] How does HTTPS work? Walk me through the TLS handshake.
@tags tls, https, security
@hook Asymmetric crypto to prove identity and agree on a key; fast symmetric crypto for the actual data.
@say
"HTTPS is HTTP over TLS. TLS provides three things: encryption, so no one can read the traffic; integrity, so no one can tamper with it; and authentication, so you know you're talking to the real server.

In a TLS 1.3 handshake, the client sends a ClientHello with the TLS versions and cipher suites it supports, plus its key share for a Diffie-Hellman key exchange. The server replies with a ServerHello choosing the cipher and sending its own key share. Both sides can now derive the same shared secret without ever sending it. The server also sends its certificate and a signature proving it owns the certificate's private key.

The client validates the certificate: it checks that it's signed by a trusted certificate authority through a chain up to a root in its trust store, that it hasn't expired or been revoked, and that the domain name matches. Then both sides switch to fast symmetric encryption, usually AES-GCM or ChaCha20, with keys derived from the shared secret. TLS 1.3 does all this in one round trip, and because the key exchange uses fresh ephemeral keys, it has forward secrecy: stealing the server's private key later doesn't decrypt old recorded traffic."
@follow What is mTLS?
Mutual TLS: the client also presents a certificate and the server verifies it. It's used for service-to-service authentication, often handled automatically by a service mesh.
@trap
Saying "the server encrypts the data with its private key." The certificate key is for proving identity; the data is encrypted with symmetric session keys.

### [1] How does DNS work?
@tags dns, networking
@hook The internet's phone book, cached at every level: browser, OS, resolver, then root, TLD and the authoritative server.
@say
"DNS translates names like example.com into IP addresses. When I look up a name, the browser and operating system check their caches first. If there's no answer, the query goes to a recursive resolver, usually run by the ISP or a public service like 1.1.1.1 or 8.8.8.8.

The resolver asks a root server, which points it to the servers for the top-level domain, like .com. The TLD servers point it to the domain's authoritative name servers, which return the actual record. The resolver caches the answer for the record's TTL and returns it.

The common record types are A for IPv4, AAAA for IPv6, CNAME for an alias to another name, MX for mail servers, TXT for verification and email security like SPF and DKIM, and NS for the name servers. TTLs matter operationally: before migrating a service, you lower the TTL so the change propagates quickly. And 'it's always DNS' is a running joke in operations for a reason: caching makes DNS problems slow to appear and slow to clear."

### [1] What is REST, and what makes an API well designed?
@tags rest, api design
@hook Resources as nouns, HTTP verbs as actions, stateless requests. Then consistency, versioning, pagination and clear errors.
@say
"REST is an architectural style where you model the system as resources identified by URLs, and manipulate them with standard HTTP methods. Requests are stateless, meaning each one carries everything needed, like an auth token, so any server can handle it. Responses can be cached, and the interface is uniform.

For good API design I follow a few rules. Use plural nouns for resources, like /orders and /orders/123, and let the method be the verb, so no /getOrder. Nest only for clear ownership, like /orders/123/items. Return the right status codes and a consistent error format with a machine-readable code and a human message. Support pagination, filtering and sorting on collections. Version the API, usually in the URL like /v1, and never break existing clients. Make writes safe to retry with idempotency keys. And document it with OpenAPI so clients can generate code."
@deep
```http
GET    /v1/orders?status=paid&limit=20&cursor=eyJpZCI6MTIzfQ
POST   /v1/orders                 Idempotency-Key: 8f1c...
GET    /v1/orders/123
PATCH  /v1/orders/123             {"status": "cancelled"}
DELETE /v1/orders/123

HTTP/1.1 422 Unprocessable Content
{ "error": { "code": "INVALID_QUANTITY", "message": "Quantity must be at least 1", "field": "items[0].quantity" } }
```

### [2] REST vs GraphQL vs gRPC. When would you choose each?
@tags api design, graphql, grpc
@hook REST: simple, cacheable, universal. GraphQL: clients ask for exactly what they need. gRPC: fast, typed, service-to-service.
@say
"REST is the default for public APIs. It's simple, uses standard HTTP, works with every tool and benefits from HTTP caching. The downsides are over-fetching, getting fields you don't need, and under-fetching, needing several calls to assemble one screen.

GraphQL exposes a single endpoint with a typed schema, and the client sends a query describing exactly the fields it wants, even across related objects, in one request. That's great for complex frontends and mobile apps with varied data needs. The costs are harder caching, the risk of expensive queries that need depth and complexity limits, and N+1 query problems on the server that need batching with something like DataLoader.

gRPC uses Protocol Buffers, a compact binary format, over HTTP/2, with code generated from a strict contract. It's fast, strongly typed and supports streaming in both directions, which makes it ideal for internal service-to-service communication. Browser support needs a proxy, and binary payloads are harder to debug by eye.

My usual pattern: REST or GraphQL at the edge for clients, gRPC between internal services where performance matters."

### [2] WebSockets vs Server-Sent Events vs long polling?
@tags realtime, websockets
@hook WebSockets: full-duplex, both sides talk. SSE: server pushes over plain HTTP. Long polling: the fallback that fakes push.
@say
"All three let the server push updates to clients.

Long polling is the oldest trick: the client sends a request and the server holds it open until there's new data or a timeout, then the client immediately sends another. It works everywhere but has overhead for every message.

Server-Sent Events keep one HTTP response open and the server streams events down it. It's one-way, server to client, text-based, built into browsers with automatic reconnection, and works through most proxies. It's perfect for notifications, live dashboards and streaming LLM tokens, which is exactly what most AI chat APIs use.

WebSockets upgrade an HTTP connection into a persistent, full-duplex channel where both sides can send messages at any time with low overhead. It's the choice for chat, multiplayer games and collaborative editing.

The trade-off with WebSockets is operational: connections are long-lived and stateful, so you need sticky routing or a pub/sub backbone like Redis so a message published on one server reaches clients connected to another."

### [2] What is CORS, and why does it exist?
@tags security, browser, cors
@hook The browser blocks cross-origin reads unless the server explicitly opts in with headers. It protects users, not servers.
@say
"Browsers enforce the same-origin policy: a script from one origin, meaning scheme plus host plus port, can't read responses from another origin. That stops a malicious site from using your logged-in browser to read your bank's API.

CORS, Cross-Origin Resource Sharing, is how a server opts in to allowing specific other origins. The server responds with headers like Access-Control-Allow-Origin naming the allowed origin. For non-simple requests, like those with a JSON content type, custom headers or methods such as PUT and DELETE, the browser first sends a preflight OPTIONS request asking for permission, and only sends the real request if the server approves.

Two things people get wrong. First, CORS is enforced by the browser, not the server, so it's not an API security mechanism: curl or a backend can call the API regardless. Second, you can't combine a wildcard origin with credentials like cookies; you must name the exact origin. When I see a CORS error, I fix the server's headers, not the frontend."

### [1] Cookies vs sessions vs JWTs?
@tags auth, sessions, jwt
@hook Sessions: the server remembers you, and the cookie holds an ID. JWTs: the token carries signed claims, so the server remembers nothing.
@say
"A cookie is just a small piece of data the browser stores and sends automatically with requests to the matching domain. It's a transport mechanism.

With server-side sessions, after login the server creates a session record in memory or Redis and gives the browser a cookie containing only a random session ID. Each request, the server looks up the session. It's easy to revoke, since you delete the record, but it needs shared session storage when you have many servers.

A JWT, a JSON Web Token, is a self-contained token: a JSON payload with claims like user ID, roles and expiry, signed by the server. Any service with the verification key can validate it without a database lookup, which suits stateless APIs and microservices. The downside is revocation: a stolen JWT is valid until it expires. So the usual pattern is short-lived access tokens, around 5 to 15 minutes, plus a longer-lived refresh token that can be revoked.

For browser apps, I'd store tokens in HttpOnly, Secure, SameSite cookies rather than localStorage, because JavaScript can't read HttpOnly cookies, which protects them from XSS."
@trap
Thinking JWT payloads are encrypted. They're only Base64-encoded and signed; anyone can read them. Never put secrets in a JWT.

### [2] Authentication vs authorisation. How do OAuth 2.0 and OpenID Connect work?
@tags auth, oauth, oidc, security
@hook AuthN: who are you. AuthZ: what may you do. OAuth 2.0 delegates access; OIDC adds identity on top.
@say
"Authentication verifies who you are, with a password, a passkey or single sign-on. Authorisation decides what you're allowed to do, like roles and permissions.

OAuth 2.0 is an authorisation framework. It lets an application access a resource on a user's behalf without ever seeing their password. For example, a scheduling app gets permission to read your Google Calendar. The standard flow for web and mobile apps is the authorisation code flow with PKCE. The app redirects the user to the authorisation server, the user logs in there and consents to specific scopes, the app receives a short-lived code, and exchanges it, together with the PKCE verifier, for an access token. PKCE stops an attacker who intercepts the code from using it.

OpenID Connect is a thin identity layer on top of OAuth 2.0. It adds an ID token, a JWT that says who the user is, which is what 'Sign in with Google' uses. So the shorthand is: OAuth for access, OIDC for login. For machine-to-machine calls there's the client credentials flow, where a service authenticates as itself."
@deep
```text
Browser          App backend              Auth server             API
   | -- click login --> |                        |                     |
   | <-- redirect (client_id, scope, code_challenge) --------------->   |
   | ------------------- user logs in, consents -------------------->  |
   | <-- redirect back with ?code=abc ---------- |                     |
   | -- code --------> | -- code + code_verifier --> |                 |
   |                   | <-- access_token, id_token, refresh_token     |
   |                   | -- Authorization: Bearer access_token -------> |
```
The implicit flow and the password grant are deprecated in current OAuth guidance. Use authorisation code with PKCE.

### [2] Offset vs cursor pagination?
@tags api design, pagination, databases
@hook Offset is simple but slow and unstable at depth. Cursors are stable and fast because they seek from the last row seen.
@say
"Offset pagination uses limit and offset, like page 50 means skip 980 rows and take 20. It's simple and lets users jump to any page. But the database still has to scan and discard all the skipped rows, so deep pages get slow, and if rows are inserted or deleted while someone is paging, they'll see duplicates or miss items.

Cursor pagination, also called keyset pagination, returns an opaque cursor encoding the last item's sort key, like its created-at time and ID. The next request asks for rows after that cursor: WHERE (created_at, id) less than the cursor values, ORDER BY those, LIMIT 20. With an index on those columns, every page is equally fast, and results stay stable under inserts.

I use cursors for feeds, infinite scroll and large or frequently changing datasets, and offset only for small admin tables where jumping to page 7 matters."

### [2] What is an idempotency key, and how do you implement it?
@tags api design, reliability, payments
@hook The client sends a unique key with a write; the server stores the result under that key and replays it for retries.
@say
"Networks fail in ambiguous ways: a client sends 'charge 50 dollars', the request times out, and it doesn't know whether the charge happened. If it retries a plain POST, the customer might be charged twice.

An idempotency key solves this. The client generates a unique ID, like a UUID, for each logical operation and sends it in a header. The server, before doing the work, checks a store for that key. If it's new, it records the key as in progress, performs the operation and saves the response under the key. If the key already exists with a completed result, it returns the saved response without redoing the work. If it's still in progress, it returns a conflict so the client waits and retries.

The details that matter: the key check and insert must be atomic, for example a unique constraint in the database, the stored entry should also record a hash of the request body so a different payload with the same key is rejected, and keys expire after a sensible window like 24 hours. Payment APIs like Stripe use exactly this pattern."
