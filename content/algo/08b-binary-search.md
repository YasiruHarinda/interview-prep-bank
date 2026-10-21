@section bsearch | Binary Search

### [2] Search in Rotated Sorted Array
@lc 33
@ask Find target in a rotated sorted array of unique numbers in O(log n). Return its index or -1.
@eg nums = [4,5,6,7,0,1,2], target = 0  ->  4
@tags binary search, rotated array
@hook One half around mid is always sorted. Check if the target is inside the sorted half. If yes go there, if not go to the other half.
@say
"Even after rotation, if I cut the array at mid, at least one of the two halves is fully sorted. I can tell which one by comparing the first element with mid: if `nums[lo] <= nums[mid]`, the left half is sorted, otherwise the right half is.

Then I check whether the target lies inside the sorted half's range. That's easy, because I know its smallest and largest values. If it does, I search there. If not, it must be in the other half.

Each step still halves the range, so O(log n) time and O(1) space."
@code
```python
def search_rotated(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:                 # left half is sorted
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                     # right half is sorted
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
```
@time O(log n)
@space O(1)
@trap
Writing `nums[lo] < nums[mid]` without the equals. When lo == mid (a range of one or two), the left half is a single sorted element, and the strict check sends the search the wrong way.
@follow What if there can be duplicates?
When `nums[lo] == nums[mid] == nums[hi]`, you can't tell which half is sorted, so move `lo` up by one. The worst case becomes O(n). That is LeetCode 81.
@test
assert search_rotated([4, 5, 6, 7, 0, 1, 2], 0) == 4
assert search_rotated([4, 5, 6, 7, 0, 1, 2], 3) == -1
assert search_rotated([1], 0) == -1
assert search_rotated([1], 1) == 0
assert search_rotated([3, 1], 1) == 1
assert search_rotated([5, 1, 3], 5) == 0
assert search_rotated([5, 1, 3], 3) == 2

### [2] Find Peak Element
@lc 162
@ask Return the index of any element bigger than its neighbours. Treat the outside of the array as minus infinity. Use O(log n).
@eg [1,2,1,3,5,6,4]  ->  5 (value 6), or 1 (value 2)
@tags binary search
@hook If mid < mid + 1, you are walking uphill to the right, so a peak must exist on the right. Otherwise one exists at mid or on the left.
@say
"The array isn't sorted, but binary search still works because of the slopes.

At mid, I compare with the next element. If the next one is bigger, I'm going uphill to the right. Since the outside of the array counts as minus infinity, the uphill path must come down somewhere, so there's a peak to the right: `lo` becomes mid plus 1. Otherwise I'm going downhill, so there's a peak at mid or to the left: `hi` becomes mid.

When they meet, that index is a peak. O(log n) time and O(1) space."
@code
```python
def find_peak_element(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < nums[mid + 1]:
            lo = mid + 1         # uphill to the right: a peak is there
        else:
            hi = mid             # downhill: a peak is at mid or left
    return lo
```
@time O(log n)
@space O(1)
@test
def is_peak(a, i):
    return (i == 0 or a[i] > a[i - 1]) and (i == len(a) - 1 or a[i] > a[i + 1])
for a in [[1, 2, 3, 1], [1, 2, 1, 3, 5, 6, 4], [1], [2, 1], [1, 2], [3, 2, 1]]:
    assert is_peak(a, find_peak_element(a))
assert find_peak_element([1, 2, 3, 1]) == 2

### [2] Koko Eating Bananas
@lc 875
@ask Koko eats at speed k bananas per hour, one pile at a time, and a pile smaller than k still takes a full hour. Find the smallest k that finishes all piles in h hours.
@eg piles = [3,6,7,11], h = 8  ->  4
@tags binary search on the answer
@hook If speed k is fast enough, every faster speed is too. Binary search the speed from 1 to max(piles).
@say
"Trying every speed from 1 up is too slow when piles are large. But the question 'can she finish at speed k?' is monotonic: if it's yes for k, it's yes for every bigger k. So I binary search on the answer.

The speed is between 1 and the biggest pile, because a faster speed never helps: each pile already takes one hour. For a given speed, the hours needed is the sum of each pile divided by the speed, rounded up. If that's within h, I try slower speeds, so `hi` becomes mid. Otherwise `lo` becomes mid plus 1.

Each check is O(n), and there are O(log of max pile) checks, so O(n log m) time and O(1) space."
@code
```python
def min_eating_speed(piles, h):
    def hours_needed(speed):
        return sum((p + speed - 1) // speed for p in piles)   # ceil(p / speed)

    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if hours_needed(mid) <= h:
            hi = mid             # fast enough: try slower
        else:
            lo = mid + 1
    return lo
```
@time O(n log m), m = largest pile
@space O(1)
@pro
Say the general recipe out loud: "binary search on the answer works when I can check a guess quickly and the check is monotonic." The next three problems use the same recipe.
@test
assert min_eating_speed([3, 6, 7, 11], 8) == 4
assert min_eating_speed([30, 11, 23, 4, 20], 5) == 30
assert min_eating_speed([30, 11, 23, 4, 20], 6) == 23
assert min_eating_speed([1], 1) == 1
assert min_eating_speed([1000000000], 2) == 500000000

### [2] Capacity To Ship Packages Within D Days
@lc 1011
@ask Ship packages in the given order, one day at a time, without going over the ship's capacity. Find the smallest capacity that ships everything in `days` days.
@eg weights = [1,2,3,4,5,6,7,8,9,10], days = 5  ->  15
@tags binary search on the answer, greedy
@hook Binary search the capacity between max(weights) and sum(weights). Check a capacity by loading each day greedily.
@say
"The capacity must be at least the heaviest package, and the total weight always works in one day. Between those, if a capacity works, any bigger one works too, so I binary search on it.

To check a capacity, I simulate greedily: I keep adding packages to today's load, and when the next one doesn't fit, I start a new day. If the number of days is at most the limit, the capacity works and I try smaller. Otherwise I try bigger.

The check is O(n), and the search takes O(log of the total weight) steps. So O(n log S) time and O(1) space."
@code
```python
def ship_within_days(weights, days):
    def days_needed(capacity):
        needed, load = 1, 0
        for w in weights:
            if load + w > capacity:
                needed += 1          # start a new day
                load = 0
            load += w
        return needed

    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if days_needed(mid) <= days:
            hi = mid
        else:
            lo = mid + 1
    return lo
```
@time O(n log S), S = total weight
@space O(1)
@test
assert ship_within_days([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5) == 15
assert ship_within_days([3, 2, 2, 4, 1, 4], 3) == 6
assert ship_within_days([1, 2, 3, 1, 1], 4) == 3
assert ship_within_days([10], 1) == 10

### [2] Time Based Key-Value Store
@lc 981
@ask Build set(key, value, timestamp) and get(key, timestamp). get returns the value with the largest timestamp that is <= the given one, or "". Timestamps for set always increase.
@eg set("foo","bar",1); get("foo",3) -> "bar"; set("foo","bar2",4); get("foo",4) -> "bar2"
@tags binary search, hash map, design
@hook Each key keeps its timestamps in a sorted list. get is a binary search for the last timestamp <= t.
@say
"I map each key to two lists: its timestamps and its values, in the same order. Because set is always called with increasing timestamps, appending keeps the timestamps sorted for free.

For get, I need the last timestamp that is less than or equal to the query. `bisect_right` gives the first index with a timestamp bigger than the query, so the answer is one position before it. If that position doesn't exist, I return an empty string.

set is O(1), get is O(log n) for n entries of that key. Space is O(total entries)."
@code
```python
import bisect
from collections import defaultdict

class TimeMap:
    def __init__(self):
        self.times = defaultdict(list)      # key -> timestamps, increasing
        self.values = defaultdict(list)     # key -> values, same order

    def set(self, key, value, timestamp):
        self.times[key].append(timestamp)
        self.values[key].append(value)

    def get(self, key, timestamp):
        i = bisect.bisect_right(self.times[key], timestamp)   # first time > timestamp
        return self.values[key][i - 1] if i else ""
```
@time O(1) set, O(log n) get
@space O(n)
@test
tm = TimeMap()
tm.set("foo", "bar", 1)
assert tm.get("foo", 1) == "bar"
assert tm.get("foo", 3) == "bar"
tm.set("foo", "bar2", 4)
assert tm.get("foo", 4) == "bar2"
assert tm.get("foo", 5) == "bar2"
assert tm.get("foo", 0) == ""
assert tm.get("missing", 1) == ""

### [3] Split Array Largest Sum
@lc 410
@ask Split an array into k non-empty contiguous parts so that the largest part sum is as small as possible. Return that sum.
@eg nums = [7,2,5,10,8], k = 2  ->  18   ([7,2,5] and [10,8])
@tags binary search on the answer, greedy
@hook Guess the largest allowed sum. Count how many parts a greedy split needs. Binary search for the smallest guess that needs <= k parts.
@say
"This is the shipping problem in disguise. Instead of choosing the split, I guess the answer: a limit on each part's sum. The limit is between the biggest number and the total sum.

For a limit, I split greedily, starting a new part whenever the next number would push the current sum over the limit, and count the parts. A bigger limit never needs more parts, so the check is monotonic. If the count is at most k, the limit works and I try a smaller one. Otherwise I need a bigger one.

O(n log S) time, where S is the total sum, and O(1) space. A DP solution exists, but it's O(k times n squared)."
@code
```python
def split_array(nums, k):
    def parts_needed(limit):
        parts, total = 1, 0
        for x in nums:
            if total + x > limit:
                parts += 1
                total = 0
            total += x
        return parts

    lo, hi = max(nums), sum(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if parts_needed(mid) <= k:
            hi = mid
        else:
            lo = mid + 1
    return lo
```
@time O(n log S), S = total sum
@space O(1)
@test
assert split_array([7, 2, 5, 10, 8], 2) == 18
assert split_array([1, 2, 3, 4, 5], 2) == 9
assert split_array([1, 4, 4], 3) == 4
assert split_array([5], 1) == 5

### [3] Median of Two Sorted Arrays
@lc 4
@ask Return the median of two sorted arrays in O(log(min(m, n))) time.
@eg [1,3] and [2] -> 2,  [1,2] and [3,4] -> 2.5
@tags binary search, partition
@hook Binary search how many items the left half takes from the shorter array. A split is right when both left sides are <= both right sides.
@say
"Merging the arrays gives O(m plus n), but they want log time. The idea is to split both arrays so that the left parts together hold half of all the numbers, and every number on the left is at most every number on the right. Then the median comes from the edges of the split.

I binary search on i, the number of items taken from the shorter array a. Then b must give j equals half minus i. I look at the four edge values: a's last left item and first right item, and the same for b. If a's left edge is bigger than b's right edge, I took too many from a, so I move left. If b's left edge is bigger than a's right edge, I took too few, so I move right. Otherwise the split is correct: for an odd total, the median is the bigger left edge, and for an even total, it's the average of the bigger left edge and the smaller right edge.

Missing edges count as minus or plus infinity. O(log of the shorter length) time, O(1) space."
@code
```python
def find_median_sorted_arrays(a, b):
    if len(a) > len(b):
        a, b = b, a                        # search the shorter array
    m, n = len(a), len(b)
    half = (m + n + 1) // 2                # size of the left half
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2                 # items taken from a
        j = half - i                       # items taken from b
        a_left = a[i - 1] if i > 0 else float("-inf")
        a_right = a[i] if i < m else float("inf")
        b_left = b[j - 1] if j > 0 else float("-inf")
        b_right = b[j] if j < n else float("inf")
        if a_left <= b_right and b_left <= a_right:     # correct split
            if (m + n) % 2:
                return max(a_left, b_left)
            return (max(a_left, b_left) + min(a_right, b_right)) / 2
        if a_left > b_right:
            hi = i - 1                     # took too many from a
        else:
            lo = i + 1                     # took too few from a
```
@time O(log(min(m, n)))
@space O(1)
@pro
Start with the O(m + n) merge idea, get agreement, then offer the partition idea. Interviewers rarely expect the log solution without a hint, but they do expect you to explain it clearly if you know it.
@test
assert find_median_sorted_arrays([1, 3], [2]) == 2
assert find_median_sorted_arrays([1, 2], [3, 4]) == 2.5
assert find_median_sorted_arrays([], [1]) == 1
assert find_median_sorted_arrays([2], []) == 2
assert find_median_sorted_arrays([1, 3, 5], [2, 4, 6]) == 3.5
assert find_median_sorted_arrays([0, 0], [0, 0]) == 0
