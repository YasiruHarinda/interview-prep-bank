@section twoptr | Two Pointers

### [2] Sort Colors
@lc 75
@ask An array holds only 0s, 1s and 2s. Sort it in place in one pass, without a library sort.
@eg [2,0,2,1,1,0]  ->  [0,0,1,1,2,2]
@tags two pointers, dutch national flag
@hook Dutch national flag: three pointers. 0s swap to the front, 2s swap to the back, 1s stay in the middle.
@say
"Counting the 0s, 1s and 2s and rewriting the array works in two passes. For one pass I use the Dutch national flag algorithm with three pointers.

`low` is where the next 0 goes, `high` is where the next 2 goes, and `mid` scans. If `nums[mid]` is 0, I swap it with `low` and move both forward. If it's 1, it's already in the right zone, so I just move `mid`. If it's 2, I swap it with `high` and move `high` back, but I don't move `mid`, because the value I just swapped in hasn't been checked yet.

O(n) time, O(1) space, one pass."
@code
```python
def sort_colors(nums):
    low, mid, high = 0, 0, len(nums) - 1
    while mid <= high:
        if nums[mid] == 0:
            nums[low], nums[mid] = nums[mid], nums[low]
            low += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[high] = nums[high], nums[mid]
            high -= 1          # don't move mid: the new value is unchecked
```
@time O(n)
@space O(1)
@trap
Moving `mid` forward after swapping with `high`. The value that came from the back might be a 0 or a 2 and needs checking.
@test
a = [2, 0, 2, 1, 1, 0]; sort_colors(a); assert a == [0, 0, 1, 1, 2, 2]
a = [2, 0, 1]; sort_colors(a); assert a == [0, 1, 2]
a = [0]; sort_colors(a); assert a == [0]
a = []; sort_colors(a); assert a == []
a = [2, 2, 0, 0]; sort_colors(a); assert a == [0, 0, 2, 2]

### [1] Merge Sorted Array
@lc 88
@ask nums1 has m sorted numbers followed by n empty slots. Merge the n sorted numbers of nums2 into nums1 in place.
@eg nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6]  ->  [1,2,2,3,5,6]
@tags two pointers, merging
@hook Fill nums1 from the back. The biggest remaining value goes into the last empty slot, so nothing is overwritten.
@say
"If I merged from the front, I'd overwrite numbers in nums1 that I still need. So I merge from the back, where the empty slots are.

I keep three pointers: `i` at the last real number of nums1, `j` at the last number of nums2, and `write` at the very end of nums1. At each step I copy the bigger of the two values to `write` and move that pointer back. I stop when nums2 is used up. Anything left in nums1 is already in the right place.

O(m plus n) time and O(1) extra space."
@code
```python
def merge(nums1, m, nums2, n):
    i, j, write = m - 1, n - 1, m + n - 1
    while j >= 0:
        if i >= 0 and nums1[i] > nums2[j]:
            nums1[write] = nums1[i]
            i -= 1
        else:
            nums1[write] = nums2[j]
            j -= 1
        write -= 1
```
@time O(m + n)
@space O(1)
@test
a = [1, 2, 3, 0, 0, 0]; merge(a, 3, [2, 5, 6], 3); assert a == [1, 2, 2, 3, 5, 6]
a = [1]; merge(a, 1, [], 0); assert a == [1]
a = [0]; merge(a, 0, [1], 1); assert a == [1]
a = [4, 5, 6, 0, 0, 0]; merge(a, 3, [1, 2, 3], 3); assert a == [1, 2, 3, 4, 5, 6]

### [1] Squares of a Sorted Array
@lc 977
@ask The array is sorted and may have negative numbers. Return the squares, also sorted, in O(n).
@eg [-4,-1,0,3,10]  ->  [0,1,9,16,100]
@tags two pointers, sorted array
@hook The biggest square is at one of the two ends. Compare the ends and fill the result from the back.
@say
"Squaring and then sorting is O(n log n). But in a sorted array with negatives, the largest squares are at the two ends: big negatives on the left, big positives on the right.

So I put a pointer at each end and fill the result array from the last position backwards. Each step I compare the absolute values at the two pointers, write the bigger square, and move that pointer inward.

One pass: O(n) time, O(n) for the output."
@code
```python
def sorted_squares(nums):
    n = len(nums)
    result = [0] * n
    left, right = 0, n - 1
    for write in range(n - 1, -1, -1):     # biggest square first
        if abs(nums[left]) > abs(nums[right]):
            result[write] = nums[left] ** 2
            left += 1
        else:
            result[write] = nums[right] ** 2
            right -= 1
    return result
```
@time O(n)
@space O(n) for the output
@test
assert sorted_squares([-4, -1, 0, 3, 10]) == [0, 1, 9, 16, 100]
assert sorted_squares([-7, -3, 2, 3, 11]) == [4, 9, 9, 49, 121]
assert sorted_squares([]) == []
assert sorted_squares([-1]) == [1]

### [1] Valid Palindrome II
@lc 680
@ask Can the string become a palindrome after deleting at most one character?
@eg "aba" -> true,  "abca" -> true,  "abc" -> false
@tags two pointers, strings, greedy
@hook On the first mismatch, try skipping the left character or the right one. One of the remaining parts must be a palindrome.
@say
"I use two pointers from both ends. While the characters match, I move inward.

At the first mismatch, I have exactly one delete to use, and it must be one of these two characters. So I check two options: the part without the left character, and the part without the right character. If either one is a palindrome, the answer is true.

The main scan and the one extra check are each O(n), so it's O(n) time and O(1) space."
@code
```python
def valid_palindrome(s):
    def is_pal(lo, hi):
        while lo < hi:
            if s[lo] != s[hi]:
                return False
            lo += 1
            hi -= 1
        return True

    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            # Use the one delete: skip the left or the right character.
            return is_pal(left + 1, right) or is_pal(left, right - 1)
        left += 1
        right -= 1
    return True
```
@time O(n)
@space O(1)
@trap
Only trying to skip the left character. In "cbbcc" you must skip the right one.
@test
assert valid_palindrome("aba")
assert valid_palindrome("abca")
assert not valid_palindrome("abc")
assert valid_palindrome("")
assert valid_palindrome("deeee")
assert valid_palindrome("cbbcc")
assert not valid_palindrome("abcda")

### [1] Is Subsequence
@lc 392
@ask Is s a subsequence of t? Its characters must appear in t in the same order, but not necessarily next to each other.
@eg "abc", "ahbgdc" -> true,  "axc", "ahbgdc" -> false
@tags two pointers, strings, greedy
@hook Walk through t once. Each time t's character matches the next needed character of s, move forward in s.
@say
"I keep a pointer into s for the next character I need. Then I walk through t once. Whenever the current character of t equals the character I need, I move the s pointer forward. Taking the earliest match is always safe, because it leaves the most room for the rest.

If the pointer reaches the end of s, every character was found in order. O(length of t) time and O(1) space."
@code
```python
def is_subsequence(s, t):
    i = 0
    for ch in t:
        if i < len(s) and s[i] == ch:
            i += 1
    return i == len(s)
```
@time O(len(t))
@space O(1)
@follow What if there are millions of strings s to check against the same t?
Preprocess t once: for each character, store the sorted list of its positions. For each s, binary search for the next position after the current one. That is O(len(s) log len(t)) per check.
@test
assert is_subsequence("abc", "ahbgdc")
assert not is_subsequence("axc", "ahbgdc")
assert is_subsequence("", "abc")
assert not is_subsequence("a", "")
assert is_subsequence("aaa", "aXaXa")
