@section dp2 | Dynamic Programming: 2-D

### [2] Maximal Square
@lc 221
@ask In a binary matrix of "0" and "1", return the area of the largest square that contains only 1s.
@eg [["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]  ->  4
@tags dynamic programming, grid
@hook dp = side of the biggest square whose bottom-right corner is here = 1 + min(up, left, up-left).
@say
"dp[r][c] is the side length of the largest all-ones square whose bottom-right corner is at (r, c). If the cell is 0, it's 0.

If the cell is 1, the square can only grow as far as all three neighbours allow: the cell above, the cell to the left and the cell diagonally up-left. So it's 1 plus the minimum of those three. I keep the largest side I see, and the answer is that side squared.

I add a padding row and column of zeros so the edges need no special case. O(rows times cols) time and space, or O(cols) space with one row."
@code
```python
def maximal_square(matrix):
    rows, cols = len(matrix), len(matrix[0])
    dp = [[0] * (cols + 1) for _ in range(rows + 1)]   # padded with zeros
    best = 0
    for r in range(1, rows + 1):
        for c in range(1, cols + 1):
            if matrix[r - 1][c - 1] == "1":
                dp[r][c] = 1 + min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1])
                best = max(best, dp[r][c])
    return best * best
```
@time O(rows * cols)
@space O(rows * cols)
@test
m = [list("10100"), list("10111"), list("11111"), list("10010")]
assert maximal_square(m) == 4
assert maximal_square([["0", "1"], ["1", "0"]]) == 1
assert maximal_square([["0"]]) == 0
assert maximal_square([["1", "1"], ["1", "1"]]) == 4

### [2] Interleaving String
@lc 97
@ask Is s3 made by interleaving s1 and s2, keeping the order of characters within each?
@eg s1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"  ->  true
@tags dynamic programming, two strings
@hook dp[i][j]: can s1[:i] and s2[:j] form s3[:i + j]? The last character of s3 came from s1 or from s2.
@say
"First, if the lengths don't add up, it's false.

dp[i][j] says whether the first i characters of s1 and the first j of s2 can interleave to form the first i plus j characters of s3. The empty case is true. For other cells, the last character of that s3 prefix came either from s1 or from s2. It came from s1 if dp[i minus 1][j] is true and s1's i-th character matches. It came from s2 if dp[i][j minus 1] is true and s2's j-th character matches.

O(m times n) time and space, or O(n) with one row."
@code
```python
def is_interleave(s1, s2, s3):
    m, n = len(s1), len(s2)
    if m + n != len(s3):
        return False
    dp = [[False] * (n + 1) for _ in range(m + 1)]   # s1[:i] + s2[:j] -> s3[:i + j]?
    dp[0][0] = True
    for i in range(m + 1):
        for j in range(n + 1):
            if i > 0 and dp[i - 1][j] and s1[i - 1] == s3[i + j - 1]:
                dp[i][j] = True                     # last char came from s1
            if j > 0 and dp[i][j - 1] and s2[j - 1] == s3[i + j - 1]:
                dp[i][j] = True                     # last char came from s2
    return dp[m][n]
```
@time O(m * n)
@space O(m * n)
@trap
A greedy two-pointer scan. When both strings could supply the next character, you can't know which one to take, so you must try both. That's why it needs DP.
@test
assert is_interleave("aabcc", "dbbca", "aadbbcbcac")
assert not is_interleave("aabcc", "dbbca", "aadbbbaccc")
assert is_interleave("", "", "")
assert is_interleave("a", "", "a")
assert is_interleave("a", "b", "ab")
assert not is_interleave("a", "b", "abc")

### [2] Triangle
@lc 120
@ask Find the smallest path sum from the top of a number triangle to the bottom. From each number you can step to one of the two numbers below it.
@eg [[2],[3,4],[6,5,7],[4,1,8,3]]  ->  11   (2 + 3 + 5 + 1)
@tags dynamic programming
@hook Work from the bottom up. Each number becomes itself plus the smaller of its two children. The top ends up as the answer.
@say
"Going top-down needs care at the edges and a final min over the bottom row. Bottom-up is cleaner.

I start with a copy of the bottom row. For each row above it, every number becomes its own value plus the smaller of the two values below it, which are the best paths from those children. I reuse one array, overwriting left to right, which is safe because each position only needs positions c and c plus 1 from the row below.

When I reach the top, best[0] is the answer. O(n squared) time, where n is the number of rows, and O(n) space."
@code
```python
def minimum_total(triangle):
    best = triangle[-1][:]                    # start with the bottom row
    for r in range(len(triangle) - 2, -1, -1):
        for c in range(r + 1):
            best[c] = triangle[r][c] + min(best[c], best[c + 1])
    return best[0]
```
@time O(n^2)
@space O(n)
@test
assert minimum_total([[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]]) == 11
assert minimum_total([[-10]]) == -10
assert minimum_total([[1], [2, 3]]) == 3

### [3] Longest Increasing Path in a Matrix
@lc 329
@ask Return the length of the longest strictly increasing path in a matrix, moving up, down, left or right.
@eg [[9,9,4],[6,6,8],[2,1,1]]  ->  4   (1, 2, 6, 9)
@tags dynamic programming, dfs, memoization, grid
@hook DFS from each cell with memoization. Paths only go up in value, so there are no cycles and each cell's answer can be cached.
@say
"I define longest_from(r, c) as the longest increasing path that starts at that cell. It's 1 plus the best longest_from of any neighbour with a bigger value.

Because the path must strictly increase, it can never come back to a cell, so there are no cycles and the results can be cached safely. With memoization, each cell is computed once, and each computation looks at four neighbours. The answer is the max over all cells.

O(rows times cols) time and space. The recursion can get deep on a big matrix, so for safety I'd mention a topological-sort version that peels cells from the smallest values up."
@code
```python
from functools import cache

def longest_increasing_path(matrix):
    rows, cols = len(matrix), len(matrix[0])

    @cache
    def longest_from(r, c):                   # longest path starting at (r, c)
        best = 1
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and matrix[nr][nc] > matrix[r][c]:
                best = max(best, 1 + longest_from(nr, nc))
        return best

    return max(longest_from(r, c) for r in range(rows) for c in range(cols))
```
@time O(rows * cols)
@space O(rows * cols)
@test
assert longest_increasing_path([[9, 9, 4], [6, 6, 8], [2, 1, 1]]) == 4
assert longest_increasing_path([[3, 4, 5], [3, 2, 6], [2, 2, 1]]) == 4
assert longest_increasing_path([[1]]) == 1

### [3] Distinct Subsequences
@lc 115
@ask Count the number of distinct subsequences of s that equal t.
@eg s = "rabbbit", t = "rabbit"  ->  3
@tags dynamic programming, two strings, counting
@hook For each character of s, every position j where t[j - 1] matches can extend the ways to build t[:j - 1]. Loop j downwards.
@say
"ways[j] is the number of ways to form the first j characters of t using the part of s I've scanned so far. ways[0] is 1, because there's one way to form the empty string.

For each character of s, I check every position in t where it matches. If t's j-th character equals it, then every way of forming the first j minus 1 characters can be extended by this character, so I add ways[j minus 1] to ways[j]. I loop j from high to low so that the character is used at most once per position, the same trick as 0/1 knapsack.

O(m times n) time and O(n) space, where n is the length of t."
@code
```python
def num_distinct(s, t):
    ways = [1] + [0] * len(t)                 # ways[j]: ways to form t[:j]
    for ch in s:
        for j in range(len(t), 0, -1):        # downwards: use ch once per j
            if t[j - 1] == ch:
                ways[j] += ways[j - 1]
    return ways[len(t)]
```
@time O(m * n)
@space O(n)
@test
assert num_distinct("rabbbit", "rabbit") == 3
assert num_distinct("babgbag", "bag") == 5
assert num_distinct("", "a") == 0
assert num_distinct("abc", "") == 1

### [3] Regular Expression Matching
@lc 10
@ask Implement matching for patterns with "." (any one character) and "*" (zero or more of the character before it). The whole string must match.
@eg "aa", "a*" -> true,  "aab", "c*a*b" -> true,  "mississippi", "mis*is*p*." -> false
@tags dynamic programming, recursion, memoization, strings
@hook match(i, j): does s[i:] match p[j:]? If p[j + 1] is "*", either skip "x*" or use it for one character and stay on it.
@say
"I write match(i, j): does the rest of s from i match the rest of the pattern from j? If the pattern is used up, it's a match only if the string is also used up.

`first` says whether the current characters match: the string isn't empty and the pattern character is the same or a dot. If the next pattern character is a star, I have two choices. Use the 'x star' zero times, so skip two pattern characters: match(i, j plus 2). Or use it once more, which needs `first`, and then stay on the same pattern position: match(i plus 1, j). Without a star, I need `first` and then match(i plus 1, j plus 1).

With memoization each (i, j) pair is solved once: O(m times n) time and space."
@code
```python
from functools import cache

def is_match(s, p):
    @cache
    def match(i, j):                          # does s[i:] match p[j:]?
        if j == len(p):
            return i == len(s)
        first = i < len(s) and p[j] in (s[i], ".")
        if j + 1 < len(p) and p[j + 1] == "*":
            # Skip "x*" completely, or let it eat one character and stay.
            return match(i, j + 2) or (first and match(i + 1, j))
        return first and match(i + 1, j + 1)

    return match(0, 0)
```
@time O(m * n)
@space O(m * n)
@test
assert not is_match("aa", "a")
assert is_match("aa", "a*")
assert is_match("ab", ".*")
assert is_match("aab", "c*a*b")
assert not is_match("mississippi", "mis*is*p*.")
assert is_match("", "a*")
assert is_match("", "")
assert not is_match("a", "")

### [3] Burst Balloons
@lc 312
@ask Bursting balloon i earns nums[left] * nums[i] * nums[right], using its current neighbours (1 past the ends). Return the most coins you can collect.
@eg [3,1,5,8]  ->  167
@tags dynamic programming, interval dp
@hook Choose the LAST balloon to burst in a range, not the first. Its neighbours at that moment are the range's fixed borders.
@say
"If I choose which balloon to burst first, the neighbours keep changing and the subproblems aren't independent. The trick is to choose which balloon is burst **last** in a range.

I pad the array with a 1 at each end. dp[l][r] is the best score for bursting every balloon strictly between l and r, with l and r still standing. If k is the last balloon burst in that range, its neighbours at that moment are exactly l and r, so it earns vals[l] times vals[k] times vals[r], and the two sides, l to k and k to r, are separate problems. I try every k and keep the best.

I fill the table by increasing range length. O(n cubed) time and O(n squared) space."
@code
```python
def max_coins(nums):
    vals = [1] + [x for x in nums if x > 0] + [1]   # zeros earn nothing: drop them
    n = len(vals)
    dp = [[0] * n for _ in range(n)]          # dp[l][r]: best for balloons between l and r
    for length in range(2, n):
        for l in range(n - length):
            r = l + length
            for k in range(l + 1, r):         # k is the LAST balloon burst here
                gain = vals[l] * vals[k] * vals[r]
                dp[l][r] = max(dp[l][r], dp[l][k] + gain + dp[k][r])
    return dp[0][n - 1]
```
@time O(n^3)
@space O(n^2)
@test
assert max_coins([3, 1, 5, 8]) == 167
assert max_coins([1, 5]) == 10
assert max_coins([]) == 0
assert max_coins([7]) == 7
assert max_coins([0, 3]) == 3
