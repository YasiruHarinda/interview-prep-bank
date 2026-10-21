@section dp1 | Dynamic Programming: 1-D

### [2] Longest Increasing Subsequence
@lc 300
@ask Return the length of the longest strictly increasing subsequence (not necessarily contiguous).
@eg [10,9,2,5,3,7,101,18]  ->  4   ([2,3,7,101])
@tags dynamic programming, binary search
@hook O(n^2): dp[i] = longest run ending at i. O(n log n): keep the smallest possible tail for each length and binary search into it.
@say
"The O(n squared) DP: dp[i] is the length of the longest increasing subsequence that ends at index i. For each i, I look at every earlier j with a smaller value and take dp[j] plus 1. The answer is the biggest dp value.

The faster version keeps a list `tails`, where tails[k] is the smallest possible last value of an increasing subsequence of length k plus 1. This list is always sorted. For each number, I binary search for the first tail that is at least as big. If there is none, the number extends the longest subsequence, so I append it. Otherwise I replace that tail with the smaller number, which leaves more room to grow later.

The length of `tails` is the answer: O(n log n) time and O(n) space. Note that `tails` itself isn't a real subsequence, only its length is right."
@code
```python
import bisect

def length_of_lis_dp(nums):                   # O(n^2)
    dp = [1] * len(nums)                      # dp[i]: longest run ending at i
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp, default=0)

def length_of_lis(nums):                      # O(n log n)
    tails = []                                # tails[k]: smallest tail for length k + 1
    for x in nums:
        i = bisect.bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)                   # x extends the longest run
        else:
            tails[i] = x                      # a smaller tail for length i + 1
    return len(tails)
```
@time O(n log n)
@space O(n)
@test
for f in (length_of_lis_dp, length_of_lis):
    assert f([10, 9, 2, 5, 3, 7, 101, 18]) == 4
    assert f([0, 1, 0, 3, 2, 3]) == 4
    assert f([7, 7, 7, 7]) == 1
    assert f([]) == 0
    assert f([4, 10, 4, 3, 8, 9]) == 3

### [2] Word Break
@lc 139
@ask Can string s be split into a sequence of words from the dictionary? Words can be reused.
@eg "leetcode", ["leet","code"] -> true,  "catsandog", ["cats","dog","sand","and","cat"] -> false
@tags dynamic programming, strings
@hook ok[i] is true when some earlier split point j is ok and s[j:i] is a dictionary word.
@say
"ok[i] means the first i characters can be split into dictionary words. ok[0] is true: the empty prefix needs no words.

For each end position i, I look at possible start positions j of the last word. If ok[j] is true and the piece from j to i is in the dictionary, then ok[i] is true. I put the words in a set for O(1) lookups, and I only check pieces up to the longest word's length.

The answer is ok[n]. With L as the longest word, it's O(n times L) checks, each costing O(L) to slice, and O(n) space."
@code
```python
def word_break(s, word_dict):
    words = set(word_dict)
    max_len = max(map(len, words), default=0)
    ok = [True] + [False] * len(s)            # ok[i]: s[:i] splits into words
    for i in range(1, len(s) + 1):
        for j in range(max(0, i - max_len), i):
            if ok[j] and s[j:i] in words:
                ok[i] = True
                break
    return ok[len(s)]
```
@time O(n * L^2), L = longest word
@space O(n)
@test
assert word_break("leetcode", ["leet", "code"])
assert word_break("applepenapple", ["apple", "pen"])
assert not word_break("catsandog", ["cats", "dog", "sand", "and", "cat"])
assert word_break("", ["a"])
assert not word_break("a", [])

### [2] Decode Ways
@lc 91
@ask Letters are encoded as "1" for A up to "26" for Z. Count the ways to decode a string of digits.
@eg "226" -> 3 ("BZ", "VF", "BBF"),  "06" -> 0
@tags dynamic programming, strings
@hook Like Climbing Stairs with rules: take one digit if it isn't 0, take two digits if they form 10 to 26.
@say
"It's Climbing Stairs with conditions. ways(i) is the number of ways to decode the first i digits.

The last piece is either one digit or two digits. One digit works if it isn't '0', and then I add ways(i minus 1). Two digits work if they form a number from 10 to 26, and then I add ways(i minus 2). A leading zero, like '06', can't be decoded, which the 10 to 26 check handles.

I only need the last two values: O(n) time and O(1) space."
@code
```python
def num_decodings(s):
    if not s:
        return 0
    prev2, prev1 = 1, 0 if s[0] == "0" else 1    # ways for s[:i - 2] and s[:i - 1]
    for i in range(2, len(s) + 1):
        curr = 0
        if s[i - 1] != "0":
            curr += prev1                     # last digit alone: 1 to 9
        if 10 <= int(s[i - 2:i]) <= 26:
            curr += prev2                     # last two digits: 10 to 26
        prev2, prev1 = prev1, curr
    return prev1
```
@time O(n)
@space O(1)
@trap
Accepting "06" as 6. A two-digit piece must be between 10 and 26, so a piece starting with 0 never counts.
@test
assert num_decodings("12") == 2
assert num_decodings("226") == 3
assert num_decodings("06") == 0
assert num_decodings("0") == 0
assert num_decodings("10") == 1
assert num_decodings("27") == 1
assert num_decodings("11106") == 2
assert num_decodings("") == 0

### [2] Maximum Product Subarray
@lc 152
@ask Return the largest product of a contiguous subarray.
@eg [2,3,-2,4] -> 6,  [-2,3,-4] -> 24
@tags dynamic programming, kadane
@hook Track both the biggest and the smallest product ending here. A negative number turns the smallest into the biggest.
@say
"This is like Kadane's algorithm, but negative numbers make it tricky: a very negative product can become the biggest one after multiplying by another negative.

So I track two values for subarrays ending at the current position: the largest product and the smallest product. When the current number is negative, I swap them first, because multiplying flips their order. Then the new largest is either the number alone or the old largest times the number, and the same for the smallest. I keep the overall best.

A zero resets both to zero, and starting fresh after it is handled by 'the number alone'. O(n) time and O(1) space."
@code
```python
def max_product(nums):
    best = cur_max = cur_min = nums[0]
    for x in nums[1:]:
        if x < 0:
            cur_max, cur_min = cur_min, cur_max     # a negative flips them
        cur_max = max(x, cur_max * x)
        cur_min = min(x, cur_min * x)
        best = max(best, cur_max)
    return best
```
@time O(n)
@space O(1)
@test
assert max_product([2, 3, -2, 4]) == 6
assert max_product([-2, 0, -1]) == 0
assert max_product([-2, 3, -4]) == 24
assert max_product([-2]) == -2
assert max_product([0, 2]) == 2
assert max_product([-1, -3, -10, 0, 60]) == 60

### [2] Longest Palindromic Substring
@lc 5
@ask Return the longest substring that reads the same forwards and backwards.
@eg "babad" -> "bab" (or "aba"),  "cbbd" -> "bb"
@tags dynamic programming, expand around center, strings
@hook Every palindrome has a center. Try all 2n - 1 centers (letters and gaps) and expand while both ends match.
@say
"A palindrome mirrors around its center. The center is either a single letter, for odd lengths, or the gap between two letters, for even lengths. That's 2n minus 1 possible centers.

For each center, I expand outwards while the characters on both sides match. When they stop matching, the palindrome is the part just inside. I keep the longest one I've seen.

Each expansion is O(n), so O(n squared) time in total, but only O(1) extra space. A DP table also works in O(n squared) time but needs O(n squared) space, and Manacher's algorithm does it in O(n), but it's rarely expected."
@code
```python
def longest_palindrome(s):
    start, length = 0, 0
    for center in range(len(s)):
        for lo, hi in ((center, center), (center, center + 1)):   # odd, even
            while lo >= 0 and hi < len(s) and s[lo] == s[hi]:
                lo -= 1
                hi += 1
            if hi - lo - 1 > length:          # the palindrome is s[lo + 1:hi]
                start, length = lo + 1, hi - lo - 1
    return s[start:start + length]
```
@time O(n^2)
@space O(1)
@test
assert longest_palindrome("babad") in ("bab", "aba")
assert longest_palindrome("cbbd") == "bb"
assert longest_palindrome("a") == "a"
assert longest_palindrome("") == ""
assert longest_palindrome("forgeeksskeegfor") == "geeksskeeg"
assert longest_palindrome("ac") == "a"
