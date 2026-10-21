@section trees | Binary Trees

### [1] Path Sum
@lc 112
@ask Return true if some path from the root down to a leaf has values that add up to target.
@eg [5,4,8,11,null,13,4,7,2,null,null,null,1], target = 22  ->  true (5+4+11+2)
@tags trees, dfs
@hook Subtract the node's value from the target on the way down. At a leaf, check whether what's left equals the leaf's value.
@say
"I pass the remaining target down the tree. At each node I subtract its value. When I reach a leaf, a node with no children, the path works if the leaf's value equals the remaining target. The answer is true if the left or the right subtree has a working path.

The leaf check matters: a path must end at a leaf, not at any node. O(n) time and O(h) space."
@code
```python
def has_path_sum(root, target):
    if not root:
        return False
    if not root.left and not root.right:           # a leaf
        return root.val == target
    rest = target - root.val
    return has_path_sum(root.left, rest) or has_path_sum(root.right, rest)
```
@time O(n)
@space O(h)
@trap
Stopping when the running sum hits the target at a node that isn't a leaf. With [1, 2] and target 1, the answer is false, because node 1 has a child.
@test
assert has_path_sum(build_tree([5, 4, 8, 11, None, 13, 4, 7, 2, None, None, None, 1]), 22)
assert not has_path_sum(build_tree([1, 2, 3]), 5)
assert not has_path_sum(None, 0)
assert not has_path_sum(build_tree([1, 2]), 1)
assert has_path_sum(build_tree([-2, None, -3]), -5)

### [1] Binary Tree Inorder Traversal Without Recursion
@lc 94
@ask Return the inorder traversal (left, node, right) of a tree, using a loop and your own stack instead of recursion.
@eg [1,null,2,3]  ->  [1,3,2]
@tags trees, stack, traversal
@hook Push nodes while going left. Pop one, record it, then go to its right child and repeat.
@say
"Recursion uses the call stack for me, so to remove it I keep my own stack.

I start at the root and walk left, pushing every node, because the leftmost node comes first. When I can't go left any more, I pop a node, record its value, and move to its right child. Then I repeat: walk left from there, pushing nodes. I stop when there's no current node and the stack is empty.

Each node is pushed and popped once: O(n) time and O(h) space. This is the same pattern used in a BST iterator."
@code
```python
def inorder_traversal(root):
    result, stack = [], []
    node = root
    while node or stack:
        while node:                  # go as far left as possible
            stack.append(node)
            node = node.left
        node = stack.pop()           # visit
        result.append(node.val)
        node = node.right            # then the right subtree
    return result
```
@time O(n)
@space O(h)
@test
assert inorder_traversal(build_tree([1, None, 2, 3])) == [1, 3, 2]
assert inorder_traversal(None) == []
assert inorder_traversal(build_tree([1])) == [1]
assert inorder_traversal(build_tree([4, 2, 6, 1, 3, 5, 7])) == [1, 2, 3, 4, 5, 6, 7]

### [2] Binary Tree Level Order Traversal
@lc 102
@ask Return the node values level by level, from left to right.
@eg [3,9,20,null,null,15,7]  ->  [[3],[9,20],[15,7]]
@tags trees, bfs, queue
@hook BFS with a queue. Before each level, read the queue's length: that is exactly how many nodes belong to this level.
@say
"Levels mean BFS. I put the root in a queue. While the queue is not empty, I take its current size, which is the number of nodes on this level. I pop exactly that many nodes, record their values in a list for this level, and push their children, which belong to the next level. Then I add the level's list to the result.

Each node is enqueued and dequeued once: O(n) time and O(w) space, where w is the widest level."
@code
```python
from collections import deque

def level_order(root):
    if not root:
        return []
    result, queue = [], deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):          # only this level's nodes
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result
```
@time O(n)
@space O(w), w = widest level
@follow How do you return a zigzag order: left to right, then right to left, alternating?
Run the same BFS and reverse every second level's list before adding it. That is LeetCode 103.
@test
assert level_order(build_tree([3, 9, 20, None, None, 15, 7])) == [[3], [9, 20], [15, 7]]
assert level_order(build_tree([1])) == [[1]]
assert level_order(None) == []

### [2] Binary Tree Right Side View
@lc 199
@ask Imagine standing on the right side of the tree. Return the values you can see, from top to bottom.
@eg [1,2,3,null,5,null,4]  ->  [1,3,4]
@tags trees, bfs
@hook You see the last node of each level. Run level-order BFS and keep the last value of every level.
@say
"From the right side, I see exactly one node per level: the rightmost one. So I do a level-order BFS, and for each level I record the value of the last node I pop.

Careful: the rightmost node isn't always a right child. If a level only has a left child, that's the one I see, which BFS handles naturally.

O(n) time and O(w) space. A DFS that visits the right child first and records the first node seen at each new depth also works."
@code
```python
from collections import deque

def right_side_view(root):
    if not root:
        return []
    view, queue = [], deque([root])
    while queue:
        size = len(queue)
        for i in range(size):
            node = queue.popleft()
            if i == size - 1:                # last node of this level
                view.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
    return view
```
@time O(n)
@space O(w)
@trap
Only following right children. In [1, 2] the root has just a left child, and you can still see 2 from the right.
@test
assert right_side_view(build_tree([1, 2, 3, None, 5, None, 4])) == [1, 3, 4]
assert right_side_view(build_tree([1, None, 3])) == [1, 3]
assert right_side_view(None) == []
assert right_side_view(build_tree([1, 2])) == [1, 2]

### [2] Count Good Nodes in Binary Tree
@lc 1448
@ask A node is good if no node on the path from the root to it has a bigger value. Count the good nodes.
@eg [3,1,4,3,null,1,5]  ->  4
@tags trees, dfs, top-down
@hook Top-down DFS: pass the biggest value seen so far on the path. A node is good if it is at least that big.
@say
"This is a top-down problem: each node needs information from its ancestors, namely the maximum value on the path from the root.

I do a DFS that carries `max_so_far`. At a node, if its value is at least `max_so_far`, it's good and I count it. Then I update the maximum and pass it to both children. The total is this node's count plus the counts from both subtrees. The root is always good, so I start with minus infinity.

O(n) time and O(h) space."
@code
```python
def good_nodes(root):
    def dfs(node, max_so_far):
        if not node:
            return 0
        good = 1 if node.val >= max_so_far else 0
        max_so_far = max(max_so_far, node.val)
        return good + dfs(node.left, max_so_far) + dfs(node.right, max_so_far)

    return dfs(root, float("-inf"))
```
@time O(n)
@space O(h)
@test
assert good_nodes(build_tree([3, 1, 4, 3, None, 1, 5])) == 4
assert good_nodes(build_tree([3, 3, None, 4, 2])) == 3
assert good_nodes(build_tree([1])) == 1
assert good_nodes(None) == 0

### [2] Lowest Common Ancestor of a Binary Tree
@lc 236
@ask Return the lowest node that has both p and q as descendants. A node counts as a descendant of itself.
@eg [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1 -> 3;  p = 5, q = 4 -> 5
@tags trees, dfs
@hook Search both sides. If p and q come back from different sides, this node is the answer. Otherwise pass up whichever side found something.
@say
"My function returns p or q if it finds one of them in the subtree, the LCA if it finds both, or None.

At a node: if it's empty, or it is p or q itself, I return it. Otherwise I search the left and right subtrees. If both searches return something, then p is on one side and q is on the other, so this node is the lowest common ancestor. If only one side returns something, I pass that up, because both targets are on that side, or only one has been found so far.

This works even when p is an ancestor of q: the search returns p as soon as it sees it, and that is correct. O(n) time and O(h) space."
@code
```python
def lowest_common_ancestor(root, p, q):
    if not root or root is p or root is q:
        return root
    left = lowest_common_ancestor(root.left, p, q)
    right = lowest_common_ancestor(root.right, p, q)
    if left and right:
        return root                  # p and q are on different sides
    return left or right
```
@time O(n)
@space O(h)
@follow What if it's a binary search tree?
Use the ordering instead: if both values are smaller than the node, go left. If both are bigger, go right. Otherwise this node is the split point and the answer. O(h) time.
@test
t = build_tree([3, 5, 1, 6, 2, 0, 8, None, None, 7, 4])
assert lowest_common_ancestor(t, find_node(t, 5), find_node(t, 1)) is t
assert lowest_common_ancestor(t, find_node(t, 5), find_node(t, 4)) is find_node(t, 5)
assert lowest_common_ancestor(t, find_node(t, 7), find_node(t, 8)) is t
assert lowest_common_ancestor(t, find_node(t, 6), find_node(t, 4)) is find_node(t, 5)
