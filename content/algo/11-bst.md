@section bst | Binary Search Trees
@blurb Left subtree smaller, right subtree bigger, at every node. Inorder traversal gives sorted order, and the ordering lets you skip half the tree at each step.

### [2] Validate Binary Search Tree
@lc 98
@ask Return true if a tree is a valid BST: every node's left subtree has only smaller values and its right subtree only bigger values.
@eg [2,1,3] -> true,  [5,1,4,null,null,3,6] -> false
@tags bst, dfs, bounds
@hook Pass down a (low, high) range. Going left lowers the high bound, going right raises the low bound. Every node must fit its range.
@say
"Checking only that each node is bigger than its left child and smaller than its right child is not enough. A node deep in the right subtree must still be bigger than the root.

So each node gets a valid range. The root's range is minus infinity to plus infinity. When I go left, the upper bound becomes the current node's value. When I go right, the lower bound becomes the current node's value. If any node falls outside its range, the tree is invalid.

O(n) time and O(h) space. Another correct way is an inorder traversal that checks every value is bigger than the previous one."
@code
```python
def is_valid_bst(root):
    def check(node, low, high):          # node.val must be in (low, high)
        if not node:
            return True
        if not (low < node.val < high):
            return False
        return check(node.left, low, node.val) and check(node.right, node.val, high)

    return check(root, float("-inf"), float("inf"))
```
@time O(n)
@space O(h)
@trap
Comparing a node only with its direct children. In [5, 4, 6, null, null, 3, 7], the 3 is a correct left child of 6, but it's in the right subtree of 5, so the tree is invalid.
@test
assert is_valid_bst(build_tree([2, 1, 3]))
assert not is_valid_bst(build_tree([5, 1, 4, None, None, 3, 6]))
assert not is_valid_bst(build_tree([5, 4, 6, None, None, 3, 7]))
assert not is_valid_bst(build_tree([1, 1]))
assert is_valid_bst(None)
assert is_valid_bst(build_tree([2147483647]))

### [2] Kth Smallest Element in a BST
@lc 230
@ask Return the kth smallest value in a BST (k starts at 1).
@eg [5,3,6,2,4,null,null,1], k = 3  ->  3
@tags bst, inorder, stack
@hook Inorder traversal visits a BST in sorted order. Stop at the kth node you visit.
@say
"An inorder traversal of a BST, left, node, right, visits the values from smallest to largest. So the kth node I visit is the answer.

I use the iterative inorder with a stack so I can stop early: walk left pushing nodes, pop one, count it, and if it's the kth, return it. Otherwise move to its right child.

O(h plus k) time, because I only go as far as the kth node, and O(h) space."
@code
```python
def kth_smallest(root, k):
    stack, node = [], root
    while stack or node:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right
    return None
```
@time O(h + k)
@space O(h)
@follow What if the tree changes often and you ask for the kth smallest many times?
Store in each node the size of its subtree. Then compare k with the left subtree's size to decide whether to go left, stop, or go right with a smaller k. Each query is O(h).
@test
assert kth_smallest(build_tree([3, 1, 4, None, 2]), 1) == 1
assert kth_smallest(build_tree([5, 3, 6, 2, 4, None, None, 1]), 3) == 3
assert kth_smallest(build_tree([1]), 1) == 1
assert kth_smallest(build_tree([2, 1, 3]), 3) == 3

### [2] Lowest Common Ancestor of a BST
@lc 235
@ask In a BST, return the lowest node that has both p and q as descendants (a node counts as its own descendant).
@eg [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8 -> 6;  p = 2, q = 4 -> 2
@tags bst, iteration
@hook Both smaller: go left. Both bigger: go right. Otherwise you're at the split point, and that's the answer.
@say
"The BST ordering tells me where p and q are without searching both sides.

I start at the root. If both p and q are smaller than the current node, they're both in the left subtree, so I go left. If both are bigger, I go right. Otherwise they split here, one on each side, or one of them is this node, so this node is the lowest common ancestor.

O(h) time and O(1) space with a loop."
@code
```python
def lowest_common_ancestor_bst(root, p, q):
    node = root
    while node:
        if p.val < node.val and q.val < node.val:
            node = node.left           # both on the left
        elif p.val > node.val and q.val > node.val:
            node = node.right          # both on the right
        else:
            return node                # they split here
    return None
```
@time O(h)
@space O(1)
@test
t = build_tree([6, 2, 8, 0, 4, 7, 9, None, None, 3, 5])
def lca(a, b):
    return lowest_common_ancestor_bst(t, find_node(t, a), find_node(t, b)).val
assert lca(2, 8) == 6
assert lca(2, 4) == 2
assert lca(3, 5) == 4
assert lca(7, 9) == 8
assert lca(0, 5) == 2

### [1] Search and Insert in a Binary Search Tree
@lc 700 / 701
@ask Write search(root, val), which returns the node holding val or None, and insert(root, val), which adds val as a new leaf and returns the root.
@eg insert 5 into [4,2,7,1,3]  ->  [4,2,7,1,3,5]
@tags bst, iteration
@hook Smaller goes left, bigger goes right. Search stops when it finds the value. Insert stops at the empty spot and puts a new node there.
@say
"Both follow the same path. At each node I compare: if the value is smaller, I go left, otherwise right.

For search, I stop when I find the value or fall off the tree. For insert, I walk until the child in the direction I need is empty, and attach a new node there. If the tree is empty, the new node is the root.

Both are O(h) time: O(log n) when the tree is balanced, O(n) when it's a straight line. With a loop, space is O(1)."
@code
```python
def search_bst(root, val):
    node = root
    while node and node.val != val:
        node = node.left if val < node.val else node.right
    return node

def insert_into_bst(root, val):
    if not root:
        return TreeNode(val)
    node = root
    while True:
        if val < node.val:
            if not node.left:
                node.left = TreeNode(val)
                return root
            node = node.left
        else:
            if not node.right:
                node.right = TreeNode(val)
                return root
            node = node.right
```
@time O(h)
@space O(1)
@test
t = build_tree([4, 2, 7, 1, 3])
assert search_bst(t, 2).val == 2
assert search_bst(t, 5) is None
assert tree_vals(insert_into_bst(t, 5)) == [4, 2, 7, 1, 3, 5]
assert tree_vals(insert_into_bst(None, 5)) == [5]

### [2] Delete Node in a BST
@lc 450
@ask Delete the node with value key from a BST, keep it a valid BST, and return the root.
@eg [5,3,6,2,4,null,7], key = 3  ->  [5,4,6,2,null,null,7]
@tags bst, recursion
@hook Zero or one child: replace the node with its child. Two children: copy in the next bigger value (the smallest in the right subtree), then delete that one.
@say
"First I find the node, going left or right by comparing with the key. Then there are three cases.

If the node has no children, I just remove it. If it has one child, that child takes its place. If it has two children, I can't simply remove it, so I find its successor, the smallest value in its right subtree, by going right once and then left as far as possible. I copy the successor's value into the node, then delete the successor from the right subtree. The successor has no left child, so that second delete is one of the easy cases.

O(h) time and O(h) space for the recursion."
@code
```python
def delete_node(root, key):
    if not root:
        return None
    if key < root.val:
        root.left = delete_node(root.left, key)
    elif key > root.val:
        root.right = delete_node(root.right, key)
    else:
        if not root.left:
            return root.right           # zero or one child: lift it up
        if not root.right:
            return root.left
        successor = root.right          # two children: next bigger value
        while successor.left:
            successor = successor.left
        root.val = successor.val
        root.right = delete_node(root.right, successor.val)
    return root
```
@time O(h)
@space O(h)
@test
def inorder(n):
    return inorder(n.left) + [n.val] + inorder(n.right) if n else []
assert tree_vals(delete_node(build_tree([5, 3, 6, 2, 4, None, 7]), 3)) == [5, 4, 6, 2, None, None, 7]
assert inorder(delete_node(build_tree([5, 3, 6, 2, 4, None, 7]), 0)) == [2, 3, 4, 5, 6, 7]
assert inorder(delete_node(build_tree([5, 3, 6, 2, 4, None, 7]), 5)) == [2, 3, 4, 6, 7]
assert delete_node(None, 0) is None
assert delete_node(build_tree([1]), 1) is None

### [1] Convert Sorted Array to Binary Search Tree
@lc 108
@ask Turn a sorted array into a height-balanced BST.
@eg [-10,-3,0,5,9]  ->  [0,-10,5,null,-3,null,9]
@tags bst, divide and conquer
@hook The middle value is the root. Build the left half into the left subtree and the right half into the right subtree.
@say
"To keep the tree balanced, the root should split the values evenly, so I pick the middle element as the root. Everything left of it is smaller and becomes the left subtree, and everything right of it becomes the right subtree. I build each side the same way, recursively, until the range is empty.

Because each step splits the range in half, the height is about log n. Each value becomes one node: O(n) time, and O(log n) recursion space."
@code
```python
def sorted_array_to_bst(nums):
    def build(lo, hi):
        if lo > hi:
            return None
        mid = (lo + hi) // 2               # middle value is the root
        node = TreeNode(nums[mid])
        node.left = build(lo, mid - 1)
        node.right = build(mid + 1, hi)
        return node

    return build(0, len(nums) - 1)
```
@time O(n)
@space O(log n)
@test
assert tree_vals(sorted_array_to_bst([-10, -3, 0, 5, 9])) == [0, -10, 5, None, -3, None, 9]
assert sorted_array_to_bst([]) is None
assert tree_vals(sorted_array_to_bst([1, 3])) == [1, None, 3]

### [2] Binary Search Tree Iterator
@lc 173
@ask Build an iterator over a BST that returns values in ascending order. next() and has_next() should be O(1) on average and use O(h) memory.
@eg [7,3,15,null,null,9,20]: next() -> 3, 7, 9, 15, 20
@tags bst, stack, design, inorder
@hook Iterative inorder, paused between steps. The stack holds the path of left children. next() pops one and pushes the left spine of its right child.
@say
"I could store the whole inorder list up front, but that's O(n) memory. Instead I run the iterative inorder traversal one step at a time.

The stack holds the nodes on the path down the left side that I haven't returned yet. At the start, I push the root and all its left children. `next` pops the top, which is the smallest value not yet returned. Before returning it, I push its right child and that child's whole left chain, so the next smallest value is ready on top. `has_next` checks if the stack is non-empty.

Each node is pushed and popped once over the whole iteration, so `next` is O(1) on average, and memory is O(h)."
@code
```python
class BSTIterator:
    def __init__(self, root):
        self.stack = []
        self._push_left(root)

    def _push_left(self, node):
        while node:
            self.stack.append(node)
            node = node.left

    def next(self):
        node = self.stack.pop()          # smallest value not returned yet
        self._push_left(node.right)
        return node.val

    def has_next(self):
        return bool(self.stack)
```
@time O(1) average per call
@space O(h)
@test
it = BSTIterator(build_tree([7, 3, 15, None, None, 9, 20]))
assert it.next() == 3
assert it.next() == 7
assert it.has_next()
assert [it.next(), it.next(), it.next()] == [9, 15, 20]
assert not it.has_next()
assert not BSTIterator(None).has_next()
