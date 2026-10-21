@section backtrack | Backtracking
@blurb Build every candidate step by step and undo each step when you return. Use it for all subsets, permutations, combinations and puzzles.

### [1] Pattern: what is the backtracking template?
@tags pattern, backtracking, recursion
@hook Choose, explore, un-choose. Add a choice to the path, recurse, then remove it so the next choice starts clean.
@say
"Backtracking explores a tree of decisions. At each step I have some choices. I pick one and add it to my current path, recurse to make the remaining decisions, then remove it again, which is the 'backtrack', so the next choice starts from the same state.

When the path is complete, I save a **copy** of it, because the path list keeps changing. To make it faster, I **prune**: I stop exploring as soon as a path can't lead to a valid answer, like a sum that's already too big.

For duplicates in the input, I sort first and skip a value if it's the same as the previous one at the same level. The cost is exponential by nature: subsets are O(n times 2 to the n) and permutations are O(n times n factorial), so this only works for small inputs, usually n up to about 20."
@deep
```python
def backtrack_template(choices):
    result, path = [], []

    def backtrack(start):
        if is_complete(path):
            result.append(path[:])          # save a COPY
            return
        for i in range(start, len(choices)):
            if not is_valid(choices[i], path):
                continue                    # prune
            path.append(choices[i])         # choose
            backtrack(i + 1)                # explore
            path.pop()                      # un-choose
    backtrack(0)
    return result
```
| Problem | Next call starts at | Duplicate handling |
|---|---|---|
| Subsets, combinations | `i + 1` (no reuse) | sort, skip `nums[i] == nums[i - 1]` when `i > start` |
| Combination Sum | `i` (reuse allowed) | none needed |
| Permutations | `0` with a `used` array | sort, skip if the equal previous one is unused |
@trap
Appending `path` instead of `path[:]`. Every saved answer is then the same list object, which ends up empty after all the pops.

### [2] Subsets
@lc 78
@ask Return all subsets of a list of distinct numbers.
@eg [1,2,3]  ->  [[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]
@tags backtracking, power set
@hook Every node in the decision tree is a subset. Record the path at every call, and only move forward in the list.
@say
"For each number there are two options, in or out, so there are 2 to the n subsets.

With backtracking, I record the current path as a subset every time I enter the function, not only at the leaves. Then I try adding each number from `start` onwards, recurse with the next index, and pop it afterwards. Only moving forward means I never build the same subset twice in a different order.

There are 2 to the n subsets and copying each takes up to n, so O(n times 2 to the n) time. The recursion uses O(n) extra space."
@code
```python
def subsets(nums):
    result, path = [], []

    def backtrack(start):
        result.append(path[:])           # every path is a subset
        for i in range(start, len(nums)):
            path.append(nums[i])         # choose
            backtrack(i + 1)             # only later numbers
            path.pop()                   # un-choose

    backtrack(0)
    return result
```
@time O(n * 2^n)
@space O(n) besides the output
@deep
Two other ways that are good to mention:

```python
def subsets_iterative(nums):
    result = [[]]
    for x in nums:                       # add x to every subset so far
        result += [s + [x] for s in result]
    return result

def subsets_bitmask(nums):
    n = len(nums)
    return [[nums[i] for i in range(n) if mask >> i & 1] for mask in range(1 << n)]
```
@test
def norm(groups):
    return sorted(sorted(g) for g in groups)
assert norm(subsets([1, 2, 3])) == norm([[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]])
assert subsets([]) == [[]]
assert len(subsets([1, 2, 3, 4])) == 16

### [2] Subsets II
@lc 90
@ask Return all subsets of a list that may contain duplicates, without duplicate subsets.
@eg [1,2,2]  ->  [[],[1],[1,2],[1,2,2],[2],[2,2]]
@tags backtracking, duplicates
@hook Sort, then at each level skip a number equal to the one just before it. Equal numbers can still be taken together at deeper levels.
@say
"It's the Subsets code with one change. First I sort so equal values sit next to each other.

Then, inside the loop, if `i` is bigger than `start` and `nums[i]` equals `nums[i - 1]`, I skip it. That stops me from starting two branches with the same value at the same level, which is where duplicate subsets come from. But a deeper level can still pick the second 2 after the first 2, so [2, 2] is still produced once.

O(n times 2 to the n) time in the worst case, O(n) extra space."
@code
```python
def subsets_with_dup(nums):
    nums.sort()                          # equal values sit together
    result, path = [], []

    def backtrack(start):
        result.append(path[:])
        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i - 1]:
                continue                 # same value at this level: skip
            path.append(nums[i])
            backtrack(i + 1)
            path.pop()

    backtrack(0)
    return result
```
@time O(n * 2^n)
@space O(n)
@test
assert sorted(subsets_with_dup([1, 2, 2])) == sorted([[], [1], [1, 2], [1, 2, 2], [2], [2, 2]])
assert subsets_with_dup([0]) == [[], [0]]
assert len(subsets_with_dup([2, 2, 2])) == 4

### [2] Permutations
@lc 46
@ask Return all orderings of a list of distinct numbers.
@eg [1,2,3]  ->  [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
@tags backtracking, permutations
@hook At each position, try every number not used yet. A used array tracks what is already in the path.
@say
"A permutation uses every number once, in any order. At each step I can pick any number that isn't already in my path, so I keep a `used` array.

When the path has all n numbers, I save a copy. Otherwise I loop over all numbers, skip the used ones, mark the chosen one as used, add it to the path, recurse, then undo both.

There are n factorial permutations and each takes O(n) to copy: O(n times n factorial) time and O(n) extra space."
@code
```python
def permute(nums):
    result, path = [], []
    used = [False] * len(nums)

    def backtrack():
        if len(path) == len(nums):
            result.append(path[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            path.append(nums[i])
            backtrack()
            path.pop()
            used[i] = False

    backtrack()
    return result
```
@time O(n * n!)
@space O(n)
@follow What if the input has duplicates, like [1, 1, 2]?
Sort first. Skip `nums[i]` when it equals `nums[i - 1]` and `nums[i - 1]` is not used. That forces equal values to be used in their original order, so each permutation appears once. That is LeetCode 47.
@test
assert sorted(permute([1, 2, 3])) == [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
assert sorted(permute([0, 1])) == [[0, 1], [1, 0]]
assert permute([1]) == [[1]]

### [2] Combinations
@lc 77
@ask Return all ways to choose k numbers from 1 to n.
@eg n = 4, k = 2  ->  [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]
@tags backtracking, combinations, pruning
@hook Subsets of size exactly k. Prune: stop the loop early when there aren't enough numbers left to fill the path.
@say
"This is Subsets, but I only save a path when it has exactly k numbers, and I stop going deeper at that point.

I add a useful prune. If I still need r more numbers, the next number can't be bigger than n minus r plus 1, otherwise there aren't enough numbers left after it. So my loop stops there. It saves a lot of dead branches.

There are C(n, k) combinations, each copied in O(k), so O(k times C(n, k)) time and O(k) extra space."
@code
```python
def combine(n, k):
    result, path = [], []

    def backtrack(start):
        if len(path) == k:
            result.append(path[:])
            return
        need = k - len(path)
        for x in range(start, n - need + 2):     # leave room for the rest
            path.append(x)
            backtrack(x + 1)
            path.pop()

    backtrack(1)
    return result
```
@time O(k * C(n, k))
@space O(k)
@test
assert combine(4, 2) == [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]
assert combine(1, 1) == [[1]]
assert len(combine(5, 3)) == 10
assert combine(3, 3) == [[1, 2, 3]]

### [2] Combination Sum
@lc 39
@ask Return all unique combinations of candidates that sum to target. Each candidate can be used any number of times.
@eg candidates = [2,3,6,7], target = 7  ->  [[2,2,3],[7]]
@tags backtracking, pruning
@hook Recurse with the same index to allow reuse. Sort first so you can stop the loop once a candidate is bigger than what's left.
@say
"I backtrack with the remaining amount. At each level, I try candidates from `start` onwards. When I pick candidate i, I recurse with `start` still equal to i, because the same number may be used again. Never going back to earlier candidates means each combination is built in one order only, so there are no duplicates like [2, 3, 2].

I sort the candidates first. Then, if a candidate is bigger than the remaining amount, every later one is too, so I break out of the loop. When the remaining amount is exactly zero, I save the path.

The time is exponential, roughly O(n to the power of target divided by the smallest candidate), and the space is the recursion depth."
@code
```python
def combination_sum(candidates, target):
    candidates.sort()
    result, path = [], []

    def backtrack(start, remaining):
        if remaining == 0:
            result.append(path[:])
            return
        for i in range(start, len(candidates)):
            c = candidates[i]
            if c > remaining:
                break                    # sorted: the rest are too big too
            path.append(c)
            backtrack(i, remaining - c)  # i, not i + 1: c can be reused
            path.pop()

    backtrack(0, target)
    return result
```
@time O(n^(t/m)), t = target, m = smallest candidate
@space O(t/m) recursion depth
@test
assert sorted(combination_sum([2, 3, 6, 7], 7)) == [[2, 2, 3], [7]]
assert sorted(combination_sum([2, 3, 5], 8)) == [[2, 2, 2, 2], [2, 3, 3], [3, 5]]
assert combination_sum([2], 1) == []

### [2] Combination Sum II
@lc 40
@ask Candidates may contain duplicates and each can be used once. Return all unique combinations that sum to target.
@eg [10,1,2,7,6,1,5], target = 8  ->  [[1,1,6],[1,2,5],[1,7],[2,6]]
@tags backtracking, duplicates, pruning
@hook Recurse with i + 1 (no reuse), and skip equal values at the same level, exactly like Subsets II.
@say
"This mixes the last two ideas. Each number can be used once, so I recurse with i plus 1. The input has duplicates, so I sort it and skip a candidate when it equals the previous one at the same level, which prevents duplicate combinations like two copies of [1, 7].

The sort also lets me break early when a candidate is bigger than the remaining amount.

Worst case O(2 to the n) combinations, times n to copy them. O(n) extra space."
@code
```python
def combination_sum2(candidates, target):
    candidates.sort()
    result, path = [], []

    def backtrack(start, remaining):
        if remaining == 0:
            result.append(path[:])
            return
        for i in range(start, len(candidates)):
            if i > start and candidates[i] == candidates[i - 1]:
                continue                 # same value at this level: skip
            if candidates[i] > remaining:
                break
            path.append(candidates[i])
            backtrack(i + 1, remaining - candidates[i])   # each number once
            path.pop()

    backtrack(0, target)
    return result
```
@time O(n * 2^n)
@space O(n)
@test
assert sorted(combination_sum2([10, 1, 2, 7, 6, 1, 5], 8)) == [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]]
assert sorted(combination_sum2([2, 5, 2, 1, 2], 5)) == [[1, 2, 2], [5]]
assert combination_sum2([1], 2) == []
