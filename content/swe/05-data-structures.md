@section ds | Data Structures
@blurb Know what each one is good at, what it costs, and the one-line reason you would pick it.

### [1] How do you choose the right data structure?
@tags complexity, cheat sheet
@hook Start from the operations you need most often, then pick the structure that makes those cheap.
@say
"I start from the access pattern, not the structure. What operations will happen most: lookup by key, insertion at the ends, ordered iteration, finding the minimum, checking membership?

Then I match. If I need fast lookup by key, a hash map gives average O(1). If I also need keys in sorted order or range queries, a balanced tree map gives O(log n). If I repeatedly need the smallest or largest item, a heap. If I need first-in-first-out processing, a queue; last-in-first-out, a stack. If I mostly iterate and index by position, a dynamic array, which is also the most cache-friendly. For prefix searches on strings, a trie. For relationships, a graph as an adjacency list.

Then I sanity-check memory and constants. For small n, a simple array often beats a fancier structure in practice because of cache locality."
@deep
| Structure | Access | Search | Insert | Delete | Notes |
|---|---|---|---|---|---|
| Array / dynamic array | O(1) | O(n) | O(1) amortised at end, O(n) middle | O(n) | Cache friendly |
| Linked list | O(n) | O(n) | O(1) at a known node | O(1) at a known node | Pointer overhead |
| Hash map / set | n/a | O(1) avg, O(n) worst | O(1) avg | O(1) avg | No order |
| Balanced BST / tree map | O(log n) | O(log n) | O(log n) | O(log n) | Sorted, range queries |
| Binary heap | O(1) peek min/max | O(n) | O(log n) | O(log n) pop | Priority queue |
| Stack / queue / deque | O(1) at the ends | O(n) | O(1) | O(1) | |
| Trie | O(L) | O(L) | O(L) | O(L) | L = key length |

### [1] Array vs linked list?
@tags arrays, linked list
@hook Arrays: contiguous, O(1) indexing, cache friendly. Linked lists: O(1) splicing at a known node, but O(n) to find it.
@say
"An array stores elements contiguously in memory. That gives O(1) access by index, because the address is just base plus index times element size, and excellent cache performance when iterating. The downside is that inserting or deleting in the middle is O(n), because elements have to shift, and a fixed-size array can't grow; dynamic arrays handle that by resizing.

A linked list stores nodes scattered in memory, each pointing to the next, and in a doubly linked list also the previous. Inserting or removing at a node you already have a reference to is O(1), with no shifting. But finding an element or accessing by index is O(n), each node has pointer overhead, and following pointers causes cache misses.

In practice, dynamic arrays win most of the time because of the cache. I use linked lists when I need O(1) removal from the middle given a reference, like the doubly linked list inside an LRU cache, or in queues where nodes are spliced constantly."

### [1] How does a hash map work? How are collisions handled?
@tags hashing, hash map
@hook Hash the key to a bucket index; handle collisions by chaining or probing; resize when the load factor gets too high.
@say
"A hash map stores key-value pairs in an array of buckets. To insert, it computes the key's hash code, maps it to a bucket index, usually with a modulo or bit mask, and stores the entry there. Lookup repeats the same computation, so on average it's O(1).

Collisions happen when two keys land in the same bucket. There are two main strategies. Separate chaining keeps a small list in each bucket; Java's HashMap does this and even converts long chains into balanced trees. Open addressing stores everything in the array itself and, on a collision, probes for the next free slot; Python's dict does this.

To keep chains short, the map tracks its load factor, meaning entries divided by buckets. When it passes a threshold, around 0.75 in Java, it allocates a bigger array, usually double, and rehashes everything. That single resize is O(n), but amortised over many inserts it's still O(1). The worst case is O(n), if many keys collide because of a bad hash function or a deliberate attack, which is why many languages randomise hash seeds."
@deep
For correctness, keys must follow the **equals/hashCode contract**: if `a.equals(b)` then `a.hashCode() == b.hashCode()`. Override one without the other and lookups silently fail.
```java
record Point(int x, int y) {}  // records generate equals() and hashCode() for you
```
Keys should also be immutable. If a key's fields change after insertion, its hash changes and the entry is lost in the wrong bucket.
@follow Why is a hash map's iteration order not guaranteed?
Order depends on hash values and bucket layout, which change on resize. If you need order, use LinkedHashMap (insertion order) or TreeMap (sorted). Python 3.7+ dicts do keep insertion order as a language guarantee.

### [1] Stack vs queue. How do you build a queue from two stacks?
@tags stack, queue
@hook Stack: last in, first out. Queue: first in, first out. Two stacks make a queue with amortised O(1) operations.
@say
"A stack is last-in, first-out: push and pop happen at the same end. It's used for function calls, undo history, expression parsing, matching brackets and depth-first search. A queue is first-in, first-out: enqueue at the back, dequeue at the front. It's used for task scheduling, buffering and breadth-first search.

To build a queue from two stacks, I use an in-stack and an out-stack. Enqueue always pushes onto the in-stack. Dequeue pops from the out-stack; if the out-stack is empty, I first move everything from the in-stack to the out-stack, which reverses the order so the oldest element is on top. Each element is moved at most once, so even though one dequeue can be O(n), the amortised cost per operation is O(1)."
@deep
```python
class MyQueue:
    def __init__(self):
        self.inbox, self.outbox = [], []
    def push(self, x):
        self.inbox.append(x)
    def pop(self):
        self.peek()
        return self.outbox.pop()
    def peek(self):
        if not self.outbox:
            while self.inbox:
                self.outbox.append(self.inbox.pop())
        return self.outbox[-1]
    def empty(self):
        return not self.inbox and not self.outbox
```
In Python, use `collections.deque` for a real queue. `list.pop(0)` is O(n).

### [1] What is a binary search tree, and why do balanced trees matter?
@tags trees, bst
@hook Left is smaller, right is bigger, so every step halves the search. Unless the tree degenerates into a list.
@say
"A binary search tree is a binary tree where, for every node, all values in the left subtree are smaller and all values in the right subtree are larger. That ordering lets search, insert and delete walk down one path, so they take O(h), where h is the height. An in-order traversal visits the values in sorted order.

The catch is the height. If the tree is balanced, h is about log n, so operations are O(log n). But if you insert already sorted data into a plain BST, every node goes to the right and the tree becomes a linked list with O(n) operations.

That's why real libraries use self-balancing trees like red-black trees or AVL trees, which rotate nodes on insert and delete to keep the height logarithmic. Java's TreeMap and C++'s std::map are red-black trees. Databases use a different balanced tree, the B-tree, which has many children per node so it fits disk pages and keeps the tree very shallow."
@follow Red-black vs AVL?
AVL trees are more strictly balanced, so lookups are slightly faster, but they rotate more on inserts and deletes. Red-black trees allow a bit more imbalance and do fewer rotations, so they're preferred for write-heavy general-purpose maps.

### [1] What are the tree traversal orders?
@tags trees, traversal, dfs, bfs
@hook Pre-order: node first. In-order: node in the middle. Post-order: node last. Level-order: row by row.
@say
"There are three depth-first orders and one breadth-first order.

Pre-order visits the node, then the left subtree, then the right. It's used to copy or serialise a tree, because you see the parent before its children.

In-order visits left, node, right. On a BST it produces sorted output, which is why it's used to validate a BST or find the kth smallest element.

Post-order visits left, right, then the node. It's used when children must be processed before the parent, like deleting a tree, or computing the height or size of subtrees.

Level-order visits the tree level by level using a queue. It's BFS on a tree and is used for things like finding the minimum depth or printing each level."
@deep
```python
def inorder(node, out):
    if node:
        inorder(node.left, out)
        out.append(node.val)
        inorder(node.right, out)

from collections import deque
def level_order(root):
    if not root: return []
    res, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            n = q.popleft()
            level.append(n.val)
            if n.left: q.append(n.left)
            if n.right: q.append(n.right)
        res.append(level)
    return res
```

### [2] How do you check whether a binary tree is a valid BST?
@tags trees, bst, coding
@hook Pass down an allowed (low, high) range. Checking only parent and child is the classic wrong answer.
@say
"The trap is checking only that each node's left child is smaller and right child is larger. That misses cases where a node deep in the left subtree is larger than an ancestor higher up.

The correct approach passes a valid range down the recursion. The root can be anything, so its range is minus infinity to plus infinity. When I go left, the upper bound becomes the current node's value; when I go right, the lower bound becomes the current value. If any node falls outside its range, the tree is invalid.

That's O(n) time, since each node is visited once, and O(h) space for the recursion stack. An alternative is an in-order traversal, checking that each value is strictly greater than the previous one."
@deep
```python
def is_valid_bst(root):
    def check(node, low, high):
        if node is None:
            return True
        if not (low < node.val < high):
            return False
        return check(node.left, low, node.val) and check(node.right, node.val, high)
    return check(root, float("-inf"), float("inf"))
```
Ask the interviewer whether duplicates are allowed and on which side. It changes `<` to `<=` on one side.

### [1] What is a heap, and what is it used for?
@tags heap, priority queue
@hook A tree where every parent beats its children. O(1) to see the top, O(log n) to push or pop. Perfect for "top k" and scheduling.
@say
"A binary heap is a complete binary tree where each parent is smaller than its children in a min-heap, or larger in a max-heap. Because it's complete, it's stored compactly in an array: the children of index i are at 2i plus 1 and 2i plus 2.

Peeking at the minimum is O(1), since it's the root. Inserting adds at the end and bubbles up, and removing the root moves the last element to the top and bubbles down. Both are O(log n). Building a heap from an unsorted array can be done in O(n) with heapify.

Heaps implement priority queues. I use them for top-k problems, where a min-heap of size k keeps the k largest elements in O(n log k), for merging k sorted lists, for Dijkstra's shortest path, for task schedulers and for finding a running median with two heaps."
@deep
```python
import heapq

def top_k(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)      # drop the smallest
    return heap                       # the k largest, O(n log k)
```
Python's `heapq` is a min-heap. For a max-heap, push negated values.
@follow Why is heapify O(n) and not O(n log n)?
Most nodes are near the bottom and only sift down a short distance. Summing the work per level gives a series that converges to O(n).

### [2] What is a trie, and when would you use one?
@tags trie, strings
@hook A tree of characters. Every path from the root spells a prefix, so prefix lookups cost O(word length), not O(number of words).
@say
"A trie, or prefix tree, stores strings character by character. Each node represents a prefix and has children for the possible next characters, plus a flag marking the end of a complete word.

Insert and search take O(L), where L is the word's length, regardless of how many words are stored. The real strength is prefix queries: finding all words that start with 'app' means walking three nodes and then collecting the subtree.

I'd use one for autocomplete, spell checking, IP routing with longest-prefix match, and word games like Boggle. The trade-off is memory: each node may hold many child pointers. Compressed tries, like radix trees, merge single-child chains to save space."
@deep
```python
class Trie:
    def __init__(self):
        self.root = {}
    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True
    def starts_with(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node:
                return False
            node = node[ch]
        return True
```

### [1] How do you represent a graph? Adjacency list vs adjacency matrix?
@tags graphs
@hook List: space proportional to edges, best for sparse graphs. Matrix: O(1) edge checks, but V squared space.
@say
"An adjacency list stores, for each vertex, a list of its neighbours. It uses O(V plus E) space and makes iterating over a node's neighbours fast, so it's the default for most real graphs, which are sparse: social networks, road maps, dependency graphs.

An adjacency matrix is a V by V grid where cell i, j says whether there's an edge, or its weight. Checking whether a specific edge exists is O(1), but it takes O(V squared) space even if there are few edges, and listing neighbours is O(V). It's a good choice for small or dense graphs, or algorithms like Floyd-Warshall that work on the matrix directly.

There's also an edge list, just a list of pairs, which is handy for algorithms like Kruskal's that sort edges."

### [1] How does a dynamic array grow, and why is append O(1)?
@tags arrays, amortised analysis
@hook When full, allocate double and copy. Copies are rare enough that each append costs O(1) on average.
@say
"A dynamic array, like Python's list, Java's ArrayList or C++'s vector, wraps a fixed-size array. When it's full and you append, it allocates a new array, typically 1.5 to 2 times larger, copies all elements across and frees the old one.

That copy is O(n), but it happens rarely. With doubling, after n appends the total copying work is n plus n over 2 plus n over 4 and so on, which is less than 2n. Spread across n appends, that's O(1) per append on average. That's called amortised O(1).

If I know the final size up front, I pre-allocate capacity to skip the resizes entirely, for example new ArrayList with an initial capacity, or reserve in C++."

### [2] HashMap vs TreeMap? When do you need ordering?
@tags hash map, tree map
@hook HashMap: O(1) average, no order. TreeMap: O(log n), always sorted, supports range queries.
@say
"A HashMap is backed by a hash table, so get and put are O(1) on average, but there's no meaningful order to the keys. A TreeMap is a red-black tree, so operations are O(log n), but keys are always sorted.

I choose a TreeMap when I need order-aware operations: iterating in sorted order, finding the smallest or largest key, range queries like 'all bookings between 9 and 11', or 'the first key greater than X' with ceilingKey and floorKey. Otherwise a HashMap is faster.

There's also LinkedHashMap, which keeps insertion order with near-HashMap speed. It's handy for predictable iteration or for building an LRU cache."

### [2] Design and implement an LRU cache.
@tags lru, cache, coding, design
@hook Hash map for O(1) lookup, doubly linked list for O(1) recency updates. Most recent at the head, evict from the tail.
@say
"An LRU cache evicts the least recently used entry when it's full. Both get and put need to be O(1).

I combine two structures. A hash map from key to node gives O(1) lookup. A doubly linked list keeps entries ordered by recency, with the most recently used at the head and the least recently used at the tail. Because it's doubly linked, I can unlink any node in O(1) given a reference to it.

On get: if the key exists, I move its node to the head and return the value. On put: if the key exists, I update the value and move it to the head; otherwise I create a node at the head and add it to the map. If that pushes the size over capacity, I remove the tail node and delete its key from the map. Using dummy head and tail sentinel nodes removes all the null-check edge cases.

In production, I'd also think about thread safety, using a lock or a concurrent design, and about TTLs. In Python, OrderedDict with move_to_end gives the same behaviour in a few lines."
@deep
```python
class Node:
    __slots__ = ("key", "val", "prev", "next")
    def __init__(self, key=0, val=0):
        self.key, self.val, self.prev, self.next = key, val, None, None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap, self.map = capacity, {}
        self.head, self.tail = Node(), Node()          # sentinels
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, node):
        node.prev.next, node.next.prev = node.next, node.prev

    def _add_front(self, node):
        node.prev, node.next = self.head, self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        node = self.map.get(key)
        if not node:
            return -1
        self._remove(node); self._add_front(node)
        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.map:
            self._remove(self.map[key])
        node = Node(key, value)
        self.map[key] = node
        self._add_front(node)
        if len(self.map) > self.cap:
            lru = self.tail.prev
            self._remove(lru)
            del self.map[lru.key]
```
@follow How would you make it thread-safe?
The simplest correct way is a single lock around get and put, since even get mutates the list. For high concurrency, shard the cache into N segments, each with its own lock, by hashing the key. Libraries like Caffeine (Java) use more advanced approximations of LRU to avoid lock contention.
@follow LRU vs LFU?
LRU evicts what was used longest ago; it adapts quickly but a single scan of many keys can flush the cache. LFU evicts the least frequently used; it protects popular items but adapts slowly to change. Many real caches use hybrids such as TinyLFU.

### [3] What is a Bloom filter?
@tags probabilistic, bloom filter, scale
@hook A tiny bit array that answers "definitely not here" or "probably here". No false negatives, some false positives.
@say
"A Bloom filter is a space-efficient probabilistic structure for testing set membership. It's a bit array of m bits plus k hash functions. To add an item, I hash it k times and set those k bits. To check an item, I hash it the same way: if any of those bits is 0, the item is definitely not in the set. If all are 1, it's probably in the set, because other items might have set those bits.

So it can have false positives but never false negatives, and it uses a tiny fraction of the memory of storing the items themselves. You can tune the false positive rate by choosing m and k for the expected number of items.

Real uses: databases like Cassandra and RocksDB check a Bloom filter before reading a file from disk, skipping files that definitely don't have the key. Web crawlers use them to skip URLs already visited, and caches use them to avoid lookups for keys that don't exist. A plain Bloom filter can't delete items; a counting Bloom filter can, at extra memory cost."

### [3] What is Union-Find, and what problems does it solve?
@tags union find, graphs, disjoint set
@hook Tracks which items are in the same group. With path compression and union by rank, each operation is nearly O(1).
@say
"Union-Find, or a disjoint set union, tracks a collection of elements split into non-overlapping groups. It supports two operations: find, which returns the representative of an element's group, and union, which merges two groups.

Each element points to a parent, and the root of each tree is the group's representative. Two optimisations make it extremely fast. Path compression makes every node on a find path point directly to the root. Union by rank or size attaches the smaller tree under the larger one. Together, the amortised cost per operation is effectively constant; formally it's the inverse Ackermann function.

I use it for counting connected components, detecting cycles in an undirected graph, Kruskal's minimum spanning tree algorithm, and problems like 'accounts merge' or 'number of provinces'."
@deep
```python
class DSU:
    def __init__(self, n):
        self.parent, self.size = list(range(n)), [1] * n
    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path halving
            x = self.parent[x]
        return x
    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False                                    # already joined: a cycle
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        return True
```
