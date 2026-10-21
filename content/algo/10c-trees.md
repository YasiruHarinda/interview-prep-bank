@section trees | Binary Trees

### [2] Construct Binary Tree from Preorder and Inorder Traversal
@lc 105
@ask Rebuild a tree with unique values from its preorder and inorder traversals.
@eg preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]  ->  [3,9,20,null,null,15,7]
@tags trees, recursion, hash map
@hook Preorder tells you the root. Its position in inorder splits the rest into the left and right subtrees.
@say
"The first value in preorder is always the root. If I find that value in the inorder list, everything to its left is the left subtree and everything to its right is the right subtree.

So I recurse. I keep an iterator over preorder, because preorder lists the roots in exactly the order I build them: root, then the whole left subtree, then the right. For a range of the inorder list, I take the next preorder value as the root, find its position with a hash map so it's O(1), then build the left part and then the right part. An empty range means no node.

O(n) time with the hash map, and O(n) space."
@code
```python
def construct_tree(preorder, inorder):
    index_of = {v: i for i, v in enumerate(inorder)}
    roots = iter(preorder)

    def build(lo, hi):                 # the subtree made of inorder[lo..hi]
        if lo > hi:
            return None
        root = TreeNode(next(roots))   # preorder gives the roots in order
        mid = index_of[root.val]
        root.left = build(lo, mid - 1)       # must build left first
        root.right = build(mid + 1, hi)
        return root

    return build(0, len(inorder) - 1)
```
@time O(n)
@space O(n)
@trap
Building the right subtree before the left. The preorder iterator gives left-subtree roots first, so the order of the two calls matters.
@test
assert tree_vals(construct_tree([3, 9, 20, 15, 7], [9, 3, 15, 20, 7])) == [3, 9, 20, None, None, 15, 7]
assert tree_vals(construct_tree([-1], [-1])) == [-1]
assert construct_tree([], []) is None
assert tree_vals(construct_tree([1, 2], [2, 1])) == [1, 2]
assert tree_vals(construct_tree([1, 2], [1, 2])) == [1, None, 2]

### [2] Path Sum III
@lc 437
@ask Count the downward paths (starting anywhere, ending anywhere below) whose values add up to target.
@eg [10,5,-3,3,2,null,11,3,-2,null,1], target = 8  ->  3
@tags trees, prefix sum, hash map, dfs
@hook This is Subarray Sum Equals K on every root-to-node path. Keep prefix sum counts for the current path and undo them when you go back up.
@say
"Starting a search from every node is O(n squared) for a skewed tree. Instead I reuse the prefix sum trick from arrays.

Walking down from the root, I keep the running sum of the current path and a map of how many times each prefix sum appears on this path. A path ending at the current node sums to the target when an earlier prefix equals the running sum minus the target, so I add that count. Then I add the current running sum to the map, recurse into both children, and when I return, I remove it again, because that node is no longer on the path.

O(n) time and O(h) space for the map and the recursion."
@code
```python
from collections import defaultdict

def path_sum(root, target):
    seen = defaultdict(int)
    seen[0] = 1                          # the empty prefix

    def dfs(node, running):
        if not node:
            return 0
        running += node.val
        count = seen[running - target]   # paths ending here
        seen[running] += 1
        count += dfs(node.left, running) + dfs(node.right, running)
        seen[running] -= 1               # leaving this path: undo
        return count

    return dfs(root, 0)
```
@time O(n)
@space O(h)
@trap
Forgetting to undo the count when the recursion returns. Prefix sums from another branch would then match paths that don't exist.
@test
assert path_sum(build_tree([10, 5, -3, 3, 2, None, 11, 3, -2, None, 1]), 8) == 3
assert path_sum(build_tree([5, 4, 8, 11, None, 13, 4, 7, 2, None, None, 5, 1]), 22) == 3
assert path_sum(None, 1) == 0
assert path_sum(build_tree([1]), 1) == 1
assert path_sum(build_tree([1, -1, 0]), 0) == 2

### [3] Binary Tree Maximum Path Sum
@lc 124
@ask A path connects any nodes through parent-child links, with no node used twice. Return the largest sum of any non-empty path. Values can be negative.
@eg [-10,9,20,null,null,15,7]  ->  42   (15 -> 20 -> 7)
@tags trees, dfs
@hook Each node returns its best one-sided path to the parent, but records the best two-sided path that bends at it. Drop negative branches.
@say
"This is the diameter idea with values. Every path has a highest node where it bends, and through that node the path can use the left branch, the right branch, or both.

My helper returns the best gain of a path that starts at this node and goes down one side only, because a parent can only extend a one-sided path. At each node I get the gains of both children and replace negative ones with 0, since adding a negative branch only hurts. The best path bending here is the node's value plus both gains, and I update a global best with it. Then I return the node's value plus the larger gain.

I start the best at minus infinity, so an all-negative tree returns its largest single value. O(n) time and O(h) space."
@code
```python
def max_path_sum(root):
    best = float("-inf")

    def gain(node):                         # best downward path from node
        nonlocal best
        if not node:
            return 0
        left = max(gain(node.left), 0)      # ignore branches that hurt
        right = max(gain(node.right), 0)
        best = max(best, node.val + left + right)    # path bending here
        return node.val + max(left, right)

    gain(root)
    return best
```
@time O(n)
@space O(h)
@trap
Returning `node.val + left + right` to the parent. A parent can't use a path that already goes down both sides, because that would not be a simple path.
@test
assert max_path_sum(build_tree([1, 2, 3])) == 6
assert max_path_sum(build_tree([-10, 9, 20, None, None, 15, 7])) == 42
assert max_path_sum(build_tree([-3])) == -3
assert max_path_sum(build_tree([2, -1])) == 2
assert max_path_sum(build_tree([-2, -1])) == -1

### [3] Serialize and Deserialize Binary Tree
@lc 297
@ask Write serialize, which turns a tree into a string, and deserialize, which rebuilds the exact same tree from it.
@eg [1,2,3,null,null,4,5]  ->  "1,2,#,#,3,4,#,#,5,#,#"  ->  the same tree
@tags trees, dfs, design
@hook Preorder with a marker like "#" for every empty child. The markers make the shape unambiguous, so one traversal is enough.
@say
"A plain preorder list can't be rebuilt on its own, because it loses the shape. If I also write a marker for every empty child, the shape is fully recorded.

To serialize, I do a preorder DFS: write the node's value, then serialize the left subtree, then the right subtree, writing '#' for None. I join everything with commas.

To deserialize, I split the string and read the tokens in the same preorder order with an iterator. If the token is '#', I return None. Otherwise I create the node, then build its left subtree, then its right subtree, which naturally consume exactly the right tokens.

Both are O(n) time and O(n) space. A BFS level-order format, like LeetCode's own, also works."
@code
```python
def serialize(root):
    out = []

    def dfs(node):                   # preorder, "#" for an empty child
        if not node:
            out.append("#")
            return
        out.append(str(node.val))
        dfs(node.left)
        dfs(node.right)

    dfs(root)
    return ",".join(out)

def deserialize(data):
    tokens = iter(data.split(","))

    def build():
        tok = next(tokens)
        if tok == "#":
            return None
        node = TreeNode(int(tok))
        node.left = build()
        node.right = build()
        return node

    return build()
```
@time O(n)
@space O(n)
@test
for vals in [[1, 2, 3, None, None, 4, 5], [], [1], [1, None, 2, None, 3], [-1, 0, 1]]:
    assert tree_vals(deserialize(serialize(build_tree(vals)))) == vals
assert serialize(build_tree([1, 2, 3, None, None, 4, 5])) == "1,2,#,#,3,4,#,#,5,#,#"
