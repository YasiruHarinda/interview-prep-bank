@section graphs | Graphs: BFS, DFS and Grids
@blurb Nodes and edges, including grids where each cell is a node. BFS finds shortest paths in unweighted graphs. DFS explores everything reachable.

### [1] Pattern: what are the BFS and DFS templates for graphs and grids?
@tags pattern, graphs, bfs, dfs, grid
@hook Build an adjacency list, keep a visited set, and choose BFS for "fewest steps" or DFS for "visit everything connected". Both are O(V + E).
@say
"First I build the graph as an adjacency list: a map from each node to its neighbours. For an undirected edge I add it in both directions. A grid is a graph too: each cell is a node and its four neighbours are the edges.

**BFS** uses a queue and explores level by level, so the first time it reaches a node is by the fewest edges. I use it for shortest paths in unweighted graphs. **DFS** uses recursion or a stack and goes deep first. I use it for counting connected parts, flood fill and cycle detection.

The key detail is the visited set. In BFS, I mark a node as visited when I add it to the queue, not when I pop it, otherwise it can be added many times. Both are O(V plus E) time and O(V) space. When BFS must start from many places at once, like all rotten oranges, I put all of them in the queue at the start: that's multi-source BFS."
@deep
```python
from collections import defaultdict, deque

graph = defaultdict(list)            # adjacency list
for a, b in edges:
    graph[a].append(b)
    graph[b].append(a)               # undirected: both ways

def bfs(start):
    seen = {start}
    queue = deque([(start, 0)])      # node, distance
    while queue:
        node, dist = queue.popleft()
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)        # mark when you ADD, not when you pop
                queue.append((nxt, dist + 1))

def dfs(start):                      # iterative: no recursion limit
    seen, stack = {start}, [start]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)

# Grids: the four neighbours with a bounds check
for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == target:
        ...
```
| Question | Use |
|---|---|
| Fewest steps, unweighted | BFS |
| Spread from many sources at once | Multi-source BFS |
| Count connected parts, flood fill | DFS or BFS |
| Cycle in a directed graph | DFS with three colours, or topological sort |
| Order with dependencies | Topological sort |
| Weighted shortest path | Dijkstra |
@trap
Recursive DFS on a big grid. A 1000 x 1000 grid of land is a million nested calls, far past Python's recursion limit. Use an explicit stack or BFS.

### [1] Find if Path Exists in Graph
@lc 1971
@ask An undirected graph has n nodes and a list of edges. Is there a path from source to destination?
@eg n = 3, edges = [[0,1],[1,2],[2,0]], source = 0, destination = 2  ->  true
@tags graphs, bfs
@hook Build an adjacency list, then BFS from the source. If you ever reach the destination, there's a path.
@say
"This is the basic graph template. I build an adjacency list from the edges, adding each edge in both directions because the graph is undirected.

Then I run BFS from the source with a visited set. If I pop the destination, there's a path. If the queue empties first, there isn't. I mark nodes as visited when I add them to the queue, so no node is added twice.

O(V plus E) time and space. Union-Find also works: union every edge, then check whether source and destination have the same root."
@code
```python
from collections import defaultdict, deque

def valid_path(n, edges, source, destination):
    graph = defaultdict(list)
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)              # undirected
    seen = {source}
    queue = deque([source])
    while queue:
        node = queue.popleft()
        if node == destination:
            return True
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)           # mark when you add it
                queue.append(nxt)
    return False
```
@time O(V + E)
@space O(V + E)
@test
assert valid_path(3, [[0, 1], [1, 2], [2, 0]], 0, 2)
assert not valid_path(6, [[0, 1], [0, 2], [3, 5], [5, 4], [4, 3]], 0, 5)
assert valid_path(1, [], 0, 0)

### [2] Number of Islands
@lc 200
@ask A grid has "1" for land and "0" for water. Count the islands: groups of land connected up, down, left or right.
@eg ["11000","11000","00100","00011"]  ->  3
@tags graphs, grid, dfs, flood fill
@hook Scan the grid. Each time you find unvisited land, count one island and flood-fill all of it so it isn't counted again.
@say
"I scan every cell. When I find a '1', I've found a new island, so I add one to the count. Then I flood-fill from that cell, visiting every connected land cell and marking it as water, so it won't be counted again.

The flood fill is a DFS with my own stack, which avoids recursion limits on big grids. Each cell is visited a constant number of times, so it's O(rows times cols) time, and O(rows times cols) space in the worst case for the stack.

If I'm not allowed to change the input, I use a visited set instead. Union-Find also works and is handy if land is added over time."
@code
```python
def num_islands(grid):
    rows, cols = len(grid), len(grid[0])

    def sink(r, c):                         # flood one island
        stack = [(r, c)]
        grid[r][c] = "0"
        while stack:
            r, c = stack.pop()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":
                    grid[nr][nc] = "0"
                    stack.append((nr, nc))

    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                sink(r, c)
    return count
```
@time O(rows * cols)
@space O(rows * cols)
@test
assert num_islands([list(r) for r in ["11110", "11010", "11000", "00000"]]) == 1
assert num_islands([list(r) for r in ["11000", "11000", "00100", "00011"]]) == 3
assert num_islands([["0"]]) == 0
assert num_islands([["1"]]) == 1

### [1] Flood Fill
@lc 733
@ask Starting from pixel (sr, sc), recolour it and every connected pixel of the same original colour.
@eg image = [[1,1,1],[1,1,0],[1,0,1]], start (1,1), colour 2  ->  [[2,2,2],[2,2,0],[2,0,1]]
@tags graphs, grid, dfs
@hook DFS from the start, painting pixels that still have the old colour. If the new colour equals the old one, return straight away.
@say
"This is the paint bucket tool. I remember the starting pixel's colour, then do a DFS from it. Every neighbour that still has the old colour gets the new colour and is added to the stack.

Painting a pixel also marks it as visited, because it no longer has the old colour. But that's why I must handle one edge case first: if the new colour is the same as the old one, painting changes nothing and the search would never stop, so I return the image unchanged.

O(rows times cols) time and space in the worst case."
@code
```python
def flood_fill(image, sr, sc, color):
    old = image[sr][sc]
    if old == color:
        return image                     # nothing changes
    rows, cols = len(image), len(image[0])
    stack = [(sr, sc)]
    image[sr][sc] = color
    while stack:
        r, c = stack.pop()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and image[nr][nc] == old:
                image[nr][nc] = color
                stack.append((nr, nc))
    return image
```
@time O(rows * cols)
@space O(rows * cols)
@trap
Skipping the `old == color` check. Recoloured pixels still match the old colour, so the search loops forever.
@test
assert flood_fill([[1, 1, 1], [1, 1, 0], [1, 0, 1]], 1, 1, 2) == [[2, 2, 2], [2, 2, 0], [2, 0, 1]]
assert flood_fill([[0, 0, 0], [0, 0, 0]], 0, 0, 0) == [[0, 0, 0], [0, 0, 0]]
assert flood_fill([[0]], 0, 0, 5) == [[5]]

### [2] Max Area of Island
@lc 695
@ask In a grid of 0s and 1s, return the area of the largest island, or 0.
@eg the example grid in LeetCode 695  ->  6
@tags graphs, grid, dfs
@hook Number of Islands, but each flood fill counts the cells it visits. Keep the biggest count.
@say
"Same as Number of Islands, but instead of counting islands, I measure each one.

When I find unvisited land, I flood-fill it with a stack, marking cells as visited by setting them to 0, and I count every cell I pop. That count is the island's area. I keep the maximum over all islands.

O(rows times cols) time and space."
@code
```python
def max_area_of_island(grid):
    rows, cols = len(grid), len(grid[0])
    best = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != 1:
                continue
            area, stack = 0, [(r, c)]
            grid[r][c] = 0                       # visited
            while stack:
                cr, cc = stack.pop()
                area += 1
                for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                        grid[nr][nc] = 0
                        stack.append((nr, nc))
            best = max(best, area)
    return best
```
@time O(rows * cols)
@space O(rows * cols)
@test
grid = [[0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
        [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0],
        [0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0]]
assert max_area_of_island(grid) == 6
assert max_area_of_island([[0, 0, 0, 0, 0, 0, 0, 0]]) == 0
assert max_area_of_island([[1]]) == 1
assert max_area_of_island([[1, 1], [1, 0]]) == 3

### [2] Clone Graph
@lc 133
@ask Return a deep copy of a connected undirected graph, given one of its nodes. Each node has a value and a list of neighbours.
@eg a square 1-2-3-4-1  ->  a new square with new nodes and the same links
@tags graphs, bfs, hash map, deep copy
@hook A map from original node to its copy does two jobs: it is the visited set, and it lets you link copies to copies.
@say
"I traverse the graph with BFS and keep a hash map from each original node to its copy.

When I first see a node, I create its copy, store it in the map and add the original to the queue. When I process a node, I go through its neighbours: if a neighbour has no copy yet, I create one and queue it. Then I append the neighbour's copy to the current node's copy's neighbour list. The map stops me from copying a node twice, which matters because the graph has cycles.

Every node and edge is handled once: O(V plus E) time and O(V) space."
@code
```python
from collections import deque

class Node:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

def clone_graph(node):
    if not node:
        return None
    copies = {node: Node(node.val)}          # original -> copy (also "visited")
    queue = deque([node])
    while queue:
        cur = queue.popleft()
        for nb in cur.neighbors:
            if nb not in copies:
                copies[nb] = Node(nb.val)
                queue.append(nb)
            copies[cur].neighbors.append(copies[nb])
    return copies[node]
```
@time O(V + E)
@space O(V)
@test
nodes = {i: Node(i) for i in range(1, 5)}
for i, nbs in {1: [2, 4], 2: [1, 3], 3: [2, 4], 4: [1, 3]}.items():
    nodes[i].neighbors = [nodes[j] for j in nbs]
copy = clone_graph(nodes[1])
originals = set(map(id, nodes.values()))
seen, stack, adj = set(), [copy], {}
while stack:
    n = stack.pop()
    if id(n) in seen:
        continue
    seen.add(id(n))
    assert id(n) not in originals
    adj[n.val] = [m.val for m in n.neighbors]
    stack.extend(n.neighbors)
assert adj == {1: [2, 4], 2: [1, 3], 3: [2, 4], 4: [1, 3]}
assert clone_graph(None) is None
single = Node(1)
assert clone_graph(single) is not single and clone_graph(single).neighbors == []
