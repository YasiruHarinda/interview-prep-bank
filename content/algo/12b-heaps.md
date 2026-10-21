@section heap | Heaps and Priority Queues

### [2] Top K Frequent Words
@lc 692
@ask Return the k most frequent words, sorted by frequency from high to low. Words with the same frequency are sorted alphabetically.
@eg ["i","love","leetcode","i","love","coding"], k = 2  ->  ["i","love"]
@tags heap, hash map, sorting
@hook Count with a hash map, then take the k smallest by the key (-count, word). The minus sign puts high counts first.
@say
"I count the words with a Counter. Then I need the top k with a two-part order: higher count first, and for ties, the word that comes first alphabetically.

A neat trick is to sort or select by the key minus count, then word. The smallest key has the highest count, and ties fall back to alphabetical order. `heapq.nsmallest` with that key returns the k best in the right order in O(n log k).

Sorting all words by the same key is O(n log n) and also fine for an interview. Space is O(n) for the counts."
@code
```python
import heapq
from collections import Counter

def top_k_frequent_words(words, k):
    counts = Counter(words)
    # Smallest key first: highest count, then alphabetical order.
    return heapq.nsmallest(k, counts.keys(), key=lambda w: (-counts[w], w))
```
@time O(n log k)
@space O(n)
@trap
Using a min-heap of `(count, word)` of size k and popping the smallest. For ties it would pop the alphabetically first word, which is the one you want to keep. The order of the tie-breaker must be reversed too.
@test
assert top_k_frequent_words(["i", "love", "leetcode", "i", "love", "coding"], 2) == ["i", "love"]
assert top_k_frequent_words(["the", "day", "is", "sunny", "the", "the", "the", "sunny", "is", "is"], 4) == ["the", "is", "sunny", "day"]
assert top_k_frequent_words(["a", "b", "c"], 2) == ["a", "b"]

### [2] Task Scheduler
@lc 621
@ask Each task takes one time unit. The same task needs at least n units between two runs, and the CPU may sit idle. Return the minimum total time.
@eg tasks = ["A","A","A","B","B","B"], n = 2  ->  8   (A B idle A B idle A B)
@tags heap, greedy, math
@hook The most frequent task sets the frame: (max_count - 1) blocks of size n + 1, plus one slot for each task tied for the max count.
@say
"The most frequent task decides the shape. If A appears max_count times, there are max_count minus 1 gaps between its runs, and each gap with A itself is a block of n plus 1 slots. Other tasks fill the idle slots in those blocks. After the last block, each task that also appears max_count times needs one more slot at the end.

So the answer is (max_count minus 1) times (n plus 1), plus the number of tasks tied for the max count. But if there are so many different tasks that no idle time is needed, the answer is simply the number of tasks. I return the larger of the two.

That's O(n) time and O(1) space, since there are at most 26 task types. A max-heap simulation also works and is easier to come up with: each step, run the most frequent task that isn't cooling down."
@code
```python
import heapq
from collections import Counter, deque

def least_interval(tasks, n):
    counts = Counter(tasks).values()
    max_count = max(counts)
    num_max = sum(1 for c in counts if c == max_count)   # tasks tied for most
    return max(len(tasks), (max_count - 1) * (n + 1) + num_max)

def least_interval_heap(tasks, n):
    heap = [-c for c in Counter(tasks).values()]   # most remaining on top
    heapq.heapify(heap)
    cooldown = deque()               # (remaining as a negative, time it is ready)
    time = 0
    while heap or cooldown:
        time += 1
        if heap:
            left = heapq.heappop(heap) + 1         # run one instance
            if left:
                cooldown.append((left, time + n))
        if cooldown and cooldown[0][1] == time:
            heapq.heappush(heap, cooldown.popleft()[0])
    return time
```
@time O(n) for the formula, O(n log k) for the heap
@space O(1), at most 26 task types
@test
for f in (least_interval, least_interval_heap):
    assert f(["A", "A", "A", "B", "B", "B"], 2) == 8
    assert f(["A", "C", "A", "B", "D", "B"], 1) == 6
    assert f(["A", "A", "A", "B", "B", "B"], 0) == 6
    assert f(["A", "A", "A", "A", "A", "A", "B", "C", "D", "E", "F", "G"], 2) == 16
    assert f(["A"], 5) == 1

### [2] Reorganize String
@lc 767
@ask Rearrange a string so that no two neighbours are the same letter. Return "" if that's impossible.
@eg "aab" -> "aba",  "aaab" -> ""
@tags heap, greedy
@hook Always place the most common remaining letter, but hold the letter you just used out of the heap for one turn.
@say
"Greedy: at each position, place the letter with the most copies left, since it's the hardest to fit. But it can't be the same as the letter I just placed.

So I keep a max-heap of counts. Each step I pop the most common letter, append it, and then push back the letter I held from the previous step. The letter I just used goes on hold, so it can't be picked next. If the heap runs empty while a letter is still on hold, I couldn't finish, and I return an empty string.

It's impossible exactly when one letter appears more than (n plus 1) divided by 2 times. O(n log k) time, where k is the number of distinct letters, and O(k) space."
@code
```python
import heapq
from collections import Counter

def reorganize_string(s):
    heap = [(-count, ch) for ch, count in Counter(s).items()]
    heapq.heapify(heap)
    result = []
    held = None                         # the letter used last, out for one turn
    while heap:
        count, ch = heapq.heappop(heap)
        result.append(ch)
        if held:
            heapq.heappush(heap, held)  # the held letter may be used again
        count += 1                      # one copy used (counts are negative)
        held = (count, ch) if count else None
    return "".join(result) if len(result) == len(s) else ""
```
@time O(n log k)
@space O(k)
@test
def ok(s, r):
    return sorted(s) == sorted(r) and all(a != b for a, b in zip(r, r[1:]))
assert ok("aab", reorganize_string("aab"))
assert reorganize_string("aaab") == ""
assert ok("vvvlo", reorganize_string("vvvlo"))
assert reorganize_string("") == ""
assert reorganize_string("a") == "a"
assert ok("aabbcc", reorganize_string("aabbcc"))

### [3] Merge K Sorted Lists
@lc 23
@ask Merge k sorted linked lists into one sorted list.
@eg [1->4->5, 1->3->4, 2->6]  ->  1->1->2->3->4->4->5->6
@tags heap, linked list, k-way merge
@hook Put the front node of each list in a min-heap. Pop the smallest, attach it, and push its next node.
@say
"Merging the lists one at a time is O(k times N), where N is the total number of nodes. Instead I use a min-heap that holds the current front node of each list.

I pop the smallest node, attach it to the result, and if it has a next node, I push that next node. The heap never holds more than k nodes, so each push and pop is O(log k). I put the list index in the tuple as a tie-breaker, because two nodes can have the same value and Python can't compare nodes.

O(N log k) time and O(k) space. Merging the lists in pairs, like merge sort, also gives O(N log k)."
@code
```python
import heapq

def merge_k_lists(lists):
    heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))   # i breaks ties
    dummy = tail = ListNode()
    while heap:
        _, i, node = heapq.heappop(heap)
        tail.next = node
        tail = node
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next
```
@time O(N log k), N = total nodes
@space O(k)
@trap
Leaving the tie-breaker out. With two equal values, Python compares the ListNode objects and raises `TypeError`.
@test
lists = [build_list([1, 4, 5]), build_list([1, 3, 4]), build_list([2, 6])]
assert list_vals(merge_k_lists(lists)) == [1, 1, 2, 3, 4, 4, 5, 6]
assert merge_k_lists([]) is None
assert merge_k_lists([None]) is None
assert list_vals(merge_k_lists([build_list([2]), None, build_list([-1])])) == [-1, 2]

### [3] Find Median from Data Stream
@lc 295
@ask Build a class with add_num(num) and find_median() for a stream of numbers.
@eg add 1, add 2 -> median 1.5; add 3 -> median 2
@tags heap, two heaps, design
@hook Two heaps: a max-heap for the smaller half and a min-heap for the bigger half. The median sits on their tops.
@say
"Keeping a sorted list makes each insert O(n). Instead I split the numbers into two halves. The smaller half goes in a max-heap, so I can see its biggest value. The bigger half goes in a min-heap, so I can see its smallest value.

To add a number, I push it into the small half, then move the small half's biggest value to the big half. That keeps every small value at most every big value. Then, if the big half has more items, I move its smallest back. So the small half always has the same number of items or one more.

The median is the small half's top when the total is odd, or the average of the two tops when it's even. add_num is O(log n) and find_median is O(1)."
@code
```python
import heapq

class MedianFinder:
    def __init__(self):
        self.low = []      # max-heap (negatives): the smaller half
        self.high = []     # min-heap: the bigger half

    def add_num(self, num):
        heapq.heappush(self.low, -num)
        heapq.heappush(self.high, -heapq.heappop(self.low))   # keep low <= high
        if len(self.high) > len(self.low):                   # low may be 1 bigger
            heapq.heappush(self.low, -heapq.heappop(self.high))

    def find_median(self):
        if len(self.low) > len(self.high):
            return -self.low[0]
        return (-self.low[0] + self.high[0]) / 2
```
@time O(log n) add, O(1) median
@space O(n)
@follow What if all numbers are integers between 0 and 100?
Keep a count array of 101 buckets and walk it to find the middle. Both operations become O(100), which is O(1).
@test
mf = MedianFinder()
mf.add_num(1); mf.add_num(2)
assert mf.find_median() == 1.5
mf.add_num(3)
assert mf.find_median() == 2
mf.add_num(-1)
assert mf.find_median() == 1.5
mf2 = MedianFinder()
got = []
for x in [5, 15, 1, 3]:
    mf2.add_num(x)
    got.append(mf2.find_median())
assert got == [5, 10, 5, 4]
