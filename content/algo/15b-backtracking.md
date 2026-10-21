@section backtrack | Backtracking

### [2] Letter Combinations of a Phone Number
@lc 17
@ask Given digits 2 to 9, return every letter combination they could stand for on a phone keypad.
@eg "23"  ->  ["ad","ae","af","bd","be","bf","cd","ce","cf"]
@tags backtracking, strings
@hook One level per digit, one branch per letter of that digit. A full-length path is an answer.
@say
"I map each digit to its letters. Then I backtrack with one level per digit: at level i, I try each letter for digits[i] and recurse to the next digit. When the path has one letter per digit, it's a complete combination.

Because strings are immutable in Python, I pass `path + ch` down, so there's nothing to undo. An empty input returns an empty list, not a list with an empty string.

There are up to 4 to the n combinations, each of length n: O(n times 4 to the n) time and O(n) recursion depth."
@code
```python
def letter_combinations(digits):
    if not digits:
        return []
    letters = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl",
               "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
    result = []

    def backtrack(i, path):
        if i == len(digits):
            result.append(path)
            return
        for ch in letters[digits[i]]:
            backtrack(i + 1, path + ch)

    backtrack(0, "")
    return result
```
@time O(n * 4^n)
@space O(n)
@test
assert letter_combinations("23") == ["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"]
assert letter_combinations("") == []
assert letter_combinations("2") == ["a", "b", "c"]
assert len(letter_combinations("79")) == 16

### [2] Generate Parentheses
@lc 22
@ask Return all valid strings of n pairs of parentheses.
@eg n = 3  ->  ["((()))","(()())","(())()","()(())","()()()"]
@tags backtracking, strings
@hook Add "(" while you have some left. Add ")" only while it closes an open one. Every finished string is valid.
@say
"Generating all 2 to the 2n strings and filtering them is wasteful. Instead I only build valid strings.

I track how many open and close brackets I've used. I can add an open bracket if I've used fewer than n. I can add a close bracket only if fewer closes than opens are used, so it always has something to match. When the string reaches length 2n, it's valid and I save it.

The number of results is the nth Catalan number, about 4 to the n divided by n to the power 1.5, and each takes O(n) to build."
@code
```python
def generate_parenthesis(n):
    result = []

    def backtrack(path, opened, closed):
        if len(path) == 2 * n:
            result.append(path)
            return
        if opened < n:
            backtrack(path + "(", opened + 1, closed)
        if closed < opened:                   # only close what is open
            backtrack(path + ")", opened, closed + 1)

    backtrack("", 0, 0)
    return result
```
@time O(4^n / sqrt(n))
@space O(n)
@test
assert generate_parenthesis(3) == ["((()))", "(()())", "(())()", "()(())", "()()()"]
assert generate_parenthesis(1) == ["()"]
assert len(generate_parenthesis(4)) == 14

### [2] Word Search
@lc 79
@ask Can the word be spelled by moving up, down, left or right through a grid of letters, using each cell at most once?
@eg grid ["ABCE","SFCS","ADEE"], word "ABCCED" -> true,  "ABCB" -> false
@tags backtracking, grid, dfs
@hook DFS from every cell. Mark a cell as used while it's on the path, and restore it when you backtrack.
@say
"I try every cell as a starting point. From a cell, a DFS checks whether it matches the current letter of the word, then tries the four neighbours for the next letter.

A cell can't be used twice in one path, so before going deeper I mark it, here by writing '#' into the board, and after the recursive calls I put the letter back. That's the backtracking step: the board is clean again for other paths. If I match the last letter, I return true straight away.

The time is O(rows times cols times 3 to the L), where L is the word length: each step has at most three new directions. Space is O(L) for the recursion."
@code
```python
def exist(board, word):
    rows, cols = len(board), len(board[0])

    def dfs(r, c, i):
        if i == len(word):
            return True
        if not (0 <= r < rows and 0 <= c < cols) or board[r][c] != word[i]:
            return False
        board[r][c] = "#"                     # used on this path
        found = (dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1) or
                 dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1))
        board[r][c] = word[i]                 # restore when going back
        return found

    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))
```
@time O(rows * cols * 3^L)
@space O(L)
@pro
Mention two quick prunes: return false if the word is longer than the grid, or if the grid doesn't have enough of some letter. Starting from the rarer end of the word also cuts many branches.
@test
board = [list("ABCE"), list("SFCS"), list("ADEE")]
assert exist(board, "ABCCED")
assert exist(board, "SEE")
assert not exist(board, "ABCB")
assert exist([["a"]], "a")
assert exist([["a", "b"]], "ba")
assert not exist([["a"]], "aa")

### [2] Palindrome Partitioning
@lc 131
@ask Split a string into pieces so that every piece is a palindrome. Return all such splits.
@eg "aab"  ->  [["a","a","b"],["aa","b"]]
@tags backtracking, strings, palindrome
@hook At each position, try every prefix that is a palindrome as the next piece, then split the rest the same way.
@say
"I backtrack over cut positions. Starting at index `start`, I try every possible end for the next piece. If that piece is a palindrome, I add it to the path and recurse on the rest of the string. When `start` reaches the end of the string, the path is a full valid split.

Checking each piece costs O(n), and there can be up to 2 to the n splits, so it's O(n times 2 to the n). I could precompute which substrings are palindromes with a DP table to make each check O(1)."
@code
```python
def partition(s):
    result, path = [], []

    def backtrack(start):
        if start == len(s):
            result.append(path[:])
            return
        for end in range(start + 1, len(s) + 1):
            piece = s[start:end]
            if piece == piece[::-1]:          # only palindromes go further
                path.append(piece)
                backtrack(end)
                path.pop()

    backtrack(0)
    return result
```
@time O(n * 2^n)
@space O(n)
@test
assert sorted(partition("aab")) == [["a", "a", "b"], ["aa", "b"]]
assert partition("a") == [["a"]]
assert len(partition("aaa")) == 4

### [3] N-Queens
@lc 51
@ask Place n queens on an n x n board so no two attack each other. Return all solutions as lists of strings.
@eg n = 4  ->  [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]
@tags backtracking, sets
@hook One queen per row. Track used columns and both diagonals in sets: a diagonal is r - c, an anti-diagonal is r + c.
@say
"Every row has exactly one queen, so I place queens row by row and only choose the column.

A queen at row r and column c attacks its column, its diagonal, where r minus c is constant, and its anti-diagonal, where r plus c is constant. I keep three sets for these. For each column in the current row, if none of the three is taken, I place the queen, add to the sets, recurse into the next row, then remove everything. When I've placed a queen in every row, I turn the column list into board strings.

The search is about O(n factorial), much less with pruning, and the space is O(n)."
@code
```python
def solve_n_queens(n):
    result = []
    queens = []                               # queens[r] = column in row r
    cols, diag, anti = set(), set(), set()

    def backtrack(r):
        if r == n:
            result.append(["." * c + "Q" + "." * (n - c - 1) for c in queens])
            return
        for c in range(n):
            if c in cols or r - c in diag or r + c in anti:
                continue                      # attacked
            queens.append(c)
            cols.add(c)
            diag.add(r - c)
            anti.add(r + c)
            backtrack(r + 1)
            queens.pop()
            cols.remove(c)
            diag.remove(r - c)
            anti.remove(r + c)

    backtrack(0)
    return result
```
@time O(n!)
@space O(n)
@test
assert solve_n_queens(4)[0] == [".Q..", "...Q", "Q...", "..Q."]
assert len(solve_n_queens(4)) == 2
assert solve_n_queens(1) == [["Q"]]
assert solve_n_queens(2) == [] and solve_n_queens(3) == []
assert len(solve_n_queens(8)) == 92

### [3] Sudoku Solver
@lc 37
@ask Fill a 9x9 Sudoku board in place. Empty cells are ".". The puzzle has exactly one solution.
@eg the classic puzzle "53..7...." / "6..195..." / ...  ->  the unique filled board
@tags backtracking, sets
@hook Collect the empty cells. For each, try digits that aren't in its row, column or box sets, recurse, and undo on failure.
@say
"I first record which digits are already used in each row, column and 3 by 3 box, and make a list of the empty cells.

Then I backtrack over the empty cells in order. For the current cell, I try each digit from 1 to 9 that isn't in its row, column or box. I place it, update the three sets, and recurse to the next empty cell. If the recursion returns true, the board is solved, and I pass true straight back up. If not, I remove the digit and try the next one. If no digit fits, I return false so the previous cell tries something else.

The worst case is 9 to the power of the number of empty cells, but the sets prune it heavily. Picking the empty cell with the fewest options first makes it much faster."
@code
```python
def solve_sudoku(board):
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    boxes = [set() for _ in range(9)]
    empty = []
    for r in range(9):
        for c in range(9):
            v = board[r][c]
            if v == ".":
                empty.append((r, c))
            else:
                rows[r].add(v)
                cols[c].add(v)
                boxes[(r // 3) * 3 + c // 3].add(v)

    def backtrack(k):
        if k == len(empty):
            return True                       # every cell is filled
        r, c = empty[k]
        b = (r // 3) * 3 + c // 3
        for v in "123456789":
            if v in rows[r] or v in cols[c] or v in boxes[b]:
                continue
            board[r][c] = v
            rows[r].add(v)
            cols[c].add(v)
            boxes[b].add(v)
            if backtrack(k + 1):
                return True
            board[r][c] = "."                 # undo and try the next digit
            rows[r].remove(v)
            cols[c].remove(v)
            boxes[b].remove(v)
        return False

    backtrack(0)
```
@time O(9^m), m = empty cells
@space O(m)
@test
puzzle = ["53..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"]
answer = ["534678912", "672195348", "198342567", "859761423", "426853791", "713924856", "961537284", "287419635", "345286179"]
board = [list(r) for r in puzzle]
solve_sudoku(board)
assert ["".join(r) for r in board] == answer
