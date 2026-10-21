@section toposort | Topological Sort and Union-Find
@blurb Ordering tasks with dependencies, detecting cycles, and tracking which items belong to the same group.

### [1] Pattern: how do topological sort and Union-Find work?
@tags pattern, topological sort, union find
@hook Topological sort: repeatedly take a node with no remaining prerequisites (indegree 0). Union-Find: find(x) gives a group's root, union(a, b) joins two groups.
@say
"**Topological sort** orders the nodes of a directed graph so every edge goes from earlier to later, like courses after their prerequisites. It only exists if there's no cycle. I use Kahn's algorithm: count each node's incoming edges, its indegree. Put every node with indegree 0 in a queue. Pop a node, add it to the order, and lower its neighbours' indegrees, queueing any that reach 0. If the order doesn't include every node, there was a cycle. It's O(V plus E).

**Union-Find**, or disjoint set union, keeps track of groups. `find(x)` follows parent links to the group's root, and `union(a, b)` links one root under the other. With path compression and union by size, both are almost O(1). I use it for connected components, cycle detection in undirected graphs, Kruskal's minimum spanning tree, and grouping problems like merging accounts."
@deep
```python
from collections import deque

def topo_sort(n, edges):                # edges: (before, after)
    graph = [[] for _ in range(n)]
    indegree = [0] * n
    for a, b in edges:
        graph[a].append(b)
        indegree[b] += 1
    queue = deque(i for i in range(n) if indegree[i] == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return order if len(order) == n else []      # [] means a cycle

class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path halving
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False                  # already in the same group
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra              # smaller tree under the bigger one
        self.size[ra] += self.size[rb]
        return True
```
@trap
Using Union-Find to detect cycles in a directed graph. It only works for undirected graphs. For directed graphs, use topological sort or DFS with three states.

### [2] Course Schedule
@lc 207
@ask There are n courses and pairs [course, prerequisite]. Can you finish all of them?
@eg n = 2, [[1,0]] -> true,  n = 2, [[1,0],[0,1]] -> false
@tags topological sort, graphs, cycle detection
@hook You can finish everything exactly when the prerequisite graph has no cycle. Kahn's algorithm takes every course whose prerequisites are done.
@say
"Courses are nodes and each prerequisite is an edge from the prerequisite to the course. I can finish all courses exactly when this graph has no cycle.

I use Kahn's algorithm. I count each course's indegree, the number of prerequisites it still needs. Courses with indegree 0 can be taken now, so they go in a queue. When I take a course, every course that depends on it loses one prerequisite, and any that reach 0 join the queue. If I take all n courses, there's no cycle. If some are left, they're stuck in a cycle.

O(V plus E) time and space."
@code
```python
from collections import deque

def can_finish(num_courses, prerequisites):
    graph = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses
    for course, pre in prerequisites:
        graph[pre].append(course)            # pre comes before course
        indegree[course] += 1
    queue = deque(c for c in range(num_courses) if indegree[c] == 0)
    taken = 0
    while queue:
        c = queue.popleft()
        taken += 1
        for nxt in graph[c]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:           # all its prerequisites are done
                queue.append(nxt)
    return taken == num_courses              # fewer means a cycle
```
@time O(V + E)
@space O(V + E)
@test
assert can_finish(2, [[1, 0]])
assert not can_finish(2, [[1, 0], [0, 1]])
assert can_finish(1, [])
assert not can_finish(3, [[1, 0], [2, 1], [0, 2]])
assert can_finish(4, [[1, 0], [2, 0], [3, 1], [3, 2]])

### [2] Course Schedule II
@lc 210
@ask Return an order in which you can take all n courses, or [] if it's impossible.
@eg n = 4, [[1,0],[2,0],[3,1],[3,2]]  ->  [0,1,2,3] or [0,2,1,3]
@tags topological sort, graphs
@hook The same Kahn's algorithm, but record the order in which courses leave the queue.
@say
"This is Course Schedule, but I return the order itself. The order in which Kahn's algorithm takes courses out of the queue is a valid topological order, because a course only enters the queue once all its prerequisites are already in the order.

At the end, if the order has all n courses, I return it. Otherwise there's a cycle and I return an empty list.

O(V plus E) time and space. Any valid order is accepted."
@code
```python
from collections import deque

def find_order(num_courses, prerequisites):
    graph = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses
    for course, pre in prerequisites:
        graph[pre].append(course)
        indegree[course] += 1
    queue = deque(c for c in range(num_courses) if indegree[c] == 0)
    order = []
    while queue:
        c = queue.popleft()
        order.append(c)
        for nxt in graph[c]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return order if len(order) == num_courses else []
```
@time O(V + E)
@space O(V + E)
@test
def valid(order, n, pres):
    pos = {c: i for i, c in enumerate(order)}
    return len(order) == n and all(pos[p] < pos[c] for c, p in pres)
assert find_order(2, [[1, 0]]) == [0, 1]
assert valid(find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]]), 4, [[1, 0], [2, 0], [3, 1], [3, 2]])
assert find_order(1, []) == [0]
assert find_order(2, [[0, 1], [1, 0]]) == []

### [3] Alien Dictionary
@lc 269
@ask Words are sorted in an unknown alphabet. Return a valid order of all the letters, or "" if the input is impossible.
@eg ["wrt","wrf","er","ett","rftt"]  ->  "wertf"
@tags topological sort, graphs, strings
@hook Compare each pair of neighbouring words. Their first different letter gives one edge. Then topologically sort the letters.
@say
"Sorted words give information about letter order. For each pair of neighbouring words, the first position where they differ tells me that the first word's letter comes before the second word's letter. Letters after that position tell me nothing.

I build a graph with one node per letter that appears, and one edge per such rule. There's one special case: if a word is followed by its own prefix, like 'abc' then 'ab', the input is invalid. Then I run Kahn's topological sort. If it can't output every letter, there's a cycle and I return an empty string.

Building the graph is O(C), the total number of characters, and the sort is O(letters plus edges), which is tiny."
@code
```python
from collections import deque

def alien_order(words):
    graph = {ch: set() for w in words for ch in w}
    indegree = {ch: 0 for ch in graph}
    for a, b in zip(words, words[1:]):
        for x, y in zip(a, b):
            if x != y:                        # first difference gives an edge
                if y not in graph[x]:
                    graph[x].add(y)
                    indegree[y] += 1
                break
        else:
            if len(a) > len(b):
                return ""                     # "abc" before "ab" is impossible
    queue = deque(ch for ch in graph if indegree[ch] == 0)
    order = []
    while queue:
        ch = queue.popleft()
        order.append(ch)
        for nxt in graph[ch]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return "".join(order) if len(order) == len(graph) else ""
```
@time O(C), C = total characters
@space O(1), at most 26 letters
@trap
Comparing every letter of the two words. Only the first difference means anything. "ab" before "cd" says a < c, not b < d.
@test
assert alien_order(["wrt", "wrf", "er", "ett", "rftt"]) == "wertf"
assert alien_order(["z", "x"]) == "zx"
assert alien_order(["z", "x", "z"]) == ""
assert alien_order(["abc", "ab"]) == ""
assert alien_order(["z", "z"]) == "z"

### [2] Number of Connected Components in an Undirected Graph
@lc 323
@ask Count the connected components of an undirected graph with n nodes and a list of edges.
@eg n = 5, edges = [[0,1],[1,2],[3,4]]  ->  2
@tags union find, graphs
@hook Start with n separate groups. Every edge that joins two different groups lowers the count by one.
@say
"Every node starts as its own component, so the count starts at n. For each edge, I find the roots of its two nodes. If they're different, the edge joins two components into one, so I union them and lower the count. If they already share a root, the edge adds nothing.

With path compression in `find`, each operation is nearly constant, so it's about O(V plus E) time and O(V) space. BFS or DFS from each unvisited node also works and has the same complexity."
@code
```python
def count_components(n, edges):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]     # path halving
            x = parent[x]
        return x

    components = n
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb                   # two groups become one
            components -= 1
    return components
```
@time O((V + E) * α(V)), nearly linear
@space O(V)
@test
assert count_components(5, [[0, 1], [1, 2], [3, 4]]) == 2
assert count_components(5, [[0, 1], [1, 2], [2, 3], [3, 4]]) == 1
assert count_components(3, []) == 3
assert count_components(4, [[0, 1], [1, 0]]) == 3

### [2] Graph Valid Tree
@lc 261
@ask Do n nodes and these undirected edges form a valid tree, meaning connected with no cycle?
@eg n = 5, [[0,1],[0,2],[0,3],[1,4]] -> true,  n = 5, [[0,1],[1,2],[2,3],[1,3],[1,4]] -> false
@tags union find, graphs
@hook A tree has exactly n - 1 edges and no cycle. Check the count, then union every edge: joining two nodes already connected means a cycle.
@say
"A tree with n nodes has exactly n minus 1 edges. If the count is different, I return false straight away.

With exactly n minus 1 edges, the graph is a tree if it has no cycle, because then it must also be connected. I check for a cycle with Union-Find: for each edge, if both ends already have the same root, this edge closes a cycle. Otherwise I union them.

O(n) time, almost, and O(n) space. A DFS that counts visited nodes and checks for back edges works too."
@code
```python
def valid_tree(n, edges):
    if len(edges) != n - 1:
        return False                          # a tree has exactly n - 1 edges
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            return False                      # this edge closes a cycle
        parent[ra] = rb
    return True
```
@time O(n * α(n))
@space O(n)
@test
assert valid_tree(5, [[0, 1], [0, 2], [0, 3], [1, 4]])
assert not valid_tree(5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]])
assert valid_tree(1, [])
assert not valid_tree(4, [[0, 1], [2, 3]])

### [2] Redundant Connection
@lc 684
@ask A tree with nodes 1 to n had one extra edge added. Return the edge that can be removed to make it a tree again. If there are several, return the last one in the input.
@eg [[1,2],[1,3],[2,3]]  ->  [2,3]
@tags union find, graphs, cycle detection
@hook Add edges one by one with Union-Find. The first edge whose two ends are already connected is the one that made the cycle.
@say
"I add the edges in order. Before adding an edge, I check with Union-Find whether its two ends are already connected. If they are, this edge creates the cycle, so it's the redundant one. Otherwise I union them.

Because there's exactly one extra edge, the first edge that closes a cycle is also the last edge of that cycle in the input, which is what the problem asks for.

Nearly O(n) time and O(n) space."
@code
```python
def find_redundant_connection(edges):
    parent = list(range(len(edges) + 1))      # nodes are 1 to n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            return [a, b]                     # already connected: cycle
        parent[ra] = rb
    return []
```
@time O(n * α(n))
@space O(n)
@test
assert find_redundant_connection([[1, 2], [1, 3], [2, 3]]) == [2, 3]
assert find_redundant_connection([[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]) == [1, 4]
assert find_redundant_connection([[1, 2], [2, 3], [1, 3]]) == [1, 3]

### [2] Accounts Merge
@lc 721
@ask Each account is [name, email, email, ...]. Accounts that share any email belong to the same person. Merge them and return each person's name with their sorted emails.
@eg [["John","a@x","b@x"],["John","b@x","c@x"],["Mary","m@x"]]  ->  [["John","a@x","b@x","c@x"],["Mary","m@x"]]
@tags union find, hash map, grouping
@hook Union accounts that share an email. Then group every email under its account's root.
@say
"Two accounts are the same person if they share an email, even through a chain of other accounts. That's connected components, so I use Union-Find over account indexes.

I keep a map from each email to the first account that had it. When I see an email again in another account, I union the two accounts. Afterwards, I group every email by the root of its account, sort each group, and put the account's name in front.

With A accounts and E emails in total, it's O(E log E) because of the sorting, and O(E) space."
@code
```python
from collections import defaultdict

def accounts_merge(accounts):
    parent = list(range(len(accounts)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    owner = {}                                # email -> first account with it
    for i, account in enumerate(accounts):
        for email in account[1:]:
            if email in owner:
                parent[find(i)] = find(owner[email])   # same person
            else:
                owner[email] = i
    groups = defaultdict(list)
    for email, i in owner.items():
        groups[find(i)].append(email)
    return [[accounts[root][0]] + sorted(emails) for root, emails in groups.items()]
```
@time O(E log E)
@space O(E)
@trap
Merging accounts because they have the same name. Two different people can both be called John. Only a shared email proves it's the same person.
@test
accounts = [["John", "johnsmith@mail.com", "john_newyork@mail.com"],
            ["John", "johnsmith@mail.com", "john00@mail.com"],
            ["Mary", "mary@mail.com"],
            ["John", "johnnybravo@mail.com"]]
expected = [["John", "john00@mail.com", "john_newyork@mail.com", "johnsmith@mail.com"],
            ["Mary", "mary@mail.com"],
            ["John", "johnnybravo@mail.com"]]
assert sorted(accounts_merge(accounts)) == sorted(expected)
assert accounts_merge([["A", "a@x", "b@x"], ["A", "c@x"], ["A", "b@x", "c@x"]]) == [["A", "a@x", "b@x", "c@x"]]
