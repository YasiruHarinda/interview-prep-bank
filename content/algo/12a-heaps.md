@section heap | Heaps and Priority Queues
@blurb Always know the smallest or largest item in O(1), with O(log n) push and pop. The tool for top k, k-way merges, scheduling and running medians.

### [1] Pattern: when do you use a heap?
@tags pattern, heap, priority queue
@hook Need the best item over and over while the data changes? Use a heap. For the top k, keep a min-heap of size k.
@say
"A heap is a tree stored in an array, where the smallest item is always on top in a min-heap. Reading the top is O(1), and pushing or popping is O(log n). Building one from a list is O(n).

I reach for a heap in four situations. **Top k or kth largest:** I keep a min-heap of size k, so the top is the kth largest and anything smaller gets popped. **Merging k sorted lists:** the heap holds the front of each list and always gives me the next smallest. **Scheduling:** always pick the most urgent or most frequent task. **Running median:** two heaps, one for the smaller half and one for the bigger half.

In Python, `heapq` is a min-heap only, so for a max-heap I push negative values. Tuples compare by their first item, so I add a tie-breaker like an index when the second item can't be compared."
@deep
```python
import heapq

nums = [5, 1, 8, 3]
heapq.heapify(nums)              # O(n), nums[0] is now the smallest
heapq.heappush(nums, 2)          # O(log n)
smallest = heapq.heappop(nums)   # O(log n)

max_heap = []
heapq.heappush(max_heap, -8)     # max-heap: store negatives
biggest = -max_heap[0]

# Top k largest with a min-heap of size k: O(n log k)
top = []
for x in data:
    heapq.heappush(top, x)
    if len(top) > k:
        heapq.heappop(top)       # drop the smallest of the k + 1

heapq.nlargest(3, data)          # built-in shortcuts
heapq.nsmallest(3, data, key=len)
```
| Problem | Heap setup |
|---|---|
| Kth largest, top k | Min-heap of size k |
| K closest points | Max-heap of size k (negative distance) |
| Merge k sorted lists | Min-heap of (value, list index, node) |
| Task scheduling | Max-heap of remaining counts |
| Median of a stream | Max-heap for the low half, min-heap for the high half |
| Dijkstra | Min-heap of (distance, node) |
@trap
Pushing `(priority, object)` where two priorities can be equal and the objects can't be compared, like ListNode. Python raises TypeError. Add a counter or index as the second item.

### [2] Kth Largest Element in an Array
@lc 215
@ask Return the kth largest element in an unsorted array (the kth in sorted order, not the kth distinct).
@eg nums = [3,2,1,5,6,4], k = 2  ->  5
@tags heap, quickselect
@hook Keep a min-heap of the k largest values seen. Its top is the kth largest. Quickselect gets O(n) on average.
@say
"Sorting works in O(n log n). Better, I keep a min-heap holding the k largest values seen so far. For each number I push it, and if the heap grows past k, I pop the smallest. At the end the heap holds the k largest values, and its top, the smallest of them, is the kth largest.

That's O(n log k) time and O(k) space, which is good when k is small or the data is a stream.

The faster answer is quickselect: pick a pivot, partition into bigger, equal and smaller, and only recurse into the part that contains the kth position. That's O(n) on average, but O(n squared) in the worst case unless the pivot is random."
@code
```python
import heapq

def find_kth_largest(nums, k):
    heap = []                        # min-heap of the k largest so far
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)      # drop the smallest
    return heap[0]
```
@time O(n log k)
@space O(k)
@deep
Quickselect, O(n) average. This version is short to write in an interview. An in-place partition saves the extra lists.

```python
import random

def quickselect(nums, k):            # kth largest
    pivot = random.choice(nums)
    bigger = [x for x in nums if x > pivot]
    equal = [x for x in nums if x == pivot]
    smaller = [x for x in nums if x < pivot]
    if k <= len(bigger):
        return quickselect(bigger, k)
    if k <= len(bigger) + len(equal):
        return pivot
    return quickselect(smaller, k - len(bigger) - len(equal))
```
@test
assert find_kth_largest([3, 2, 1, 5, 6, 4], 2) == 5
assert find_kth_largest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4) == 4
assert find_kth_largest([1], 1) == 1
assert find_kth_largest([2, 1], 2) == 1
assert find_kth_largest([-1, -1], 2) == -1

### [1] Kth Largest Element in a Stream
@lc 703
@ask Build a class that receives numbers one at a time and returns the kth largest value seen so far after each one.
@eg k = 3, nums = [4,5,8,2]; add(3) -> 4, add(5) -> 5, add(10) -> 5, add(9) -> 8
@tags heap, design, stream
@hook A min-heap that never holds more than k values. Its top is always the kth largest.
@say
"I keep a min-heap with at most k values: the k largest seen so far. When a new value arrives, I push it, and if the heap has more than k values, I pop the smallest. The top of the heap is then the kth largest, because exactly k minus 1 values are bigger than it.

Each add is O(log k), and the memory is O(k), no matter how long the stream is. A sorted list would need O(n) memory and O(n) inserts."
@code
```python
import heapq

class KthLargest:
    def __init__(self, k, nums):
        self.k = k
        self.heap = []                 # the k largest values, smallest on top
        for x in nums:
            self.add(x)

    def add(self, val):
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)
        return self.heap[0]
```
@time O(log k) per add
@space O(k)
@test
kl = KthLargest(3, [4, 5, 8, 2])
assert [kl.add(3), kl.add(5), kl.add(10), kl.add(9), kl.add(4)] == [4, 5, 5, 8, 8]
assert KthLargest(1, []).add(-3) == -3

### [1] Last Stone Weight
@lc 1046
@ask Each turn, smash the two heaviest stones. Equal stones both break, otherwise the difference remains as a stone. Return the last stone's weight, or 0.
@eg [2,7,4,1,8,1]  ->  1
@tags heap, simulation
@hook Max-heap: pop the two biggest, push back the difference if it isn't zero. Python needs negative values for a max-heap.
@say
"Each turn I need the two heaviest stones, and the set keeps changing, which is a job for a max-heap.

Python's heapq is a min-heap, so I store negative weights. Each turn I pop twice to get the two heaviest. If they differ, I push back the difference. When one or zero stones are left, I return its weight, or 0.

Building the heap is O(n), and each turn is O(log n), with at most n turns: O(n log n) time and O(n) space."
@code
```python
import heapq

def last_stone_weight(stones):
    heap = [-s for s in stones]        # max-heap through negatives
    heapq.heapify(heap)
    while len(heap) > 1:
        first = -heapq.heappop(heap)   # heaviest
        second = -heapq.heappop(heap)
        if first != second:
            heapq.heappush(heap, -(first - second))
    return -heap[0] if heap else 0
```
@time O(n log n)
@space O(n)
@test
assert last_stone_weight([2, 7, 4, 1, 8, 1]) == 1
assert last_stone_weight([1]) == 1
assert last_stone_weight([2, 2]) == 0
assert last_stone_weight([]) == 0
assert last_stone_weight([10, 4]) == 6

### [2] K Closest Points to Origin
@lc 973
@ask Return the k points closest to (0, 0), in any order.
@eg points = [[3,3],[5,-1],[-2,4]], k = 2  ->  [[3,3],[-2,4]]
@tags heap, top k, geometry
@hook Max-heap of size k on squared distance. When it grows past k, drop the farthest point.
@say
"I compare squared distances, x squared plus y squared, because the square root doesn't change the order and avoids floating point.

I keep a max-heap of the k closest points so far, using the negative distance because Python only has a min-heap. For each point I push it, and if the heap has more than k points, I pop the farthest one. At the end the heap holds the k closest.

O(n log k) time and O(k) space. Sorting all points is O(n log n), and quickselect gets O(n) on average."
@code
```python
import heapq

def k_closest(points, k):
    heap = []                          # max-heap of size k (negative distance)
    for x, y in points:
        dist = x * x + y * y           # no sqrt needed to compare
        heapq.heappush(heap, (-dist, x, y))
        if len(heap) > k:
            heapq.heappop(heap)        # drop the farthest
    return [[x, y] for _, x, y in heap]
```
@time O(n log k)
@space O(k)
@test
assert sorted(k_closest([[1, 3], [-2, 2]], 1)) == [[-2, 2]]
assert sorted(k_closest([[3, 3], [5, -1], [-2, 4]], 2)) == [[-2, 4], [3, 3]]
assert k_closest([[0, 1]], 1) == [[0, 1]]
