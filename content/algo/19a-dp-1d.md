@section dp1 | Dynamic Programming: 1-D
@blurb Break a problem into smaller versions of itself, solve each one once, and reuse the answers. Start here with problems where the state is one index or one amount.

### [1] Pattern: how do you solve a dynamic programming problem step by step?
@tags pattern, dynamic programming, memoization
@hook Four steps: what dp[i] means in words, how dp[i] is built from smaller answers, the base cases, and the order to fill the table.
@say
"I think of DP as recursion plus memory. I use it when the problem asks to **count the ways**, find the **minimum or maximum**, or check **whether something is possible**, and the choices lead to the same smaller problems again and again.

I follow four steps. One: define the **state** in words, for example 'dp[i] is the most money I can rob from the first i houses'. Two: write the **recurrence** by thinking about the last choice: at house i I either rob it, adding dp[i minus 2], or skip it, keeping dp[i minus 1]. Three: set the **base cases**, like dp[0] equals 0. Four: choose the **order**, so smaller answers are ready before I need them, and say where the final answer is.

I can write it **top-down**, a recursive function with a cache, which is quick to get right. Or **bottom-up**, a loop that fills a table, which avoids recursion limits. Then I shrink the memory: if dp[i] only needs the last two values, I keep just two variables."
@deep
```python
from functools import cache

# Top-down: recursion + cache
def rob_top_down(nums):
    @cache
    def best(i):                       # most money from houses i, i+1, ...
        if i >= len(nums):
            return 0
        return max(best(i + 1), nums[i] + best(i + 2))   # skip or take
    return best(0)

# Bottom-up: fill a table from small to big
def rob_bottom_up(nums):
    dp = [0] * (len(nums) + 2)
    for i in range(len(nums) - 1, -1, -1):
        dp[i] = max(dp[i + 1], nums[i] + dp[i + 2])
    return dp[0]
```
| Shape | Examples | State |
|---|---|---|
| Linear | Climbing Stairs, House Robber, Decode Ways | dp[i] = answer for the first i items |
| Knapsack | Coin Change, Partition Equal Subset Sum, Target Sum | dp[amount] |
| Subsequence | Longest Increasing Subsequence | dp[i] = best ending at i |
| Two strings | LCS, Edit Distance | dp[i][j] = answer for a[:i] and b[:j] |
| Grid | Unique Paths, Minimum Path Sum | dp[r][c] |
| Interval | Burst Balloons, palindromes | dp[l][r] |
| State machine | Stock with cooldown or fee | a few states per day |
@trap
Jumping to the code before saying what dp[i] means. If you can't say the state in one sentence, the recurrence will be wrong.

### [1] Climbing Stairs
@lc 70
@ask You climb n stairs, taking 1 or 2 steps at a time. How many different ways can you reach the top?
@eg n = 3  ->  3   (1+1+1, 1+2, 2+1)
@tags dynamic programming, fibonacci
@hook The last move was 1 step or 2 steps, so ways(n) = ways(n - 1) + ways(n - 2). It's Fibonacci.
@say
"I think about the last move. To stand on step n, I came from step n minus 1 with a single step, or from step n minus 2 with a double step. So the number of ways to reach n is ways(n minus 1) plus ways(n minus 2), with one way to stand at the start.

That's the Fibonacci sequence. Since each value only needs the previous two, I keep two variables instead of an array.

O(n) time and O(1) space."
@code
```python
def climb_stairs(n):
    a, b = 1, 1                 # ways to reach step 0 and step 1
    for _ in range(n - 1):
        a, b = b, a + b         # ways(i) = ways(i - 1) + ways(i - 2)
    return b
```
@time O(n)
@space O(1)
@follow What if you can take 1, 2 or 3 steps, or any step size from a list?
The same idea: ways(i) is the sum of ways(i - s) for every allowed step size s. With k step sizes it's O(n * k).
@test
assert climb_stairs(1) == 1
assert climb_stairs(2) == 2
assert climb_stairs(3) == 3
assert climb_stairs(5) == 8
assert climb_stairs(45) == 1836311903

### [1] Min Cost Climbing Stairs
@lc 746
@ask cost[i] is the price of stepping on stair i. You can start on stair 0 or 1 and climb 1 or 2 stairs at a time. Return the cheapest cost to get past the last stair.
@eg [10,15,20] -> 15,  [1,100,1,1,1,100,1,1,100,1] -> 6
@tags dynamic programming
@hook cheapest(i) = min(cheapest(i - 1) + cost[i - 1], cheapest(i - 2) + cost[i - 2]). The top is position len(cost).
@say
"Let cheapest(i) be the lowest cost to stand on position i, where the top is position n, one past the last stair. Starting on stair 0 or 1 is free, so both are 0.

To reach position i, I either stepped from i minus 1, paying cost[i minus 1], or from i minus 2, paying cost[i minus 2]. I take the cheaper one. Again only the last two values matter, so I keep two variables.

O(n) time and O(1) space."
@code
```python
def min_cost_climbing_stairs(cost):
    a = b = 0                   # cheapest to stand on positions i - 2 and i - 1
    for i in range(2, len(cost) + 1):
        a, b = b, min(b + cost[i - 1], a + cost[i - 2])
    return b
```
@time O(n)
@space O(1)
@test
assert min_cost_climbing_stairs([10, 15, 20]) == 15
assert min_cost_climbing_stairs([1, 100, 1, 1, 1, 100, 1, 1, 100, 1]) == 6
assert min_cost_climbing_stairs([0, 0]) == 0
assert min_cost_climbing_stairs([5, 10]) == 5

### [2] House Robber
@lc 198
@ask You can't rob two houses next to each other. Return the most money you can rob.
@eg [2,7,9,3,1]  ->  12   (2 + 9 + 1)
@tags dynamic programming
@hook At each house: skip it (keep the best so far) or rob it (add it to the best from two houses back).
@say
"For each house I have two choices. If I skip it, my best total is the best up to the previous house. If I rob it, I can't have robbed the previous house, so it's this house's money plus the best up to two houses back. I take the bigger one.

So best(i) equals the max of best(i minus 1) and best(i minus 2) plus nums[i]. Only the last two values are needed, so I keep `prev` and `curr`.

O(n) time and O(1) space."
@code
```python
def rob(nums):
    prev, curr = 0, 0           # best up to two houses back, and up to the last house
    for x in nums:
        prev, curr = curr, max(curr, prev + x)    # skip x, or rob x
    return curr
```
@time O(n)
@space O(1)
@trap
Assuming the answer is just the even or the odd houses. For [2, 1, 1, 2] the best is 4, robbing the first and the last.
@test
assert rob([1, 2, 3, 1]) == 4
assert rob([2, 7, 9, 3, 1]) == 12
assert rob([]) == 0
assert rob([5]) == 5
assert rob([2, 1, 1, 2]) == 4

### [2] House Robber II
@lc 213
@ask Same as House Robber, but the houses are in a circle, so the first and last houses are neighbours.
@eg [2,3,2] -> 3,  [1,2,3,1] -> 4
@tags dynamic programming
@hook The first and last houses can't both be robbed. Solve the line without the first house and the line without the last house, and take the better one.
@say
"The circle adds one rule: I can't rob both the first and the last house. So at least one of them is skipped.

That gives two normal House Robber problems: one on all houses except the first, and one on all houses except the last. The answer is the better of the two. With only one house, I just rob it.

Two linear passes: O(n) time and O(1) extra space, besides the slices, which I could avoid by passing index ranges."
@code
```python
def rob_circle(nums):
    def rob_line(houses):
        prev = curr = 0
        for x in houses:
            prev, curr = curr, max(curr, prev + x)
        return curr

    if len(nums) == 1:
        return nums[0]
    # The first and last houses touch, so leave out one of them.
    return max(rob_line(nums[1:]), rob_line(nums[:-1]))
```
@time O(n)
@space O(n) for the slices, O(1) with index ranges
@test
assert rob_circle([2, 3, 2]) == 3
assert rob_circle([1, 2, 3, 1]) == 4
assert rob_circle([1, 2, 3]) == 3
assert rob_circle([5]) == 5
assert rob_circle([]) == 0

### [2] Coin Change
@lc 322
@ask Return the fewest coins that add up to amount, or -1 if it can't be done. You have unlimited coins of each type.
@eg coins = [1,2,5], amount = 11  ->  3   (5 + 5 + 1)
@tags dynamic programming, knapsack
@hook dp[a] = 1 + min(dp[a - coin]) over all coins. Build it from amount 0 upwards.
@say
"Greedy, taking the biggest coin first, fails for coins like 1, 3 and 4 with amount 6. So I use DP.

dp[a] is the fewest coins to make amount a. dp[0] is 0. For every other amount, the last coin I used was one of the coins c, so dp[a] is 1 plus the minimum of dp[a minus c] over all coins that fit. I fill the table from 1 up to the amount. I use amount plus 1 as 'impossible', since that's more coins than could ever be needed.

O(amount times number of coins) time and O(amount) space."
@code
```python
def coin_change(coins, amount):
    impossible = amount + 1                  # more coins than ever needed
    dp = [0] + [impossible] * amount         # dp[a] = fewest coins for a
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return dp[amount] if dp[amount] != impossible else -1
```
@time O(amount * coins)
@space O(amount)
@test
assert coin_change([1, 2, 5], 11) == 3
assert coin_change([2], 3) == -1
assert coin_change([1], 0) == 0
assert coin_change([1, 3, 4], 6) == 2
assert coin_change([2, 5, 10, 1], 27) == 4

### [2] Coin Change II
@lc 518
@ask Count the combinations of coins that make up amount. You have unlimited coins of each type. Order doesn't matter.
@eg amount = 5, coins = [1,2,5]  ->  4
@tags dynamic programming, knapsack, counting
@hook Loop over coins on the outside and amounts on the inside. Each combination is then counted once, in coin order.
@say
"ways[a] is the number of combinations that make amount a, and ways[0] is 1: the empty combination.

The loop order is the key. I put the coins in the outer loop. For each coin, I go through amounts from the coin's value up, and add ways[a minus coin] to ways[a]. Because coins are added one type at a time, every combination is built in the same coin order, so 1 plus 2 and 2 plus 1 are counted once.

O(amount times number of coins) time and O(amount) space."
@code
```python
def change(amount, coins):
    ways = [1] + [0] * amount               # ways[a] = combinations for a
    for c in coins:                         # coins outside: no repeats in another order
        for a in range(c, amount + 1):
            ways[a] += ways[a - c]
    return ways[amount]
```
@time O(amount * coins)
@space O(amount)
@trap
Swapping the two loops. With amounts outside and coins inside, you count every order separately, which answers a different question: Combination Sum IV, LeetCode 377.
@test
assert change(5, [1, 2, 5]) == 4
assert change(3, [2]) == 0
assert change(10, [10]) == 1
assert change(0, []) == 1
