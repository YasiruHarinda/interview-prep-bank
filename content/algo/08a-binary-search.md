@section bsearch | Binary Search
@blurb Halve the search space every step for O(log n). Works on sorted data, and on any yes/no question that flips only once, which is "binary search on the answer".

### [1] Pattern: which binary search templates should you know?
@tags pattern, binary search
@hook Three templates: find an exact value, find the first index where a condition becomes true, and binary search on the answer.
@say
"Binary search throws away half of the remaining options at every step, so it's O(log n). It needs one property: a yes/no question whose answer flips only once, from all 'no' to all 'yes'. A sorted array gives that, but so does a question like 'can Koko finish all the bananas at speed x?', because if speed x works, every faster speed works too.

I use three templates. **Exact match:** `lo <= hi`, return when I find the value. **First true:** a half-open range with `lo < hi`, where I set `hi = mid` when the condition is true and `lo = mid + 1` when it's false. At the end `lo` is the first true index. **Search on the answer:** the same first-true template, but over a range of possible answers instead of array indexes.

To avoid bugs, I pick one template, keep the invariant in my head, and test it on a two-element array."
@deep
```python
# 1. Exact value
lo, hi = 0, len(a) - 1
while lo <= hi:
    mid = (lo + hi) // 2
    if a[mid] == target:
        return mid
    if a[mid] < target:
        lo = mid + 1
    else:
        hi = mid - 1

# 2. First index where ok(i) is true   (False False ... True True)
lo, hi = 0, len(a)              # hi = len(a) means "none are true"
while lo < hi:
    mid = (lo + hi) // 2
    if ok(mid):
        hi = mid                # mid might be the first true
    else:
        lo = mid + 1

# 3. Binary search on the answer: the smallest value that works
lo, hi = smallest_possible, largest_possible
while lo < hi:
    mid = (lo + hi) // 2
    if works(mid):
        hi = mid
    else:
        lo = mid + 1
```
In Java, C# or C++, compute `mid = lo + (hi - lo) / 2` so `lo + hi` can't overflow.
@trap
An infinite loop with `lo = mid`. If `mid` rounds down and you set `lo = mid`, a range of two never shrinks. Either use `lo = mid + 1`, or round up with `(lo + hi + 1) // 2`.

### [1] Binary Search
@lc 704
@ask Return the index of target in a sorted array, or -1. Use O(log n) time.
@eg nums = [-1,0,3,5,9,12], target = 9  ->  4
@tags binary search
@hook Compare with the middle. Too small: search the right half. Too big: search the left half.
@say
"I keep a range from `lo` to `hi` where the target could be. I look at the middle element. If it's the target, I return its index. If it's smaller than the target, the target can only be to the right, so `lo` becomes mid plus 1. If it's bigger, `hi` becomes mid minus 1. When `lo` passes `hi`, the range is empty and the target isn't there.

Each step halves the range, so it's O(log n) time and O(1) space."
@code
```python
def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```
@time O(log n)
@space O(1)
@test
assert search([-1, 0, 3, 5, 9, 12], 9) == 4
assert search([-1, 0, 3, 5, 9, 12], 2) == -1
assert search([5], 5) == 0
assert search([], 1) == -1
assert search([1, 3], 1) == 0
assert search([1, 3], 3) == 1

### [1] Search Insert Position
@lc 35
@ask In a sorted array of distinct numbers, return the index of target, or the index where it would be inserted to keep the order.
@eg nums = [1,3,5,6], target = 2  ->  1
@tags binary search, lower bound
@hook This is "lower bound": the first index whose value is >= target.
@say
"The answer is the first position whose value is greater than or equal to the target. If the target exists, that's its index. If not, that's where it belongs.

I use the half-open template: `lo` is 0 and `hi` is the length, because the answer can be the very end. If the middle value is smaller than the target, the answer is to the right, so `lo` is mid plus 1. Otherwise mid could be the answer, so `hi` is mid. When they meet, that's the index.

O(log n) time and O(1) space. Python's `bisect_left` does exactly this."
@code
```python
def search_insert(nums, target):
    lo, hi = 0, len(nums)            # the answer can be len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo
```
@time O(log n)
@space O(1)
@test
assert search_insert([1, 3, 5, 6], 5) == 2
assert search_insert([1, 3, 5, 6], 2) == 1
assert search_insert([1, 3, 5, 6], 7) == 4
assert search_insert([1, 3, 5, 6], 0) == 0
assert search_insert([], 3) == 0

### [2] Find First and Last Position of Element in Sorted Array
@lc 34
@ask In a sorted array with duplicates, return the first and last index of target, or [-1,-1]. Use O(log n).
@eg nums = [5,7,7,8,8,10], target = 8  ->  [3,4]
@tags binary search, lower bound
@hook Two lower-bound searches: the first index >= target, and the first index >= target + 1, minus one.
@say
"A normal binary search finds some copy of the target, but then walking left and right is O(n) if there are many copies. So I run binary search twice.

I write a lower-bound helper that returns the first index with a value greater than or equal to x. The first position is the lower bound of the target. If that index is past the end or holds a different value, the target isn't there. The last position is the lower bound of target plus 1, minus 1, which is just before the first bigger value.

Two searches, so O(log n) time and O(1) space."
@code
```python
def search_range(nums, target):
    def lower_bound(x):               # first index with nums[i] >= x
        lo, hi = 0, len(nums)
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[mid] < x:
                lo = mid + 1
            else:
                hi = mid
        return lo

    first = lower_bound(target)
    if first == len(nums) or nums[first] != target:
        return [-1, -1]
    return [first, lower_bound(target + 1) - 1]
```
@time O(log n)
@space O(1)
@pro
`target + 1` works for integers. For other types, write an `upper_bound` that uses `<=` instead of `<`. Python's `bisect_left` and `bisect_right` give both.
@test
assert search_range([5, 7, 7, 8, 8, 10], 8) == [3, 4]
assert search_range([5, 7, 7, 8, 8, 10], 6) == [-1, -1]
assert search_range([], 0) == [-1, -1]
assert search_range([1], 1) == [0, 0]
assert search_range([2, 2], 2) == [0, 1]

### [1] First Bad Version
@lc 278
@ask Versions 1 to n: after the first bad version, all later ones are bad. Find the first bad one with as few calls to is_bad_version as possible.
@eg n = 5, first bad = 4  ->  4
@tags binary search, first true
@hook Good, good, bad, bad: the answer flips once, so find the first "true" with binary search.
@say
"The versions look like good, good, good, bad, bad. The question 'is it bad?' flips from false to true exactly once, so binary search finds the first true.

If the middle version is bad, the first bad one is at mid or before it, so `hi` becomes mid. If it's good, the first bad one is after it, so `lo` becomes mid plus 1. When `lo` and `hi` meet, that's the first bad version.

That's O(log n) calls to the API, about 31 calls even for two billion versions, and O(1) space."
@code
```python
def first_bad_version(n, is_bad_version):
    lo, hi = 1, n
    while lo < hi:
        mid = (lo + hi) // 2
        if is_bad_version(mid):
            hi = mid             # mid might be the first bad one
        else:
            lo = mid + 1
    return lo
```
@time O(log n)
@space O(1)
@trap
In Java or C++, `(lo + hi) / 2` overflows when n is close to 2^31. Use `lo + (hi - lo) / 2`.
@test
assert first_bad_version(5, lambda v: v >= 4) == 4
assert first_bad_version(1, lambda v: True) == 1
assert first_bad_version(2**31 - 1, lambda v: v >= 1702766719) == 1702766719
assert first_bad_version(10, lambda v: v >= 1) == 1

### [1] Sqrt(x)
@lc 69
@ask Return the square root of a non-negative integer, rounded down, without using a built-in power or sqrt function.
@eg 8 -> 2,  16 -> 4
@tags binary search, math
@hook Find the largest m with m * m <= x. Round mid up so that "lo = mid" always makes progress.
@say
"The answer is the biggest integer m whose square is at most x. Squares grow with m, so I can binary search for it between 0 and x.

If mid squared is at most x, mid is a valid answer and maybe something bigger is too, so `lo` becomes mid. If not, `hi` becomes mid minus 1. Because I'm setting `lo` to mid, I compute mid rounding up, otherwise a range of two numbers would loop forever.

O(log x) time and O(1) space. Newton's method also works and converges faster."
@code
```python
def my_sqrt(x):
    lo, hi = 0, x
    while lo < hi:
        mid = (lo + hi + 1) // 2      # round up so lo = mid makes progress
        if mid * mid <= x:
            lo = mid
        else:
            hi = mid - 1
    return lo
```
@time O(log x)
@space O(1)
@test
assert my_sqrt(4) == 2
assert my_sqrt(8) == 2
assert my_sqrt(0) == 0
assert my_sqrt(1) == 1
assert my_sqrt(15) == 3
assert my_sqrt(16) == 4
assert my_sqrt(2147395599) == 46339

### [2] Search a 2D Matrix
@lc 74
@ask Each row is sorted, and each row starts after the previous row ends. Return whether target is in the matrix, in O(log(m*n)).
@eg [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3  ->  true
@tags binary search, matrix
@hook The matrix is one sorted list in disguise. Index k is at row k // cols, column k % cols.
@say
"Because each row continues where the previous one ended, reading the matrix row by row gives one sorted list of length rows times columns.

So I binary search over the positions 0 to m times n minus 1, without copying anything. For a position k, the row is k divided by the number of columns, and the column is k modulo the number of columns. Everything else is a normal binary search.

O(log of m times n) time and O(1) space."
@code
```python
def search_matrix(matrix, target):
    if not matrix or not matrix[0]:
        return False
    rows, cols = len(matrix), len(matrix[0])
    lo, hi = 0, rows * cols - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        value = matrix[mid // cols][mid % cols]     # one sorted list
        if value == target:
            return True
        if value < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False
```
@time O(log(m * n))
@space O(1)
@follow What if each row and each column is sorted, but rows don't continue each other?
Start at the top-right corner. If the value is too big, move left. If it's too small, move down. Each step removes a row or a column: O(m + n). That is LeetCode 240.
@test
m = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
assert search_matrix(m, 3)
assert not search_matrix(m, 13)
assert search_matrix(m, 60)
assert search_matrix(m, 1)
assert not search_matrix(m, 61)
assert not search_matrix([], 1)
assert search_matrix([[1]], 1)

### [2] Find Minimum in Rotated Sorted Array
@lc 153
@ask A sorted array of unique numbers was rotated, like [3,4,5,1,2]. Find the minimum in O(log n).
@eg [4,5,6,7,0,1,2]  ->  0
@tags binary search, rotated array
@hook Compare mid with the last element. If mid is bigger, the drop (and the minimum) is to the right.
@say
"A rotated array is two sorted runs, and the minimum is where the second run starts.

I compare the middle element with the last element. If the middle is bigger than the last, the drop must be somewhere after mid, so the minimum is to the right and `lo` becomes mid plus 1. If the middle is smaller, then mid to the end is sorted, so the minimum is at mid or to its left, and `hi` becomes mid. When `lo` meets `hi`, that's the minimum.

O(log n) time and O(1) space."
@code
```python
def find_min(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1         # the drop is to the right of mid
        else:
            hi = mid             # mid could be the minimum
    return nums[lo]
```
@time O(log n)
@space O(1)
@trap
Comparing mid with the first element instead of the last. If the array isn't rotated at all, that comparison points the wrong way.
@test
assert find_min([3, 4, 5, 1, 2]) == 1
assert find_min([4, 5, 6, 7, 0, 1, 2]) == 0
assert find_min([11, 13, 15, 17]) == 11
assert find_min([1]) == 1
assert find_min([2, 1]) == 1
