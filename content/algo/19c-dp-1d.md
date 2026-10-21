@section dp1 | Dynamic Programming: 1-D

### [2] Palindromic Substrings
@lc 647
@ask Count the substrings that are palindromes. Substrings at different positions count separately.
@eg "abc" -> 3,  "aaa" -> 6
@tags dynamic programming, expand around center, strings
@hook Expand around all 2n - 1 centers and count one palindrome for every successful step outwards.
@say
"I use the same expand-around-center idea as the longest palindrome problem. For each of the 2n minus 1 centers, I expand while both ends match, and every successful expansion is one more palindromic substring, so I add one each time.

O(n squared) time and O(1) space. The DP table version, where dp[i][j] says whether s[i..j] is a palindrome, gives the same time with O(n squared) space."
@code
```python
def count_substrings(s):
    count = 0
    for center in range(len(s)):
        for lo, hi in ((center, center), (center, center + 1)):
            while lo >= 0 and hi < len(s) and s[lo] == s[hi]:
                count += 1                    # s[lo:hi + 1] is a palindrome
                lo -= 1
                hi += 1
    return count
```
@time O(n^2)
@space O(1)
@test
assert count_substrings("abc") == 3
assert count_substrings("aaa") == 6
assert count_substrings("") == 0
assert count_substrings("abba") == 6

### [2] Partition Equal Subset Sum
@lc 416
@ask Can the array be split into two groups with equal sums?
@eg [1,5,11,5] -> true ([1,5,5] and [11]),  [1,2,3,5] -> false
@tags dynamic programming, knapsack, subset sum
@hook Two equal halves means one subset sums to total / 2. That's 0/1 knapsack: track which sums are reachable, looping sums downwards.
@say
"If the total is odd, it's impossible. Otherwise I need a subset that sums to exactly half the total, and the rest automatically makes the other half.

That's the subset sum problem, a 0/1 knapsack. I keep a boolean array `reachable`, where reachable[s] says some subset of the numbers seen so far sums to s. Zero is always reachable. For each number x, I go through the sums from the target down to x, and mark s as reachable if s minus x was reachable. Going downwards means each number is used at most once in a round.

O(n times target) time and O(target) space."
@code
```python
def can_partition(nums):
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    reachable = [True] + [False] * target     # reachable[s]: a subset sums to s
    for x in nums:
        for s in range(target, x - 1, -1):    # downwards: use x at most once
            if reachable[s - x]:
                reachable[s] = True
    return reachable[target]
```
@time O(n * target)
@space O(target)
@trap
Looping the sums upwards. Then one number can be added again in the same round, as if you had it twice.
@pro
In Python, a big integer works as a bitset: `bits = 1`, then `bits |= bits << x` for each number, and check `bits >> target & 1`. It is the same DP, much faster.
@test
assert can_partition([1, 5, 11, 5])
assert not can_partition([1, 2, 3, 5])
assert can_partition([1, 1])
assert not can_partition([2])
assert can_partition([3, 3, 3, 4, 5])

### [2] Perfect Squares
@lc 279
@ask Return the fewest perfect squares (1, 4, 9, 16, ...) that add up to n.
@eg 12 -> 3 (4 + 4 + 4),  13 -> 2 (4 + 9)
@tags dynamic programming, knapsack, math
@hook Coin Change where the coins are the squares up to n: dp[i] = 1 + min(dp[i - j * j]).
@say
"This is Coin Change where the coins are all the perfect squares up to n. dp[i] is the fewest squares that sum to i, with dp[0] equal to 0. For each i, the last square used is j squared for some j, so dp[i] is 1 plus the minimum of dp[i minus j squared].

There are about the square root of n squares, so it's O(n times the square root of n) time and O(n) space. BFS over the remainders also works. There's even a math answer: by Lagrange's theorem, the answer is never more than 4."
@code
```python
def num_squares(n):
    dp = [0] + [float("inf")] * n             # dp[i]: fewest squares summing to i
    for i in range(1, n + 1):
        j = 1
        while j * j <= i:
            dp[i] = min(dp[i], dp[i - j * j] + 1)
            j += 1
    return dp[n]
```
@time O(n * sqrt(n))
@space O(n)
@test
assert num_squares(12) == 3
assert num_squares(13) == 2
assert num_squares(1) == 1
assert num_squares(0) == 0
assert num_squares(7) == 4

### [2] Best Time to Buy and Sell Stock with Cooldown
@lc 309
@ask Buy and sell as many times as you like, one share at a time, but after selling you must wait one day before buying again. Return the max profit.
@eg [1,2,3,0,2]  ->  3   (buy, sell, cooldown, buy, sell)
@tags dynamic programming, state machine
@hook Three states per day: holding a share, just sold (cooling down), or resting with no share. Each day's states come from yesterday's.
@say
"I describe each day with three states. **hold**: I own a share. **sold**: I sold today, so tomorrow is a cooldown. **rest**: I have no share and I'm free to buy.

The transitions: hold is the max of keeping yesterday's share or buying today from rest, which is rest minus the price. Sold is yesterday's hold plus today's price. Rest is the max of yesterday's rest or yesterday's sold, because the cooldown is over. I update all three at the same time from yesterday's values.

The answer is the best of sold and rest at the end. O(n) time and O(1) space. This state machine idea solves the whole stock problem family, including fees and a limit of k trades."
@code
```python
def max_profit_cooldown(prices):
    hold, sold, rest = float("-inf"), 0, 0
    for p in prices:
        # All three use yesterday's values.
        hold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)
    return max(sold, rest)
```
@time O(n)
@space O(1)
@test
assert max_profit_cooldown([1, 2, 3, 0, 2]) == 3
assert max_profit_cooldown([1]) == 0
assert max_profit_cooldown([]) == 0
assert max_profit_cooldown([1, 2, 4]) == 3
assert max_profit_cooldown([2, 1, 4]) == 3
