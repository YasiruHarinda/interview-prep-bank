@section greedy | Greedy

### [2] Partition Labels
@lc 763
@ask Split a string into as many parts as possible so each letter appears in only one part. Return the part sizes.
@eg "ababcbacadefegdehijhklij"  ->  [9,7,8]
@tags greedy, hash map, strings
@hook Record each letter's last position. A part must stretch to the last position of every letter inside it. Cut when you reach that point.
@say
"First I record the last index of every letter. Then I scan from the left, keeping `end`, the furthest last-index of any letter in the current part. Every letter I see forces the part to reach at least its last occurrence, so I update `end`.

When my position equals `end`, no letter in this part appears later, so I can cut here. I record the size and start a new part at the next index. Cutting as early as possible gives the most parts.

Two passes: O(n) time, and O(1) space for the 26 letters."
@code
```python
def partition_labels(s):
    last = {ch: i for i, ch in enumerate(s)}     # last index of each letter
    sizes = []
    start = end = 0
    for i, ch in enumerate(s):
        end = max(end, last[ch])                 # the part must reach here
        if i == end:                             # nothing inside goes further
            sizes.append(end - start + 1)
            start = i + 1
    return sizes
```
@time O(n)
@space O(1), at most 26 letters
@test
assert partition_labels("ababcbacadefegdehijhklij") == [9, 7, 8]
assert partition_labels("eccbbbbdec") == [10]
assert partition_labels("a") == [1]
assert partition_labels("abc") == [1, 1, 1]

### [2] Best Time to Buy and Sell Stock II
@lc 122
@ask You can buy and sell many times, holding at most one share at a time. Return the maximum profit.
@eg [7,1,5,3,6,4]  ->  7   (buy 1 sell 5, buy 3 sell 6)
@tags greedy, arrays
@hook Collect every price increase from one day to the next. Any long rise is just a sum of daily rises.
@say
"Any profitable trade from day a to day b equals the sum of the day-to-day changes in between. So the best plan is to collect every positive daily change and skip every negative one.

I loop from day 1, and whenever today's price is higher than yesterday's, I add the difference. That's the same as buying at every low point and selling at every high point.

O(n) time and O(1) space."
@code
```python
def max_profit_multi(prices):
    profit = 0
    for i in range(1, len(prices)):
        if prices[i] > prices[i - 1]:
            profit += prices[i] - prices[i - 1]   # take every rise
    return profit
```
@time O(n)
@space O(1)
@follow What if each sale has a fee, or a cooldown day after selling?
Greedy no longer works. Use a small state-machine DP with two states per day: holding a share or not. That is LeetCode 714 for the fee and 309 for the cooldown.
@test
assert max_profit_multi([7, 1, 5, 3, 6, 4]) == 7
assert max_profit_multi([1, 2, 3, 4, 5]) == 4
assert max_profit_multi([7, 6, 4, 3, 1]) == 0
assert max_profit_multi([]) == 0

### [1] Assign Cookies
@lc 455
@ask Child i is happy with a cookie of size at least greed[i]. Each child gets at most one cookie. Maximize the number of happy children.
@eg greed = [1,2], cookies = [1,2,3]  ->  2
@tags greedy, sorting, two pointers
@hook Sort both. Give each cookie, smallest first, to the least greedy child it can satisfy.
@say
"I sort the children by greed and the cookies by size. Then I go through the cookies from small to large with a pointer on the least greedy unsatisfied child. If the cookie is big enough for that child, the child is happy and I move to the next child. If not, this cookie is too small for every remaining child, so I skip it.

Using the smallest cookie that works saves bigger cookies for greedier children. O(n log n plus m log m) for sorting and O(1) extra space."
@code
```python
def find_content_children(greed, cookies):
    greed.sort()
    cookies.sort()
    child = 0
    for size in cookies:                    # smallest cookies first
        if child < len(greed) and size >= greed[child]:
            child += 1                      # this child is happy
    return child
```
@time O(n log n + m log m)
@space O(1)
@test
assert find_content_children([1, 2, 3], [1, 1]) == 1
assert find_content_children([1, 2], [1, 2, 3]) == 2
assert find_content_children([], [1]) == 0
assert find_content_children([10], [1, 2]) == 0

### [2] Boats to Save People
@lc 881
@ask Each boat carries at most two people and at most limit weight. Return the fewest boats to carry everyone.
@eg people = [3,2,2,1], limit = 3  ->  3
@tags greedy, two pointers, sorting
@hook Sort. The heaviest person always leaves now. Add the lightest person to that boat if they fit together.
@say
"I sort the weights and use two pointers, one on the lightest and one on the heaviest person.

The heaviest person needs a boat no matter what. The best partner for them is the lightest person, because if even the lightest doesn't fit, nobody does. So if the two together are within the limit, both go and I move both pointers. Otherwise the heaviest goes alone. Either way I use one boat.

Sorting is O(n log n), the scan is O(n), and the extra space is O(1)."
@code
```python
def num_rescue_boats(people, limit):
    people.sort()
    light, heavy = 0, len(people) - 1
    boats = 0
    while light <= heavy:
        if people[light] + people[heavy] <= limit:
            light += 1                    # the lightest rides along
        heavy -= 1                        # the heaviest always leaves
        boats += 1
    return boats
```
@time O(n log n)
@space O(1)
@test
assert num_rescue_boats([1, 2], 3) == 1
assert num_rescue_boats([3, 2, 2, 1], 3) == 3
assert num_rescue_boats([3, 5, 3, 4], 5) == 4
assert num_rescue_boats([5], 5) == 1

### [2] Valid Parenthesis String
@lc 678
@ask The string has "(", ")" and "*". A "*" can be "(", ")" or nothing. Can the string be valid?
@eg "(*)" -> true,  "(*))" -> true,  "(((*)" -> false
@tags greedy, strings
@hook Track the lowest and highest possible number of open brackets. "*" widens the range. Fail if high drops below 0. Succeed if low can reach 0.
@say
"Trying every meaning of every star is exponential. Instead I track a range: the lowest and highest number of open brackets that could be unclosed so far.

An open bracket adds one to both. A closing bracket subtracts one from both. A star could close a bracket or open one, so low goes down by one and high goes up by one. If high ever drops below zero, there are too many closing brackets even if every star opens one, so it's invalid. Low can't go below zero, because I'd just choose a different meaning for an earlier star, so I clamp it at zero.

At the end, the string can be valid if low is zero. O(n) time and O(1) space."
@code
```python
def check_valid_string(s):
    low = high = 0             # range of possible open-bracket counts
    for ch in s:
        if ch == "(":
            low += 1
            high += 1
        elif ch == ")":
            low -= 1
            high -= 1
        else:                  # "*" can be ")", "" or "("
            low -= 1
            high += 1
        if high < 0:
            return False       # too many ")" even if every * opens
        low = max(low, 0)
    return low == 0
```
@time O(n)
@space O(1)
@test
assert check_valid_string("()")
assert check_valid_string("(*)")
assert check_valid_string("(*))")
assert not check_valid_string("(((*)")
assert not check_valid_string(")(")
assert check_valid_string("")
assert check_valid_string("*")
assert not check_valid_string("(")

### [3] Candy
@lc 135
@ask Children stand in a line with ratings. Each gets at least one candy, and a child with a higher rating than a neighbour gets more than that neighbour. Return the fewest candies in total.
@eg [1,0,2] -> 5,  [1,2,2] -> 4
@tags greedy, two passes
@hook Two passes. Left to right fixes the left-neighbour rule, right to left fixes the right-neighbour rule. Take the max at each child.
@say
"There are two rules at each child: one about the left neighbour and one about the right neighbour. I handle them separately.

Everyone starts with one candy. Going left to right, if a child's rating is higher than the left neighbour's, they get one more than that neighbour. Going right to left, if a child's rating is higher than the right neighbour's, they need at least one more than that neighbour, so I take the max of their current candies and that number. Taking the max keeps the first rule true.

Each pass gives the minimum needed for its rule, so together they give the minimum total. O(n) time and O(n) space."
@code
```python
def candy(ratings):
    n = len(ratings)
    candies = [1] * n
    for i in range(1, n):                     # rule for the left neighbour
        if ratings[i] > ratings[i - 1]:
            candies[i] = candies[i - 1] + 1
    for i in range(n - 2, -1, -1):            # rule for the right neighbour
        if ratings[i] > ratings[i + 1]:
            candies[i] = max(candies[i], candies[i + 1] + 1)
    return sum(candies)
```
@time O(n)
@space O(n)
@trap
Giving more candy to a child whose rating equals a neighbour's. Equal ratings have no rule between them, which is why [1, 2, 2] needs only 4.
@test
assert candy([1, 0, 2]) == 5
assert candy([1, 2, 2]) == 4
assert candy([1]) == 1
assert candy([]) == 0
assert candy([1, 3, 2, 2, 1]) == 7
assert candy([1, 2, 87, 87, 87, 2, 1]) == 13
