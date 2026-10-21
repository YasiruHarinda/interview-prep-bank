@section twoptr | Two Pointers
@blurb Two indexes moving through the data. Use it on sorted arrays, palindromes and in-place edits to get O(n) time with O(1) space.

### [1] Pattern: how do two pointers work, and when do you use them?
@tags pattern, two pointers
@hook Each step, one pointer moves and throws away options that can't be the answer. One pass instead of a double loop.
@say
"Two pointers replace a nested loop with one pass. There are three common shapes.

**Opposite ends:** one pointer at the start, one at the end, moving toward each other. I use this on sorted arrays, like finding a pair with a target sum, and for palindromes. Each move safely throws away options: if the sum is too small, moving the left pointer right is the only way to make it bigger.

**Same direction, read and write:** a fast `read` pointer scans everything and a slow `write` pointer marks where the next kept item goes. I use this for in-place edits like removing duplicates or moving zeros.

**Fast and slow:** one pointer moves two steps, the other one step. I use this on linked lists to find the middle or detect a cycle.

All three give O(n) time and O(1) extra space."
@deep
```python
# 1. Opposite ends: sorted input, pairs, palindromes
left, right = 0, len(a) - 1
while left < right:
    total = a[left] + a[right]
    if total == target: ...
    elif total < target: left += 1      # need bigger
    else: right -= 1                     # need smaller

# 2. Same direction: in-place filtering
write = 0
for read in range(len(a)):
    if keep(a[read]):
        a[write] = a[read]
        write += 1
# a[:write] is the result

# 3. Fast and slow: linked lists
slow = fast = head
while fast and fast.next:
    slow, fast = slow.next, fast.next.next
# slow is now the middle
```
@trap
Using opposite-end pointers on unsorted data. The "move the smaller side" logic only works when the order tells you which way the sum will change. Sort first, or use a hash map.

### [1] Valid Palindrome
@lc 125
@ask After lowercasing and removing everything that is not a letter or digit, does the string read the same both ways?
@eg "A man, a plan, a canal: Panama" -> true,  "race a car" -> false
@tags two pointers, strings
@hook Pointers at both ends. Skip non-alphanumeric characters, compare lowercase, move inward.
@say
"I could build a cleaned string and compare it with its reverse, but that uses O(n) extra space. With two pointers I do it in place.

Left starts at the beginning and right at the end. If the left character isn't a letter or digit, I skip it. Same for the right. Otherwise I compare the two characters in lowercase. If they differ, it's not a palindrome. If they match, I move both inward. When the pointers meet, it's a palindrome.

O(n) time and O(1) space."
@code
```python
def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        if not s[left].isalnum():
            left += 1
        elif not s[right].isalnum():
            right -= 1
        elif s[left].lower() != s[right].lower():
            return False
        else:
            left += 1
            right -= 1
    return True
```
@time O(n)
@space O(1)
@test
assert is_palindrome("A man, a plan, a canal: Panama")
assert not is_palindrome("race a car")
assert is_palindrome(" ")
assert not is_palindrome("0P")
assert is_palindrome("ab_a")

### [2] Two Sum II: Sorted Input
@lc 167
@ask The array is sorted. Return the 1-based positions of the two numbers that add up to target, using O(1) extra space.
@eg numbers = [2,7,11,15], target = 9  ->  [1,2]
@tags two pointers, sorted array
@hook Sum too small: move left up. Sum too big: move right down. Sorted order makes every move safe.
@say
"Because the array is sorted, I don't need a hash map. I put one pointer at the smallest number and one at the largest.

If their sum equals the target, I'm done. If the sum is too small, the only way to increase it is to move the left pointer right. If it's too big, I move the right pointer left. Each move throws away a number that can't be part of any answer, so I never miss the pair.

O(n) time and O(1) space. The problem wants 1-based positions, so I add one to each index."
@code
```python
def two_sum_sorted(numbers, target):
    left, right = 0, len(numbers) - 1
    while left < right:
        total = numbers[left] + numbers[right]
        if total == target:
            return [left + 1, right + 1]      # 1-based answer
        if total < target:
            left += 1
        else:
            right -= 1
    return []
```
@time O(n)
@space O(1)
@test
assert two_sum_sorted([2, 7, 11, 15], 9) == [1, 2]
assert two_sum_sorted([2, 3, 4], 6) == [1, 3]
assert two_sum_sorted([-1, 0], -1) == [1, 2]
assert two_sum_sorted([1, 2], 10) == []

### [2] 3Sum
@lc 15
@ask Return all unique triplets in the array that add up to zero.
@eg [-1,0,1,2,-1,-4]  ->  [[-1,-1,2],[-1,0,1]]
@tags two pointers, sorting
@hook Sort. Fix one number, then run Two Sum II with two pointers on the rest. Skip equal values to avoid duplicate triplets.
@say
"Three nested loops would be O(n cubed). Instead, I sort the array first. Then I fix the first number with a loop, and look for a pair after it that sums to minus that number, using two pointers, like Two Sum on a sorted array.

The tricky part is duplicates. I skip a first number if it's the same as the one before it. And after finding a triplet, I move the left pointer past any equal values. Once the fixed number is positive, I can stop, because three positive numbers can't sum to zero.

Sorting is O(n log n), and the loop with two pointers is O(n squared), so it's O(n squared) overall."
@code
```python
def three_sum(nums):
    nums.sort()
    result = []
    for i in range(len(nums) - 2):
        if nums[i] > 0:
            break                           # three positives can't sum to 0
        if i > 0 and nums[i] == nums[i - 1]:
            continue                        # same first number as before
        left, right = i + 1, len(nums) - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                result.append([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1               # skip equal second numbers
    return result
```
@time O(n^2)
@space O(1) extra, or O(n) for the sort
@trap
Using a set of tuples to remove duplicates at the end. It works but hides the real skill they test: skipping duplicates while you scan.
@follow How would you solve 4Sum, or kSum in general?
Fix numbers with loops (or recursion) until two are left, then use two pointers. kSum costs O(n^(k-1)).
@test
assert sorted(three_sum([-1, 0, 1, 2, -1, -4])) == [[-1, -1, 2], [-1, 0, 1]]
assert three_sum([0, 1, 1]) == []
assert three_sum([0, 0, 0]) == [[0, 0, 0]]
assert three_sum([0, 0, 0, 0]) == [[0, 0, 0]]
assert three_sum([-2, 0, 1, 1, 2]) == [[-2, 0, 2], [-2, 1, 1]]

### [2] Container With Most Water
@lc 11
@ask Each number is the height of a vertical line. Pick two lines that, with the x-axis, hold the most water. Return that amount.
@eg [1,8,6,2,5,4,8,3,7]  ->  49
@tags two pointers, greedy
@hook Start with the widest pair. Always move the shorter wall, because the shorter wall limits the area.
@say
"The area is the width between two lines times the shorter of the two heights. Checking every pair is O(n squared).

I start with pointers at both ends, which gives the maximum width. I record the area. Then I move the pointer at the shorter line inward. Why? The area is limited by the shorter line. If I moved the taller line instead, the width shrinks and the height can't go above the shorter line, so the area can only get smaller. Moving the shorter one is the only move that might find something bigger.

I repeat until the pointers meet. O(n) time and O(1) space."
@code
```python
def max_area(height):
    left, right = 0, len(height) - 1
    best = 0
    while left < right:
        width = right - left
        best = max(best, width * min(height[left], height[right]))
        if height[left] < height[right]:
            left += 1          # the shorter wall limits the area
        else:
            right -= 1
    return best
```
@time O(n)
@space O(1)
@test
assert max_area([1, 8, 6, 2, 5, 4, 8, 3, 7]) == 49
assert max_area([1, 1]) == 1
assert max_area([4, 3, 2, 1, 4]) == 16
assert max_area([1, 2, 1]) == 2

### [3] Trapping Rain Water
@lc 42
@ask Given bar heights, return how much rain water is trapped between the bars.
@eg [0,1,0,2,1,0,1,3,2,1,2,1]  ->  6
@tags two pointers, arrays
@hook Water above a bar = min(tallest bar on its left, tallest bar on its right) - its height. Two pointers work out the smaller side as they go.
@say
"For each bar, the water above it is the smaller of the tallest bar to its left and the tallest bar to its right, minus its own height.

A simple O(n) version stores the left maximums and right maximums in two arrays. I can do it in O(1) space with two pointers. I keep `left_max` and `right_max`. If the left bar is lower than the right bar, then the water at the left is limited by `left_max`, because I know there's something at least as tall on the right. So I update `left_max`, add `left_max` minus the height, and move left. Otherwise I do the same on the right side.

O(n) time and O(1) space."
@code
```python
def trap(height):
    left, right = 0, len(height) - 1
    left_max = right_max = 0
    water = 0
    while left < right:
        if height[left] < height[right]:
            left_max = max(left_max, height[left])
            water += left_max - height[left]
            left += 1
        else:
            right_max = max(right_max, height[right])
            water += right_max - height[right]
            right -= 1
    return water
```
@time O(n)
@space O(1)
@deep
The prefix and suffix maximum version is easier to explain first, then improve:

```python
def trap_arrays(height):
    n = len(height)
    if n == 0:
        return 0
    left_max, right_max = [0] * n, [0] * n
    left_max[0], right_max[-1] = height[0], height[-1]
    for i in range(1, n):
        left_max[i] = max(left_max[i - 1], height[i])
    for i in range(n - 2, -1, -1):
        right_max[i] = max(right_max[i + 1], height[i])
    return sum(min(left_max[i], right_max[i]) - height[i] for i in range(n))
```
A monotonic stack also works: it adds water layer by layer when a taller bar closes a dip.
@test
assert trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) == 6
assert trap([4, 2, 0, 3, 2, 5]) == 9
assert trap([]) == 0
assert trap([3]) == 0
assert trap([2, 0, 2]) == 2
