@section dp2 | Dynamic Programming: 2-D
@blurb Two strings, a grid, a list of items with a capacity, or a range. The state needs two numbers, so the table has two dimensions.

### [2] Pattern: how do you set up a 2-D DP?
@tags pattern, dynamic programming, two strings, grid
@hook Two inputs or a grid means dp[i][j]. Add an empty row and column for the base cases, fill row by row, then keep only one row to save memory.
@say
"When the state needs two numbers, like a position in each of two strings or a row and a column in a grid, the table is two-dimensional.

For **two strings**, dp[i][j] is the answer for the first i characters of one and the first j characters of the other. I add an extra row and column for the empty prefixes, which makes the base cases simple. Then each cell looks at the last characters: if they match, I usually come from the diagonal, dp[i minus 1][j minus 1]. If not, I take the best of dropping a character from one string or the other.

For a **grid**, dp[r][c] comes from the cell above and the cell to the left. For **knapsack**, dp[item][capacity]. For **ranges**, dp[l][r], filled by increasing length.

I draw a small table on the whiteboard and fill a few cells by hand. Then I optimise space: if a row only needs the row above, one row is enough."
@deep
| Problem | dp[i][j] means | Recurrence |
|---|---|---|
| Unique Paths | ways to reach (i, j) | up + left |
| Longest Common Subsequence | LCS of a[:i], b[:j] | match: diagonal + 1, else max(up, left) |
| Edit Distance | edits to turn a[:i] into b[:j] | match: diagonal, else 1 + min(up, left, diagonal) |
| 0/1 Knapsack | best value with the first i items and capacity j | max(skip, take) |
| Burst Balloons | best for the range l to r | try each balloon as the last one |
@trap
Forgetting that the table has an extra row and column. dp[i][j] then talks about `a[i - 1]` and `b[j - 1]`, and mixing those up is the most common bug.

### [2] Unique Paths
@lc 62
@ask A robot starts at the top-left of an m x n grid and moves only right or down. How many paths reach the bottom-right?
@eg m = 3, n = 7  ->  28
@tags dynamic programming, grid
@hook Paths to a cell = paths to the cell above + paths to the cell on the left. One row of the table is enough.
@say
"The robot reaches a cell either from above or from the left, so the number of paths to a cell is the sum of those two. Every cell in the first row and first column has exactly one path.

I only need the previous row, so I keep one row. When I update row[c], the old value of row[c] is the cell above, and row[c minus 1] has already been updated, so it's the cell on the left.

O(m times n) time and O(n) space. There's also a math answer: the robot makes m minus 1 downs and n minus 1 rights in some order, so it's the binomial coefficient C(m plus n minus 2, m minus 1)."
@code
```python
def unique_paths(m, n):
    row = [1] * n                    # the first row has one path to each cell
    for _ in range(1, m):
        for c in range(1, n):
            row[c] += row[c - 1]     # from above (old row[c]) + from the left
    return row[-1]
```
@time O(m * n)
@space O(n)
@follow What if some cells are blocked?
Set a blocked cell's count to 0 and keep the same update for the others. Be careful with the first row and column: everything after a block there is 0 too. That is LeetCode 63.
@test
assert unique_paths(3, 7) == 28
assert unique_paths(3, 2) == 3
assert unique_paths(1, 1) == 1
assert unique_paths(10, 10) == 48620

### [2] Minimum Path Sum
@lc 64
@ask Find a path from the top-left to the bottom-right of a grid of non-negative numbers, moving only right or down, with the smallest sum.
@eg [[1,3,1],[1,5,1],[4,2,1]]  ->  7   (1 -> 3 -> 1 -> 1 -> 1)
@tags dynamic programming, grid
@hook Cost of a cell = its value + the cheaper of the cell above and the cell on the left.
@say
"Like Unique Paths, but with costs. The cheapest path to a cell comes from the cheaper of its two possible previous cells, above or left, plus its own value.

I keep one row. For each cell, `dp[c]` still holds the value from the row above, and `dp[c minus 1]` has the new value to the left. Cells outside the grid count as infinity, except that the start has nothing before it.

O(rows times cols) time and O(cols) space."
@code
```python
def min_path_sum(grid):
    rows, cols = len(grid), len(grid[0])
    dp = [float("inf")] * cols
    dp[0] = 0                                 # nothing before the start
    for r in range(rows):
        for c in range(cols):
            left = dp[c - 1] if c > 0 else float("inf")
            dp[c] = grid[r][c] + min(dp[c], left)    # from above or the left
    return dp[-1]
```
@time O(rows * cols)
@space O(cols)
@test
assert min_path_sum([[1, 3, 1], [1, 5, 1], [4, 2, 1]]) == 7
assert min_path_sum([[1, 2, 3], [4, 5, 6]]) == 12
assert min_path_sum([[5]]) == 5

### [2] Longest Common Subsequence
@lc 1143
@ask Return the length of the longest sequence of characters that appears in both strings in the same order, not necessarily next to each other.
@eg "abcde", "ace"  ->  3   ("ace")
@tags dynamic programming, two strings
@hook Last letters match: 1 + LCS of both prefixes. They don't: the best of dropping the last letter of one string or the other.
@say
"dp[i][j] is the LCS length of the first i letters of a and the first j letters of b. An empty prefix gives 0, which fills the first row and column.

For each cell I look at the last letters, a[i minus 1] and b[j minus 1]. If they match, that letter can end the common subsequence, so dp[i][j] is dp[i minus 1][j minus 1] plus 1. If not, at least one of those letters isn't used, so I take the max of dropping the last letter from a, dp[i minus 1][j], or from b, dp[i][j minus 1].

O(m times n) time and space, and the space can drop to O(min(m, n)) with two rows."
@code
```python
def longest_common_subsequence(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]    # dp[i][j]: LCS of a[:i], b[:j]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1           # use the match
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])  # drop a letter
    return dp[m][n]
```
@time O(m * n)
@space O(m * n)
@test
assert longest_common_subsequence("abcde", "ace") == 3
assert longest_common_subsequence("abc", "abc") == 3
assert longest_common_subsequence("abc", "def") == 0
assert longest_common_subsequence("", "a") == 0
assert longest_common_subsequence("bsbininm", "jmjkbkjkv") == 1

### [2] Edit Distance
@lc 72
@ask Return the fewest single-character inserts, deletes or replacements to turn word1 into word2.
@eg "horse" -> "ros"  =  3   (replace h with r, delete r, delete e)
@tags dynamic programming, two strings
@hook dp[i][j] = edits for word1[:i] -> word2[:j]. Same last letter: no edit. Otherwise 1 + min(delete, insert, replace).
@say
"dp[i][j] is the fewest edits to turn the first i letters of word1 into the first j letters of word2. Turning a prefix into the empty string takes i deletes, and building a prefix from nothing takes j inserts, which fills the first column and row.

For other cells, if the last letters are equal, no edit is needed for them, so dp[i][j] equals dp[i minus 1][j minus 1]. Otherwise I take 1 plus the cheapest of three moves: delete word1's last letter, dp[i minus 1][j]; insert word2's last letter, dp[i][j minus 1]; or replace one with the other, dp[i minus 1][j minus 1].

O(m times n) time and space, or O(n) space with two rows. This is also called the Levenshtein distance, used in spell checkers and DNA comparison."
@code
```python
def min_distance(word1, word2):
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i                          # delete everything
    for j in range(n + 1):
        dp[0][j] = j                          # insert everything
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]   # nothing to change
            else:
                dp[i][j] = 1 + min(dp[i - 1][j],      # delete
                                   dp[i][j - 1],      # insert
                                   dp[i - 1][j - 1])  # replace
    return dp[m][n]
```
@time O(m * n)
@space O(m * n)
@test
assert min_distance("horse", "ros") == 3
assert min_distance("intention", "execution") == 5
assert min_distance("", "") == 0
assert min_distance("", "abc") == 3
assert min_distance("abc", "abc") == 0
assert min_distance("a", "b") == 1

### [2] 0/1 Knapsack
@ask Each item has a weight and a value, and you can take each item at most once. Return the biggest total value that fits in the capacity.
@eg weights = [1,3,4,5], values = [1,4,5,7], capacity = 7  ->  9   (weights 3 + 4)
@tags dynamic programming, knapsack
@hook For each item: skip it, or take it and add its value to the best answer for the remaining capacity. Loop capacity downwards to use each item once.
@say
"The full table is dp[i][c]: the best value using the first i items with capacity c. For item i, I either skip it, keeping dp[i minus 1][c], or take it if it fits, getting its value plus dp[i minus 1][c minus its weight]. I take the max.

Each row only needs the row above, so I keep one array `best` indexed by capacity. For each item I loop the capacity from high to low. Going downwards is important: best[c minus w] then still holds the value from before this item, so the item can't be taken twice.

O(n times capacity) time and O(capacity) space. It's pseudo-polynomial: fast when the capacity is a small number."
@code
```python
def knapsack(weights, values, capacity):
    best = [0] * (capacity + 1)               # best[c]: max value within capacity c
    for w, v in zip(weights, values):
        for c in range(capacity, w - 1, -1):  # downwards: each item at most once
            best[c] = max(best[c], best[c - w] + v)
    return best[capacity]
```
@time O(n * capacity)
@space O(capacity)
@follow What changes if you can take each item as many times as you like?
Loop the capacity upwards instead. Then `best[c - w]` may already include this item, which is exactly what unlimited copies means. Coin Change is this version.
@test
assert knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7) == 9
assert knapsack([10], [100], 5) == 0
assert knapsack([1, 2, 3], [6, 10, 12], 5) == 22
assert knapsack([], [], 10) == 0

### [2] Target Sum
@lc 494
@ask Put a + or - in front of every number. Count the ways to make the total equal target.
@eg nums = [1,1,1,1,1], target = 3  ->  5
@tags dynamic programming, knapsack, counting
@hook Plus group P and minus group M: P - M = target and P + M = total, so P = (total + target) / 2. Count subsets with that sum.
@say
"Trying every sign is O(2 to the n). Instead I use a little algebra. Split the numbers into the ones with plus, P, and the ones with minus, M. Then P minus M is the target and P plus M is the total, so P must equal total plus target, divided by 2.

So the question becomes: how many subsets sum to that value? If total plus target is odd, or the target is bigger than the total, the answer is 0. Otherwise it's a counting knapsack: ways[0] is 1, and for each number I go through the sums downwards and add ways[s minus x] to ways[s].

O(n times the goal sum) time and O(goal) space. Zeros work automatically: each one doubles the count, because +0 and -0 are both allowed."
@code
```python
def find_target_sum_ways(nums, target):
    total = sum(nums)
    if abs(target) > total or (total + target) % 2:
        return 0
    goal = (total + target) // 2              # sum of the "+" numbers
    ways = [1] + [0] * goal                   # ways[s]: subsets that sum to s
    for x in nums:
        for s in range(goal, x - 1, -1):      # downwards: each number once
            ways[s] += ways[s - x]
    return ways[goal]
```
@time O(n * goal)
@space O(goal)
@test
assert find_target_sum_ways([1, 1, 1, 1, 1], 3) == 5
assert find_target_sum_ways([1], 1) == 1
assert find_target_sum_ways([1], 2) == 0
assert find_target_sum_ways([0, 0, 0], 0) == 8
assert find_target_sum_ways([1, 0], 1) == 2
