@section security | Security for Developers
@blurb The attacks every developer should be able to explain and prevent, mapped to the OWASP Top 10:2025.

### [1] What is the OWASP Top 10? Name the main risks.
@tags owasp, web security
@hook A community ranking of the most critical web app risks. The 2025 edition: access control is still number one, and supply chain failures are new at number three.
@say
"The OWASP Top 10 is a widely used awareness list of the most critical security risks in web applications, based on real vulnerability data and community input. The current edition is from 2025.

Broken Access Control is still number one: users acting outside their permissions, like viewing someone else's order by changing an ID in the URL. It now also covers server-side request forgery. Security Misconfiguration moved up to second: default credentials, verbose errors, open storage buckets, missing security headers. Software Supply Chain Failures is new at third, covering compromised or vulnerable dependencies, build systems and distribution. Then Cryptographic Failures, Injection, Insecure Design, Authentication Failures, Software or Data Integrity Failures, Security Logging and Alerting Failures, and another new one, Mishandling of Exceptional Conditions, like failing open when an error occurs.

As a developer, I use it as a checklist in design and code review, and back it with automated tools: dependency scanning, static analysis and secret scanning in CI."
@deep
| # | OWASP Top 10:2025 | One-line example |
|---|---|---|
| A01 | Broken Access Control | `/api/orders/1043` returns another user's order (IDOR); SSRF |
| A02 | Security Misconfiguration | Public S3 bucket, debug mode in production |
| A03 | Software Supply Chain Failures | Malicious npm package, compromised CI pipeline |
| A04 | Cryptographic Failures | Passwords hashed with MD5, no TLS |
| A05 | Injection | SQL injection, command injection, XSS |
| A06 | Insecure Design | No rate limit on password reset |
| A07 | Authentication Failures | Credential stuffing, weak session handling |
| A08 | Software or Data Integrity Failures | Unsigned updates, unsafe deserialization |
| A09 | Security Logging and Alerting Failures | Breach goes unnoticed for months |
| A10 | Mishandling of Exceptional Conditions | Auth check throws, code fails open |

### [1] What is SQL injection, and how do you prevent it?
@tags injection, sql
@hook User input gets treated as SQL code. Fix: parameterised queries, always. Never build SQL with string concatenation.
@say
"SQL injection happens when user input is concatenated into a SQL query, so specially crafted input changes the query's structure. If a login query is built as 'WHERE username equals' plus the input, someone can type a quote followed by OR 1 equals 1, and the query matches every user. Worse payloads can read entire tables or drop them.

The fix is parameterised queries, also called prepared statements: the query structure is sent separately from the values, so input is always treated as data, never as code. ORMs do this by default, as long as you don't drop into raw SQL with string formatting.

Defence in depth on top of that: validate input against expected formats, run the application's database user with least privilege so it can't drop tables or read unrelated schemas, avoid showing raw database errors to users, and use static analysis in CI to flag string-built queries. Table or column names can't be parameterised, so if those come from users, I map them through an allow-list."
@deep
```python
# Vulnerable
cur.execute(f"SELECT * FROM users WHERE email = '{email}'")

# Safe: parameterised
cur.execute("SELECT * FROM users WHERE email = %s", (email,))
```
```csharp
// Safe in EF Core: interpolated strings are converted into parameters
var user = await db.Users.FromSqlInterpolated($"SELECT * FROM Users WHERE Email = {email}").FirstOrDefaultAsync();
// Dangerous: FromSqlRaw with string concatenation
```

### [1] What is cross-site scripting (XSS), and how do you prevent it?
@tags xss, injection, browser
@hook Attacker-controlled script runs in your users' browsers. Encode output for its context, sanitise HTML, and add a Content Security Policy.
@say
"XSS is when an attacker gets their JavaScript to run in another user's browser on your site, where it can steal session data, act as the user or change the page.

There are three types. Stored XSS: malicious script is saved, say in a comment, and served to everyone who views it. Reflected XSS: the script comes from the request, like a search parameter echoed back in the page. DOM-based XSS: client-side JavaScript takes data from the URL or similar and writes it into the page unsafely, for example with innerHTML.

Prevention: encode output for the context it appears in, meaning HTML, attribute, JavaScript or URL. Modern frameworks like React, Angular and Razor escape output by default, so the risk comes from bypasses like dangerouslySetInnerHTML or innerHTML. If users must submit rich HTML, sanitise it with a well-tested library like DOMPurify. Add a Content Security Policy header that blocks inline scripts and restricts script sources, which limits damage if something slips through. And set session cookies as HttpOnly, so scripts can't read them."

### [2] What is CSRF, and how do you prevent it?
@tags csrf, cookies, browser
@hook The browser auto-attaches cookies, so a malicious page can make requests as you. Fix: SameSite cookies plus anti-CSRF tokens.
@say
"Cross-site request forgery exploits the fact that browsers automatically attach cookies to requests. If I'm logged into my bank and visit a malicious site, that site can submit a hidden form to the bank's transfer endpoint, and my browser sends my session cookie along, so the bank thinks I made the request. The attacker can't read the response, but the action still happens.

Defences: set session cookies with SameSite set to Lax or Strict, so browsers don't send them on cross-site requests; Lax is now the default in modern browsers, which blocks most attacks. Use anti-CSRF tokens: a random, unpredictable token embedded in forms or sent in a header, which the server validates, and which a cross-site attacker can't know. Never perform state changes with GET requests. And for sensitive actions, re-authenticate.

APIs that authenticate with a bearer token in the Authorization header, rather than cookies, aren't vulnerable to classic CSRF, because the browser doesn't attach that header automatically."

### [1] Hashing vs encryption vs encoding. How should passwords be stored?
@tags cryptography, passwords
@hook Encoding is for format, encryption is reversible with a key, hashing is one-way. Passwords: slow, salted hashes like Argon2id or bcrypt.
@say
"Encoding changes data's representation for transport or storage, like Base64 or URL encoding. It's not security; anyone can decode it.

Encryption makes data unreadable without a key, and it's reversible by whoever has the key. It's for data you need to read back later, like stored credit card tokens or messages.

Hashing is a one-way function: the same input always produces the same fixed-size output, and you can't reverse it. It's used for integrity checks and for passwords.

For passwords, you never store them in plain text or encrypted, and you don't use fast hashes like MD5 or SHA-256 alone, because attackers can try billions of guesses per second on GPUs. Instead you use a deliberately slow, salted password hashing algorithm: Argon2id is the current recommendation, with bcrypt or scrypt also acceptable. The salt is a unique random value per user, stored with the hash, which defeats precomputed rainbow tables and makes identical passwords hash differently. On login, you hash the attempt with the stored salt and compare in constant time."
@deep
| | Reversible | Needs a key | Use for |
|---|---|---|---|
| Encoding (Base64) | Yes, by anyone | No | Transport and formatting |
| Encryption (AES, RSA) | Yes, with the key | Yes | Confidential data you must read back |
| Hashing (SHA-256) | No | No | Integrity, fingerprints |
| Password hashing (Argon2id, bcrypt) | No | No (uses salt and cost) | Storing passwords |
| HMAC | No | Yes | Proving a message wasn't tampered with |

### [1] Symmetric vs asymmetric encryption?
@tags cryptography
@hook Symmetric: one shared key, fast. Asymmetric: a public and private key pair, slow but solves key exchange. TLS uses both.
@say
"Symmetric encryption uses the same secret key to encrypt and decrypt, for example AES. It's very fast and ideal for bulk data. The challenge is sharing the key securely with the other party.

Asymmetric encryption uses a key pair: a public key that anyone can have and a private key kept secret. Data encrypted with the public key can only be decrypted with the private key. The private key can also create digital signatures that anyone can verify with the public key. Examples are RSA and elliptic-curve cryptography. It's much slower, so it's not used for bulk data.

Real systems combine them. In TLS, asymmetric cryptography is used to authenticate the server and agree on a shared secret, and then fast symmetric encryption protects the actual traffic. The same pattern, called envelope encryption, is used in cloud key management: data is encrypted with a data key, and that data key is itself encrypted by a master key in a KMS."

### [2] What is broken access control, and how do you prevent IDOR?
@tags access control, idor, authorisation
@hook Authentication tells you who they are; you still have to check, on every request, that they're allowed to touch that specific object.
@say
"Broken access control means users can do or see things outside their permissions. It's number one on the OWASP list. The most common form is IDOR, insecure direct object reference: a user requests /api/invoices/1043, changes it to 1044, and gets someone else's invoice, because the server checked that they were logged in but not that the invoice belongs to them.

Prevention: enforce authorisation on the server for every request and every object, never relying on the UI hiding buttons. Scope queries by the current user, like 'select the invoice where id equals X and owner equals the current user', rather than fetching by ID and checking later. Deny by default. Centralise the logic in a policy layer or middleware instead of scattering checks across controllers. Using unguessable IDs like UUIDs helps a little, but it's not a substitute for checks.

And test it: automated tests that log in as user A and try to access user B's resources, for every endpoint. Multi-tenant SaaS apps need the same at the tenant level, sometimes enforced with row-level security in the database."

### [2] How should applications handle secrets like API keys and database passwords?
@tags secrets, configuration
@hook Never in code or Git. Inject at runtime from a secrets manager, use short-lived credentials, rotate, and scan for leaks.
@say
"Secrets should never be committed to source code or Git history, baked into container images or printed in logs.

In production, I store them in a secrets manager like Azure Key Vault, AWS Secrets Manager, Google Secret Manager or HashiCorp Vault, and the application reads them at runtime, ideally authenticating with a managed or workload identity, so there's no bootstrap password at all. Where possible, I avoid long-lived secrets entirely, using short-lived tokens or dynamic database credentials that expire automatically.

Locally, I use environment variables or the framework's user-secrets feature, with .env files in .gitignore. In CI/CD, the pipeline injects secrets from its secret store or uses OIDC federation to get short-lived cloud credentials.

I also add secret scanning, such as GitHub secret scanning or gitleaks, as a pre-commit hook and in CI. If a secret does leak, the first step is to rotate it immediately, since rewriting Git history doesn't help once it's been pushed and possibly cloned."

### [2] What are common JWT security mistakes?
@tags jwt, authentication
@hook Accepting "alg: none", not validating claims, long lifetimes with no revocation, secrets in the payload, tokens in localStorage.
@say
"The main mistakes I watch for are these.

Not validating properly: the server must verify the signature with the expected algorithm, explicitly rejecting 'none' and algorithm confusion attacks, and check the expiry, issuer and audience claims. Using a well-maintained library with strict settings handles most of this.

Weak signing keys: a short HMAC secret can be brute-forced offline. Use a strong random secret, or asymmetric keys like RS256 or ES256 so services only need the public key to verify.

Long lifetimes with no revocation: since JWTs are stateless, a stolen token works until it expires. So keep access tokens short, minutes not days, use rotating refresh tokens, and keep a denylist for emergencies.

Putting sensitive data in the payload: it's only Base64-encoded, so anyone can read it.

And storage: tokens in localStorage are readable by any script, so an XSS bug becomes token theft. For browser apps I prefer HttpOnly, Secure, SameSite cookies, or a backend-for-frontend pattern where the browser never sees the token."

### [2] What is SSRF?
@tags ssrf, cloud security
@hook Your server is tricked into fetching a URL the attacker chooses, often internal services or the cloud metadata endpoint.
@say
"Server-side request forgery is when an application fetches a URL supplied by the user, like a webhook, an image import or a link preview, and the attacker supplies an internal address instead. The server then makes the request from inside the network, reaching things the attacker can't, like internal admin APIs, databases, or the cloud metadata endpoint at 169.254.169.254, which can hand out cloud credentials. That's exactly how several major cloud breaches happened.

Prevention: validate URLs against an allow-list of permitted domains where possible; block private, loopback and link-local IP ranges after resolving DNS, and re-check on redirects, because attackers use DNS rebinding and redirects to bypass naive checks; route outbound fetches through an egress proxy; and on AWS, require IMDSv2, which needs a session token that simple SSRF can't obtain. Least-privilege credentials limit the blast radius if it happens anyway. In the 2025 OWASP list, SSRF is part of Broken Access Control."

### [2] How would you secure a public REST API?
@tags api security, checklist
@hook Authenticate, authorise every object, validate input, limit rates, encrypt, log, and don't leak details.
@say
"I'd go through layers.

Transport: HTTPS only, with HSTS.

Authentication: OAuth 2.0 or OIDC with short-lived tokens, or API keys for server-to-server, stored hashed and scoped.

Authorisation: check permissions for every request and every object, deny by default, including tenant isolation.

Input: validate every input against a schema for type, length, format and range, reject unknown fields to prevent mass assignment, and use parameterised queries.

Abuse protection: rate limiting and quotas per client, request size limits, pagination limits, and timeouts.

Output: return only needed fields, no stack traces or internal errors, and set security headers.

Operations: secrets in a vault, dependencies scanned, audit logging of security-relevant events without logging secrets or personal data, and alerts on anomalies like spikes in 401s or 403s.

And I'd use an API gateway or WAF for the cross-cutting parts, while still enforcing authorisation inside the service, because the gateway alone can't know object-level permissions."
