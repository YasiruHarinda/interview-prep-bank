@section paths | Shortest Paths and Spanning Trees
@blurb Weighted graphs. Dijkstra for non-negative weights, Bellman-Ford for a limit on the number of edges, Floyd-Warshall for all pairs, and Prim or Kruskal to connect everything cheaply.

### [2] Pattern: which shortest path algorithm should you use?
@tags pattern, dijkstra, bellman-ford, floyd-warshall, mst
@hook Unweighted: BFS. Non-negative weights: Dijkstra with a heap. Negative weights or "at most k edges": Bellman-Ford. Every pair: Floyd-Warshall.
@say
"I choose by the weights and the question.

If every edge costs the same, **BFS** is enough. With non-negative weights, I use **Dijkstra**: a min-heap ordered by distance, always settling the closest unsettled node and relaxing its edges. It's O((V plus E) log V). It fails with negative edges, because a settled node could later get cheaper.

With negative weights, or a limit like 'at most k stops', I use **Bellman-Ford**: relax every edge, V minus 1 times, or k plus 1 times for the limit. It's O(V times E), and one extra round that still improves something means a negative cycle. For the distance between **every pair** of nodes on a small graph, **Floyd-Warshall** is three nested loops, O(V cubed).

To connect all nodes with the cheapest total edge cost, that's a **minimum spanning tree**: Prim grows one tree with a heap, and Kruskal sorts the edges and adds them with Union-Find, skipping any that would make a cycle."
@deep
```python
import heapq

def dijkstra(graph, source):          # graph[u] = [(v, weight), ...]
    dist = {source: 0}
    heap = [(0, source)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist.get(u, float("inf")):
            continue                  # stale entry: a shorter path was found
        for v, w in graph[u]:
            if d + w < dist.get(v, float("inf")):
                dist[v] = d + w
                heapq.heappush(heap, (d + w, v))
    return dist
```
| Situation | Algorithm | Time |
|---|---|---|
| All edges cost the same | BFS | O(V + E) |
| Edge weights 0 or 1 | 0-1 BFS with a deque | O(V + E) |
| Non-negative weights | Dijkstra | O((V + E) log V) |
| Negative weights, or at most k edges | Bellman-Ford | O(V * E) or O(k * E) |
| Every pair, small V | Floyd-Warshall | O(V^3) |
| Cheapest way to connect all nodes | Prim or Kruskal | O(E log V) |
@trap
Using Dijkstra with negative edge weights. It settles a node too early and can return a wrong answer without any error.

### [2] Network Delay Time
@lc 743
@ask A signal starts at node k. times[i] = [u, v, w] means it takes w to go from u to v. How long until all n nodes get the signal? Return -1 if some never do.
@eg times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2  ->  2
@tags dijkstra, heap, graphs
@hook Dijkstra from k. The answer is the largest shortest-path distance, or -1 if some node is unreachable.
@say
"Every node gets the signal along its shortest path from k, so I need all shortest distances from k, and the answer is the largest of them.

The weights are non-negative, so I use Dijkstra. I push (0, k) into a min-heap. Each time I pop the closest node that isn't settled yet, its distance is final, so I record it and push its neighbours with the new distances. If a node pops a second time with a bigger distance, I skip it.

If fewer than n nodes got a distance, some are unreachable and I return -1. O(E log E) time and O(V plus E) space."
@code
```python
import heapq
from collections import defaultdict

def network_delay_time(times, n, k):
    graph = defaultdict(list)
    for u, v, w in times:
        graph[u].append((v, w))
    dist = {}                                  # settled shortest times
    heap = [(0, k)]
    while heap:
        d, node = heapq.heappop(heap)
        if node in dist:
            continue                           # already settled
        dist[node] = d
        for nxt, w in graph[node]:
            if nxt not in dist:
                heapq.heappush(heap, (d + w, nxt))
    return max(dist.values()) if len(dist) == n else -1
```
@time O(E log E)
@space O(V + E)
@test
assert network_delay_time([[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2) == 2
assert network_delay_time([[1, 2, 1]], 2, 1) == 1
assert network_delay_time([[1, 2, 1]], 2, 2) == -1
assert network_delay_time([[1, 2, 1], [2, 3, 2], [1, 3, 4]], 3, 1) == 3

### [2] Path With Minimum Effort
@lc 1631
@ask Walk from the top-left to the bottom-right of a height grid. A path's effort is its biggest height difference between two neighbouring cells. Return the smallest possible effort.
@eg [[1,2,2],[3,8,2],[5,3,5]]  ->  2
@tags dijkstra, heap, grid
@hook Dijkstra where a path's cost is its maximum step, not its sum. Pop the cell with the smallest effort so far.
@say
"This is a shortest path problem, but the cost of a path is the biggest single step instead of the total. Dijkstra still works, because extending a path can never make its maximum smaller.

I keep the best known effort for each cell and a min-heap of (effort, row, col). I pop the cell with the smallest effort. When I move to a neighbour, the new effort is the max of the current effort and the height difference of that step. If that beats the neighbour's best, I update it and push it. The first time I pop the bottom-right cell, its effort is the answer.

O(rows times cols times log of that) time and O(rows times cols) space. Binary search on the effort with a BFS check also works."
@code
```python
import heapq

def minimum_effort_path(heights):
    rows, cols = len(heights), len(heights[0])
    best = [[float("inf")] * cols for _ in range(rows)]
    best[0][0] = 0
    heap = [(0, 0, 0)]                         # effort, row, col
    while heap:
        effort, r, c = heapq.heappop(heap)
        if (r, c) == (rows - 1, cols - 1):
            return effort
        if effort > best[r][c]:
            continue                           # stale entry
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols:
                step = abs(heights[nr][nc] - heights[r][c])
                new = max(effort, step)        # the biggest step, not the sum
                if new < best[nr][nc]:
                    best[nr][nc] = new
                    heapq.heappush(heap, (new, nr, nc))
    return 0
```
@time O(R * C * log(R * C))
@space O(R * C)
@test
assert minimum_effort_path([[1, 2, 2], [3, 8, 2], [5, 3, 5]]) == 2
assert minimum_effort_path([[1, 2, 3], [3, 8, 4], [5, 3, 5]]) == 1
assert minimum_effort_path([[1, 2, 1, 1, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 1, 1, 2, 1]]) == 0
assert minimum_effort_path([[5]]) == 0

### [2] Cheapest Flights Within K Stops
@lc 787
@ask Find the cheapest price from src to dst using at most k stops (k + 1 flights). Return -1 if there's no such route.
@eg n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1  ->  700
@tags bellman-ford, graphs, dynamic programming
@hook Bellman-Ford limited to k + 1 rounds. Each round, relax every flight using only the previous round's prices.
@say
"Plain Dijkstra ignores the number of stops, so it can return a cheap route with too many stops. Bellman-Ford fits perfectly: after round i, the prices are the cheapest using at most i flights.

I start with price 0 at src and infinity elsewhere. I run k plus 1 rounds. In each round I copy the prices, then for every flight u to v, I try the price to u from the previous round plus the flight's price. Using the copy is the key: it stops me from chaining two flights in one round, which would break the stop limit.

O(k times E) time and O(n) space."
@code
```python
def find_cheapest_price(n, flights, src, dst, k):
    cost = [float("inf")] * n
    cost[src] = 0
    for _ in range(k + 1):                     # at most k + 1 flights
        new_cost = cost[:]                     # only last round's prices
        for u, v, price in flights:
            if cost[u] + price < new_cost[v]:
                new_cost[v] = cost[u] + price
        cost = new_cost
    return cost[dst] if cost[dst] != float("inf") else -1
```
@time O(k * E)
@space O(n)
@trap
Updating `cost` in place during a round. Then one round can use two flights, and the answer may use more stops than allowed.
@test
assert find_cheapest_price(4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1) == 700
assert find_cheapest_price(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1) == 200
assert find_cheapest_price(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 0) == 500
assert find_cheapest_price(2, [], 0, 1, 1) == -1

### [2] Min Cost to Connect All Points
@lc 1584
@ask Connect all points so there's a path between any two. The cost of an edge is the Manhattan distance |x1 - x2| + |y1 - y2|. Return the minimum total cost.
@eg [[0,0],[2,2],[3,10],[5,2],[7,0]]  ->  20
@tags minimum spanning tree, prim, greedy
@hook Minimum spanning tree. Every pair is an edge, so use Prim's O(n^2) version: repeatedly add the closest point not yet in the tree.
@say
"Connecting everything with the cheapest total is a minimum spanning tree. Every pair of points could be an edge, so the graph is complete, with about n squared over 2 edges.

For a complete graph, the simple O(n squared) version of Prim's algorithm is best. I keep, for each point not yet in the tree, the cheapest edge connecting it to the tree. Each round, I add the point with the cheapest such edge, add that cost to the total, and update every other point's cheapest edge using the new point. After n rounds everything is connected.

O(n squared) time and O(n) space. Kruskal would need to sort all n squared edges, which is O(n squared log n)."
@code
```python
def min_cost_connect_points(points):
    n = len(points)
    in_tree = [False] * n
    dist = [float("inf")] * n               # cheapest edge into the tree
    dist[0] = 0
    total = 0
    for _ in range(n):
        u = min((i for i in range(n) if not in_tree[i]), key=lambda i: dist[i])
        in_tree[u] = True                   # add the closest point
        total += dist[u]
        for v in range(n):                  # does u give v a cheaper edge?
            if not in_tree[v]:
                d = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1])
                if d < dist[v]:
                    dist[v] = d
    return total
```
@time O(n^2)
@space O(n)
@test
assert min_cost_connect_points([[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]) == 20
assert min_cost_connect_points([[3, 12], [-2, 5], [-4, 1]]) == 18
assert min_cost_connect_points([[0, 0]]) == 0
assert min_cost_connect_points([[0, 0], [1, 1], [1, 0], [-1, 1]]) == 4

### [3] Swim in Rising Water
@lc 778
@ask grid[r][c] is a height. At time t, you can swim between neighbouring cells whose heights are both at most t. Return the earliest time you can get from the top-left to the bottom-right.
@eg [[0,2],[1,3]]  ->  3
@tags dijkstra, heap, grid, minimax path
@hook You need the path whose highest cell is as low as possible. Dijkstra with a min-heap on "highest cell so far".
@say
"The time I need for a path is the highest cell on it, so I want the path whose highest cell is lowest. That's the same minimax shortest path as Path With Minimum Effort.

I use a min-heap of (highest cell so far, row, col), starting with the top-left cell's height. I always pop the lowest one, and push each unvisited neighbour with the max of the current value and the neighbour's height. Since the popped values never go down, the first time I reach the bottom-right corner, its value is the answer.

O(n squared log n) time and O(n squared) space. Binary search on t with a BFS check, or Union-Find adding cells in order of height, also work."
@code
```python
import heapq

def swim_in_water(grid):
    n = len(grid)
    seen = {(0, 0)}
    heap = [(grid[0][0], 0, 0)]              # highest cell on the path so far
    while heap:
        t, r, c = heapq.heappop(heap)
        if (r, c) == (n - 1, n - 1):
            return t
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in seen:
                seen.add((nr, nc))
                heapq.heappush(heap, (max(t, grid[nr][nc]), nr, nc))
    return -1
```
@time O(n^2 log n)
@space O(n^2)
@test
assert swim_in_water([[0, 2], [1, 3]]) == 3
assert swim_in_water([[0, 1, 2, 3, 4], [24, 23, 22, 21, 5], [12, 13, 14, 15, 16], [11, 17, 18, 19, 20], [10, 9, 8, 7, 6]]) == 16
assert swim_in_water([[0]]) == 0

### [2] Find the City With the Smallest Number of Neighbors at a Threshold Distance
@lc 1334
@ask For each city, count the other cities within distanceThreshold by shortest path. Return the city with the smallest count, choosing the largest index on ties.
@eg n = 4, edges = [[0,1,3],[1,2,1],[1,3,4],[2,3,1]], threshold = 4  ->  3
@tags floyd-warshall, graphs, all pairs
@hook All-pairs shortest paths on a small graph: Floyd-Warshall. For each middle city k, try i -> k -> j.
@say
"I need the shortest distance between every pair of cities, and n is small, at most about 100. That's exactly what Floyd-Warshall is for.

I start a distance table with 0 on the diagonal, the edge weights for direct roads, and infinity elsewhere. Then for each city k, I let it be a stop in the middle: for every pair i, j, if going through k is shorter, I update the distance. The loop over k must be the outer loop.

Then for each city I count the others within the threshold and keep the smallest count, using less-than-or-equal so ties go to the larger index. O(n cubed) time and O(n squared) space. Running Dijkstra from every city also works and is better for big sparse graphs."
@code
```python
def find_the_city(n, edges, distance_threshold):
    INF = float("inf")
    dist = [[INF] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
    for u, v, w in edges:
        dist[u][v] = dist[v][u] = min(dist[u][v], w)
    for k in range(n):                       # k is the middle stop: outer loop
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    best_city, best_count = -1, INF
    for i in range(n):
        count = sum(1 for j in range(n) if j != i and dist[i][j] <= distance_threshold)
        if count <= best_count:              # ties go to the larger index
            best_city, best_count = i, count
    return best_city
```
@time O(n^3)
@space O(n^2)
@trap
Putting the k loop inside the i and j loops. The order matters: k must be outermost, or some paths are never found.
@test
assert find_the_city(4, [[0, 1, 3], [1, 2, 1], [1, 3, 4], [2, 3, 1]], 4) == 3
assert find_the_city(5, [[0, 1, 2], [0, 4, 8], [1, 2, 3], [1, 4, 2], [2, 3, 1], [3, 4, 1]], 2) == 0
