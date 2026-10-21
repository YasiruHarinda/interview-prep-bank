@section prefix | Prefix Sums
@blurb Precompute running totals so any range sum is one subtraction. Add a hash map to count subarrays with a target sum, even with negative numbers.

### [1] Pattern: what are prefix sums, and how do you combine them with a hash map?
@tags pattern, prefix sum, hash map
@hook sum(i..j) = prefix[j + 1] - prefix[i]. To count subarrays summing to k, count earlier prefixes equal to (current prefix - k).
@say
"A prefix sum array stores running totals: `prefix[i]` is the sum of the first i numbers. After one O(n) pass, the sum of any range i to j is `prefix[j + 1] - prefix[i]`, which is O(1).

The more powerful version adds a hash map. If I want subarrays that sum to k, a subarray ending here sums to k exactly when some earlier prefix equals the current prefix minus k. So as I scan, I keep a count of every prefix sum seen so far, and add the count of `prefix - k` to my answer.

This works with negative numbers, where a sliding window fails. Variations use a balance of plus one and minus one instead of a sum, or the prefix modulo k for 'divisible by k' problems."
@deep
```python
# Range sums in O(1) after O(n) setup
prefix = [0]
for x in nums:
    prefix.append(prefix[-1] + x)
range_sum = prefix[j + 1] - prefix[i]

# Count subarrays with sum k
from collections import defaultdict
seen = defaultdict(int)
seen[0] = 1                      # the empty prefix
running = count = 0
for x in nums:
    running += x
    count += seen[running - k]
    seen[running] += 1
```
| Problem | What goes in the map |
|---|---|
| Subarray Sum Equals K | count of each prefix sum |
| Contiguous Array (equal 0s and 1s) | first index of each balance |
| Continuous Subarray Sum | first index of each prefix % k |
| Subarray Sums Divisible by K | count of each prefix % k |
@trap
Forgetting to seed the map with `{0: 1}` or `{0: -1}`. Without it, subarrays that start at index 0 are missed.

### [1] Range Sum Query: Immutable
@lc 303
@ask Build a class that answers many "sum of nums from left to right" queries quickly. The array never changes.
@eg nums = [-2,0,3,-5,2,-1]; sum_range(0, 2) -> 1, sum_range(2, 5) -> -1
@tags prefix sum, design
@hook Precompute prefix sums once in O(n). Each query is one subtraction in O(1).
@say
"Summing the range on every query is O(n) per query, which is slow if there are many queries.

Instead, in the constructor I build a prefix array with a leading zero, where `prefix[i]` is the sum of the first i numbers. The sum from left to right is then `prefix[right + 1] - prefix[left]`. The leading zero means I never need a special case for left equal to 0.

Setup is O(n) time and space, and each query is O(1)."
@code
```python
class NumArray:
    def __init__(self, nums):
        self.prefix = [0]                  # prefix[i] = sum of nums[:i]
        for x in nums:
            self.prefix.append(self.prefix[-1] + x)

    def sum_range(self, left, right):
        return self.prefix[right + 1] - self.prefix[left]
```
@time O(n) setup, O(1) per query
@space O(n)
@follow What if the array can also be updated?
Prefix sums would need O(n) per update. Use a Fenwick tree (binary indexed tree) or a segment tree: O(log n) for both updates and queries.
@test
na = NumArray([-2, 0, 3, -5, 2, -1])
assert na.sum_range(0, 2) == 1
assert na.sum_range(2, 5) == -1
assert na.sum_range(0, 5) == -3
assert na.sum_range(3, 3) == -5

### [1] Find Pivot Index
@lc 724
@ask Return the leftmost index where the sum of numbers to its left equals the sum to its right, or -1.
@eg [1,7,3,6,5,6]  ->  3   (1+7+3 = 5+6 = 11)
@tags prefix sum, arrays
@hook Right sum = total - left sum - current number. Keep the left sum as you walk.
@say
"I first compute the total sum. Then I walk through the array keeping a running left sum. At index i, the right sum is the total minus the left sum minus the number at i. If the left sum equals the right sum, i is the pivot. Otherwise I add the current number to the left sum and continue.

Two passes in total, O(n) time, O(1) space."
@code
```python
def pivot_index(nums):
    total = sum(nums)
    left_sum = 0
    for i, x in enumerate(nums):
        if left_sum == total - left_sum - x:     # left side == right side
            return i
        left_sum += x
    return -1
```
@time O(n)
@space O(1)
@test
assert pivot_index([1, 7, 3, 6, 5, 6]) == 3
assert pivot_index([1, 2, 3]) == -1
assert pivot_index([2, 1, -1]) == 0
assert pivot_index([]) == -1
assert pivot_index([0]) == 0

### [2] Subarray Sum Equals K
@lc 560
@ask Count the contiguous subarrays whose sum equals k. Numbers can be negative.
@eg nums = [1,2,3], k = 3  ->  2   ([1,2] and [3])
@tags prefix sum, hash map
@hook A subarray ending here sums to k when an earlier prefix equals (current prefix - k). Count those prefixes in a hash map.
@say
"Checking every subarray is O(n squared). A sliding window doesn't work because numbers can be negative.

So I use prefix sums with a hash map. As I scan, I keep the running sum. A subarray ending at the current position sums to k exactly when there was an earlier running sum equal to the current sum minus k. So I keep a map from each running sum to how many times it has appeared, and add the count of `running - k` to the answer before adding the current sum to the map.

I seed the map with zero seen once, so subarrays starting at index 0 are counted. O(n) time and O(n) space."
@code
```python
from collections import defaultdict

def subarray_sum(nums, k):
    seen = defaultdict(int)
    seen[0] = 1                    # empty prefix: subarrays starting at 0
    running = count = 0
    for x in nums:
        running += x
        count += seen[running - k] # earlier prefixes that leave exactly k
        seen[running] += 1
    return count
```
@time O(n)
@space O(n)
@trap
Updating the map before counting. With k = 0, the current prefix would match itself and count an empty subarray.
@test
assert subarray_sum([1, 1, 1], 2) == 2
assert subarray_sum([1, 2, 3], 3) == 2
assert subarray_sum([1, -1, 0], 0) == 3
assert subarray_sum([], 0) == 0
assert subarray_sum([3], 3) == 1

### [2] Contiguous Array
@lc 525
@ask In a binary array, return the length of the longest contiguous subarray with equal numbers of 0s and 1s.
@eg [0,0,1,0,0,0,1,1]  ->  6
@tags prefix sum, hash map
@hook Count 1 as +1 and 0 as -1. Equal counts means the balance returns to a value it had before. Store the first index of each balance.
@say
"I turn the problem into a sum problem: every 1 adds one and every 0 subtracts one. A subarray has equal 0s and 1s exactly when its total is zero, which means the running balance at its end equals the balance just before its start.

So I keep a map from each balance to the first index where it appeared, seeded with balance 0 at index minus 1. When I see a balance again, the subarray between the first time and now is balanced, so I check its length. I only store the first index, because that gives the longest subarray.

O(n) time and O(n) space."
@code
```python
def find_max_length(nums):
    first_index = {0: -1}          # balance -> first index it appeared
    balance = best = 0
    for i, x in enumerate(nums):
        balance += 1 if x == 1 else -1
        if balance in first_index:
            best = max(best, i - first_index[balance])
        else:
            first_index[balance] = i
    return best
```
@time O(n)
@space O(n)
@test
assert find_max_length([0, 1]) == 2
assert find_max_length([0, 1, 0]) == 2
assert find_max_length([0, 0, 1, 0, 0, 0, 1, 1]) == 6
assert find_max_length([]) == 0
assert find_max_length([1, 1, 1]) == 0

### [2] Continuous Subarray Sum
@lc 523
@ask Return true if there is a subarray of length at least 2 whose sum is a multiple of k.
@eg nums = [23,2,4,6,7], k = 6  ->  true   ([2,4] sums to 6)
@tags prefix sum, modulo, hash map
@hook Two prefixes with the same remainder mod k mean the part between them is a multiple of k. Check the gap is at least 2.
@say
"If two running sums have the same remainder when divided by k, then the numbers between them add up to a multiple of k.

So I scan with a running sum modulo k, and keep a map from each remainder to the first index where it appeared. I seed it with remainder 0 at index minus 1. If I see a remainder again and the distance from its first index is at least 2, the subarray is long enough and I return true. I store only the first index, so the distance is as large as possible.

O(n) time and O(min(n, k)) space."
@code
```python
def check_subarray_sum(nums, k):
    first_index = {0: -1}          # prefix % k -> first index
    running = 0
    for i, x in enumerate(nums):
        running = (running + x) % k
        if running in first_index:
            if i - first_index[running] >= 2:
                return True
        else:
            first_index[running] = i
    return False
```
@time O(n)
@space O(min(n, k))
@trap
Overwriting the first index when a remainder repeats too soon. Keep the earliest index, or [5, 0, 0] with k = 3 fails.
@test
assert check_subarray_sum([23, 2, 4, 6, 7], 6)
assert check_subarray_sum([23, 2, 6, 4, 7], 6)
assert not check_subarray_sum([23, 2, 6, 4, 7], 13)
assert not check_subarray_sum([0], 1)
assert check_subarray_sum([0, 0], 1)
assert check_subarray_sum([5, 0, 0, 0], 3)
assert not check_subarray_sum([1, 0], 2)

### [2] Subarray Sums Divisible by K
@lc 974
@ask Count the contiguous subarrays whose sum is divisible by k. Numbers can be negative.
@eg nums = [4,5,0,-2,-3,1], k = 5  ->  7
@tags prefix sum, modulo, hash map
@hook Count remainders of the running sum. Each earlier prefix with the same remainder makes one valid subarray.
@say
"This combines the last two ideas. A subarray is divisible by k when the running sums at its two ends have the same remainder mod k. So as I scan, I keep a count of how many earlier prefixes had each remainder, and add the count for the current remainder to the answer.

I seed the map with remainder 0 seen once. With negative numbers, the remainder must be made non-negative. Python's modulo already does that for positive k. In Java or C# I'd add k and take the modulo again.

O(n) time and O(k) space."
@code
```python
def subarrays_div_by_k(nums, k):
    seen = {0: 1}                  # remainder -> how many prefixes had it
    running = count = 0
    for x in nums:
        running = (running + x) % k        # never negative in Python for k > 0
        count += seen.get(running, 0)
        seen[running] = seen.get(running, 0) + 1
    return count
```
@time O(n)
@space O(k)
@test
assert subarrays_div_by_k([4, 5, 0, -2, -3, 1], 5) == 7
assert subarrays_div_by_k([5], 9) == 0
assert subarrays_div_by_k([5], 5) == 1
assert subarrays_div_by_k([-1, 2, 9], 2) == 2

### [2] Range Sum Query 2D: Immutable
@lc 304
@ask Build a class that returns the sum of any rectangle in a fixed matrix in O(1).
@eg sum_region(2, 1, 4, 3) on the example 5x5 matrix  ->  8
@tags prefix sum, matrix, design
@hook 2-D prefix sums. Rectangle = big corner - top strip - left strip + the overlap you removed twice.
@say
"I build a 2-D prefix table with an extra row and column of zeros. `P[r][c]` is the sum of the rectangle from the top-left corner down to row r minus 1 and column c minus 1. Each cell is the matrix value plus the cell above plus the cell to the left, minus the top-left diagonal cell, which was added twice.

To answer a query for corners r1, c1 to r2, c2, I take the big rectangle up to the bottom-right corner, subtract the strip above and the strip to the left, then add back the top-left block, which I subtracted twice.

Setup is O(rows times cols), and each query is O(1)."
@code
```python
class NumMatrix:
    def __init__(self, matrix):
        rows = len(matrix)
        cols = len(matrix[0]) if rows else 0
        # P[r][c] = sum of the block from (0, 0) to (r - 1, c - 1)
        self.P = [[0] * (cols + 1) for _ in range(rows + 1)]
        for r in range(rows):
            for c in range(cols):
                self.P[r + 1][c + 1] = (matrix[r][c] + self.P[r][c + 1]
                                        + self.P[r + 1][c] - self.P[r][c])

    def sum_region(self, r1, c1, r2, c2):
        P = self.P
        return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1]
```
@time O(rows * cols) setup, O(1) per query
@space O(rows * cols)
@test
nm = NumMatrix([[3, 0, 1, 4, 2], [5, 6, 3, 2, 1], [1, 2, 0, 1, 5], [4, 1, 0, 1, 7], [1, 0, 3, 0, 5]])
assert nm.sum_region(2, 1, 4, 3) == 8
assert nm.sum_region(1, 1, 2, 2) == 11
assert nm.sum_region(1, 2, 2, 4) == 12
assert nm.sum_region(0, 0, 0, 0) == 3
