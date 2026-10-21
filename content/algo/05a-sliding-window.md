@section window | Sliding Window
@blurb For the longest, shortest or best contiguous subarray or substring. Grow the window on the right, shrink it on the left.

### [1] Pattern: how does a sliding window work?
@tags pattern, sliding window
@hook Expand the right edge every step. Shrink the left edge only while the window breaks the rule. Each item enters and leaves once, so it's O(n).
@say
"A sliding window is a range from `left` to `right` that moves across the array or string. I use it when the problem asks about a **contiguous** subarray or substring, like the longest substring without repeats or the shortest subarray with a big enough sum.

There are two kinds. A **fixed-size** window of length k: each step I add the new item on the right and remove the item that falls off the left. A **variable-size** window: I always grow it by moving `right`, and while the window breaks the rule, I shrink it by moving `left`. After that I update the answer.

It's O(n) because each element enters the window once and leaves once. The window state is usually a running sum, a count map or a set."
@deep
```python
# Fixed size k
window = sum(nums[:k])
best = window
for right in range(k, len(nums)):
    window += nums[right] - nums[right - k]
    best = max(best, window)

# Variable size: LONGEST valid window
left = 0
for right in range(len(s)):
    add(s[right])
    while not valid():
        remove(s[left])
        left += 1
    best = max(best, right - left + 1)

# Variable size: SHORTEST valid window
left = 0
for right in range(len(s)):
    add(s[right])
    while valid():
        best = min(best, right - left + 1)
        remove(s[left])
        left += 1
```
@trap
Using a sliding window for sums when numbers can be negative. Adding an item may then make the sum smaller, so shrinking is not always right. Use prefix sums with a hash map instead.

### [1] Best Time to Buy and Sell Stock
@lc 121
@ask prices[i] is a stock's price on day i. Buy on one day and sell on a later day. Return the maximum profit, or 0.
@eg [7,1,5,3,6,4]  ->  5   (buy at 1, sell at 6)
@tags sliding window, arrays, greedy
@hook Keep the lowest price seen so far. Each day, the best sale is today's price minus that lowest price.
@say
"Checking every buy and sell pair is O(n squared). Instead I walk through the days once and keep the lowest price so far, which is the best day to have bought.

On each day I ask: if I sold today, what's my profit? That's today's price minus the lowest price so far. I keep the maximum of that. Then I update the lowest price if today is cheaper.

If prices only go down, the profit stays 0. One pass: O(n) time and O(1) space."
@code
```python
def max_profit(prices):
    min_price = float("inf")
    best = 0
    for price in prices:
        min_price = min(min_price, price)       # cheapest day to buy so far
        best = max(best, price - min_price)     # sell today
    return best
```
@time O(n)
@space O(1)
@follow What if you can buy and sell many times, holding one share at a time?
Add every price rise: if today is higher than yesterday, add the difference. That captures every upward move. O(n).
@test
assert max_profit([7, 1, 5, 3, 6, 4]) == 5
assert max_profit([7, 6, 4, 3, 1]) == 0
assert max_profit([]) == 0
assert max_profit([2, 4, 1]) == 2
assert max_profit([1, 2]) == 1

### [1] Maximum Average Subarray
@lc 643
@ask Find the contiguous subarray of length k with the largest average, and return that average.
@eg nums = [1,12,-5,-6,50,3], k = 4  ->  12.75
@tags sliding window, fixed size
@hook Fixed window: add the new number, subtract the one that falls off. No need to re-sum.
@say
"Summing every window from scratch is O(n times k). With a fixed-size sliding window, I sum the first k numbers once. Then I slide one step at a time: add the number entering on the right and subtract the number leaving on the left. I keep the biggest sum, and divide by k at the end.

That's O(n) time and O(1) space."
@code
```python
def find_max_average(nums, k):
    window = sum(nums[:k])
    best = window
    for right in range(k, len(nums)):
        window += nums[right] - nums[right - k]   # add new, drop old
        best = max(best, window)
    return best / k
```
@time O(n)
@space O(1)
@test
assert find_max_average([1, 12, -5, -6, 50, 3], 4) == 12.75
assert find_max_average([5], 1) == 5.0
assert find_max_average([0, 4, 0, 3, 2], 1) == 4.0
assert find_max_average([-1, -2, -3], 2) == -1.5

### [2] Longest Substring Without Repeating Characters
@lc 3
@ask Return the length of the longest substring with no repeated characters.
@eg "abcabcbb" -> 3 ("abc"),  "pwwkew" -> 3 ("wke")
@tags sliding window, hash map, strings
@hook Remember where each character was last seen. On a repeat inside the window, jump left to just past the old copy.
@say
"I use a sliding window that always has unique characters, and a map from each character to the last index where I saw it.

I move `right` one step at a time. If the new character was already seen inside the current window, I move `left` to one past its last position, which removes the duplicate. Then I record the new position and update the best length, right minus left plus 1.

Each character is visited once, so it's O(n) time. Space is O(k) for the map, where k is the size of the character set."
@code
```python
def length_of_longest_substring(s):
    last_seen = {}                 # char -> last index
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1          # jump past the old copy
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best
```
@time O(n)
@space O(k), k = size of the character set
@trap
Moving `left` back to an old position. In "abba", when the last "a" arrives, its old index is outside the window. The `>= left` check stops `left` from moving backwards.
@test
assert length_of_longest_substring("abcabcbb") == 3
assert length_of_longest_substring("bbbbb") == 1
assert length_of_longest_substring("pwwkew") == 3
assert length_of_longest_substring("") == 0
assert length_of_longest_substring("abba") == 2
assert length_of_longest_substring(" ") == 1
assert length_of_longest_substring("dvdf") == 3

### [2] Longest Repeating Character Replacement
@lc 424
@ask You can change at most k characters. Return the length of the longest substring that can be made of one repeated letter.
@eg s = "AABABBA", k = 1  ->  4
@tags sliding window, counting
@hook A window is valid when (window length - count of its most common letter) <= k. Those are the letters you'd replace.
@say
"In any window, the cheapest plan is to keep the most common letter and replace all the others. So the number of replacements needed is the window length minus the count of the most common letter.

I slide a window and keep letter counts and the highest count seen. I extend `right` each step. If the replacements needed are more than k, I shrink from the left. After each step, the window is valid, so I update the best length.

One detail: I never lower `max_freq` when shrinking. That's fine, because the answer only gets bigger when some letter reaches a higher count. O(n) time and O(26) space."
@code
```python
def character_replacement(s, k):
    counts = {}
    left = max_freq = best = 0
    for right, ch in enumerate(s):
        counts[ch] = counts.get(ch, 0) + 1
        max_freq = max(max_freq, counts[ch])
        # letters to replace = window length - most common count
        while (right - left + 1) - max_freq > k:
            counts[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best
```
@time O(n)
@space O(1), at most 26 letters
@test
assert character_replacement("ABAB", 2) == 4
assert character_replacement("AABABBA", 1) == 4
assert character_replacement("", 2) == 0
assert character_replacement("AAAA", 0) == 4
assert character_replacement("ABCDE", 1) == 2

### [2] Permutation in String
@lc 567
@ask Return true if s2 contains any rearrangement of s1 as a contiguous substring.
@eg s1 = "ab", s2 = "eidbaooo"  ->  true ("ba")
@tags sliding window, counting
@hook Slide a window of length len(s1) over s2 and compare letter counts. Equal counts mean a permutation.
@say
"A permutation of s1 is any string with exactly the same letter counts. So I slide a window of the same length as s1 across s2, and keep the letter counts of the window in an array of 26.

Each step I add the new letter on the right and remove the letter that falls off the left. If the window's counts equal s1's counts, I return true.

Comparing two arrays of 26 is constant work, so it's O(n) time, where n is the length of s2, and O(1) space."
@code
```python
def check_inclusion(s1, s2):
    k = len(s1)
    if k > len(s2):
        return False
    need, window = [0] * 26, [0] * 26
    for ch in s1:
        need[ord(ch) - ord("a")] += 1
    for right, ch in enumerate(s2):
        window[ord(ch) - ord("a")] += 1
        if right >= k:
            window[ord(s2[right - k]) - ord("a")] -= 1   # drop the letter that left
        if window == need:
            return True
    return False
```
@time O(n)
@space O(1)
@pro
To avoid comparing 26 counts each step, keep a `matches` counter of how many letters currently have equal counts, and update it only for the two letters that change. Then check `matches == 26`.
@test
assert check_inclusion("ab", "eidbaooo")
assert not check_inclusion("ab", "eidboaoo")
assert check_inclusion("a", "a")
assert not check_inclusion("abc", "ab")
assert check_inclusion("adc", "dcda")
