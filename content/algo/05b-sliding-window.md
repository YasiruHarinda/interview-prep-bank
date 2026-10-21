@section window | Sliding Window

### [2] Find All Anagrams in a String
@lc 438
@ask Return every start index in s where a rearrangement of p begins.
@eg s = "cbaebabacd", p = "abc"  ->  [0,6]
@tags sliding window, counting
@hook Same as Permutation in String, but record every match instead of stopping at the first.
@say
"I slide a window of length p across s and keep its letter counts in an array of 26. Each step I add the new letter and remove the letter that left. Once the window is full length and its counts equal p's counts, the window's start index, right minus length plus 1, is an answer.

O(n) time for the scan, and O(1) space because the arrays always have 26 entries."
@code
```python
def find_anagrams(s, p):
    k = len(p)
    need, window = [0] * 26, [0] * 26
    for ch in p:
        need[ord(ch) - ord("a")] += 1
    result = []
    for right, ch in enumerate(s):
        window[ord(ch) - ord("a")] += 1
        if right >= k:
            window[ord(s[right - k]) - ord("a")] -= 1
        if right >= k - 1 and window == need:
            result.append(right - k + 1)
    return result
```
@time O(n)
@space O(1), not counting the output
@test
assert find_anagrams("cbaebabacd", "abc") == [0, 6]
assert find_anagrams("abab", "ab") == [0, 1, 2]
assert find_anagrams("a", "ab") == []
assert find_anagrams("", "a") == []

### [2] Minimum Size Subarray Sum
@lc 209
@ask All numbers are positive. Return the length of the shortest contiguous subarray whose sum is at least target, or 0.
@eg target = 7, nums = [2,3,1,2,4,3]  ->  2   ([4,3])
@tags sliding window, shortest window
@hook Grow until the sum is big enough, then shrink from the left as far as possible, recording the length each time.
@say
"Because every number is positive, adding a number always makes the sum bigger and removing one makes it smaller. That makes a sliding window safe.

I add numbers on the right. As soon as the sum reaches the target, the window is valid, so I record its length and then try to shrink it from the left, subtracting numbers, while it stays valid. Every time it's still valid, I record the shorter length.

Each number is added once and removed once: O(n) time and O(1) space. I return 0 if no window ever reached the target."
@code
```python
def min_subarray_len(target, nums):
    left = window = 0
    best = float("inf")
    for right, x in enumerate(nums):
        window += x
        while window >= target:
            best = min(best, right - left + 1)
            window -= nums[left]
            left += 1
    return 0 if best == float("inf") else best
```
@time O(n)
@space O(1)
@follow What if the numbers can be negative?
The window trick breaks. Use prefix sums with a monotonic deque instead (LeetCode 862), O(n).
@test
assert min_subarray_len(7, [2, 3, 1, 2, 4, 3]) == 2
assert min_subarray_len(4, [1, 4, 4]) == 1
assert min_subarray_len(11, [1, 1, 1, 1, 1, 1, 1, 1]) == 0
assert min_subarray_len(15, [1, 2, 3, 4, 5]) == 5

### [2] Max Consecutive Ones III
@lc 1004
@ask In a binary array you can flip at most k zeros to ones. Return the longest run of ones you can get.
@eg nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2  ->  6
@tags sliding window, longest window
@hook Rephrase it: find the longest window with at most k zeros inside.
@say
"Flipping zeros is the same as asking: what is the longest window that contains at most k zeros? Then I flip all of them.

I slide a window and count the zeros inside it. I move `right` every step and add one to the count when I see a zero. While there are more than k zeros, I move `left` forward, and lower the count when a zero leaves. After that, the window is valid and I update the best length.

O(n) time and O(1) space."
@code
```python
def longest_ones(nums, k):
    left = zeros = best = 0
    for right, x in enumerate(nums):
        if x == 0:
            zeros += 1
        while zeros > k:
            if nums[left] == 0:
                zeros -= 1
            left += 1
        best = max(best, right - left + 1)
    return best
```
@time O(n)
@space O(1)
@test
assert longest_ones([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2) == 6
assert longest_ones([0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1], 3) == 10
assert longest_ones([0, 0, 0], 0) == 0
assert longest_ones([1, 1], 0) == 2

### [2] Fruit Into Baskets
@lc 904
@ask Trees in a row each give one type of fruit. With two baskets, each holding one type, what is the most fruit you can pick from a contiguous run of trees?
@eg [1,2,3,2,2]  ->  4   ([2,3,2,2])
@tags sliding window, hash map
@hook This is "longest subarray with at most 2 distinct values". Keep a count map and shrink when it has 3 keys.
@say
"Under the story, the question is: what is the longest contiguous subarray with at most two different values?

I slide a window and keep a map from fruit type to its count inside the window. I add the fruit on the right. If the map has more than two types, I shrink from the left, lowering counts and deleting a type when its count hits zero. Then I update the best length.

O(n) time, and O(1) space because the map never holds more than three keys. The same code solves 'at most k distinct' by changing the 2 to k."
@code
```python
def total_fruit(fruits):
    counts = {}
    left = best = 0
    for right, fruit in enumerate(fruits):
        counts[fruit] = counts.get(fruit, 0) + 1
        while len(counts) > 2:                  # three types: shrink
            counts[fruits[left]] -= 1
            if counts[fruits[left]] == 0:
                del counts[fruits[left]]
            left += 1
        best = max(best, right - left + 1)
    return best
```
@time O(n)
@space O(1)
@test
assert total_fruit([1, 2, 1]) == 3
assert total_fruit([0, 1, 2, 2]) == 3
assert total_fruit([1, 2, 3, 2, 2]) == 4
assert total_fruit([3, 3, 3, 1, 2, 1, 1, 2, 3, 3, 4]) == 5
assert total_fruit([]) == 0

### [2] Subarray Product Less Than K
@lc 713
@ask All numbers are positive. Count the contiguous subarrays whose product is less than k.
@eg nums = [10,5,2,6], k = 100  ->  8
@tags sliding window, counting
@hook For each right end, every window that starts between left and right is valid, so add right - left + 1.
@say
"I keep a window with a running product. I multiply in the number on the right. While the product is k or more, I divide out the number on the left and move `left` forward.

Now the key counting step. Once the window from left to right is valid, every subarray that ends at `right` and starts anywhere from `left` to `right` is also valid, because it's a smaller piece of positive numbers. That's right minus left plus 1 subarrays, so I add that to the count.

If k is 1 or less, no product of positive numbers can be smaller, so I return 0. O(n) time and O(1) space."
@code
```python
def num_subarray_product_less_than_k(nums, k):
    if k <= 1:
        return 0
    product = 1
    left = count = 0
    for right, x in enumerate(nums):
        product *= x
        while product >= k:
            product //= nums[left]
            left += 1
        count += right - left + 1          # subarrays ending at right
    return count
```
@time O(n)
@space O(1)
@test
assert num_subarray_product_less_than_k([10, 5, 2, 6], 100) == 8
assert num_subarray_product_less_than_k([1, 2, 3], 0) == 0
assert num_subarray_product_less_than_k([1, 1, 1], 2) == 6
assert num_subarray_product_less_than_k([5], 5) == 0

### [3] Minimum Window Substring
@lc 76
@ask Return the shortest substring of s that contains every character of t, including duplicates. Return "" if there is none.
@eg s = "ADOBECODEBANC", t = "ABC"  ->  "BANC"
@tags sliding window, hash map, shortest window
@hook Count what t needs. Grow right until nothing is missing, then shrink left while still covered, saving the best window.
@say
"I keep a count of the characters t still needs, and a single number, `missing`, for how many characters are still uncovered.

I move `right` across s. If the character is still needed, `missing` goes down by one. I always lower its need count, and a negative count means the window has extra copies. When `missing` hits zero, the window covers t. Then I shrink from the left as much as I can: I save the window if it's the shortest so far, give the left character back to the need count, and if that makes it needed again, `missing` goes up and I stop shrinking.

Each pointer moves at most n times, so it's O(n plus m) time and O(m) space for the counts."
@code
```python
from collections import Counter

def min_window(s, t):
    if not s or not t:
        return ""
    need = Counter(t)
    missing = len(t)                  # characters of t not yet covered
    left = 0
    best_start, best_len = 0, float("inf")
    for right, ch in enumerate(s):
        if need[ch] > 0:
            missing -= 1
        need[ch] -= 1                 # below 0 means an extra copy
        while missing == 0:           # window covers t, so shrink it
            if right - left + 1 < best_len:
                best_start, best_len = left, right - left + 1
            need[s[left]] += 1
            if need[s[left]] > 0:
                missing += 1          # dropped a character we needed
            left += 1
    return "" if best_len == float("inf") else s[best_start:best_start + best_len]
```
@time O(n + m)
@space O(m), m = distinct characters in t
@trap
Ignoring duplicates in t. For t = "AA", one "A" in the window isn't enough. Counting with `need` and `missing` handles it.
@test
assert min_window("ADOBECODEBANC", "ABC") == "BANC"
assert min_window("a", "a") == "a"
assert min_window("a", "aa") == ""
assert min_window("ab", "b") == "b"
assert min_window("bba", "ab") == "ba"
assert min_window("", "a") == ""

### [3] Sliding Window Maximum
@lc 239
@ask Return the maximum of every window of size k as it slides from left to right.
@eg nums = [1,3,-1,-3,5,3,6,7], k = 3  ->  [3,3,5,5,6,7]
@tags sliding window, monotonic deque
@hook Keep a deque of indexes whose values go down from front to back. The front is always the window's maximum.
@say
"Taking the max of each window is O(n times k). A heap gives O(n log n). The best is a monotonic deque, O(n).

The deque stores indexes, and their values are in decreasing order. When a new number comes in, I pop every smaller number from the back, because they can never be a maximum again: the new number is bigger and will stay in the window longer. Then I push the new index. If the front index has slid out of the window, I pop it from the front. Once the first window is complete, the front of the deque is the maximum.

Each index is pushed and popped at most once, so it's O(n) time and O(k) space."
@code
```python
from collections import deque

def max_sliding_window(nums, k):
    dq = deque()            # indexes, values decreasing front to back
    result = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()                    # smaller values can't be a max any more
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()                # front left the window
        if i >= k - 1:
            result.append(nums[dq[0]])
    return result
```
@time O(n)
@space O(k)
@test
assert max_sliding_window([1, 3, -1, -3, 5, 3, 6, 7], 3) == [3, 3, 5, 5, 6, 7]
assert max_sliding_window([1], 1) == [1]
assert max_sliding_window([9, 8, 7, 6], 2) == [9, 8, 7]
assert max_sliding_window([1, -1], 1) == [1, -1]
assert max_sliding_window([4, 2, 12, 3], 4) == [12]
