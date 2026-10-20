@section coding | Classic Coding Problems
@blurb The problems that keep coming back. Each answer is what you would say while solving it, with clean Python in the deep dive.

### [1] Two Sum: return the indices of two numbers that add up to a target.
@tags arrays, hash map
@hook For each number, ask a hash map "have I already seen target minus me?" One pass, O(n).
@say
"The brute force is checking every pair, which is O(n squared).

To do better, I walk the array once and keep a hash map from each value I've seen to its index. For each number x, the partner I need is target minus x. If that partner is already in the map, I've found the answer. Otherwise I store x with its index and move on. Checking before inserting also handles the case where the same element would be used twice.

That's O(n) time and O(n) space. If the array were sorted and I only needed the values, I could use two pointers with O(1) space instead."
@deep
```python
def two_sum(nums, target):
    seen = {}                       # value -> index
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []
```
Test cases: `[2,7,11,15], 9 -> [0,1]`; duplicates `[3,3], 6 -> [0,1]`; negatives `[-1,4,5], 3 -> [0,1]`; no answer.
@follow What if you need all unique pairs, not just one?
Sort, then use two pointers and skip duplicate values as you move each pointer. O(n log n) time and no extra map.

### [1] Valid Parentheses: is a string of brackets balanced?
@tags stack, strings
@hook Push openers, pop on closers, and the popped opener must match. The stack must be empty at the end.
@say
"I use a stack. I scan the string: every opening bracket gets pushed. For every closing bracket, the stack must not be empty and the top must be the matching opener, so I pop and compare. If it doesn't match, the string is invalid. At the end, the stack must be empty, otherwise some brackets were never closed.

It's O(n) time and O(n) space in the worst case. A quick early exit: an odd-length string can never be valid."
@deep
```python
def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack
```
Edge cases: empty string (valid), `"(]"`, `"(("`, `"))"`.

### [1] Reverse a singly linked list.
@tags linked list, pointers
@hook Walk the list flipping each next pointer, keeping track of prev, curr and next.
@say
"I'll do it iteratively with three pointers: previous, current and next. Previous starts as null and current at the head. For each node, I save current.next, point current.next back at previous, then move previous and current one step forward. When current becomes null, previous is the new head.

It's O(n) time and O(1) space. There's also a recursive version: reverse the rest of the list, then make the next node point back at the current node and cut the current node's next pointer. It's elegant but uses O(n) stack space, so for long lists I prefer the iterative one."
@deep
```python
def reverse_list(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev, curr = curr, nxt
    return prev

def reverse_recursive(head):
    if head is None or head.next is None:
        return head
    new_head = reverse_recursive(head.next)
    head.next.next = head
    head.next = None
    return new_head
```
@trap
Losing the rest of the list by overwriting `curr.next` before saving it.

### [1] Detect a cycle in a linked list, and find where it starts.
@tags linked list, two pointers, floyd
@hook Tortoise and hare: if fast and slow meet, there's a cycle. Reset one to the head and step both by one; they meet at the start.
@say
"I use Floyd's algorithm. A slow pointer moves one step at a time and a fast pointer moves two. If there's no cycle, fast reaches the end. If there is one, fast eventually laps slow and they meet inside the cycle. That's O(n) time and O(1) space, versus O(n) space for storing visited nodes in a set.

To find where the cycle starts, after they meet I move one pointer back to the head and advance both one step at a time. They meet exactly at the cycle's entry. The reason is that the distance from the head to the entry equals the distance from the meeting point to the entry, going around the cycle."
@deep
```python
def detect_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            slow = head
            while slow is not fast:
                slow, fast = slow.next, fast.next
            return slow          # entry node
    return None
```
The same idea finds the duplicate number in an array of n+1 values in [1, n] without modifying it.

### [1] Merge two sorted linked lists.
@tags linked list, merge
@hook A dummy head plus a tail pointer. Always attach the smaller node, then append whatever is left.
@say
"I create a dummy node to act as the start of the result, and a tail pointer. While both lists have nodes, I compare their heads, attach the smaller one to tail, and advance that list. When one list runs out, I attach the rest of the other one directly, since it's already sorted. The answer is dummy.next.

That's O(n plus m) time and O(1) extra space, because I'm relinking existing nodes, not creating new ones. The dummy node removes the special case of choosing the head."
@deep
```python
def merge_two(a, b):
    dummy = tail = ListNode()
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next
```

### [1] Best Time to Buy and Sell Stock: find the maximum profit from one buy and one sell.
@tags arrays, greedy
@hook Track the cheapest price so far; at each day, profit is today minus that minimum.
@say
"The brute force checks every buy-sell pair in O(n squared). But for each day, the best buy is simply the lowest price before it. So I scan once, keeping the minimum price seen so far and the best profit. At each price, I update the best profit with price minus the minimum, then update the minimum.

That's O(n) time and O(1) space. If prices only fall, the answer is zero, since we can choose not to trade."
@deep
```python
def max_profit(prices):
    lowest, best = float("inf"), 0
    for p in prices:
        lowest = min(lowest, p)
        best = max(best, p - lowest)
    return best
```
Variant: unlimited transactions means summing every positive day-to-day increase.

### [1] Maximum Subarray: find the contiguous subarray with the largest sum.
@tags arrays, dynamic programming, kadane
@hook Kadane: at each element, either extend the current run or start fresh. Keep the best seen.
@say
"I use Kadane's algorithm. I walk the array keeping two values: the best sum of a subarray ending at the current position, and the best overall. At each element, the best subarray ending here is either the element alone or the element plus the best subarray ending at the previous position, whichever is bigger. In other words, if the running sum has gone negative, it can only hurt, so I start fresh.

It's O(n) time and O(1) space. It's really a tiny dynamic programming solution. If all numbers are negative, it correctly returns the largest single element, as long as I initialise with the first element rather than zero."
@deep
```python
def max_subarray(nums):
    cur = best = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
```

### [2] Group Anagrams: group words that are anagrams of each other.
@tags hash map, strings
@hook Give every word a canonical key (sorted letters or letter counts) and bucket by key.
@say
"Two words are anagrams if they have the same letters in the same quantities. So I compute a canonical key for each word and group words by key in a hash map.

The simplest key is the word with its letters sorted, so 'eat', 'tea' and 'ate' all map to 'aet'. That's O(n times k log k), where k is the word length. For a faster key, I can count letters into a 26-length array and use it as a tuple, giving O(n times k). Then I return the map's values."
@deep
```python
from collections import defaultdict

def group_anagrams(words):
    groups = defaultdict(list)
    for w in words:
        counts = [0] * 26
        for ch in w:
            counts[ord(ch) - ord("a")] += 1
        groups[tuple(counts)].append(w)
    return list(groups.values())
```

### [2] Top K Frequent Elements.
@tags heap, hash map, bucket sort
@hook Count with a hash map, then a min-heap of size k (n log k) or bucket by frequency (n).
@say
"First I count frequencies with a hash map, which is O(n). Then I need the k keys with the highest counts.

One option is a min-heap of size k: push each element with its count, and pop the smallest whenever the heap exceeds k. That's O(n log k), which is great when k is small.

There's also an O(n) approach with bucket sort: frequencies are between 1 and n, so I create n plus one buckets indexed by frequency, drop each element in its bucket, and read buckets from the highest frequency down until I have k elements. I'd mention both and pick the heap if the data streams in, or the buckets if I have it all in memory."
@deep
```python
from collections import Counter
import heapq

def top_k_frequent(nums, k):
    counts = Counter(nums)
    return heapq.nlargest(k, counts.keys(), key=counts.get)   # O(n log k)

def top_k_bucket(nums, k):
    counts = Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]
    for x, c in counts.items():
        buckets[c].append(x)
    out = []
    for c in range(len(buckets) - 1, 0, -1):
        for x in buckets[c]:
            out.append(x)
            if len(out) == k:
                return out
    return out
```

### [2] Merge Intervals: merge all overlapping intervals.
@tags arrays, sorting, intervals
@hook Sort by start. Walk once: overlap means stretch the last merged end, otherwise start a new interval.
@say
"I sort the intervals by start time, which is O(n log n). Then I walk through them with a result list. If the current interval starts after the end of the last merged interval, there's no overlap, so I append it. Otherwise they overlap, and I extend the last merged interval's end to the maximum of both ends. Taking the maximum matters for cases where one interval completely contains the next.

Overall O(n log n) time for the sort, and O(n) for the output. I'd confirm with the interviewer whether touching intervals like 1 to 2 and 2 to 3 should merge."
@deep
```python
def merge(intervals):
    intervals.sort(key=lambda iv: iv[0])
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
```
Related: insert an interval, meeting rooms (can one person attend all?), minimum meeting rooms (sort starts and ends, or a min-heap of end times).

### [2] Number of Islands: count connected groups of land in a grid.
@tags graphs, grid, bfs, dfs
@hook Scan the grid; each unvisited land cell starts a new island, and a flood fill marks the whole island.
@say
"I treat the grid as a graph where each land cell connects to its four neighbours. I scan every cell. When I hit land that hasn't been visited, that's a new island, so I increment the count and flood fill from it with DFS or BFS, marking every connected land cell as visited so it isn't counted again.

Every cell is visited a constant number of times, so it's O(rows times columns) time. Space is O(rows times columns) in the worst case for the recursion or queue. To save memory I can mark visited cells by overwriting them in the grid, if I'm allowed to modify the input. For very large grids I'd use BFS or an iterative DFS to avoid recursion limits."
@deep
```python
def num_islands(grid):
    if not grid: return 0
    rows, cols, count = len(grid), len(grid[0]), 0

    def sink(r, c):
        stack = [(r, c)]
        while stack:
            r, c = stack.pop()
            if 0 <= r < rows and 0 <= c < cols and grid[r][c] == "1":
                grid[r][c] = "0"
                stack.extend(((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)))

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                sink(r, c)
    return count
```

### [2] Product of Array Except Self, without division.
@tags arrays, prefix
@hook Answer at i = product of everything left of i times everything right of i. Two passes.
@say
"For each index, the answer is the product of all elements to its left times the product of all elements to its right.

I do two passes. In the first pass, left to right, I fill the output so that output of i holds the product of everything before i. In the second pass, right to left, I keep a running product of everything after i and multiply it in. That's O(n) time, and O(1) extra space apart from the output array.

Avoiding division matters because of zeros: one zero makes every other answer zero, and dividing by it would crash."
@deep
```python
def product_except_self(nums):
    n = len(nums)
    out = [1] * n
    for i in range(1, n):
        out[i] = out[i - 1] * nums[i - 1]
    right = 1
    for i in range(n - 1, -1, -1):
        out[i] *= right
        right *= nums[i]
    return out
```

### [2] Lowest Common Ancestor of two nodes in a binary tree.
@tags trees, recursion
@hook Recurse: if both sides find a target, this node is the LCA; otherwise pass up whichever side found something.
@say
"For a general binary tree, I use recursion. The function returns a node if it finds p or q in that subtree, or null otherwise.

At each node: if it's null, or it's p or q, I return it. Otherwise I recurse left and right. If both sides return something, p and q are in different subtrees, so the current node is their lowest common ancestor. If only one side returns something, I pass that result up.

It visits each node once, so O(n) time and O(h) space for the recursion. If the tree is a binary search tree, it's simpler: walk down from the root, going left if both values are smaller and right if both are larger. The first node where they split is the LCA, in O(h)."
@deep
```python
def lca(root, p, q):
    if root is None or root is p or root is q:
        return root
    left = lca(root.left, p, q)
    right = lca(root.right, p, q)
    if left and right:
        return root
    return left or right
```

### [2] Find the Kth largest element in an array.
@tags heap, quickselect
@hook Min-heap of size k gives n log k. Quickselect gives O(n) on average.
@say
"Sorting works in O(n log n), but we can do better.

With a min-heap of size k: I push each element and pop whenever the size exceeds k. At the end, the heap holds the k largest elements and its top is the kth largest. That's O(n log k) time and O(k) space, and it works on a stream.

With quickselect: I partition around a random pivot like in quicksort, but only recurse into the side that contains the target index. That's O(n) on average, O(n squared) worst case, and in place. I'd go with the heap for simplicity and streaming, and mention quickselect if they want the faster average case."
@deep
```python
import heapq, random

def kth_largest_heap(nums, k):
    heap = nums[:k]
    heapq.heapify(heap)
    for x in nums[k:]:
        if x > heap[0]:
            heapq.heapreplace(heap, x)
    return heap[0]

def kth_largest_quickselect(nums, k):
    target = len(nums) - k
    lo, hi = 0, len(nums) - 1
    while True:
        p = random.randint(lo, hi)
        nums[p], nums[hi] = nums[hi], nums[p]
        store = lo
        for i in range(lo, hi):
            if nums[i] < nums[hi]:
                nums[i], nums[store] = nums[store], nums[i]
                store += 1
        nums[store], nums[hi] = nums[hi], nums[store]
        if store == target: return nums[store]
        if store < target: lo = store + 1
        else: hi = store - 1
```

### [2] Design a stack that returns its minimum in O(1).
@tags stack, design
@hook Store the minimum alongside each element. Popping restores the previous minimum automatically.
@say
"Alongside each value I push, I also store the minimum of the stack at that moment. So each stack entry is a pair: the value and the current minimum, which is the smaller of the new value and the previous entry's minimum.

Push, pop, top and getMin are all O(1), since the minimum is always on the top entry. When I pop, the previous minimum is automatically restored because it's stored in the entry below. The cost is O(n) extra space. An optimisation is a second stack that only pushes when a value is less than or equal to the current minimum."
@deep
```python
class MinStack:
    def __init__(self):
        self.items = []                    # (value, min_so_far)
    def push(self, x):
        m = min(x, self.items[-1][1]) if self.items else x
        self.items.append((x, m))
    def pop(self):
        self.items.pop()
    def top(self):
        return self.items[-1][0]
    def get_min(self):
        return self.items[-1][1]
```

### [3] Merge K sorted lists.
@tags heap, linked list, divide and conquer
@hook Keep the head of every list in a min-heap; repeatedly pop the smallest and push its successor. O(N log k).
@say
"With k lists and N total nodes, comparing all k heads at every step would be O(N times k). Instead I put the head of each list into a min-heap keyed by value. I repeatedly pop the smallest node, attach it to the result, and push that node's next node if it exists. The heap never holds more than k items, so each operation is O(log k), and the total is O(N log k) time with O(k) space.

An alternative is divide and conquer: merge the lists in pairs, then merge the results in pairs, like merge sort. That's also O(N log k) and needs no heap. In Python, I add an index as a tie-breaker in the heap tuples, because nodes themselves aren't comparable."
@deep
```python
import heapq

def merge_k_lists(lists):
    heap = [(node.val, i, node) for i, node in enumerate(lists) if node]
    heapq.heapify(heap)
    dummy = tail = ListNode()
    while heap:
        _, i, node = heapq.heappop(heap)
        tail.next = tail = node
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next
```
The same pattern shows up in system design as a k-way merge of sorted files or log streams.

### [3] Trapping Rain Water: how much water is trapped between the bars?
@tags arrays, two pointers
@hook Water above a bar = min(tallest left, tallest right) minus its height. Two pointers get it in O(1) space.
@say
"For each bar, the water above it is the smaller of the tallest bar to its left and the tallest bar to its right, minus its own height, and never below zero.

A straightforward way is precomputing left-max and right-max arrays, which is O(n) time and O(n) space.

To get O(1) space, I use two pointers from both ends, tracking leftMax and rightMax. At each step I move the pointer on the side with the smaller max, because that side's water level is fully determined: there's a taller wall on the other side. I add max minus height for that bar and move inward. It's O(n) time and O(1) space."
@deep
```python
def trap(height):
    l, r = 0, len(height) - 1
    left_max = right_max = water = 0
    while l < r:
        if height[l] < height[r]:
            left_max = max(left_max, height[l])
            water += left_max - height[l]
            l += 1
        else:
            right_max = max(right_max, height[r])
            water += right_max - height[r]
            r -= 1
    return water
```
