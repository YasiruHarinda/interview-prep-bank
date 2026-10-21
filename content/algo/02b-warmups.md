@section warmups | Warm-ups

### [1] Move Zeroes
@lc 283
@ask Move all zeros in an array to the end, in place, keeping the order of the other numbers.
@eg [0,1,0,3,12]  ->  [1,3,12,0,0]
@tags two pointers, in place
@hook A read pointer scans everything. A write pointer marks where the next non-zero goes. Swap them.
@say
"I use two pointers. `read` walks through every element. `write` points to where the next non-zero number should go.

Whenever `read` finds a non-zero number, I swap it into position `write` and move `write` forward. Non-zero numbers keep their order because I place them left to right, and the zeros naturally end up at the back.

It's one pass, O(n) time and O(1) space."
@code
```python
def move_zeroes(nums):
    write = 0
    for read in range(len(nums)):
        if nums[read] != 0:
            nums[write], nums[read] = nums[read], nums[write]
            write += 1
```
@time O(n)
@space O(1)
@test
a = [0, 1, 0, 3, 12]; move_zeroes(a); assert a == [1, 3, 12, 0, 0]
a = [0]; move_zeroes(a); assert a == [0]
a = [1, 2]; move_zeroes(a); assert a == [1, 2]
a = [0, 0, 1]; move_zeroes(a); assert a == [1, 0, 0]

### [1] Remove Duplicates from Sorted Array
@lc 26
@ask A sorted array has duplicates. Remove them in place so each value appears once, and return the new length k.
@eg [0,0,1,1,1,2,2,3,3,4]  ->  5, and the first 5 items are [0,1,2,3,4]
@tags two pointers, in place
@hook Sorted means duplicates sit next to each other. Copy a value forward only when it differs from the last kept one.
@say
"Because the array is sorted, equal values are next to each other. I keep a `write` pointer for where the next unique value goes, starting at 1 because the first value is always kept.

Then `read` walks from index 1. If `nums[read]` is different from the last value I kept, `nums[write - 1]`, I copy it to `write` and move `write` forward. At the end, `write` is the number of unique values.

One pass, O(n) time, O(1) space."
@code
```python
def remove_duplicates(nums):
    if not nums:
        return 0
    write = 1
    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:
            nums[write] = nums[read]
            write += 1
    return write
```
@time O(n)
@space O(1)
@follow What if each value may appear at most twice?
Compare with `nums[write - 2]` instead of `nums[write - 1]`, and start `write` at 2. The same idea works for "at most k".
@test
a = [1, 1, 2]; k = remove_duplicates(a); assert k == 2 and a[:k] == [1, 2]
a = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]; k = remove_duplicates(a); assert k == 5 and a[:k] == [0, 1, 2, 3, 4]
assert remove_duplicates([]) == 0
assert remove_duplicates([1]) == 1

### [1] Plus One
@lc 66
@ask A number is stored as a list of digits, most significant first. Add one to it.
@eg [1,2,9]  ->  [1,3,0],   [9,9]  ->  [1,0,0]
@tags arrays, carry
@hook Walk from the right. A 9 becomes 0 and carries. Anything else just goes up by one and you stop.
@say
"I go from the last digit to the first. If the digit is less than 9, I add one and return straight away, because there is no carry. If it's a 9, it becomes 0 and the carry moves to the next digit on the left.

If I get through the whole list, every digit was a 9, like 999. Then the answer is a 1 followed by all zeros, so I put a 1 at the front.

It's O(n) in the worst case and O(1) extra space, except for the new list in the all-nines case."
@code
```python
def plus_one(digits):
    for i in range(len(digits) - 1, -1, -1):
        if digits[i] < 9:
            digits[i] += 1
            return digits
        digits[i] = 0
    return [1] + digits
```
@time O(n)
@space O(1), or O(n) when every digit is 9
@test
assert plus_one([1, 2, 3]) == [1, 2, 4]
assert plus_one([1, 2, 9]) == [1, 3, 0]
assert plus_one([9]) == [1, 0]
assert plus_one([9, 9]) == [1, 0, 0]
assert plus_one([0]) == [1]

### [1] First Unique Character in a String
@lc 387
@ask Return the index of the first character that appears only once in a string, or -1.
@eg "leetcode" -> 0,  "loveleetcode" -> 2,  "aabb" -> -1
@tags hash map, counting
@hook Two passes: count every character, then return the first one with count 1.
@say
"I do two passes. First I count how many times each character appears, using a hash map or Counter. Then I go through the string again, in order, and return the index of the first character whose count is 1. If none has count 1, I return -1.

It's O(n) time. The space is O(1) if the input is only lowercase letters, because the map holds at most 26 keys. In general it's O(k), where k is the number of different characters."
@code
```python
from collections import Counter

def first_uniq_char(s):
    counts = Counter(s)
    for i, ch in enumerate(s):
        if counts[ch] == 1:
            return i
    return -1
```
@time O(n)
@space O(1), at most 26 letters
@test
assert first_uniq_char("leetcode") == 0
assert first_uniq_char("loveleetcode") == 2
assert first_uniq_char("aabb") == -1
assert first_uniq_char("") == -1
assert first_uniq_char("z") == 0

### [1] Roman to Integer
@lc 13
@ask Convert a Roman numeral like "MCMXCIV" to an integer.
@eg "LVIII" -> 58,  "MCMXCIV" -> 1994
@tags strings, hash map
@hook Add each symbol's value, but subtract it when a bigger symbol comes right after it (IV, IX, XL...).
@say
"I map each symbol to its value: I is 1, V is 5, up to M at 1000. Normally Roman numerals go from big to small, so I just add the values.

The exception is subtraction pairs like IV for 4 or CM for 900. These happen exactly when a smaller value comes before a bigger one. So for each symbol, I look at the next one: if the next value is bigger, I subtract the current value, otherwise I add it.

One pass, O(n) time and O(1) space."
@code
```python
def roman_to_int(s):
    values = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    total = 0
    for i, ch in enumerate(s):
        if i + 1 < len(s) and values[ch] < values[s[i + 1]]:
            total -= values[ch]      # IV, IX, XL, XC, CD, CM
        else:
            total += values[ch]
    return total
```
@time O(n)
@space O(1)
@follow How would you convert an integer to Roman?
Greedy with a table that includes the subtraction pairs: 1000 M, 900 CM, 500 D, 400 CD, and so on down to 1 I. Take the biggest value that fits, append its symbol and repeat.
@test
assert roman_to_int("III") == 3
assert roman_to_int("IV") == 4
assert roman_to_int("IX") == 9
assert roman_to_int("LVIII") == 58
assert roman_to_int("MCMXCIV") == 1994

### [1] Pascal's Triangle
@lc 118
@ask Return the first n rows of Pascal's triangle. Each number is the sum of the two numbers above it.
@eg n = 5  ->  [[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]
@tags arrays, simulation
@hook Each row starts and ends with 1. Every inside value is the two values above it added together.
@say
"I build the rows one by one. Row r has r plus 1 numbers. I start each row as all ones, because the first and last values are always 1. Then for each inside position c, the value is the previous row's value at c minus 1 plus the value at c.

The total work is the number of values in the triangle, about n squared over 2, so O(n squared) time, and the output itself is O(n squared) space."
@code
```python
def generate(num_rows):
    rows = []
    for r in range(num_rows):
        row = [1] * (r + 1)
        for c in range(1, r):
            row[c] = rows[r - 1][c - 1] + rows[r - 1][c]
        rows.append(row)
    return rows
```
@time O(n^2)
@space O(n^2) for the output
@test
assert generate(5) == [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]]
assert generate(1) == [[1]]
assert generate(0) == []

### [1] Add Binary
@lc 67
@ask Add two binary numbers given as strings and return the sum as a binary string.
@eg "1010" + "1011"  ->  "10101"
@tags strings, carry, math
@hook Add from the right like school addition. Digit = total % 2, carry = total // 2.
@say
"I add the numbers the way we do it on paper, from the rightmost digit. I keep a pointer at the end of each string and a carry.

In each step, the total is the carry plus the current digit of each string, if that string still has digits. The result digit is total modulo 2, and the new carry is total divided by 2. I keep going while either string has digits or there is still a carry. I collect the digits in a list and reverse it at the end, because joining a list is faster than adding to the front of a string.

It's O(max of the two lengths) time and space."
@code
```python
def add_binary(a, b):
    i, j, carry = len(a) - 1, len(b) - 1, 0
    digits = []
    while i >= 0 or j >= 0 or carry:
        total = carry
        if i >= 0:
            total += int(a[i])
            i -= 1
        if j >= 0:
            total += int(b[j])
            j -= 1
        digits.append(str(total % 2))
        carry = total // 2
    return "".join(reversed(digits))
```
@time O(max(m, n))
@space O(max(m, n))
@trap
Forgetting the final carry. "1" + "1" must give "10", not "0". Keeping `carry` in the loop condition handles it.
@test
assert add_binary("11", "1") == "100"
assert add_binary("1010", "1011") == "10101"
assert add_binary("0", "0") == "0"
assert add_binary("1", "111") == "1000"
assert add_binary("1", "1") == "10"

### [1] Longest Common Prefix
@lc 14
@ask Find the longest prefix shared by all strings in a list.
@eg ["flower","flow","flight"]  ->  "fl"
@tags strings
@hook Compare column by column. Stop at the first position where any word is too short or has a different character.
@say
"I scan column by column. For each position i in the first word, I check that every other word has the same character at position i. As soon as one word is too short or has a different character, the prefix ends at i, so I return the first word up to i. If I get through the whole first word, the whole first word is the prefix.

This is O(S) time, where S is the total number of characters, because I never look past the shortest match. Extra space is O(1)."
@code
```python
def longest_common_prefix(strs):
    if not strs:
        return ""
    for i, ch in enumerate(strs[0]):
        for word in strs[1:]:
            if i == len(word) or word[i] != ch:
                return strs[0][:i]
    return strs[0]
```
@time O(S), S = total characters
@space O(1)
@pro
Sorting the list and comparing only the first and last words also works, because they are the most different. It's O(S log n) but shows good insight.
@test
assert longest_common_prefix(["flower", "flow", "flight"]) == "fl"
assert longest_common_prefix(["dog", "racecar", "car"]) == ""
assert longest_common_prefix(["a"]) == "a"
assert longest_common_prefix([]) == ""
assert longest_common_prefix(["ab", "a"]) == "a"
assert longest_common_prefix(["", ""]) == ""
