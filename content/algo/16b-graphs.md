@section graphs | Graphs: BFS, DFS and Grids

### [2] Rotting Oranges
@lc 994
@ask Each minute, rotten oranges (2) rot their fresh neighbours (1) up, down, left and right. Return the minutes until no fresh orange is left, or -1 if that never happens.
@eg [[2,1,1],[1,1,0],[0,1,1]]  ->  4
@tags graphs, multi-source bfs, grid
@hook Multi-source BFS: put every rotten orange in the queue at the start. Each BFS level is one minute.
@say
"The rot spreads from all rotten oranges at the same time, so I start BFS from all of them at once: I put every rotten orange in the queue and count the fresh ones.

Then I process the queue level by level. Each level is one minute. For every orange in the current level, I rot its fresh neighbours, lower the fresh count and add them to the queue. I stop when the queue is empty or no fresh oranges are left.

If fresh oranges remain at the end, some were unreachable, so I return -1. O(rows times cols) time and space."
@code
```python
from collections import deque

def oranges_rotting(grid):
    rows, cols = len(grid), len(grid[0])
    queue = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))         # every rotten orange starts at once
            elif grid[r][c] == 1:
                fresh += 1
    minutes = 0
    while queue and fresh:
        minutes += 1
        for _ in range(len(queue)):          # one level = one minute
            r, c = queue.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))
    return minutes if fresh == 0 else -1
```
@time O(rows * cols)
@space O(rows * cols)
@trap
Running a separate BFS from each rotten orange. The rot spreads from all of them at the same time, and separate searches cost O((rows x cols)^2).
@test
assert oranges_rotting([[2, 1, 1], [1, 1, 0], [0, 1, 1]]) == 4
assert oranges_rotting([[2, 1, 1], [0, 1, 1], [1, 0, 1]]) == -1
assert oranges_rotting([[0, 2]]) == 0
assert oranges_rotting([[1]]) == -1
assert oranges_rotting([[0]]) == 0

### [2] 01 Matrix
@lc 542
@ask For each cell of a 0/1 matrix, return the distance to the nearest 0, moving up, down, left or right.
@eg [[0,0,0],[0,1,0],[1,1,1]]  ->  [[0,0,0],[0,1,0],[1,2,1]]
@tags graphs, multi-source bfs, grid
@hook Don't BFS from every 1. BFS once from all the 0s together. The first time BFS reaches a cell is its distance.
@say
"A BFS from every 1 to find its nearest 0 would be very slow. I flip it around: I start one BFS from all the zeros at the same time, with distance 0.

Every other cell starts as unvisited. When BFS reaches an unvisited cell from a neighbour, its distance is the neighbour's distance plus 1, and since BFS goes in rings of increasing distance, that's the shortest one. Then I add it to the queue.

Each cell is visited once: O(rows times cols) time and space."
@code
```python
from collections import deque

def update_matrix(mat):
    rows, cols = len(mat), len(mat[0])
    dist = [[-1] * cols for _ in range(rows)]
    queue = deque()
    for r in range(rows):
        for c in range(cols):
            if mat[r][c] == 0:
                dist[r][c] = 0
                queue.append((r, c))         # every 0 is a source
    while queue:
        r, c = queue.popleft()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                queue.append((nr, nc))
    return dist
```
@time O(rows * cols)
@space O(rows * cols)
@test
assert update_matrix([[0, 0, 0], [0, 1, 0], [0, 0, 0]]) == [[0, 0, 0], [0, 1, 0], [0, 0, 0]]
assert update_matrix([[0, 0, 0], [0, 1, 0], [1, 1, 1]]) == [[0, 0, 0], [0, 1, 0], [1, 2, 1]]
assert update_matrix([[0, 1, 1, 1]]) == [[0, 1, 2, 3]]

### [2] Pacific Atlantic Water Flow
@lc 417
@ask Rain flows to neighbouring cells of equal or lower height. The Pacific touches the top and left edges, the Atlantic the bottom and right. Return the cells whose water can reach both oceans.
@eg the 5x5 example  ->  [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]
@tags graphs, dfs, grid, reverse search
@hook Search backwards from each ocean: climb to cells that are equal or higher. Cells reached from both oceans are the answer.
@say
"Running a search from every cell to see if it reaches both oceans repeats a lot of work. Instead I reverse the direction of the water.

I start a DFS from all the Pacific border cells and move to neighbours that are equal or higher, because water could flow from there down to the ocean. Everything I reach can drain into the Pacific. I do the same from the Atlantic border cells. The answer is the cells in both sets.

Each search visits each cell at most once: O(rows times cols) time and space."
@code
```python
def pacific_atlantic(heights):
    rows, cols = len(heights), len(heights[0])

    def reach(starts):                    # cells that can drain to these cells
        seen = set(starts)
        stack = list(starts)
        while stack:
            r, c = stack.pop()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if (0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen
                        and heights[nr][nc] >= heights[r][c]):   # uphill or level
                    seen.add((nr, nc))
                    stack.append((nr, nc))
        return seen

    pacific = reach([(r, 0) for r in range(rows)] + [(0, c) for c in range(cols)])
    atlantic = reach([(r, cols - 1) for r in range(rows)] + [(rows - 1, c) for c in range(cols)])
    return sorted([r, c] for r, c in pacific & atlantic)
```
@time O(rows * cols)
@space O(rows * cols)
@test
heights = [[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]]
assert pacific_atlantic(heights) == [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]]
assert pacific_atlantic([[1]]) == [[0, 0]]
assert pacific_atlantic([[1, 1], [1, 1]]) == [[0, 0], [0, 1], [1, 0], [1, 1]]

### [2] Surrounded Regions
@lc 130
@ask Capture every region of "O" that is completely surrounded by "X" by flipping it to "X". Regions touching the border stay.
@eg ["XXXX","XOOX","XXOX","XOXX"]  ->  ["XXXX","XXXX","XXXX","XOXX"]
@tags graphs, dfs, grid, reverse search
@hook Find what is safe instead of what is trapped: every "O" connected to the border survives. Flip everything else.
@say
"It's hard to prove a region is surrounded, but easy to find the regions that aren't: they touch the border.

So in step one I start from every border cell and flood-fill through 'O' cells, marking them with a temporary 'S' for safe. In step two I scan the whole board: any 'O' left wasn't reached from the border, so it's trapped and becomes 'X'. Every 'S' goes back to 'O'.

O(rows times cols) time and space."
@code
```python
def solve(board):
    if not board:
        return
    rows, cols = len(board), len(board[0])
    stack = [(r, c) for r in range(rows) for c in (0, cols - 1)]
    stack += [(r, c) for r in (0, rows - 1) for c in range(cols)]
    while stack:                              # 1. mark border-connected "O"
        r, c = stack.pop()
        if 0 <= r < rows and 0 <= c < cols and board[r][c] == "O":
            board[r][c] = "S"
            stack += [(r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)]
    for r in range(rows):                     # 2. flip trapped, restore safe
        for c in range(cols):
            if board[r][c] == "O":
                board[r][c] = "X"
            elif board[r][c] == "S":
                board[r][c] = "O"
```
@time O(rows * cols)
@space O(rows * cols)
@test
b = [list(r) for r in ["XXXX", "XOOX", "XXOX", "XOXX"]]
solve(b)
assert ["".join(r) for r in b] == ["XXXX", "XXXX", "XXXX", "XOXX"]
b = [["X"]]; solve(b); assert b == [["X"]]
b = [list("OO"), list("OO")]; solve(b); assert b == [["O", "O"], ["O", "O"]]

### [2] Shortest Path in Binary Matrix
@lc 1091
@ask In an n x n grid of 0s and 1s, find the shortest path of 0s from the top-left to the bottom-right, moving in 8 directions. Count the cells. Return -1 if there's none.
@eg [[0,0,0],[1,1,0],[1,1,0]]  ->  4
@tags graphs, bfs, grid
@hook Unweighted shortest path means BFS. Use all 8 neighbours, and mark cells when you add them to the queue.
@say
"Every move costs the same, so BFS finds the shortest path: the first time it reaches the bottom-right corner is with the fewest cells.

If the start or end cell is blocked, I return -1 straight away. I start BFS at the top-left with path length 1. For each cell I look at all 8 neighbours, and every open, unvisited one gets the current length plus 1 and joins the queue. I mark cells as visited by setting them to 1 when I add them.

O(n squared) time and space."
@code
```python
from collections import deque

def shortest_path_binary_matrix(grid):
    n = len(grid)
    if grid[0][0] or grid[n - 1][n - 1]:
        return -1
    queue = deque([(0, 0, 1)])                # row, col, cells on the path
    grid[0][0] = 1                            # visited
    while queue:
        r, c, length = queue.popleft()
        if (r, c) == (n - 1, n - 1):
            return length
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0:
                    grid[nr][nc] = 1
                    queue.append((nr, nc, length + 1))
    return -1
```
@time O(n^2)
@space O(n^2)
@test
assert shortest_path_binary_matrix([[0, 1], [1, 0]]) == 2
assert shortest_path_binary_matrix([[0, 0, 0], [1, 1, 0], [1, 1, 0]]) == 4
assert shortest_path_binary_matrix([[1, 0, 0], [1, 1, 0], [1, 1, 0]]) == -1
assert shortest_path_binary_matrix([[0]]) == 1

### [2] Is Graph Bipartite?
@lc 785
@ask Can the nodes be split into two groups so that every edge connects the two groups? graph[i] lists the neighbours of node i.
@eg [[1,3],[0,2],[1,3],[0,2]] -> true,  [[1,2,3],[0,2],[0,1,3],[0,2]] -> false
@tags graphs, bfs, two-colouring
@hook Colour nodes with two colours using BFS. A neighbour gets the opposite colour. An edge between two nodes of the same colour means no.
@say
"Bipartite means I can colour every node with one of two colours so that every edge joins different colours.

I run BFS and give the start node colour 0. Each uncoloured neighbour gets the opposite colour. If I find a neighbour that already has the same colour as the current node, that edge breaks the rule, so I return false. The graph may have several disconnected parts, so I start a new BFS from every node that isn't coloured yet.

O(V plus E) time and O(V) space. An odd-length cycle is exactly what makes a graph not bipartite."
@code
```python
from collections import deque

def is_bipartite(graph):
    color = {}
    for start in range(len(graph)):           # the graph may be disconnected
        if start in color:
            continue
        color[start] = 0
        queue = deque([start])
        while queue:
            node = queue.popleft()
            for nxt in graph[node]:
                if nxt not in color:
                    color[nxt] = 1 - color[node]     # the other group
                    queue.append(nxt)
                elif color[nxt] == color[node]:
                    return False              # an edge inside one group
    return True
```
@time O(V + E)
@space O(V)
@test
assert not is_bipartite([[1, 2, 3], [0, 2], [0, 1, 3], [0, 2]])
assert is_bipartite([[1, 3], [0, 2], [1, 3], [0, 2]])
assert is_bipartite([])
assert is_bipartite([[], []])

### [3] Word Ladder
@lc 127
@ask Change begin_word into end_word one letter at a time, where every step must be a word in the list. Return the number of words in the shortest sequence, or 0.
@eg "hit" -> "cog" with ["hot","dot","dog","lot","log","cog"]  ->  5 (hit, hot, dot, dog, cog)
@tags graphs, bfs, strings
@hook Words are nodes, one-letter changes are edges. BFS gives the shortest chain. Find neighbours fast with wildcard patterns like "h*t".
@say
"Each word is a node, and two words are connected if they differ by one letter. The shortest transformation is the shortest path, so I use BFS.

Comparing every pair of words is slow. Instead I group words by wildcard patterns: 'hot' belongs to '*ot', 'h*t' and 'ho*'. Two words are neighbours exactly when they share a pattern. So from a word, I look up its patterns and get all neighbours directly. After I expand a pattern once, I clear it, because every word in it is already queued.

With n words of length L, building patterns is O(n times L squared) because of the slicing, and BFS is about the same. Space is O(n times L squared). Searching from both ends at once, bidirectional BFS, is faster in practice."
@code
```python
from collections import defaultdict, deque

def ladder_length(begin_word, end_word, word_list):
    words = set(word_list)
    if end_word not in words:
        return 0
    patterns = defaultdict(list)          # "h*t" -> ["hot", "hit"]
    for w in words | {begin_word}:
        for i in range(len(w)):
            patterns[w[:i] + "*" + w[i + 1:]].append(w)
    seen = {begin_word}
    queue = deque([(begin_word, 1)])
    while queue:
        word, steps = queue.popleft()
        if word == end_word:
            return steps
        for i in range(len(word)):
            key = word[:i] + "*" + word[i + 1:]
            for nxt in patterns[key]:
                if nxt not in seen:
                    seen.add(nxt)
                    queue.append((nxt, steps + 1))
            patterns[key] = []            # this pattern is fully used now
    return 0
```
@time O(n * L^2)
@space O(n * L^2)
@test
assert ladder_length("hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]) == 5
assert ladder_length("hit", "cog", ["hot", "dot", "dog", "lot", "log"]) == 0
assert ladder_length("a", "c", ["a", "b", "c"]) == 2
assert ladder_length("hot", "dog", ["hot", "dog"]) == 0
