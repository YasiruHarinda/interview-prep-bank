@section sorting | Sorting and Searching from Scratch
@blurb "Implement it yourself" questions. Know how each sort works, its Big O, whether it's stable, and when you'd pick it.

### [2] Merge Sort
@lc 912
@ask Sort an array with merge sort.
@eg [5,2,3,1]  ->  [1,2,3,5]
@tags sorting, divide and conquer, merge sort
@hook Split in half, sort each half, merge the two sorted halves. Always O(n log n), stable, but needs O(n) extra memory.
@say
"Merge sort is divide and conquer. If the list has zero or one items, it's already sorted. Otherwise I split it in half, sort each half recursively, and merge the two sorted halves.

To merge, I keep a pointer in each half and repeatedly take the smaller front item. When one half runs out, I add the rest of the other. I use less-than-or-equal when comparing, so equal items keep their original order, which makes the sort stable.

There are log n levels of splitting and each level does O(n) merging work, so it's O(n log n) in every case. It needs O(n) extra space. It's the natural choice for linked lists and for data too big for memory."
@code
```python
def merge_sort(nums):
    if len(nums) <= 1:
        return nums
    mid = len(nums) // 2
    left = merge_sort(nums[:mid])
    right = merge_sort(nums[mid:])
    merged, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:              # <= keeps equal items in order
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged
```
@time O(n log n)
@space O(n)
@test
import random
random.seed(3)
for _ in range(50):
    a = [random.randint(-20, 20) for _ in range(random.randint(0, 30))]
    assert merge_sort(a) == sorted(a)
assert merge_sort([5, 2, 3, 1]) == [1, 2, 3, 5]

### [2] Quicksort
@ask Sort an array in place with quicksort.
@eg [3,6,1,8,2]  ->  [1,2,3,6,8]
@tags sorting, divide and conquer, quicksort
@hook Pick a random pivot, move smaller items to its left and bigger ones to its right, then sort both sides. O(n log n) on average.
@say
"Quicksort picks a pivot and partitions the array: everything smaller goes left of it, everything else goes right, and the pivot lands in its final position. Then I sort the two sides recursively.

For the partition I use Lomuto's scheme: move the pivot to the end, keep a `store` index, and swap every smaller item to `store`. At the end I swap the pivot into `store`.

With good pivots it's O(n log n) on average and sorts in place with O(log n) stack. A bad pivot, like always the first item on sorted input, makes it O(n squared), so I pick the pivot at random. It isn't stable. Many duplicates also slow it down, which a three-way partition fixes."
@code
```python
import random

def quick_sort(nums, lo=0, hi=None):
    if hi is None:
        hi = len(nums) - 1
    if lo >= hi:
        return
    p = random.randint(lo, hi)                # random pivot: no O(n^2) on sorted input
    nums[p], nums[hi] = nums[hi], nums[p]
    pivot, store = nums[hi], lo
    for i in range(lo, hi):                   # Lomuto partition
        if nums[i] < pivot:
            nums[i], nums[store] = nums[store], nums[i]
            store += 1
    nums[store], nums[hi] = nums[hi], nums[store]   # pivot to its final place
    quick_sort(nums, lo, store - 1)
    quick_sort(nums, store + 1, hi)
```
@time O(n log n) average, O(n^2) worst
@space O(log n) average stack
@test
import random
random.seed(4)
for _ in range(50):
    a = [random.randint(-20, 20) for _ in range(random.randint(0, 30))]
    b = a[:]
    quick_sort(b)
    assert b == sorted(a)
c = [2, 2, 2, 2]; quick_sort(c); assert c == [2, 2, 2, 2]

### [2] Quickselect: Kth Smallest Element
@ask Find the kth smallest element (k starts at 1) in O(n) average time, without sorting.
@eg nums = [7,10,4,3,20,15], k = 3  ->  7
@tags quickselect, partition, divide and conquer
@hook Partition like quicksort, but only continue into the side that contains index k - 1.
@say
"Quickselect is quicksort that only follows one side. After partitioning around a random pivot, the pivot is in its final sorted position. If that position is k minus 1, the pivot is the answer. If the position is smaller, the answer is to the right, otherwise to the left, and I only search that part.

Each step throws away a big part of the array on average: n, then about n over 2, then n over 4, which adds up to O(n) on average. The worst case is O(n squared), which random pivots make very unlikely. I work on a copy so the caller's list isn't changed. Median of medians guarantees O(n), but it's rarely expected."
@code
```python
import random

def quickselect(nums, k):
    nums = nums[:]                            # leave the caller's list alone
    target = k - 1                            # its index in sorted order
    lo, hi = 0, len(nums) - 1
    while True:
        p = random.randint(lo, hi)
        nums[p], nums[hi] = nums[hi], nums[p]
        pivot, store = nums[hi], lo
        for i in range(lo, hi):
            if nums[i] < pivot:
                nums[i], nums[store] = nums[store], nums[i]
                store += 1
        nums[store], nums[hi] = nums[hi], nums[store]
        if store == target:
            return nums[store]
        if store < target:
            lo = store + 1                    # the answer is on the right
        else:
            hi = store - 1                    # the answer is on the left
```
@time O(n) average
@space O(n) for the copy
@test
import random
random.seed(5)
assert quickselect([7, 10, 4, 3, 20, 15], 3) == 7
for _ in range(40):
    a = [random.randint(-10, 10) for _ in range(random.randint(1, 25))]
    s = sorted(a)
    for k in range(1, len(a) + 1):
        assert quickselect(a, k) == s[k - 1]

### [1] Counting Sort
@ask Sort a list of integers whose values fall in a small range, faster than O(n log n).
@eg [4,2,2,8,3,3,1]  ->  [1,2,2,3,3,4,8]
@tags sorting, counting
@hook Count how many times each value appears, then write the values out in order. O(n + k), where k is the range of values.
@say
"Comparison sorts can't beat O(n log n), but counting sort doesn't compare. If the values are integers in a small range, from min to max, I make a count array of that size, count each value, then walk the counts in order and write each value out as many times as it appeared.

I shift by the minimum value, so negative numbers work too. It's O(n plus k) time and O(k) space, where k is max minus min plus 1. It's great for things like ages or exam scores, and bad when the range is huge compared to n. Radix sort extends the idea to bigger numbers, digit by digit."
@code
```python
def counting_sort(nums):
    if not nums:
        return []
    lo, hi = min(nums), max(nums)
    counts = [0] * (hi - lo + 1)
    for x in nums:
        counts[x - lo] += 1                   # shift so the minimum is index 0
    result = []
    for offset, count in enumerate(counts):
        result.extend([offset + lo] * count)
    return result
```
@time O(n + k), k = max - min + 1
@space O(k)
@test
import random
random.seed(6)
for _ in range(50):
    a = [random.randint(-15, 15) for _ in range(random.randint(0, 30))]
    assert counting_sort(a) == sorted(a)
assert counting_sort([3, -1, 2, -1]) == [-1, -1, 2, 3]

### [1] Insertion Sort
@ask Sort a list in place with insertion sort, and say when it's a good choice.
@eg [5,2,4,6,1,3]  ->  [1,2,3,4,5,6]
@tags sorting, insertion sort
@hook Grow a sorted part on the left. Take the next item and shift bigger items right until its place opens up.
@say
"Insertion sort works like sorting cards in your hand. The left part of the list is always sorted. For each new item, I shift every bigger item in the sorted part one place to the right, and drop the new item into the gap.

It's O(n squared) in the worst case, but O(n) when the list is already nearly sorted, because each item only moves a little. It's in place, stable and has very little overhead. That's why Python's Timsort and other library sorts use insertion sort for small pieces."
@code
```python
def insertion_sort(nums):
    for i in range(1, len(nums)):
        x = nums[i]
        j = i - 1
        while j >= 0 and nums[j] > x:         # shift bigger items right
            nums[j + 1] = nums[j]
            j -= 1
        nums[j + 1] = x
    return nums
```
@time O(n^2), O(n) if nearly sorted
@space O(1)
@test
import random
random.seed(8)
for _ in range(50):
    a = [random.randint(-20, 20) for _ in range(random.randint(0, 30))]
    assert insertion_sort(a[:]) == sorted(a)

### [2] Implement a Min-Heap
@ask Build a min-heap with push, pop and peek, without using heapq.
@eg push 5, 1, 3; pop() -> 1; pop() -> 3
@tags heap, design, array
@hook Store it in an array: the children of i are 2i + 1 and 2i + 2. Push sifts up, pop moves the last item to the root and sifts down.
@say
"A binary heap is a complete tree stored in an array. For index i, the children are at 2i plus 1 and 2i plus 2, and the parent is at i minus 1, divided by 2. The rule is that every parent is at most its children, so the minimum is at index 0.

To push, I append the value at the end and **sift up**: while it's smaller than its parent, I swap them. To pop, I take the root, move the last item to the root, and **sift down**: while it's bigger than its smaller child, I swap with that child.

Both are O(log n), because the tree's height is log n. Peek is O(1). Building a heap from a whole list by sifting down from the middle is O(n)."
@code
```python
class MinHeap:
    def __init__(self):
        self.a = []

    def push(self, x):
        a = self.a
        a.append(x)
        i = len(a) - 1
        while i > 0 and a[(i - 1) // 2] > a[i]:      # sift up
            parent = (i - 1) // 2
            a[i], a[parent] = a[parent], a[i]
            i = parent

    def pop(self):
        a = self.a
        top = a[0]
        last = a.pop()
        if a:
            a[0] = last
            i = 0
            while True:                              # sift down
                smallest = i
                for child in (2 * i + 1, 2 * i + 2):
                    if child < len(a) and a[child] < a[smallest]:
                        smallest = child
                if smallest == i:
                    break
                a[i], a[smallest] = a[smallest], a[i]
                i = smallest
        return top

    def peek(self):
        return self.a[0]

    def __len__(self):
        return len(self.a)
```
@time O(log n) push and pop, O(1) peek
@space O(n)
@test
import random, heapq
random.seed(9)
h, ref = MinHeap(), []
for _ in range(500):
    if ref and random.random() < 0.4:
        assert h.pop() == heapq.heappop(ref)
    else:
        x = random.randint(-50, 50)
        h.push(x)
        heapq.heappush(ref, x)
    assert len(h) == len(ref)
    if ref:
        assert h.peek() == ref[0]

### [2] Largest Number
@lc 179
@ask Arrange non-negative integers so that, joined together, they form the largest number. Return it as a string.
@eg [3,30,34,5,9]  ->  "9534330"
@tags sorting, custom comparator, strings
@hook Sort with the rule: a goes before b if a + b > b + a as strings. Then fix the all-zeros case.
@say
"Sorting the numbers by value fails: 30 must come after 3, because 330 beats 303. Sorting as plain strings also fails for cases like 3 and 34.

The right rule compares two numbers by trying both orders: a goes first if the string a plus b is bigger than b plus a. This rule is consistent, so it works as a sort comparator. In Python I wrap it with `cmp_to_key`. Then I join everything. One edge case: if the biggest number is 0, everything is 0, and I return '0' instead of '000'.

Sorting is O(n log n) comparisons, each costing O(length of the numbers), and O(n) space for the strings."
@code
```python
from functools import cmp_to_key

def largest_number(nums):
    def order(a, b):                          # a first if a + b is bigger
        if a + b > b + a:
            return -1
        if a + b < b + a:
            return 1
        return 0

    strs = sorted((str(x) for x in nums), key=cmp_to_key(order))
    result = "".join(strs)
    return "0" if result[0] == "0" else result
```
@time O(n log n * L), L = digits per number
@space O(n * L)
@test
assert largest_number([10, 2]) == "210"
assert largest_number([3, 30, 34, 5, 9]) == "9534330"
assert largest_number([0, 0]) == "0"
assert largest_number([1]) == "1"
assert largest_number([432, 43243]) == "43243432"

### [3] Count Inversions
@ask Count the pairs (i, j) with i < j and nums[i] > nums[j]. This measures how far an array is from sorted.
@eg [2,4,1,3,5]  ->  3   ((2,1), (4,1), (4,3))
@tags merge sort, divide and conquer, counting
@hook Merge sort, and count while merging: when an item from the right half is taken first, it is smaller than every item still waiting in the left half.
@say
"Checking every pair is O(n squared). Merge sort can count them in O(n log n).

The inversions are of three kinds: both items in the left half, both in the right half, or one in each. The recursion counts the first two. For the third, I count during the merge. The halves are sorted, so when I take an item from the right half before the left half is finished, that item is smaller than every item still waiting on the left. That's len(left) minus i inversions at once.

O(n log n) time and O(n) space. The same idea answers 'count smaller numbers after self' and 'reverse pairs'."
@code
```python
def count_inversions(nums):
    def sort_count(a):                        # returns (sorted a, inversions in a)
        if len(a) <= 1:
            return a, 0
        mid = len(a) // 2
        left, inv_left = sort_count(a[:mid])
        right, inv_right = sort_count(a[mid:])
        merged, i, j = [], 0, 0
        inv = inv_left + inv_right
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                merged.append(left[i])
                i += 1
            else:
                merged.append(right[j])
                inv += len(left) - i          # smaller than every waiting left item
                j += 1
        merged += left[i:] + right[j:]
        return merged, inv

    return sort_count(nums)[1]
```
@time O(n log n)
@space O(n)
@test
import random
assert count_inversions([2, 4, 1, 3, 5]) == 3
assert count_inversions([5, 4, 3, 2, 1]) == 10
assert count_inversions([1, 2, 3]) == 0
assert count_inversions([]) == 0
random.seed(10)
for _ in range(30):
    a = [random.randint(0, 9) for _ in range(random.randint(0, 20))]
    brute = sum(1 for i in range(len(a)) for j in range(i + 1, len(a)) if a[i] > a[j])
    assert count_inversions(a) == brute
