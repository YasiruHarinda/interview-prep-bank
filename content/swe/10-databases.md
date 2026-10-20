@section db | Databases and SQL
@blurb Transactions, indexes, isolation, scaling and the SQL you will be asked to write on the spot.

### [1] SQL vs NoSQL. How do you choose?
@tags databases, sql, nosql
@hook Default to a relational database. Pick NoSQL for a specific access pattern or scale need, not because it sounds modern.
@say
"Relational databases like PostgreSQL and MySQL store data in tables with a fixed schema, enforce relationships with foreign keys, support powerful ad-hoc queries with joins, and give ACID transactions. They fit most business applications, where data is structured and correctness matters, like orders, payments and users.

NoSQL is a family of different models. Document stores like MongoDB keep flexible JSON-like documents, good when each record is naturally a self-contained object. Key-value stores like Redis and DynamoDB give extremely fast lookups by key. Wide-column stores like Cassandra handle massive write volumes spread across many nodes. Graph databases like Neo4j are built for relationship-heavy queries like social networks or fraud rings.

My approach is to start relational unless there's a clear reason not to, because Postgres scales further than most people expect and handles JSON well too. I pick NoSQL when the access pattern is simple and known in advance and the scale or flexibility requirements are beyond what a relational database handles comfortably. Many real systems use both, for example Postgres as the source of truth and Redis as a cache."
@deep
| Need | Good fit |
|---|---|
| Transactions across entities, complex queries, reporting | PostgreSQL, MySQL, SQL Server |
| Flexible, nested, self-contained records | MongoDB, Postgres JSONB |
| Microsecond key lookups, caching, counters, sessions | Redis, Memcached |
| Huge write throughput, time series, multi-region | Cassandra, ScyllaDB, DynamoDB |
| Deep relationship traversal | Neo4j, Neptune |
| Full-text search, relevance ranking | Elasticsearch, OpenSearch |
| Similarity search on embeddings | pgvector, Qdrant, Pinecone, Weaviate |

### [1] What does ACID mean?
@tags transactions, acid
@hook Atomic: all or nothing. Consistent: rules always hold. Isolated: concurrent transactions don't trip over each other. Durable: committed means saved.
@say
"ACID describes the guarantees of a database transaction.

Atomicity means all of a transaction's operations succeed or none do. If I move money between accounts and the credit fails, the debit is rolled back.

Consistency means a transaction takes the database from one valid state to another, so constraints like foreign keys, unique keys and check constraints are never violated.

Isolation means concurrent transactions don't see each other's partial work. How strictly that's enforced depends on the isolation level.

Durability means once a transaction is committed, it survives crashes, because it's been written to durable storage, typically via a write-ahead log that's flushed before the commit is acknowledged.

The bank transfer is the classic example: debit, credit and an audit record either all happen or none do, even if the server loses power halfway through."

### [2] Explain transaction isolation levels and the anomalies they prevent.
@tags transactions, isolation, concurrency
@hook Read uncommitted, read committed, repeatable read, serializable. Each one blocks one more anomaly and costs more concurrency.
@say
"Isolation levels trade correctness against concurrency, and they're defined by which anomalies they prevent.

A dirty read is reading another transaction's uncommitted changes, which might be rolled back. A non-repeatable read is reading the same row twice and getting different values because someone committed in between. A phantom read is running the same query twice and getting different rows because someone inserted matching rows.

Read Uncommitted allows all of them. Read Committed prevents dirty reads, and it's the default in PostgreSQL and SQL Server. Repeatable Read also prevents non-repeatable reads, and it's MySQL InnoDB's default. Serializable prevents all of them and behaves as if transactions ran one at a time.

Modern databases often use MVCC, multi-version concurrency control: readers see a consistent snapshot and don't block writers. Even then, at Read Committed you can hit lost updates, where two transactions read a value, both modify it and the second write overwrites the first. I prevent that with SELECT FOR UPDATE, an atomic UPDATE like SET stock = stock minus 1, optimistic locking with a version column, or a stricter isolation level with retries."
@deep
| Level | Dirty read | Non-repeatable read | Phantom |
|---|---|---|---|
| Read Uncommitted | Possible | Possible | Possible |
| Read Committed | Prevented | Possible | Possible |
| Repeatable Read | Prevented | Prevented | Possible (prevented in practice by Postgres and InnoDB in most cases) |
| Serializable | Prevented | Prevented | Prevented |

At Serializable, expect serialization failures under contention. Your code must catch them and retry the whole transaction.

### [1] How does a database index work, and when should you not add one?
@tags indexes, performance, b-tree
@hook An index is a sorted structure (usually a B-tree) that turns a full table scan into a short tree walk. It costs writes and storage.
@say
"Without an index, a query filtering on a column has to scan every row, which is O(n). An index is a separate data structure, usually a B-tree or B+ tree, that keeps the column's values sorted with pointers to the rows. Because B-trees have hundreds of keys per node, even a table with a billion rows is only three or four levels deep, so a lookup touches a handful of pages. Because the leaves are sorted and linked, the index also speeds up range queries, ORDER BY and joins.

Indexes aren't free. Every insert, update or delete must also update each index, so too many indexes slow down writes, and they take disk space and memory. They also don't help much on low-selectivity columns, like a boolean where half the rows match, because the database would read most of the table anyway.

So I index columns used in WHERE clauses, joins and ORDER BY on large tables, especially foreign keys, and I check with EXPLAIN that the query actually uses the index rather than guessing."
@deep
```sql
CREATE INDEX idx_orders_customer_created ON orders (customer_id, created_at DESC);

-- Uses the index: leftmost column is filtered
SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;

-- Cannot use it efficiently: skips the leading column
SELECT * FROM orders WHERE created_at > now() - interval '1 day';

-- Defeats the index: function applied to the column
SELECT * FROM users WHERE lower(email) = 'a@b.com';   -- fix: an expression index on lower(email)
```
Other index types: hash (equality only), GIN (arrays, JSONB, full text), GiST (geospatial), BRIN (huge, naturally ordered tables like logs), and HNSW/IVF indexes for vectors.
@follow What is a composite index, and why does column order matter?
An index on several columns is sorted by the first column, then the second within it, and so on, like a phone book sorted by last name then first name. It helps queries that filter on a leftmost prefix of the columns. Put equality-filtered columns first and range or sort columns after them.
@follow What is a covering index?
An index that contains every column the query needs, so the database answers from the index alone without visiting the table. In Postgres you can add extra columns with INCLUDE.

### [2] Clustered vs non-clustered index?
@tags indexes
@hook Clustered: the table itself is stored in index order, so only one per table. Non-clustered: a separate structure pointing back at the rows.
@say
"A clustered index determines the physical order in which rows are stored: the table data itself lives in the leaves of the index. So there can only be one per table, usually on the primary key. Range scans on the clustered key are very fast because the rows are physically adjacent.

A non-clustered index is a separate structure holding the indexed columns plus a pointer to the row, either a physical row locator or the clustered key. A lookup through it may need an extra step to fetch the rest of the row, unless the index covers the query.

In SQL Server and MySQL InnoDB, the primary key is the clustered index, which is why a random UUID primary key can hurt insert performance: new rows land at random places in the tree and cause page splits. Sequential keys or time-ordered UUIDs like UUIDv7 avoid that. PostgreSQL works differently: tables are heaps and all indexes are secondary."

### [1] What is normalisation? When would you denormalise?
@tags schema design, normalisation
@hook Normalise to store each fact once and avoid update anomalies. Denormalise deliberately for read speed, and own the duplication.
@say
"Normalisation organises tables so each fact is stored exactly once, which avoids update anomalies, where you change a customer's address in one row but not another.

First normal form means atomic values with no repeating groups, so no comma-separated lists in a column. Second normal form means every non-key column depends on the whole primary key, not just part of a composite key. Third normal form means non-key columns depend only on the key, not on other non-key columns. For example, storing a customer's city and also the city's country in the orders table violates it; the country belongs with the city.

Denormalisation deliberately duplicates data to make reads faster, like storing the order total on the order row instead of summing line items each time, or keeping a precomputed follower count. I do it when there's a measured read-performance problem, and I make sure something keeps the copies consistent, like a transaction, a trigger or an event handler. Analytics warehouses are denormalised by design, using star schemas."

### [1] Explain the different types of SQL joins.
@tags sql, joins
@hook Inner: only matches. Left: everything from the left plus matches. Full: everything from both. Cross: every combination.
@say
"An INNER JOIN returns only rows that have a match in both tables, like orders that have a customer.

A LEFT JOIN returns every row from the left table, with matching data from the right table or NULLs where there's no match, like all customers including those with no orders. A RIGHT JOIN is the mirror image. A FULL OUTER JOIN returns all rows from both sides, matched where possible.

A CROSS JOIN returns every combination, the Cartesian product, which is rarely what you want unless you're generating combinations like sizes times colours. A SELF JOIN joins a table to itself, like employees to their managers in the same table.

A handy trick: a LEFT JOIN with WHERE right.id IS NULL finds rows with no match, like customers who've never ordered."
@deep
```sql
-- Customers who have never placed an order
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- Employees with their manager's name
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id;
```
@trap
Putting a filter on the right table in WHERE instead of in the ON clause of a LEFT JOIN. It silently turns the left join into an inner join.

### [1] WHERE vs HAVING? And what is the order of execution of a SQL query?
@tags sql
@hook WHERE filters rows before grouping; HAVING filters groups after. SQL runs FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT.
@say
"WHERE filters individual rows before any grouping happens, so it can't use aggregate functions. HAVING filters groups after GROUP BY, so it can, like keeping only customers whose total spend is over 1,000.

It helps to know the logical order a query is evaluated in, which is different from the order you write it: FROM and JOINs first, then WHERE, then GROUP BY, then HAVING, then SELECT, then DISTINCT, then ORDER BY, and finally LIMIT and OFFSET.

That order explains common errors. You can't use a SELECT alias in WHERE, because SELECT hasn't run yet, but you can in ORDER BY. And for performance, filter as much as possible in WHERE, so fewer rows reach the grouping step."
@deep
```sql
SELECT customer_id, SUM(amount) AS total
FROM orders
WHERE status = 'paid'                 -- row filter
GROUP BY customer_id
HAVING SUM(amount) > 1000             -- group filter
ORDER BY total DESC
LIMIT 10;
```

### [2] Write a query to find the second-highest salary, and the top earner in each department.
@tags sql, window functions
@hook Use DENSE_RANK in a window function. It handles ties and generalises to "Nth highest per group".
@say
"For the second-highest salary overall, a simple version is selecting the max salary where salary is less than the overall max. It handles duplicates correctly and returns NULL if there isn't a second value.

The more general approach uses window functions, which every interviewer is happy to see. DENSE_RANK over salary descending numbers the distinct salaries 1, 2, 3, with ties sharing a rank, so I filter for rank 2. For the top earner per department, I add PARTITION BY department, which restarts the ranking for each department, and filter for rank 1.

I'd also mention the difference between the ranking functions: ROW_NUMBER gives unique numbers even for ties, RANK leaves gaps after ties, like 1, 1, 3, and DENSE_RANK doesn't, like 1, 1, 2. For 'Nth highest salary', DENSE_RANK is usually the right one."
@deep
```sql
-- Second-highest distinct salary
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Top earner(s) per department
SELECT department, name, salary
FROM (
  SELECT department, name, salary,
         DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk
  FROM employees
) ranked
WHERE rnk = 1;

-- Find duplicate emails
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

-- Running total per customer
SELECT customer_id, created_at, amount,
       SUM(amount) OVER (PARTITION BY customer_id ORDER BY created_at) AS running_total
FROM orders;
```

### [2] Optimistic vs pessimistic locking?
@tags concurrency, locking, transactions
@hook Pessimistic: lock first, then work. Optimistic: work freely, then check nobody changed it (version column) before saving.
@say
"Pessimistic locking assumes conflicts are likely, so it locks the data before working with it, for example SELECT ... FOR UPDATE inside a transaction. Other transactions that want the same rows wait. It's safe and simple when contention is high and transactions are short, like decrementing limited stock during a flash sale. The costs are waiting, reduced throughput and the possibility of deadlocks.

Optimistic locking assumes conflicts are rare. Each row has a version number or timestamp. You read the row and its version, do your work, and update with WHERE id equals X AND version equals the version you read, incrementing the version. If zero rows are updated, someone else changed it first, so you reload and retry, or show the user a conflict. There's no locking while the user thinks, which suits web apps where someone might have an edit form open for minutes.

ORMs support it directly: JPA's @Version and Entity Framework's concurrency tokens. As an API, this maps nicely to ETags with If-Match headers, returning 412 Precondition Failed on conflict."
@deep
```sql
-- Optimistic update
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 7 AND version = 12;     -- 0 rows affected means conflict: reload and retry

-- Pessimistic
BEGIN;
SELECT stock FROM products WHERE id = 7 FOR UPDATE;   -- others wait here
UPDATE products SET stock = stock - 1 WHERE id = 7;
COMMIT;
```

### [1] What is the N+1 query problem, and how do you fix it?
@tags orm, performance
@hook One query to get the list, then one more per item. 101 round trips instead of 2. Fix with eager loading or batching.
@say
"The N+1 problem happens when code loads a list of N records with one query, then lazily loads a related record for each one with another query. Loading 100 blog posts and then each post's author separately makes 101 database round trips instead of one or two. It usually hides inside ORMs, because accessing post.author looks like a property but actually fires a query.

The fixes are to eager-load the relationship: a JOIN, Include in Entity Framework, JOIN FETCH or entity graphs in JPA, select_related or prefetch_related in Django. Or batch the lookups: collect all the author IDs and fetch them in one IN query. In GraphQL servers, DataLoader does this batching automatically.

To catch it, I enable SQL logging in development or use APM tracing, where it shows up as dozens of identical queries in one request, and I can add tests that assert on the number of queries for critical endpoints."
@deep
```csharp
// N+1: one query for orders, then one per order for Customer
var orders = await db.Orders.ToListAsync();
foreach (var o in orders) Console.WriteLine(o.Customer.Name);   // lazy loads

// Fixed: one query with a join
var orders = await db.Orders.Include(o => o.Customer).ToListAsync();
```

### [2] How do you troubleshoot a slow SQL query?
@tags performance, query tuning
@hook Measure first, read the EXPLAIN plan, then fix the cause: missing index, bad statistics, too much data, or a bad query shape.
@say
"First I confirm which query is slow and how slow, using the slow query log, pg_stat_statements or APM traces, rather than guessing.

Then I run EXPLAIN ANALYZE to see the actual execution plan. I look for sequential scans on big tables, nested loops over large row counts, sorts spilling to disk, and big gaps between estimated and actual row counts, which mean the statistics are stale.

The usual fixes, roughly in order: add or adjust an index that matches the WHERE, JOIN and ORDER BY columns; rewrite the query so it can use the index, for example avoiding functions on indexed columns or leading wildcards in LIKE; select only the columns needed instead of SELECT star; paginate instead of loading everything; update statistics with ANALYZE; and fix N+1 patterns in the application.

If the query is fine but the load is too high, I look at caching the results, adding read replicas, or precomputing results with a materialised view. And after any change, I re-run EXPLAIN ANALYZE to confirm it actually helped."

### [2] How does database replication work? What is replication lag?
@tags replication, scaling, high availability
@hook The primary takes writes and streams changes to replicas that serve reads. Async replicas can be behind, so you may read stale data.
@say
"In leader-follower replication, one primary accepts all writes and streams its changes, usually from the write-ahead log, to one or more replicas. Replicas apply the changes and can serve read traffic, which scales reads, and they're standbys for failover if the primary dies.

Replication can be synchronous, where the primary waits for a replica to confirm before committing, which means no data loss on failover but slower writes, or asynchronous, where the primary commits immediately, which is faster but a replica can be seconds behind. That delay is replication lag.

Lag causes a classic bug: a user updates their profile, the next request reads from a replica that hasn't caught up, and their change seems to have vanished. Fixes include reading your own writes from the primary for a short time after a write, routing that user's reads to the primary, or using session tokens that track the last write position. There's also multi-leader and leaderless replication, as in Cassandra, which allow writes in several places but need conflict resolution."

### [2] Partitioning vs sharding. How do you choose a shard key?
@tags sharding, partitioning, scaling
@hook Partitioning splits a table; sharding spreads the pieces across machines. The shard key decides whether load spreads evenly or hot-spots.
@say
"Partitioning splits one large table into smaller pieces, often within a single database server, for example orders partitioned by month. Queries for one month only touch one partition, and old partitions can be dropped cheaply. Sharding is horizontal partitioning across multiple database servers, so each shard holds a subset of the rows and handles a share of the load. It's how you scale writes and storage beyond one machine.

The shard key is the most important decision. A good key has high cardinality, spreads load evenly, and matches the main access pattern, so most queries hit a single shard. User ID is often good for a social app, because most queries are about one user. A bad key creates hotspots: sharding by country puts most traffic on one shard, and sharding by creation date sends every new write to the newest shard.

Strategies are range-based, which is good for range queries but prone to hotspots, hash-based, which spreads evenly but makes range queries scatter, and directory-based, a lookup table mapping keys to shards. Consistent hashing helps rebalance with minimal data movement. Sharding adds real complexity: cross-shard joins and transactions become hard, so I'd exhaust indexing, caching, read replicas and vertical scaling first."

### [2] What is the CAP theorem? What is PACELC?
@tags distributed systems, cap, consistency
@hook During a network partition, choose consistency or availability. PACELC adds: otherwise, choose latency or consistency.
@say
"CAP says that in a distributed system, when a network partition happens, meaning some nodes can't talk to others, you have to choose between consistency, where every read sees the latest write or gets an error, and availability, where every request gets a non-error response, possibly with stale data. Partition tolerance isn't really optional, because networks do fail, so the real choice is C or A during a partition.

A CP system, like a bank ledger, or ZooKeeper or etcd, refuses or blocks some requests during a partition to avoid inconsistency. An AP system, like a shopping cart or a social feed, stays available and reconciles differences later.

PACELC extends this to the normal case: if there's a Partition, choose Availability or Consistency; Else, even with no partition, choose Latency or Consistency, because strong consistency requires coordination between replicas, which adds latency. DynamoDB and Cassandra lean toward availability and low latency with tunable consistency; Spanner leans toward consistency and pays in latency. In interviews I make this choice per feature, not per system: payments need consistency, a like counter doesn't."

### [2] What is eventual consistency? How do you live with it?
@tags consistency, distributed systems
@hook If writes stop, all replicas converge eventually. Design the UX and the code so temporary staleness doesn't hurt.
@say
"Eventual consistency means that if no new updates are made, all replicas will eventually return the same value, but in the meantime different readers might see different versions. It's the price of high availability and low latency in distributed systems.

To live with it, I first decide where it's acceptable. A like count or a feed can be a few seconds stale; an account balance can't. Then I use techniques like read-your-writes consistency, so users always see their own changes; optimistic UI updates on the client; idempotent operations, so replayed events don't double-apply; and conflict resolution, like last-writer-wins with timestamps, or merge-friendly data types such as CRDTs for collaborative editing.

It's also important to communicate it in the product: 'your order is being processed' is honest, while showing a success screen and then a failure later is not."

### [1] What is connection pooling, and why does it matter?
@tags performance, databases
@hook Opening a database connection is expensive. A pool keeps a few open and lends them out, and it also caps load on the database.
@say
"Opening a database connection involves a TCP handshake, often TLS, authentication and server-side setup, which can take several milliseconds. Doing that for every request wastes time, and each connection also uses memory on the database server. Postgres in particular uses a process per connection, so thousands of connections can overwhelm it.

A connection pool keeps a set of open connections and lends them to requests, which return them when done. That removes the setup cost and caps the number of concurrent connections. Pool size should be modest. A common starting point is around two to four times the database's CPU cores across all app instances, because beyond that, extra connections just queue inside the database.

In Kubernetes or serverless, where many app instances each have their own pool, the total can still explode, so I use a central pooler like PgBouncer or RDS Proxy. And I always set timeouts for acquiring a connection, so a saturated pool fails fast instead of hanging every request."
