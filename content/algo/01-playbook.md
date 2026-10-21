@section playbook | How to Solve Any Coding Problem
@blurb The method that works for every problem in this track. Read these first.

### [1] What steps should you follow to solve a coding problem in an interview?
@tags method, communication
@hook Clarify, example, brute force, better idea, code, test, complexity. Say each step out loud.
@say
"I follow the same seven steps every time.

1. **Clarify.** I repeat the problem in my own words and ask about input size, empty input, duplicates and negative numbers.
2. **Example.** I work through one small example by hand, so I really understand what output is expected.
3. **Brute force.** I say the simplest correct solution and its Big O, even if it's slow. Now I have a safe answer.
4. **Optimise.** I look for wasted work and ask which pattern fits: a hash map, two pointers, a heap and so on.
5. **Code.** I write clean code with clear names, and I talk while I write.
6. **Test.** I dry-run my code on the example, then on edge cases like an empty array or a single element.
7. **Complexity.** I finish with the final time and space complexity.

This keeps the interviewer with me the whole time, so they can give hints early if I go the wrong way."
@deep
How to split a 45-minute round:

| Minutes | Step |
|---|---|
| 0 to 5 | Clarify and run a small example |
| 5 to 12 | Brute force, then the better idea, agreed with the interviewer |
| 12 to 30 | Code |
| 30 to 38 | Test and fix bugs |
| 38 to 45 | Follow-up questions and your questions |

If you are not coding by minute 15, say your best idea and start. A working O(n log n) answer beats an unfinished O(n) one.
@trap
Starting to code before the interviewer agrees with your approach. If the idea is wrong, all the code is wasted.
@pro
Before coding, say a one-line plan: "I'll sort the intervals, then merge each one into the last one in the result." The interviewer can say yes or redirect you in five seconds.

### [1] How do you recognise which pattern a problem needs?
@tags patterns, method
@hook The wording gives it away. "Sorted" means two pointers or binary search. "Top k" means a heap. "All combinations" means backtracking.
@say
"I look for clue words in the problem and in the constraints.

If the input is **sorted**, I think of two pointers or binary search. If I need a **contiguous subarray or substring**, I think of a sliding window or prefix sums. **Top k** or **kth largest** means a heap. **All combinations, subsets or permutations** means backtracking. **Shortest path** in an unweighted grid means BFS. **Number of ways** or **minimum cost** with overlapping choices means dynamic programming. **Dependencies or ordering** means topological sort. And if I keep asking 'have I seen this before?', I need a hash set or hash map.

Then I check the input size, because it tells me how fast the solution must be."
@deep
| Clue in the problem | Try this pattern |
|---|---|
| Find a pair, count things, "seen before" | Hash map or hash set |
| Sorted array, pair or triplet with a target | Two pointers |
| Longest or shortest contiguous subarray or substring | Sliding window |
| Sum of a subarray equals k | Prefix sum plus hash map |
| Matching brackets, undo, nested structure | Stack |
| Next greater or smaller element | Monotonic stack |
| Sorted input, or "minimum value that works" | Binary search |
| Linked list cycle or middle | Fast and slow pointers |
| Tree height, paths, subtrees | DFS recursion |
| Level by level, shortest steps | BFS with a queue |
| Top k, kth largest, merge k sorted | Heap |
| Overlapping ranges | Sort by start, then merge |
| Every subset, combination or permutation | Backtracking |
| Grid regions, connected parts | DFS or BFS flood fill |
| Tasks with prerequisites | Topological sort |
| Grouping, "are these connected?" | Union-Find |
| Weighted shortest path | Dijkstra |
| Count ways, min or max cost, choices overlap | Dynamic programming |
| Prefix of words, autocomplete | Trie |
| "Without extra space", pairs that cancel | Bit tricks (XOR) |

### [1] How do the input limits tell you which time complexity you need?
@tags complexity, constraints
@hook A computer does about 10^8 simple steps per second. Use the input size to work backwards to the Big O you need.
@say
"I read the constraints before I design anything. A computer does roughly a hundred million simple operations per second, and most judges allow about one second.

So if n is up to 10, even O(n factorial) is fine, which means I can try every permutation. Up to about 20, O(2 to the n) is fine, so I can try every subset. Up to 500, O(n cubed) works. Up to 5,000, O(n squared) works. Up to a million, I need O(n log n) or O(n). And if n is around 10^9 or more, I need O(log n) or a math formula.

This also helps in the interview. If the interviewer says n can be a million, I know my O(n squared) idea is not good enough before I write any code."
@deep
| n up to | Fastest allowed | Typical approach |
|---|---|---|
| 10 | O(n!) | All permutations |
| 20 | O(2^n) | All subsets, bitmask |
| 500 | O(n^3) | Triple loop, interval DP |
| 5,000 | O(n^2) | Double loop, 2-D DP |
| 10^6 | O(n log n) | Sorting, heap, binary search |
| 10^8 | O(n) | One pass |
| 10^18 | O(log n) or O(1) | Binary search, math |

### [1] Which Python tools should you know for coding rounds?
@tags python, standard library
@hook dict, set, Counter, defaultdict, deque, heapq, bisect and sorted with a key cover almost every problem.
@say
"Python's standard library saves a lot of time, so I know a few tools well.

A **dict** and a **set** give O(1) average lookups. **Counter** counts things in one line. **defaultdict(list)** groups items without checking if a key exists. **deque** is a queue with O(1) pops from both ends, which I use for BFS, because popping from the front of a list is O(n). **heapq** is a min-heap; for a max-heap I push negative numbers. **bisect** does binary search on a sorted list. And **sorted** with a key function sorts by any rule.

For recursion with memoization, **functools.cache** adds caching in one line. I still explain what the tool does, so the interviewer knows I could write it myself."
@deep
```python
from collections import Counter, defaultdict, deque
import heapq, bisect
from functools import cache

Counter("banana").most_common(1)    # [('a', 3)]
groups = defaultdict(list)
groups["key"].append(1)             # no KeyError

q = deque([1, 2]); q.append(3); q.popleft()   # O(1) at both ends

h = []
heapq.heappush(h, 5); heapq.heappush(h, 1)
heapq.heappop(h)                    # 1, the smallest
heapq.heappush(h, -9)               # max-heap trick: store negatives

a = [1, 3, 5, 7]
bisect.bisect_left(a, 5)            # 2, first index with a[i] >= 5

people = [("ann", 31), ("bob", 25)]
sorted(people, key=lambda p: (-p[1], p[0]))   # age descending, then name

@cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)
```
Big O to remember: `x in list` is O(n), `x in set` is O(1), `list.pop(0)` is O(n), `list.pop()` is O(1), slicing copies (O(k)), and `s += char` in a loop can be O(n^2). Build a list and use `"".join(parts)` instead.
@trap
`[[0] * cols] * rows` creates rows that are the same list, so changing one row changes all of them. Use `[[0] * cols for _ in range(rows)]`.

### [1] How do you test your own code before you say you are done?
@tags testing, edge cases
@hook Dry-run the example line by line, then try the edge cases: empty, one item, duplicates, negatives, all the same, very large.
@say
"I never say 'done' straight after writing the code. First I trace my code with the example from the problem, line by line, and I write the variable values next to the code. This catches most off-by-one errors.

Then I run through edge cases out loud: an empty input, a single element, two elements, duplicates, negative numbers, all values the same, and the largest input size, to check for overflow or slowness. For strings I think about empty strings and spaces. For trees, a null root and a tree that is just a straight line. For graphs, cycles and disconnected parts.

If I find a bug, I say what it is and fix it calmly. Interviewers like seeing that I can find my own bugs."
@deep
| Input type | Edge cases to try |
|---|---|
| Array | `[]`, `[x]`, all equal, sorted, reverse sorted, negatives, duplicates |
| String | `""`, one character, all the same character, spaces, upper and lower case |
| Number | 0, 1, negative, very large, overflow in fixed-size languages |
| Linked list | None, one node, two nodes, a cycle |
| Tree | None, one node, only left children (a line), a full tree |
| Graph | One node, no edges, a cycle, more than one component |
| Intervals | Touching ends `[1,2],[2,3]`, one inside another, unsorted |

### [1] What makes interview code look clean?
@tags code quality
@hook Clear names, small helper functions, early returns for edge cases, and no clever one-liners you can't explain.
@say
"I write code that reads like the explanation I just gave.

I use clear names, like `left`, `right` and `window_sum` instead of `i`, `j` and `s`, unless it's a simple loop index. I handle edge cases at the top with early returns. When a block has its own job, like checking whether a cell is inside the grid, I pull it into a small helper function. I avoid global variables, and I don't write clever one-liners that I'd have to stop and explain.

I also keep the function signature exactly as the interviewer gave it, and I add a short comment only where the logic is not obvious, like the invariant of a binary search."
@deep
```python
# Hard to follow
def f(a, k):
    s = m = sum(a[:k])
    for i in range(k, len(a)): s += a[i] - a[i-k]; m = max(m, s)
    return m

# Easy to follow
def max_window_sum(nums, k):
    if k > len(nums):
        return None
    window_sum = sum(nums[:k])
    best = window_sum
    for right in range(k, len(nums)):
        window_sum += nums[right] - nums[right - k]   # slide by one
        best = max(best, window_sum)
    return best
```

### [2] What do you do when you are stuck on a problem?
@tags method, hints
@hook Say what you know, solve a smaller version, try another example, list patterns that might fit, then ask a specific question.
@say
"First, I don't go quiet. I say what I know so far: 'the brute force is O(n squared), and the slow part is finding the matching element.'

Then I try a few things. I solve a smaller or simpler version, for example with no duplicates or with a sorted array. I work through a different example by hand and watch what I do in my head, because that is often the algorithm. I go through the pattern list and ask whether a hash map, sorting, two pointers or a heap could remove the slow part.

If I'm still stuck after a few minutes, I ask a specific question, like 'Would sorting the input first be allowed?' A good question is a sign of skill, not weakness. Using a hint well costs much less than being stuck in silence."
@trap
Giving up on a working brute force to chase a perfect answer. Code the brute force if time is running out, then improve it.
