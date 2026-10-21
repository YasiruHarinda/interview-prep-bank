@section trees | Binary Trees
@blurb Almost every tree problem is a short recursive function. Ask what the function should return for a subtree, and handle the empty tree first.

### [1] Pattern: how do you approach any binary tree problem?
@tags pattern, trees, dfs, bfs
@hook Ask: "if I already had the answer for the left and right subtrees, how do I get the answer for this node?" Then handle the empty node.
@say
"I think recursively. I define what my function returns for a subtree, assume the recursive calls on the left and right children already work, and combine their results at the current node. The base case is almost always the empty node.

There are two styles. **Bottom-up**, where the children return values to the parent, like height or diameter. **Top-down**, where the parent passes information down, like the maximum value on the path so far. When the question is about levels, like 'the right side view' or 'level by level', I use BFS with a queue instead.

Time is usually O(n), since each node is visited once. Space is O(h) for the recursion stack, where h is the height: O(log n) for a balanced tree and O(n) for a skewed one."
@deep
```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# Bottom-up DFS: children report to the parent
def height(node):
    if not node:
        return 0
    return 1 + max(height(node.left), height(node.right))

# Top-down DFS: the parent passes information down
def visit(node, best_so_far):
    if not node:
        return
    best_so_far = max(best_so_far, node.val)
    visit(node.left, best_so_far)
    visit(node.right, best_so_far)

# BFS: one level at a time
from collections import deque
queue = deque([root])
while queue:
    for _ in range(len(queue)):        # exactly the nodes of this level
        node = queue.popleft()
        if node.left: queue.append(node.left)
        if node.right: queue.append(node.right)
```
| Order | Visit | Typical use |
|---|---|---|
| Preorder | node, left, right | Copy or serialize a tree |
| Inorder | left, node, right | Sorted order of a BST |
| Postorder | left, right, node | Compute from children, delete a tree |
| Level order | level by level | Shortest depth, views, levels |
@trap
Forgetting recursion depth. Python stops at about 1,000 nested calls, so a skewed tree with 10,000 nodes crashes. Mention an iterative version with your own stack for very deep trees.

### [1] Maximum Depth of Binary Tree
@lc 104
@ask Return the number of nodes on the longest path from the root down to a leaf.
@eg [3,9,20,null,null,15,7]  ->  3
@tags trees, dfs
@hook Depth of a node = 1 + the deeper of its two subtrees. An empty tree has depth 0.
@say
"This is the simplest bottom-up recursion. An empty tree has depth 0. For any other node, the depth is 1 for the node itself plus the larger depth of its left and right subtrees.

Each node is visited once, so O(n) time. The space is the recursion depth, O(h), where h is the height of the tree. BFS that counts the levels works too."
@code
```python
def max_depth(root):
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
```
@time O(n)
@space O(h), h = height
@test
assert max_depth(build_tree([3, 9, 20, None, None, 15, 7])) == 3
assert max_depth(build_tree([1, None, 2])) == 2
assert max_depth(None) == 0
assert max_depth(build_tree([1])) == 1

### [1] Invert Binary Tree
@lc 226
@ask Mirror a binary tree: swap the left and right child of every node.
@eg [4,2,7,1,3,6,9]  ->  [4,7,2,9,6,3,1]
@tags trees, dfs
@hook Swap the two children, then invert each of them. Any traversal order works.
@say
"At every node I swap the left and right children, and I do the same for every subtree. Recursively: invert the right subtree and put it on the left, invert the left subtree and put it on the right. An empty tree stays empty.

O(n) time, since each node is visited once, and O(h) space for the recursion. A BFS with a queue does the same thing iteratively."
@code
```python
def invert_tree(root):
    if root:
        root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root
```
@time O(n)
@space O(h)
@test
assert tree_vals(invert_tree(build_tree([4, 2, 7, 1, 3, 6, 9]))) == [4, 7, 2, 9, 6, 3, 1]
assert tree_vals(invert_tree(build_tree([2, 1, 3]))) == [2, 3, 1]
assert invert_tree(None) is None

### [1] Same Tree
@lc 100
@ask Return true if two binary trees have the same shape and the same values.
@eg [1,2,3] and [1,2,3] -> true,  [1,2] and [1,null,2] -> false
@tags trees, dfs
@hook Both empty: same. One empty or values differ: different. Otherwise compare left with left and right with right.
@say
"I compare the trees node by node with recursion. If both nodes are empty, they match. If only one is empty, or their values are different, they don't match. Otherwise the trees are the same only if the left subtrees are the same and the right subtrees are the same.

O(n) time in the worst case, where n is the smaller tree's size, and O(h) space."
@code
```python
def is_same_tree(p, q):
    if not p and not q:
        return True
    if not p or not q or p.val != q.val:
        return False
    return is_same_tree(p.left, q.left) and is_same_tree(p.right, q.right)
```
@time O(n)
@space O(h)
@test
assert is_same_tree(build_tree([1, 2, 3]), build_tree([1, 2, 3]))
assert not is_same_tree(build_tree([1, 2]), build_tree([1, None, 2]))
assert not is_same_tree(build_tree([1, 2, 1]), build_tree([1, 1, 2]))
assert is_same_tree(None, None)

### [1] Symmetric Tree
@lc 101
@ask Return true if a tree is a mirror image of itself around its center.
@eg [1,2,2,3,4,4,3] -> true,  [1,2,2,null,3,null,3] -> false
@tags trees, dfs
@hook Compare two subtrees as mirrors: outer pair (a.left, b.right) and inner pair (a.right, b.left).
@say
"A tree is symmetric when its left subtree is a mirror of its right subtree. I write a helper that checks whether two trees are mirrors.

Two trees are mirrors if both are empty, or if their root values are equal and the outside children match, meaning a's left with b's right, and the inside children match, meaning a's right with b's left. I call the helper on the root's two children.

O(n) time and O(h) space."
@code
```python
def is_symmetric(root):
    def mirror(a, b):
        if not a and not b:
            return True
        if not a or not b or a.val != b.val:
            return False
        return mirror(a.left, b.right) and mirror(a.right, b.left)

    return mirror(root.left, root.right) if root else True
```
@time O(n)
@space O(h)
@test
assert is_symmetric(build_tree([1, 2, 2, 3, 4, 4, 3]))
assert not is_symmetric(build_tree([1, 2, 2, None, 3, None, 3]))
assert is_symmetric(None)
assert is_symmetric(build_tree([1]))

### [1] Subtree of Another Tree
@lc 572
@ask Return true if `sub` appears in `root` as a full subtree: a node of root plus all of its descendants.
@eg root = [3,4,5,1,2], sub = [4,1,2]  ->  true
@tags trees, dfs
@hook At every node of root, run Same Tree against sub. If any match, it's a subtree.
@say
"I walk through every node of the big tree, and at each one I check whether the tree starting there is exactly the same as `sub`, using the Same Tree check. If any node matches, the answer is true.

An empty `sub` is always a subtree, and nothing fits inside an empty `root`.

In the worst case this is O(m times n), because Same Tree can run at every node. For huge trees, I'd serialize both trees and use string matching, or compare hashes of subtrees, to get O(m plus n)."
@code
```python
def is_subtree(root, sub):
    if not sub:
        return True
    if not root:
        return False
    if same(root, sub):
        return True
    return is_subtree(root.left, sub) or is_subtree(root.right, sub)

def same(a, b):
    if not a and not b:
        return True
    if not a or not b or a.val != b.val:
        return False
    return same(a.left, b.left) and same(a.right, b.right)
```
@time O(m * n)
@space O(h)
@test
assert is_subtree(build_tree([3, 4, 5, 1, 2]), build_tree([4, 1, 2]))
assert not is_subtree(build_tree([3, 4, 5, 1, 2, None, None, None, None, 0]), build_tree([4, 1, 2]))
assert is_subtree(build_tree([1, 1]), build_tree([1]))
assert not is_subtree(build_tree([1]), build_tree([2]))

### [1] Diameter of Binary Tree
@lc 543
@ask Return the length, in edges, of the longest path between any two nodes. The path may not pass through the root.
@eg [1,2,3,4,5]  ->  3   (4 -> 2 -> 1 -> 3)
@tags trees, dfs
@hook Each node's best path through it = left height + right height. Compute heights bottom-up and keep a global best.
@say
"Every path has one highest node where it bends. The longest path that bends at a node goes down its left side as far as possible and down its right side as far as possible, so its length is left height plus right height.

So I write a height function. At each node it gets the heights of both children, updates a global best with their sum, and returns 1 plus the bigger of the two to its parent. The function returns height, but it records the diameter on the side.

One pass: O(n) time and O(h) space."
@code
```python
def diameter_of_binary_tree(root):
    best = 0

    def height(node):
        nonlocal best
        if not node:
            return 0
        left, right = height(node.left), height(node.right)
        best = max(best, left + right)       # longest path bending here
        return 1 + max(left, right)

    height(root)
    return best
```
@time O(n)
@space O(h)
@trap
Assuming the longest path goes through the root. It can be deep inside one subtree, which is why you check every node.
@test
assert diameter_of_binary_tree(build_tree([1, 2, 3, 4, 5])) == 3
assert diameter_of_binary_tree(build_tree([1, 2])) == 1
assert diameter_of_binary_tree(None) == 0
assert diameter_of_binary_tree(build_tree([1])) == 0

### [1] Balanced Binary Tree
@lc 110
@ask Return true if, at every node, the heights of the left and right subtrees differ by at most 1.
@eg [3,9,20,null,null,15,7] -> true,  [1,2,2,3,3,null,null,4,4] -> false
@tags trees, dfs
@hook Return the height, or -1 as a signal that a subtree is already unbalanced. One pass, no repeated work.
@say
"The simple way calls a height function at every node, which repeats work and is O(n squared) on a skewed tree.

Instead, I compute heights bottom-up and check balance on the way. My helper returns the height of a subtree, or minus 1 if it's unbalanced anywhere inside. At each node, if either child returned minus 1, or their heights differ by more than 1, I return minus 1. Otherwise I return 1 plus the larger height.

Each node is visited once: O(n) time and O(h) space."
@code
```python
def is_balanced(root):
    def height(node):                 # -1 means "not balanced"
        if not node:
            return 0
        left = height(node.left)
        right = height(node.right)
        if left == -1 or right == -1 or abs(left - right) > 1:
            return -1
        return 1 + max(left, right)

    return height(root) != -1
```
@time O(n)
@space O(h)
@test
assert is_balanced(build_tree([3, 9, 20, None, None, 15, 7]))
assert not is_balanced(build_tree([1, 2, 2, 3, 3, None, None, 4, 4]))
assert is_balanced(None)
assert not is_balanced(build_tree([1, None, 2, None, 3]))
