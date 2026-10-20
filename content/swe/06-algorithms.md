@section algo | Algorithms and Complexity
@blurb Big O, sorting, searching, graphs and the problem-solving patterns behind most coding rounds.

### [1] What is Big O notation? How is it different from Big Theta and Big Omega?
@tags complexity, big o
@hook Big O describes how cost grows as input grows, ignoring constants. O is an upper bound, Omega a lower bound, Theta a tight bound.
@say
"Big O describes how an algorithm's running time or memory grows as the input size grows, focusing on the dominant term and ignoring constants. If a function does 3n squared plus 5n plus 2 steps, it's O(n squared), because for large inputs the n squared term dominates.

Formally, Big O is an upper bound, Big Omega is a lower bound, and Big Theta is a tight bound, meaning both. In interviews, people usually say Big O but mean the tight bound for the worst case.

It's also important to separate best, average and worst case. Quicksort is O(n log n) on average but O(n squared) in the worst case, and a hash map lookup is O(1) on average but O(n) in the worst case. And I always mention space complexity alongside time, because trading memory for speed, like adding a hash map, is the most common optimisation."
@deep
Growth rates from best to worst, with a feel for n = 1,000,000:

| Complexity | Name | Example | Rough work at n = 10^6 |
|---|---|---|---|
| O(1) | Constant | Hash lookup, array index | 1 |
| O(log n) | Logarithmic | Binary search | 20 |
| O(n) | Linear | Single loop | 10^6 |
| O(n log n) | Linearithmic | Merge sort | 2 x 10^7 |
| O(n^2) | Quadratic | Nested loops | 10^12 (too slow) |
| O(2^n) | Exponential | All subsets | Impossible |
| O(n!) | Factorial | All permutations | Impossible |

A typical machine does roughly 10^8 simple operations per second, which is why n = 10^5 rules out O(n^2).

### [1] How do you work out the time and space complexity of a piece of code?
@tags complexity, analysis
@hook Count how many times the innermost work runs. Loops multiply, sequential blocks add, halving gives a log.
@say
"I look at how many times the most frequent operation runs as a function of the input size.

A single loop over n items is O(n). Nested loops each over n are O(n squared). Two loops one after the other are O(n) plus O(n), which is still O(n). A loop where the range halves each time, like binary search, is O(log n). And a loop of n with a halving loop inside is O(n log n).

For recursion I think about the recursion tree: how many calls are made, and how much work each does. Naive Fibonacci makes two calls per level, so it's about O(2 to the n). Merge sort does O(n) work at each of log n levels, so O(n log n).

For space I count extra memory that grows with the input: new arrays, hash maps, and the recursion stack depth, which people often forget. A recursive DFS on a skewed tree uses O(n) stack space."
@deep
```python
for i in range(n):          # O(n)
    for j in range(i, n):   # still O(n^2) overall: n + (n-1) + ... = n(n+1)/2
        ...

i = n
while i > 1:                # O(log n): i halves each time
    i //= 2

def f(n):                   # O(2^n) calls
    if n <= 1: return n
    return f(n - 1) + f(n - 2)
```
Watch for hidden costs: `x in list` is O(n), string concatenation in a loop can be O(n^2), and slicing (`arr[1:]`) copies.

### [1] Compare the common sorting algorithms.
@tags sorting
@hook Merge sort: guaranteed n log n, stable, needs memory. Quicksort: fastest in practice, n squared worst case. Heap sort: in place, not stable.
@say
"The three I'd compare are quicksort, merge sort and heap sort, all O(n log n) on average.

Quicksort picks a pivot, partitions the array into smaller and larger elements, and recurses. It's in place and usually the fastest in practice thanks to good cache behaviour, but its worst case is O(n squared) with bad pivots, and it isn't stable.

Merge sort splits the array in half, sorts each half and merges them. It's always O(n log n) and it's stable, meaning equal elements keep their original order, but it needs O(n) extra memory. It's also the natural choice for linked lists and for external sorting of data that doesn't fit in memory.

Heap sort builds a heap and repeatedly extracts the max. It's O(n log n) worst case and in place, but not stable and slower in practice.

For small or nearly sorted inputs, insertion sort is O(n) best case and very fast, which is why real libraries are hybrids. Python and Java's object sort use Timsort, a merge sort and insertion sort hybrid that exploits existing runs. C++ and .NET use introsort, which is quicksort that falls back to heap sort if recursion gets too deep."
@deep
| Algorithm | Best | Average | Worst | Extra space | Stable |
|---|---|---|---|---|---|
| Quicksort | n log n | n log n | n^2 | log n | No |
| Merge sort | n log n | n log n | n log n | n | Yes |
| Heap sort | n log n | n log n | n log n | 1 | No |
| Insertion sort | n | n^2 | n^2 | 1 | Yes |
| Timsort | n | n log n | n log n | n | Yes |
| Counting / radix | n + k | n + k | n + k | n + k | Yes |

Comparison-based sorting can't beat O(n log n) in the worst case. Counting and radix sort beat it by not comparing, when keys are small integers.
@follow What does "stable" mean and when does it matter?
A stable sort keeps equal elements in their original relative order. It matters when you sort by multiple keys in passes, for example sort by name, then stable-sort by department, and names stay alphabetical within each department.

### [2] How does quicksort work, and how do you avoid its worst case?
@tags sorting, quicksort
@hook Partition around a pivot, recurse on both sides. Bad pivots on sorted input give n squared, so randomise.
@say
"Quicksort chooses a pivot element, then partitions the array so everything smaller goes left and everything larger goes right. The pivot is then in its final position, and we recurse on the two sides. With balanced partitions there are about log n levels, each doing O(n) work, so O(n log n).

The worst case happens when the pivot is always the smallest or largest element, for example picking the first element on an already sorted array. Then each partition only removes one element, giving n levels and O(n squared).

To avoid it, I pick a random pivot or the median of three, meaning first, middle and last. For arrays with many duplicates, three-way partitioning into less than, equal and greater avoids degrading too. And production versions like introsort switch to heap sort if the recursion gets too deep, guaranteeing O(n log n)."
@deep
```python
import random

def quicksort(a, lo=0, hi=None):
    if hi is None: hi = len(a) - 1
    if lo >= hi: return
    p = random.randint(lo, hi)
    a[p], a[hi] = a[hi], a[p]
    pivot, i = a[hi], lo
    for j in range(lo, hi):                 # Lomuto partition
        if a[j] < pivot:
            a[i], a[j] = a[j], a[i]
            i += 1
    a[i], a[hi] = a[hi], a[i]
    quicksort(a, lo, i - 1)
    quicksort(a, i + 1, hi)
```
Quickselect uses the same partition idea to find the kth smallest element in O(n) average time.

### [1] Explain binary search and its common variants.
@tags binary search
@hook Halve a sorted search space each step: O(log n). The bugs live in the boundaries.
@say
"Binary search works on sorted data. I keep two pointers, low and high, look at the middle element, and if the target is larger I discard the left half, otherwise the right half. Each step halves the search space, so it's O(log n). A million elements takes about 20 steps.

The common bugs are off-by-one errors and infinite loops, so I pick one template and stick to it. I also compute mid as low plus half the difference, which avoids integer overflow in languages with fixed-size integers.

The variants are more important than the basic version. Finding the first or last occurrence of a value, finding the insertion point, and searching in a rotated sorted array. And the most powerful one is binary search on the answer: if a condition is monotonic, like 'can we ship all packages within D days with capacity C', I binary search over C to find the smallest capacity that works."
@deep
```python
def lower_bound(a, target):
    """First index with a[i] >= target (insertion point)."""
    lo, hi = 0, len(a)               # half-open [lo, hi)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo

def min_capacity(weights, days):
    """Binary search on the answer."""
    def ok(cap):
        need, load = 1, 0
        for w in weights:
            if load + w > cap:
                need, load = need + 1, 0
            load += w
        return need <= days
    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid): hi = mid
        else: lo = mid + 1
    return lo
```
Python has `bisect.bisect_left` and `bisect_right` built in.

### [1] BFS vs DFS. When do you use each?
@tags graphs, bfs, dfs
@hook BFS explores in rings with a queue and finds shortest paths in unweighted graphs. DFS dives deep with a stack or recursion.
@say
"Breadth-first search explores level by level using a queue: all neighbours at distance one, then distance two, and so on. Because of that, the first time it reaches a node is via the shortest path in an unweighted graph. I use it for shortest path in a grid or maze, minimum number of moves, level-order traversal, and 'degrees of separation' in a social graph.

Depth-first search goes as deep as possible along one path before backtracking, using recursion or an explicit stack. I use it for exploring all paths, detecting cycles, topological sorting, finding connected components, and backtracking problems.

Both are O(V plus E) time. Memory differs: BFS can hold a whole level in its queue, which is wide for bushy graphs, while DFS holds the current path, which can be deep. In both, I keep a visited set so I don't loop forever on cycles."
@deep
```python
from collections import deque

def shortest_steps(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    q, seen = deque([(start, 0)]), {start}
    while q:
        (r, c), d = q.popleft()
        if (r, c) == goal:
            return d
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != "#" and (nr, nc) not in seen:
                seen.add((nr, nc))
                q.append(((nr, nc), d + 1))
    return -1
```
@trap
Marking nodes visited when you pop them instead of when you push them. In BFS that lets the same node enter the queue many times.

### [2] How do you detect a cycle in a graph?
@tags graphs, cycles
@hook Directed: DFS with three colours, or Kahn's algorithm. Undirected: DFS ignoring the parent, or Union-Find.
@say
"It depends on whether the graph is directed.

For a directed graph, I use DFS with three states per node: unvisited, in progress, meaning on the current recursion path, and done. If DFS reaches a node that's in progress, I've found a back edge, which means a cycle. Alternatively, Kahn's algorithm for topological sort: if it can't process all nodes, the leftovers are in a cycle. That's how you detect circular dependencies, like in course prerequisites or build systems.

For an undirected graph, a DFS that reaches an already visited node that isn't the node it just came from means a cycle. Union-Find works well too: for each edge, if both endpoints already have the same root, that edge closes a cycle.

All of these are O(V plus E). For a linked list, the special case is Floyd's tortoise and hare: a slow and a fast pointer, and if they ever meet, there's a cycle."
@deep
```python
def has_cycle_directed(n, edges):
    graph = [[] for _ in range(n)]
    for u, v in edges:
        graph[u].append(v)
    WHITE, GREY, BLACK = 0, 1, 2
    color = [WHITE] * n

    def dfs(u):
        color[u] = GREY
        for v in graph[u]:
            if color[v] == GREY:
                return True              # back edge
            if color[v] == WHITE and dfs(v):
                return True
        color[u] = BLACK
        return False

    return any(color[u] == WHITE and dfs(u) for u in range(n))
```

### [2] How does Dijkstra's algorithm work, and when does it fail?
@tags graphs, shortest path
@hook Greedily finalise the closest unvisited node using a min-heap. Breaks with negative edges; use Bellman-Ford then.
@say
"Dijkstra finds the shortest path from a source to every node in a graph with non-negative edge weights. It keeps a min-heap of nodes keyed by their best known distance. It repeatedly pops the closest node, which is now final, and relaxes its edges: if going through this node gives a neighbour a shorter distance, it updates the distance and pushes the neighbour onto the heap. With a binary heap that's O((V plus E) log V).

It fails with negative edge weights, because it assumes that once a node is popped, no later path can be shorter. A negative edge discovered later could break that. For negative weights I'd use Bellman-Ford, which relaxes all edges V minus 1 times, in O(V times E), and can also detect negative cycles.

For unweighted graphs, plain BFS is enough. And for pathfinding on maps, A star is Dijkstra plus a heuristic, like straight-line distance, which steers the search toward the goal and explores far fewer nodes."
@deep
```python
import heapq

def dijkstra(graph, src):
    """graph: {u: [(v, w), ...]}"""
    dist = {src: 0}
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist.get(u, float("inf")):
            continue                       # stale entry
        for v, w in graph.get(u, []):
            nd = d + w
            if nd < dist.get(v, float("inf")):
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return dist
```

### [2] What is topological sorting, and how do you implement it?
@tags graphs, topological sort, dag
@hook An ordering where every task comes after its prerequisites. Only exists for DAGs. Kahn's algorithm peels off zero in-degree nodes.
@say
"A topological sort orders the nodes of a directed acyclic graph so that for every edge from A to B, A comes before B. Think course prerequisites, build systems compiling dependencies first, or a CI pipeline's job graph.

I usually implement Kahn's algorithm. I compute the in-degree of every node, meaning how many prerequisites it has, and put all nodes with in-degree zero in a queue. Then I repeatedly take a node from the queue, add it to the result, and decrement the in-degree of its neighbours; any neighbour that reaches zero joins the queue. If at the end the result contains fewer nodes than the graph, there's a cycle and no valid ordering exists.

It's O(V plus E). The alternative is a DFS that adds each node to a list after visiting all its descendants, then reverses the list."
@deep
```python
from collections import deque, defaultdict

def course_order(n, prereqs):
    graph, indeg = defaultdict(list), [0] * n
    for course, pre in prereqs:
        graph[pre].append(course)
        indeg[course] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []   # [] means a cycle
```

### [2] What is dynamic programming? Memoization vs tabulation?
@tags dynamic programming
@hook Solve each overlapping subproblem once and reuse it. Top-down with a cache, or bottom-up with a table.
@say
"Dynamic programming solves problems that have two properties: overlapping subproblems, meaning the same smaller problem comes up again and again, and optimal substructure, meaning the best answer can be built from best answers to subproblems.

There are two styles. Memoization is top-down: write the natural recursive solution and cache each result, so each subproblem is computed once. Tabulation is bottom-up: fill a table from the smallest subproblems up to the full one, with no recursion, which avoids stack limits and often allows space optimisation.

My process is: define the state, meaning what dp of i represents; write the recurrence; set the base cases; decide the order of computation; then see whether I only need the last row or two, to cut space. For example, climbing stairs: ways of n equals ways of n minus 1 plus ways of n minus 2, which turns exponential recursion into O(n) time and O(1) space."
@deep
```python
from functools import lru_cache

# Coin change: fewest coins to make amount
def coin_change(coins, amount):
    INF = float("inf")
    dp = [0] + [INF] * amount               # dp[a] = fewest coins for amount a
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] != INF else -1

# Longest common subsequence, top-down
def lcs(a, b):
    @lru_cache(maxsize=None)
    def go(i, j):
        if i == len(a) or j == len(b):
            return 0
        if a[i] == b[j]:
            return 1 + go(i + 1, j + 1)
        return max(go(i + 1, j), go(i, j + 1))
    return go(0, 0)
```
Classic DP families: 1D (climbing stairs, house robber), 2D grid (unique paths), two strings (LCS, edit distance), knapsack (subset sum, coin change), intervals (burst balloons), and DP on trees.

### [2] Greedy vs dynamic programming. How do you know greedy works?
@tags greedy, dynamic programming
@hook Greedy takes the best local step and never looks back. It only works when you can prove local choices lead to a global optimum.
@say
"A greedy algorithm makes the locally best choice at each step and never reconsiders. When it works, it's simple and fast. Dynamic programming considers all relevant choices for each subproblem and combines them, which is slower but always correct when the problem has optimal substructure.

Greedy works when the problem has the greedy choice property, meaning a locally optimal choice is always part of some globally optimal solution. Examples are interval scheduling, where you pick the meeting that ends earliest, Huffman coding, and Dijkstra.

A good counter-example is coin change with coins of 1, 3 and 4 and an amount of 6. Greedy takes 4 plus 1 plus 1, three coins, but the best is 3 plus 3, two coins. So with arbitrary coin values I'd use DP. In an interview, if I propose greedy, I try to break it with a small counter-example first, or give a short exchange argument for why it's safe."

### [2] What is backtracking? Give an example.
@tags backtracking, recursion
@hook Build a solution step by step, undo the last step when it can't lead anywhere, try the next option.
@say
"Backtracking explores all possible solutions by building candidates incrementally and abandoning a candidate as soon as it can't lead to a valid solution. The pattern is: choose, explore, un-choose.

For example, generating all subsets: at each element I either include it or not, recurse, and then undo the choice before trying the other branch. Permutations, combinations that sum to a target, N-Queens, Sudoku and word search all follow this shape.

The complexity is usually exponential, like O(2 to the n) for subsets or O(n factorial) for permutations, so pruning is what makes it practical: skipping branches early when the partial sum already exceeds the target, or a queen placement is already attacked."
@deep
```python
def subsets(nums):
    res, path = [], []
    def go(i):
        if i == len(nums):
            res.append(path[:])
            return
        path.append(nums[i])     # choose
        go(i + 1)                # explore
        path.pop()               # un-choose
        go(i + 1)
    go(0)
    return res

def combination_sum(cands, target):
    res = []
    cands.sort()
    def go(start, remaining, path):
        if remaining == 0:
            res.append(path[:]); return
        for i in range(start, len(cands)):
            if cands[i] > remaining:
                break            # prune: sorted, nothing later fits
            path.append(cands[i])
            go(i, remaining - cands[i], path)
            path.pop()
    go(0, target, [])
    return res
```

### [1] Explain the two-pointer and sliding window techniques.
@tags two pointers, sliding window, patterns
@hook Two pointers walk toward each other on sorted data. A sliding window grows and shrinks over a contiguous range. Both turn O(n squared) into O(n).
@say
"Both techniques avoid nested loops by moving indices cleverly.

Two pointers typically start at both ends of a sorted array and move toward each other. To find a pair that sums to a target, if the sum is too small I move the left pointer right, if it's too big I move the right pointer left. That's O(n) instead of checking every pair. Variants include fast and slow pointers, used to detect cycles or find the middle of a linked list, and in-place array edits like removing duplicates.

A sliding window keeps a contiguous range defined by left and right pointers. I expand the right side to include new elements, and when the window breaks a condition, I shrink from the left. Each element enters and leaves the window at most once, so it's O(n). It's the go-to for 'longest or shortest substring or subarray that satisfies X', like the longest substring without repeating characters or the smallest subarray with a sum at least K."
@deep
```python
def longest_unique_substring(s):
    last, left, best = {}, 0, 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1          # shrink past the duplicate
        last[ch] = right
        best = max(best, right - left + 1)
    return best

def pair_with_sum(sorted_nums, target):
    i, j = 0, len(sorted_nums) - 1
    while i < j:
        s = sorted_nums[i] + sorted_nums[j]
        if s == target: return i, j
        if s < target: i += 1
        else: j -= 1
    return None
```

### [2] What are prefix sums, and what problems do they solve?
@tags prefix sum, arrays
@hook Precompute running totals once, then any range sum is one subtraction.
@say
"A prefix sum array stores, at each index i, the sum of all elements before i. Building it is O(n). After that, the sum of any range from i to j is prefix of j plus 1 minus prefix of i, which is O(1) per query instead of O(n).

The more interesting use is combining prefix sums with a hash map. To count subarrays that sum to K, I walk the array keeping a running sum, and for each position I check how many earlier prefix sums equal the running sum minus K. Each match is a subarray ending here with sum K. That's O(n) and also works with negative numbers, where a sliding window doesn't.

The same idea extends to 2D, for fast rectangle sums in a matrix, and to difference arrays, for applying many range updates efficiently."
@deep
```python
from collections import defaultdict

def subarray_sum_equals_k(nums, k):
    count, running = 0, 0
    seen = defaultdict(int)
    seen[0] = 1
    for x in nums:
        running += x
        count += seen[running - k]
        seen[running] += 1
    return count
```

### [3] What do P, NP and NP-complete mean, and what do you do with an NP-hard problem in practice?
@tags complexity theory, np
@hook P: solvable fast. NP: checkable fast. NP-complete: the hardest problems in NP. In practice: approximate, use heuristics, or exploit small inputs.
@say
"P is the class of problems solvable in polynomial time. NP is the class of problems whose solutions can be verified in polynomial time: given a proposed answer to a Sudoku, you can check it quickly, even if finding one is hard. NP-complete problems are the hardest in NP: if any one of them had a polynomial-time solution, all of NP would, which is the famous open P versus NP question. NP-hard problems are at least that hard but don't have to be in NP themselves. The travelling salesman problem, graph colouring and knapsack are classic examples.

In practice, when I recognise an NP-hard problem, I don't search for a perfect fast algorithm. I look at the actual constraints: if n is small, exact search with pruning or DP over subsets is fine. If n is large, I use approximation algorithms with guarantees, heuristics like greedy plus local search or simulated annealing, or an off-the-shelf solver for integer programming or constraint satisfaction. Real systems like delivery route planning run on good-enough answers, not optimal ones."
