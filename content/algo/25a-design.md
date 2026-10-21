@section design | Design a Data Structure
@blurb "Design X with these operations in O(1)." Pick one structure for each operation's speed, then combine them and keep them in sync.

### [1] Pattern: how do you approach a "design a data structure" question?
@tags pattern, design, data structures
@hook List each operation and the speed it needs. Pick a structure for each, combine them, and say the invariant that keeps them in sync.
@say
"I start by listing the operations and the time each one must take, and I confirm edge cases: capacity zero, missing keys, duplicates.

Then I pick a structure for each need. O(1) lookup by key means a hash map. O(1) 'remove the oldest' or 'move to front' means a doubly linked list or a deque. O(1) random choice means an array. 'Always give me the smallest' means a heap. Usually one structure isn't enough, so I combine two, like a hash map that points into a linked list for an LRU cache.

Before coding, I say the invariant out loud, for example 'the map and the list always hold the same keys', and every method keeps it true. At the end I mention follow-ups: thread safety with a lock, and memory limits."
@deep
| Need | Structure |
|---|---|
| O(1) lookup by key | Hash map |
| O(1) move to front, remove any node | Doubly linked list + map to its nodes |
| O(1) add or remove at both ends | Deque |
| O(1) random element | Array + map from value to index |
| Smallest or largest so far | Heap |
| Sorted order with updates | Balanced BST, or a sorted list with bisect |
| Recent events in a time window | Queue of timestamps |
| Prefix lookups | Trie |
@trap
Coding before agreeing on the API. Ask what `get` should return for a missing key and what happens at full capacity. Those answers change the design.

### [2] LRU Cache
@lc 146
@ask Build a cache with a fixed capacity. get(key) and put(key, value) must be O(1). When full, remove the least recently used key.
@eg capacity 2: put(1,1), put(2,2), get(1) -> 1, put(3,3) removes key 2, get(2) -> -1
@tags design, hash map, doubly linked list
@hook A hash map for O(1) lookup, plus a doubly linked list ordered by use. Move a node to the front on every access, evict from the back.
@say
"I need O(1) lookup, which is a hash map, and O(1) 'which key is the least recently used', which is an ordering I can update in O(1). A doubly linked list does that: I can unlink any node in O(1) if I have a pointer to it, and the map gives me that pointer.

The most recently used node sits right after a dummy head, and the least recently used sits right before a dummy tail. The dummies mean no special cases for empty lists. On get, I move the node to the front. On put, I update or insert at the front, and if the size goes over capacity, I remove the node before the tail and delete its key from the map. That's why each node stores its key.

Every operation is O(1), and space is O(capacity). In Python, OrderedDict with move_to_end gives the same thing in a few lines, but interviewers usually want the real structure."
@code
```python
class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.map = {}                              # key -> node
        self.head, self.tail = Node(), Node()      # dummies: head.next is the newest
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, node):
        node.prev.next, node.next.prev = node.next, node.prev

    def _add_front(self, node):
        node.prev, node.next = self.head, self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key):
        if key not in self.map:
            return -1
        node = self.map[key]
        self._remove(node)                         # now the most recently used
        self._add_front(node)
        return node.val

    def put(self, key, value):
        if key in self.map:
            self._remove(self.map[key])
        node = Node(key, value)
        self.map[key] = node
        self._add_front(node)
        if len(self.map) > self.capacity:
            lru = self.tail.prev                   # least recently used
            self._remove(lru)
            del self.map[lru.key]
```
@time O(1) per operation
@space O(capacity)
@deep
The short Python version, good to mention after the real one:

```python
from collections import OrderedDict

class LRUCacheShort:
    def __init__(self, capacity):
        self.capacity, self.data = capacity, OrderedDict()

    def get(self, key):
        if key not in self.data:
            return -1
        self.data.move_to_end(key)          # most recent at the end
        return self.data[key]

    def put(self, key, value):
        self.data[key] = value
        self.data.move_to_end(key)
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)   # oldest at the front
```
@test
c = LRUCache(2)
c.put(1, 1); c.put(2, 2)
assert c.get(1) == 1
c.put(3, 3)
assert c.get(2) == -1
c.put(4, 4)
assert c.get(1) == -1
assert c.get(3) == 3 and c.get(4) == 4
c = LRUCache(2)
c.put(1, 1); c.put(2, 2); c.put(1, 10); c.put(3, 3)
assert c.get(1) == 10 and c.get(2) == -1

### [3] LFU Cache
@lc 460
@ask Like an LRU cache, but when full, remove the least frequently used key. Break ties by removing the least recently used among them. get and put in O(1).
@eg capacity 2: put(1,1), put(2,2), get(1), put(3,3) removes key 2 (used once), get(3), put(4,4) removes key 1
@tags design, hash map, linked list, ordered dict
@hook Group keys by use count. Each group is in LRU order. Track the smallest count so eviction is O(1).
@say
"I need to find the least frequently used key, and among those, the least recently used one. So I keep a map from each count to the keys with that count, in the order they were used. In Python, an OrderedDict per count does this. I also keep each key's value and count, and the current smallest count.

When a key is used, I move it from its count's group to the next count's group, at the end. If its old group becomes empty and it was the smallest count, the smallest count goes up by one. When I insert a new key into a full cache, I evict the first key in the smallest count's group, then add the new key with count 1, which makes the smallest count 1.

Every operation is O(1) and space is O(capacity)."
@code
```python
from collections import defaultdict, OrderedDict

class LFUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.info = {}                              # key -> [value, count]
        self.groups = defaultdict(OrderedDict)      # count -> keys, oldest first
        self.min_count = 0

    def _touch(self, key):                          # one more use of key
        count = self.info[key][1]
        del self.groups[count][key]
        if not self.groups[count]:
            del self.groups[count]
            if self.min_count == count:
                self.min_count += 1
        self.groups[count + 1][key] = None
        self.info[key][1] = count + 1

    def get(self, key):
        if key not in self.info:
            return -1
        self._touch(key)
        return self.info[key][0]

    def put(self, key, value):
        if self.capacity <= 0:
            return
        if key in self.info:
            self.info[key][0] = value
            self._touch(key)
            return
        if len(self.info) >= self.capacity:
            old, _ = self.groups[self.min_count].popitem(last=False)   # LFU, then LRU
            if not self.groups[self.min_count]:
                del self.groups[self.min_count]
            del self.info[old]
        self.info[key] = [value, 1]
        self.groups[1][key] = None
        self.min_count = 1
```
@time O(1) per operation
@space O(capacity)
@test
c = LFUCache(2)
c.put(1, 1); c.put(2, 2)
assert c.get(1) == 1
c.put(3, 3)
assert c.get(2) == -1
assert c.get(3) == 3
c.put(4, 4)
assert c.get(1) == -1
assert c.get(3) == 3 and c.get(4) == 4
z = LFUCache(0)
z.put(1, 1)
assert z.get(1) == -1

### [1] Implement Queue using Stacks
@lc 232
@ask Build a first-in, first-out queue using only two stacks.
@eg push 1, push 2, peek() -> 1, pop() -> 1, empty() -> false
@tags design, stack, queue
@hook An inbox stack for pushes and an outbox stack for pops. Refill the outbox only when it's empty, which reverses the order once.
@say
"A stack reverses order, and reversing twice gives the original order back. So I use two stacks. New items always go on the inbox. When I need the front of the queue, I take it from the outbox. If the outbox is empty, I first pour the whole inbox into it, which puts the oldest item on top.

The important rule is to refill only when the outbox is empty, otherwise newer items would jump ahead of older ones. Each item is moved at most once, from inbox to outbox, so every operation is O(1) amortized, even though one pop may move many items."
@code
```python
class MyQueue:
    def __init__(self):
        self.inbox, self.outbox = [], []

    def push(self, x):
        self.inbox.append(x)

    def _refill(self):
        if not self.outbox:                     # only when empty: keeps FIFO order
            while self.inbox:
                self.outbox.append(self.inbox.pop())

    def pop(self):
        self._refill()
        return self.outbox.pop()

    def peek(self):
        self._refill()
        return self.outbox[-1]

    def empty(self):
        return not self.inbox and not self.outbox
```
@time O(1) amortized per operation
@space O(n)
@test
q = MyQueue()
q.push(1); q.push(2)
assert q.peek() == 1
assert q.pop() == 1
assert not q.empty()
q.push(3)
assert q.pop() == 2 and q.pop() == 3
assert q.empty()

### [2] Insert Delete GetRandom O(1)
@lc 380
@ask Build a set with insert, remove and get_random, where every value is equally likely. All three in O(1) average time.
@eg insert(1) -> true, remove(2) -> false, insert(2) -> true, get_random() -> 1 or 2
@tags design, hash map, array, randomness
@hook An array for O(1) random picks, plus a map from value to its index. To remove, move the last value into the hole, then pop the end.
@say
"A hash set alone can't pick a random element in O(1). An array can, but removing from the middle of an array is O(n).

So I combine them: an array of values, and a map from each value to its index in the array. Insert appends to the array and records the index. To remove a value, I look up its index, copy the last value of the array into that spot, update the moved value's index in the map, then pop the last element and delete the value from the map. Popping the end is O(1). get_random picks a random index of the array.

All three are O(1) on average, and space is O(n)."
@code
```python
import random

class RandomizedSet:
    def __init__(self):
        self.values = []                 # for O(1) random picks
        self.index = {}                  # value -> its position in values

    def insert(self, val):
        if val in self.index:
            return False
        self.index[val] = len(self.values)
        self.values.append(val)
        return True

    def remove(self, val):
        if val not in self.index:
            return False
        i, last = self.index[val], self.values[-1]
        self.values[i] = last            # move the last value into the hole
        self.index[last] = i
        self.values.pop()
        del self.index[val]
        return True

    def get_random(self):
        return random.choice(self.values)
```
@time O(1) average per operation
@space O(n)
@trap
Deleting from the map before moving the last value. When the value you remove is itself the last one, you'd add it back to the map by mistake. Moving first, then deleting, handles that case.
@test
import random
from collections import Counter
random.seed(12)
rs = RandomizedSet()
assert rs.insert(1)
assert not rs.remove(2)
assert rs.insert(2)
assert rs.get_random() in (1, 2)
assert rs.remove(1)
assert not rs.insert(2)
assert rs.get_random() == 2
assert rs.remove(2) and rs.values == [] and rs.index == {}
for v in (1, 2, 3):
    rs.insert(v)
counts = Counter(rs.get_random() for _ in range(3000))
assert min(counts.values()) > 850
