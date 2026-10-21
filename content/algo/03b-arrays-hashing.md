@section hashing | Arrays and Hashing

### [2] Longest Consecutive Sequence
@lc 128
@ask Return the length of the longest run of consecutive integers in an unsorted array, in O(n) time.
@eg [100,4,200,1,3,2]  ->  4   (1, 2, 3, 4)
@tags hash set, arrays
@hook Put everything in a set. Only start counting from numbers that have no left neighbour (x - 1 missing).
@say
"Sorting would give O(n log n), but they want O(n), so I use a hash set.

I put all numbers in a set. Then for each number x, I only start counting if x minus 1 is not in the set, because that means x is the start of a run. From there I count up, x plus 1, x plus 2, while the numbers exist in the set, and I keep the longest length.

It looks like a nested loop, but each number is counted only once, inside the run it starts, so the total work is O(n). Space is O(n) for the set."
@code
```python
def longest_consecutive(nums):
    num_set = set(nums)
    best = 0
    for x in num_set:
        if x - 1 not in num_set:          # x starts a run
            length = 1
            while x + length in num_set:
                length += 1
            best = max(best, length)
    return best
```
@time O(n)
@space O(n)
@trap
Starting a count from every number, not just run starts. That makes it O(n^2) on input like 1, 2, 3, ..., n.
@test
assert longest_consecutive([100, 4, 200, 1, 3, 2]) == 4
assert longest_consecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1]) == 9
assert longest_consecutive([]) == 0
assert longest_consecutive([1, 2, 0, 1]) == 3
assert longest_consecutive([5]) == 1

### [2] Valid Sudoku
@lc 36
@ask Check whether a partly filled 9x9 Sudoku board is valid: no repeated digit in any row, column or 3x3 box. Empty cells are ".".
@eg board with two 8s in the top-left box  ->  false
@tags hash set, matrix
@hook One set per row, per column and per box. Box number = (row // 3) * 3 + col // 3.
@say
"I don't need to solve the puzzle, only check the rules. I keep 27 sets: one for each row, each column and each 3 by 3 box.

I visit every cell once. For a digit, I work out its box number with row divided by 3, times 3, plus column divided by 3. If the digit is already in that row's set, that column's set or that box's set, the board is invalid. Otherwise I add it to all three.

The board is always 81 cells, so it's O(1), or O(n squared) for an n by n board."
@code
```python
def is_valid_sudoku(board):
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    boxes = [set() for _ in range(9)]
    for r in range(9):
        for c in range(9):
            v = board[r][c]
            if v == ".":
                continue
            b = (r // 3) * 3 + c // 3
            if v in rows[r] or v in cols[c] or v in boxes[b]:
                return False
            rows[r].add(v)
            cols[c].add(v)
            boxes[b].add(v)
    return True
```
@time O(81), constant
@space O(81), constant
@test
rows = ["53..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"]
board = [list(r) for r in rows]
assert is_valid_sudoku(board)
board[0][0] = "8"
assert not is_valid_sudoku(board)
board = [list(r) for r in rows]
board[0][1] = "5"
assert not is_valid_sudoku(board)
assert is_valid_sudoku([["."] * 9 for _ in range(9)])

### [2] Encode and Decode Strings
@lc 271
@ask Design `encode` to turn a list of strings into one string, and `decode` to turn it back. The strings can contain any character.
@eg ["lint","code"]  ->  "4#lint4#code"  ->  ["lint","code"]
@tags strings, design
@hook Write each string as length + "#" + string. The length tells you exactly where it ends, so any character inside is safe.
@say
"A simple separator like a comma breaks if a string contains a comma. So I write the length first, then a marker, then the string: 'lint' becomes '4#lint'.

To decode, I read digits until the '#', which gives the length. Then I take exactly that many characters as the string and continue from right after it. Because I know the length, a '#' or digit inside the string can't confuse me.

Both functions are O(n), where n is the total number of characters."
@code
```python
def encode(strs):
    return "".join(f"{len(s)}#{s}" for s in strs)

def decode(data):
    result, i = [], 0
    while i < len(data):
        j = data.index("#", i)              # end of the length digits
        length = int(data[i:j])
        result.append(data[j + 1 : j + 1 + length])
        i = j + 1 + length
    return result
```
@time O(n)
@space O(n)
@trap
Searching for the next "#" to find where a string ends. The string itself may contain "#". Always jump by the length.
@test
for case in [["lint", "code", "love", "you"], ["", "#", "a#b", "12#3"], [], [""], ["##", "3#"]]:
    assert decode(encode(case)) == case
assert encode(["lint", "code"]) == "4#lint4#code"

### [1] Majority Element
@lc 169
@ask Return the value that appears more than n / 2 times. It always exists.
@eg [2,2,1,1,1,2,2]  ->  2
@tags voting, arrays
@hook Boyer-Moore voting: a different value cancels one vote. The majority survives because it has more than half.
@say
"A hash map of counts works in O(n) time and O(n) space. Sorting and taking the middle element works in O(n log n).

The best answer is Boyer-Moore voting, with O(1) space. I keep a candidate and a count. When the count is zero, the current number becomes the candidate. Then a matching number adds one and a different number subtracts one.

It works because each different number can cancel at most one vote of the majority, and the majority has more votes than all others together. So it is the candidate left at the end. O(n) time, O(1) space."
@code
```python
def majority_element(nums):
    candidate, count = None, 0
    for x in nums:
        if count == 0:
            candidate = x
        count += 1 if x == candidate else -1
    return candidate
```
@time O(n)
@space O(1)
@follow What if the majority might not exist?
Run a second pass to count the candidate and check it really appears more than n / 2 times.
@test
assert majority_element([3, 2, 3]) == 3
assert majority_element([2, 2, 1, 1, 1, 2, 2]) == 2
assert majority_element([1]) == 1
assert majority_element([6, 5, 5]) == 5

### [2] Rotate Array
@lc 189
@ask Rotate an array to the right by k steps, in place.
@eg [1,2,3,4,5,6,7], k = 3  ->  [5,6,7,1,2,3,4]
@tags arrays, reversal, in place
@hook Reverse the whole array, then reverse the first k items, then reverse the rest.
@say
"Rotating one step at a time is O(n times k). Copying into a new array is O(n) but uses O(n) space.

The in-place trick is three reversals. First I take k modulo n, because rotating by n changes nothing. Then I reverse the whole array, so the last k items move to the front but in reverse order. Then I reverse the first k items and the remaining n minus k items to fix their order.

Each element moves a constant number of times, so it's O(n) time and O(1) space."
@code
```python
def rotate(nums, k):
    n = len(nums)
    if n == 0:
        return
    k %= n

    def reverse(lo, hi):
        while lo < hi:
            nums[lo], nums[hi] = nums[hi], nums[lo]
            lo += 1
            hi -= 1

    reverse(0, n - 1)
    reverse(0, k - 1)
    reverse(k, n - 1)
```
@time O(n)
@space O(1)
@trap
Forgetting `k %= n`. When k is bigger than the array length, the indexes go out of range.
@test
a = [1, 2, 3, 4, 5, 6, 7]; rotate(a, 3); assert a == [5, 6, 7, 1, 2, 3, 4]
a = [-1, -100, 3, 99]; rotate(a, 2); assert a == [3, 99, -1, -100]
a = [1, 2]; rotate(a, 5); assert a == [2, 1]
a = [1]; rotate(a, 0); assert a == [1]

### [1] Isomorphic Strings
@lc 205
@ask Two strings are isomorphic if you can replace characters in s to get t, where each character always maps to the same character and no two characters map to the same one.
@eg "egg", "add" -> true,  "foo", "bar" -> false,  "badc", "baba" -> false
@tags hash map, strings
@hook Keep two maps, s to t and t to s. Both directions must stay consistent.
@say
"I walk both strings together and keep two hash maps: one from characters of s to t, and one from t back to s.

For each pair of characters, if s's character already maps to something different, it fails. And if t's character is already the target of a different s character, it also fails. That second map is the part people forget. Without it, 'ab' and 'aa' would pass, because both a and b would map to a.

It's O(n) time, and O(1) space for a fixed alphabet."
@code
```python
def is_isomorphic(s, t):
    if len(s) != len(t):
        return False
    s_to_t, t_to_s = {}, {}
    for a, b in zip(s, t):
        if s_to_t.get(a, b) != b or t_to_s.get(b, a) != a:
            return False
        s_to_t[a] = b
        t_to_s[b] = a
    return True
```
@time O(n)
@space O(1) for a fixed alphabet
@test
assert is_isomorphic("egg", "add")
assert not is_isomorphic("foo", "bar")
assert is_isomorphic("paper", "title")
assert not is_isomorphic("badc", "baba")
assert not is_isomorphic("ab", "aa")
assert is_isomorphic("", "")

### [1] Contains Duplicate II
@lc 219
@ask Return true if two equal values sit at most k positions apart.
@eg nums = [1,2,3,1], k = 3 -> true,  nums = [1,2,3,1,2,3], k = 2 -> false
@tags hash map, sliding window
@hook Remember the last index of each value. A repeat is a match if the gap is k or less.
@say
"I keep a hash map from each value to the last index where I saw it. For each position i, if the value is in the map and i minus its last index is at most k, I return true. Then I update the last index to i, because a closer copy can only help later.

That's O(n) time and O(n) space. Another way is a sliding window set holding only the last k values, which keeps memory at O(k)."
@code
```python
def contains_nearby_duplicate(nums, k):
    last_index = {}
    for i, x in enumerate(nums):
        if x in last_index and i - last_index[x] <= k:
            return True
        last_index[x] = i
    return False
```
@time O(n)
@space O(n)
@test
assert contains_nearby_duplicate([1, 2, 3, 1], 3)
assert contains_nearby_duplicate([1, 0, 1, 1], 1)
assert not contains_nearby_duplicate([1, 2, 3, 1, 2, 3], 2)
assert not contains_nearby_duplicate([], 0)

### [3] First Missing Positive
@lc 41
@ask Find the smallest positive integer that is not in an unsorted array. Use O(n) time and O(1) extra space.
@eg [3,4,-1,1] -> 2,  [1,2,0] -> 3,  [7,8,9,11,12] -> 1
@tags arrays, cyclic sort, in place
@hook The answer is between 1 and n + 1. Swap each value v into index v - 1, then find the first index that holds the wrong value.
@say
"The key insight is that the answer must be between 1 and n plus 1, because n numbers can fill at most the slots 1 to n. So I can use the array itself as the hash table.

First pass: for each position, while the value v is between 1 and n and it isn't already at its home index v minus 1, I swap it there. Values outside 1 to n are ignored. Second pass: the first index i where the value isn't i plus 1 gives the answer i plus 1. If every slot is correct, the answer is n plus 1.

Every swap puts one value in its final place, so the total is O(n) time, and O(1) extra space."
@code
```python
def first_missing_positive(nums):
    n = len(nums)
    for i in range(n):
        # Keep swapping nums[i] to its home index nums[i] - 1.
        while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
            home = nums[i] - 1
            nums[i], nums[home] = nums[home], nums[i]
    for i in range(n):
        if nums[i] != i + 1:
            return i + 1
    return n + 1
```
@time O(n)
@space O(1)
@trap
Writing `nums[i], nums[nums[i] - 1] = nums[nums[i] - 1], nums[i]` in Python. The left side is assigned in order, so `nums[i]` changes before the second index is computed. Save the home index first.
@test
assert first_missing_positive([1, 2, 0]) == 3
assert first_missing_positive([3, 4, -1, 1]) == 2
assert first_missing_positive([7, 8, 9, 11, 12]) == 1
assert first_missing_positive([]) == 1
assert first_missing_positive([1]) == 2
assert first_missing_positive([1, 1]) == 2
assert first_missing_positive([2, 1]) == 3
