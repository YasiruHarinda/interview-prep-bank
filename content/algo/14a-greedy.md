@section greedy | Greedy
@blurb Take the best-looking choice at each step and never go back. Fast and short, but you must be able to say why it's safe.

### [1] Pattern: when does a greedy algorithm work, and how do you justify it?
@tags pattern, greedy
@hook Greedy works when a locally best choice never blocks the best overall answer. Justify it with an exchange argument, or switch to DP.
@say
"A greedy algorithm makes the choice that looks best right now and never undoes it. It's usually O(n), or O(n log n) with a sort, and the code is short.

The risk is that it can be wrong. Coin change with coins 1, 3 and 4 for amount 6: greedy takes 4, 1, 1, which is three coins, but 3 plus 3 is two coins. So I always give a reason. The usual one is an **exchange argument**: take any optimal answer, swap its first choice for my greedy choice, and show the answer doesn't get worse. Another is **greedy stays ahead**: after each step, my partial answer is at least as good as any other.

If I can find a counterexample, I switch to dynamic programming, which tries all choices but reuses results."
@deep
| Problem | Greedy rule |
|---|---|
| Keep the most non-overlapping intervals | Earliest end first |
| Maximum subarray (Kadane) | Drop the running sum when it goes negative |
| Jump Game | Track the farthest reachable index |
| Gas Station | Restart after any point where the tank goes negative |
| Assign Cookies | Smallest cookie to the least greedy child |
| Huffman coding | Merge the two least frequent nodes |
| Coin change, coins 1, 5, 10, 25 | Biggest coin first (works for these coins only) |
@trap
Assuming greedy works because it passes the examples. Try to break it with a small counterexample before you code.

### [2] Maximum Subarray
@lc 53
@ask Find the contiguous subarray with the largest sum and return the sum.
@eg [-2,1,-3,4,-1,2,1,-5,4]  ->  6   ([4,-1,2,1])
@tags greedy, kadane, dynamic programming
@hook Kadane: at each number, either extend the current run or start fresh. A negative running sum only hurts what comes next.
@say
"Checking every subarray is O(n squared). Kadane's algorithm does it in one pass.

I keep `current`, the best sum of a subarray that ends at this position, and `best`, the best seen anywhere. At each number, I choose: extend the previous run, which is current plus x, or start a new run at x. If the previous run is negative, starting fresh is better. Then I update `best`.

I start both at the first element, not zero, so an all-negative array returns its largest number. O(n) time and O(1) space. It's also a tiny DP: current[i] = max(x, current[i - 1] + x)."
@code
```python
def max_sub_array(nums):
    best = current = nums[0]
    for x in nums[1:]:
        current = max(x, current + x)      # extend the run, or start at x
        best = max(best, current)
    return best
```
@time O(n)
@space O(1)
@trap
Starting `best` at 0. For [-3, -1, -2] that returns 0, but every subarray must contain at least one number, so the answer is -1.
@follow What if the array is circular?
The best circular subarray is either a normal one, or it wraps around, which equals the total minus the minimum subarray. Return the larger, unless every number is negative. That is LeetCode 918.
@test
assert max_sub_array([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6
assert max_sub_array([1]) == 1
assert max_sub_array([5, 4, -1, 7, 8]) == 23
assert max_sub_array([-3, -1, -2]) == -1

### [2] Jump Game
@lc 55
@ask nums[i] is the furthest you can jump from index i. Starting at index 0, can you reach the last index?
@eg [2,3,1,1,4] -> true,  [3,2,1,0,4] -> false
@tags greedy, arrays
@hook Track the farthest index you can reach. If you ever stand past it, you're stuck.
@say
"I keep `reach`, the farthest index I can get to so far. I walk through the indexes in order. If the current index is beyond `reach`, I can never get here, so the answer is false. Otherwise I update `reach` with i plus nums[i].

If I get through the loop, every index, including the last one, was reachable. O(n) time and O(1) space. A DP that marks each index as good or bad also works but is O(n squared)."
@code
```python
def can_jump(nums):
    reach = 0                          # farthest index reachable so far
    for i, step in enumerate(nums):
        if i > reach:
            return False               # stuck before index i
        reach = max(reach, i + step)
    return True
```
@time O(n)
@space O(1)
@test
assert can_jump([2, 3, 1, 1, 4])
assert not can_jump([3, 2, 1, 0, 4])
assert can_jump([0])
assert not can_jump([0, 1])
assert can_jump([2, 0, 0])

### [2] Jump Game II
@lc 45
@ask Return the minimum number of jumps to reach the last index. You can always reach it.
@eg [2,3,1,1,4]  ->  2   (index 0 -> 1 -> 4)
@tags greedy, bfs
@hook BFS by levels without a queue: all indexes within the current jump's range form one level. When you pass the range's end, take a jump.
@say
"Think of it as BFS. All indexes I can reach with one jump form the first level, those reachable with two jumps form the second level, and so on. I don't need a queue, because each level is a continuous range of indexes.

I keep `current_end`, the end of the range I can reach with the jumps used so far, and `farthest`, how far the next jump could take me from anywhere inside that range. I scan the indexes. When I reach `current_end`, I must take another jump, so I add one and set `current_end` to `farthest`. I stop before the last index, because I don't need to jump from there.

O(n) time and O(1) space."
@code
```python
def jump(nums):
    jumps = 0
    current_end = farthest = 0
    for i in range(len(nums) - 1):       # no jump needed from the last index
        farthest = max(farthest, i + nums[i])
        if i == current_end:             # used up this jump's range
            jumps += 1
            current_end = farthest
    return jumps
```
@time O(n)
@space O(1)
@test
assert jump([2, 3, 1, 1, 4]) == 2
assert jump([2, 3, 0, 1, 4]) == 2
assert jump([0]) == 0
assert jump([1, 2]) == 1
assert jump([1, 1, 1, 1]) == 3

### [2] Gas Station
@lc 134
@ask Stations are in a circle. gas[i] is the fuel at station i, and cost[i] is the fuel to drive to the next one. Return the start index that lets you drive the full circle, or -1. The answer is unique.
@eg gas = [1,2,3,4,5], cost = [3,4,5,1,2]  ->  3
@tags greedy, arrays
@hook If total gas < total cost, it's impossible. Otherwise, whenever the tank goes negative, restart from the next station.
@say
"First, if the total gas is less than the total cost, no start can work, so I return -1. Otherwise an answer exists.

Then I drive once around, starting at station 0, adding gas minus cost to the tank. If the tank goes negative at station i, then no station from my start up to i can be the start: each of them would arrive at i with even less fuel. So I set the start to i plus 1 and reset the tank to zero.

The start left at the end is the answer. One pass: O(n) time and O(1) space."
@code
```python
def can_complete_circuit(gas, cost):
    if sum(gas) < sum(cost):
        return -1                          # not enough gas in total
    start = tank = 0
    for i in range(len(gas)):
        tank += gas[i] - cost[i]
        if tank < 0:                       # can't get past i from start
            start, tank = i + 1, 0         # so nothing up to i works
    return start
```
@time O(n)
@space O(1)
@test
assert can_complete_circuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]) == 3
assert can_complete_circuit([2, 3, 4], [3, 4, 3]) == -1
assert can_complete_circuit([5], [4]) == 0
assert can_complete_circuit([3, 1, 1], [1, 2, 2]) == 0

### [2] Hand of Straights
@lc 846
@ask Can the cards be split into groups of group_size consecutive values?
@eg hand = [1,2,3,6,2,3,4,7,8], group_size = 3  ->  true   ([1,2,3],[2,3,4],[6,7,8])
@tags greedy, hash map, sorting
@hook The smallest card left must start a group. Use it to build a run of group_size cards, as many times as it appears.
@say
"The smallest card can't be in the middle or end of a group, because nothing smaller is left to come before it. So it must start a group.

I count the cards and go through the values in increasing order. If a value still has count c, then c groups must start here, so I subtract c from each of the next group_size values. If any of them has fewer than c cards, it's impossible. First, if the number of cards isn't divisible by group_size, I return false.

Sorting the distinct values is O(n log n), and the subtraction is O(n times group_size) at most. Space is O(n)."
@code
```python
from collections import Counter

def is_n_straight_hand(hand, group_size):
    if len(hand) % group_size:
        return False
    counts = Counter(hand)
    for card in sorted(counts):          # the smallest card starts a group
        need = counts[card]
        if need:
            for c in range(card, card + group_size):
                if counts[c] < need:
                    return False
                counts[c] -= need
    return True
```
@time O(n log n)
@space O(n)
@test
assert is_n_straight_hand([1, 2, 3, 6, 2, 3, 4, 7, 8], 3)
assert not is_n_straight_hand([1, 2, 3, 4, 5], 4)
assert is_n_straight_hand([1, 1, 2, 2, 3, 3], 3)
assert is_n_straight_hand([1], 1)
assert not is_n_straight_hand([1, 2, 4], 3)
