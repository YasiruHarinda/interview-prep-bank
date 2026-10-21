@section design | Design a Data Structure

### [1] Design HashMap
@lc 706
@ask Build a hash map with put, get and remove, without using built-in hash table libraries.
@eg put(1,1), put(2,2), get(1) -> 1, get(3) -> -1, put(2,1), get(2) -> 1, remove(2), get(2) -> -1
@tags design, hashing, separate chaining
@hook An array of buckets. hash(key) % size picks the bucket, and each bucket is a small list of [key, value] pairs (separate chaining).
@say
"I keep an array of buckets. To find a key's bucket, I take its hash modulo the number of buckets. Different keys can land in the same bucket, a collision, so each bucket is a list of key-value pairs. That's called separate chaining.

put looks through the bucket and updates the pair if the key exists, otherwise it appends a new pair. get scans the bucket for the key. remove deletes the pair.

With a good hash and enough buckets, each bucket stays short, so operations are O(1) on average and O(n) in the worst case. A real hash map also resizes: when the number of items passes about 0.75 times the number of buckets, it doubles the array and re-inserts everything, which keeps the average cost O(1)."
@code
```python
class MyHashMap:
    def __init__(self, size=1024):
        self.buckets = [[] for _ in range(size)]   # separate chaining

    def _bucket(self, key):
        return self.buckets[hash(key) % len(self.buckets)]

    def put(self, key, value):
        bucket = self._bucket(key)
        for pair in bucket:
            if pair[0] == key:
                pair[1] = value                    # update in place
                return
        bucket.append([key, value])

    def get(self, key):
        for k, v in self._bucket(key):
            if k == key:
                return v
        return -1

    def remove(self, key):
        bucket = self._bucket(key)
        for i, (k, _) in enumerate(bucket):
            if k == key:
                bucket.pop(i)
                return
```
@time O(1) average, O(n) worst
@space O(n + buckets)
@follow How else can you handle collisions?
Open addressing: store everything in the array itself and, on a collision, probe the next slots (linear or quadratic probing). It's cache-friendly, but deletes need "tombstone" markers so searches don't stop early.
@test
m = MyHashMap()
m.put(1, 1); m.put(2, 2)
assert m.get(1) == 1 and m.get(3) == -1
m.put(2, 1)
assert m.get(2) == 1
m.remove(2)
assert m.get(2) == -1
small, ref = MyHashMap(size=2), {}
for k in range(50):
    small.put(k, k * k)
    ref[k] = k * k
for k in range(0, 50, 3):
    small.remove(k)
    del ref[k]
assert all(small.get(k) == ref.get(k, -1) for k in range(60))

### [2] Design Hit Counter
@lc 362
@ask Record hits with a timestamp in seconds, and return how many hits happened in the past 5 minutes (300 seconds). Timestamps never go backwards.
@eg hit(1), hit(2), hit(3), get_hits(4) -> 3, hit(300), get_hits(300) -> 4, get_hits(301) -> 3
@tags design, queue, sliding window
@hook A queue of timestamps. Before counting, drop the ones older than 300 seconds from the front.
@say
"Hits arrive in time order, so a queue keeps them sorted for free. hit appends the timestamp. get_hits first removes timestamps from the front that are 300 or more seconds old, then returns the queue's length.

Each timestamp is added once and removed once, so both operations are O(1) amortized. Memory is the number of hits in the last 5 minutes.

If there can be thousands of hits per second, I'd store pairs of timestamp and count instead, or use a fixed array of 300 buckets, one per second, which caps the memory."
@code
```python
from collections import deque

class HitCounter:
    def __init__(self):
        self.hits = deque()              # timestamps, oldest first

    def hit(self, timestamp):
        self.hits.append(timestamp)

    def get_hits(self, timestamp):
        while self.hits and self.hits[0] <= timestamp - 300:
            self.hits.popleft()          # older than 5 minutes
        return len(self.hits)
```
@time O(1) amortized
@space O(hits in the window)
@test
hc = HitCounter()
hc.hit(1); hc.hit(2); hc.hit(3)
assert hc.get_hits(4) == 3
hc.hit(300)
assert hc.get_hits(300) == 4
assert hc.get_hits(301) == 3
assert hc.get_hits(1000) == 0

### [2] Design Circular Queue
@lc 622
@ask Build a fixed-size queue on an array, where the end wraps around to the start: en_queue, de_queue, front, rear, is_empty, is_full.
@eg k = 3: en_queue 1, 2, 3 -> true, en_queue(4) -> false, rear() -> 3, de_queue() -> true, en_queue(4) -> true, rear() -> 4
@tags design, array, queue, ring buffer
@hook Store the head index and the size. The tail is (head + size) % capacity. Modulo makes the indexes wrap around.
@say
"A circular queue, or ring buffer, reuses a fixed array. I store the index of the front item and the current size. The next free slot is head plus size, modulo the capacity, and the last item is one before that. Removing just moves head forward by one, modulo the capacity.

Keeping a size counter avoids the classic confusion where head equals tail could mean either empty or full.

Every operation is O(1), and the space is fixed at O(k). Ring buffers are used for things like network packet queues and logs that keep only the newest entries."
@code
```python
class MyCircularQueue:
    def __init__(self, k):
        self.data = [0] * k
        self.head = 0                    # index of the front item
        self.size = 0

    def en_queue(self, value):
        if self.is_full():
            return False
        self.data[(self.head + self.size) % len(self.data)] = value
        self.size += 1
        return True

    def de_queue(self):
        if self.is_empty():
            return False
        self.head = (self.head + 1) % len(self.data)
        self.size -= 1
        return True

    def front(self):
        return -1 if self.is_empty() else self.data[self.head]

    def rear(self):
        if self.is_empty():
            return -1
        return self.data[(self.head + self.size - 1) % len(self.data)]

    def is_empty(self):
        return self.size == 0

    def is_full(self):
        return self.size == len(self.data)
```
@time O(1) per operation
@space O(k)
@test
q = MyCircularQueue(3)
assert q.en_queue(1) and q.en_queue(2) and q.en_queue(3)
assert not q.en_queue(4)
assert q.rear() == 3 and q.is_full()
assert q.de_queue()
assert q.en_queue(4)
assert q.rear() == 4 and q.front() == 2
e = MyCircularQueue(1)
assert e.front() == -1 and e.rear() == -1 and not e.de_queue()

### [2] Design Browser History
@lc 1472
@ask Start on a homepage. Support visit(url), which clears the forward history, back(steps) and forward(steps), each returning the current page.
@eg visit google, facebook, youtube; back(1) -> facebook; back(1) -> google; forward(1) -> facebook; visit linkedin; forward(2) -> linkedin
@tags design, array, pointers
@hook One list of pages, a pointer to the current page, and a pointer to the last valid page. visit overwrites and cuts off the forward pages.
@say
"Two stacks work, but one array with two indexes is simpler and gives O(1) for every operation.

`current` is the page I'm on, and `last` is the last page I could go forward to. visit moves `current` forward by one, writes the URL there, overwriting old forward history, and sets `last` to `current`, which forgets everything after it. back moves `current` back, but not below 0. forward moves it ahead, but not past `last`.

O(1) for visit, back and forward, and O(n) space for the pages visited."
@code
```python
class BrowserHistory:
    def __init__(self, homepage):
        self.pages = [homepage]
        self.current = 0                 # the page we are on
        self.last = 0                    # the furthest page forward() may reach

    def visit(self, url):
        self.current += 1
        if self.current == len(self.pages):
            self.pages.append(url)
        else:
            self.pages[self.current] = url
        self.last = self.current         # forward history is gone

    def back(self, steps):
        self.current = max(0, self.current - steps)
        return self.pages[self.current]

    def forward(self, steps):
        self.current = min(self.last, self.current + steps)
        return self.pages[self.current]
```
@time O(1) per operation
@space O(n)
@test
bh = BrowserHistory("leetcode.com")
bh.visit("google.com"); bh.visit("facebook.com"); bh.visit("youtube.com")
assert bh.back(1) == "facebook.com"
assert bh.back(1) == "google.com"
assert bh.forward(1) == "facebook.com"
bh.visit("linkedin.com")
assert bh.forward(2) == "linkedin.com"
assert bh.back(2) == "google.com"
assert bh.back(7) == "leetcode.com"

### [1] Logger Rate Limiter
@lc 359
@ask should_print_message(timestamp, message) returns true only if the same message wasn't printed in the last 10 seconds. Timestamps arrive in order.
@eg (1,"foo") -> true, (2,"bar") -> true, (3,"foo") -> false, (11,"foo") -> true
@tags design, hash map
@hook Map each message to the earliest time it may print again. Allow it if now is at least that time, then push the time to now + 10.
@say
"I keep a hash map from each message to the earliest timestamp when it's allowed to print again. When a message arrives, if the current time is before that, I return false. Otherwise I return true and set its next allowed time to now plus 10.

Each call is O(1). The map grows with every distinct message, so for a long-running service I'd clean it up, for example by keeping a queue of recent messages and removing entries older than 10 seconds."
@code
```python
class Logger:
    def __init__(self):
        self.next_allowed = {}           # message -> first time it may print again

    def should_print_message(self, timestamp, message):
        if timestamp < self.next_allowed.get(message, 0):
            return False
        self.next_allowed[message] = timestamp + 10
        return True
```
@time O(1) per call
@space O(distinct messages)
@test
lg = Logger()
assert lg.should_print_message(1, "foo")
assert lg.should_print_message(2, "bar")
assert not lg.should_print_message(3, "foo")
assert not lg.should_print_message(8, "bar")
assert not lg.should_print_message(10, "foo")
assert lg.should_print_message(11, "foo")

### [2] Design Twitter
@lc 355
@ask Support post_tweet, follow, unfollow and get_news_feed(user), which returns the 10 most recent tweet ids from the user and the people they follow, newest first.
@eg post(1, 5); feed(1) -> [5]; follow(1, 2); post(2, 6); feed(1) -> [6,5]; unfollow(1, 2); feed(1) -> [5]
@tags design, heap, hash map, k-way merge
@hook Give every tweet a global time. The feed takes each followed user's latest 10 tweets and picks the 10 newest with a heap.
@say
"I keep, for each user, a list of their tweets with a global time stamp, and a set of the users they follow. Posting appends to the user's list, and follow and unfollow add to or remove from the set. A user can't follow themselves.

For the feed, only the 10 newest tweets of each relevant user can matter, so I collect those from the user and everyone they follow and take the 10 newest with a heap. My clock counts down, so newer tweets have smaller numbers and `nsmallest` gives the newest first.

With F followed users, the feed is O(F times 10 times log 10), basically O(F). For users who follow thousands of accounts, I'd do a true k-way merge with a heap that holds one pointer per user. Real systems precompute feeds when tweets are posted, called fan-out on write."
@code
```python
import heapq
from collections import defaultdict
from itertools import count

class Twitter:
    def __init__(self):
        self.clock = count(0, -1)               # newer tweets get smaller numbers
        self.tweets = defaultdict(list)         # user -> [(time, tweet_id)]
        self.follows = defaultdict(set)

    def post_tweet(self, user_id, tweet_id):
        self.tweets[user_id].append((next(self.clock), tweet_id))

    def get_news_feed(self, user_id):
        users = self.follows[user_id] | {user_id}
        recent = [t for u in users for t in self.tweets[u][-10:]]   # 10 per user is enough
        return [tweet_id for _, tweet_id in heapq.nsmallest(10, recent)]

    def follow(self, follower_id, followee_id):
        if follower_id != followee_id:
            self.follows[follower_id].add(followee_id)

    def unfollow(self, follower_id, followee_id):
        self.follows[follower_id].discard(followee_id)
```
@time O(F) per feed, O(1) for the others
@space O(tweets + follows)
@test
tw = Twitter()
tw.post_tweet(1, 5)
assert tw.get_news_feed(1) == [5]
tw.follow(1, 2)
tw.post_tweet(2, 6)
assert tw.get_news_feed(1) == [6, 5]
tw.unfollow(1, 2)
assert tw.get_news_feed(1) == [5]
t2 = Twitter()
for i in range(12):
    t2.post_tweet(7, i)
assert t2.get_news_feed(7) == [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
t2.follow(7, 7)
assert t2.get_news_feed(7)[0] == 11
