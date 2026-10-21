@section math | Math and Matrices
@blurb Matrix walks and rotations, fast power, digit tricks and fair shuffling. Short code, but every one has an edge case to name.

### [2] Rotate Image
@lc 48
@ask Rotate an n x n matrix 90 degrees clockwise, in place.
@eg [[1,2,3],[4,5,6],[7,8,9]]  ->  [[7,4,1],[8,5,2],[9,6,3]]
@tags matrix, in place
@hook Transpose (swap across the main diagonal), then reverse every row. That's a clockwise turn.
@say
"Copying into a new matrix is easy but uses O(n squared) space, and they want it in place.

The trick is two simple steps. First I transpose: swap matrix[i][j] with matrix[j][i] for every cell above the diagonal, so rows become columns. Then I reverse each row. Together that's exactly a 90-degree clockwise rotation. For counter-clockwise, I'd reverse the rows first, or reverse each column instead.

O(n squared) time, since every cell moves a constant number of times, and O(1) extra space."
@code
```python
def rotate_image(matrix):
    n = len(matrix)
    for i in range(n):                       # 1. transpose
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:                       # 2. reverse every row
        row.reverse()
```
@time O(n^2)
@space O(1)
@trap
Looping j over the whole row while transposing. Every pair gets swapped twice, which puts it back where it started. Start j at i + 1.
@test
m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]; rotate_image(m); assert m == [[7, 4, 1], [8, 5, 2], [9, 6, 3]]
m = [[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]]; rotate_image(m)
assert m == [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]]
m = [[1]]; rotate_image(m); assert m == [[1]]

### [2] Spiral Matrix
@lc 54
@ask Return all elements of an m x n matrix in clockwise spiral order.
@eg [[1,2,3],[4,5,6],[7,8,9]]  ->  [1,2,3,6,9,8,7,4,5]
@tags matrix, simulation
@hook Keep four borders: top, bottom, left, right. Walk one side, then move that border inward. Re-check before the bottom and left walks.
@say
"I keep four boundaries: the top row, bottom row, left column and right column that haven't been visited yet.

In each lap I walk the top row left to right and move top down. I walk the right column top to bottom and move right in. Then, only if a row is still left, I walk the bottom row right to left and move bottom up. And only if a column is still left, I walk the left column bottom to top and move left in. Those two checks stop a single remaining row or column from being added twice.

Every element is visited once: O(m times n) time and O(1) extra space besides the output."
@code
```python
def spiral_order(matrix):
    if not matrix:
        return []
    result = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):         # top row, left to right
            result.append(matrix[top][c])
        top += 1
        for r in range(top, bottom + 1):         # right column, downwards
            result.append(matrix[r][right])
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1): # bottom row, right to left
                result.append(matrix[bottom][c])
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1): # left column, upwards
                result.append(matrix[r][left])
            left += 1
    return result
```
@time O(m * n)
@space O(1) besides the output
@test
assert spiral_order([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) == [1, 2, 3, 6, 9, 8, 7, 4, 5]
assert spiral_order([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]) == [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
assert spiral_order([[1], [2], [3]]) == [1, 2, 3]
assert spiral_order([[1, 2, 3]]) == [1, 2, 3]
assert spiral_order([]) == []

### [2] Set Matrix Zeroes
@lc 73
@ask If a cell is 0, set its whole row and column to 0. Do it in place, ideally with O(1) extra space.
@eg [[1,1,1],[1,0,1],[1,1,1]]  ->  [[1,0,1],[0,0,0],[1,0,1]]
@tags matrix, in place
@hook Use the first row and first column as marker arrays. Remember separately whether they had a zero themselves.
@say
"I can't zero things while scanning, or new zeros would spread wrongly. Two marker sets, for rows and columns, work in O(m plus n) space.

For O(1) space, I use the matrix's own first row and first column as the markers. First I note whether the first row and first column contain a zero themselves. Then, for every other cell that is zero, I mark its row in column 0 and its column in row 0. Next I zero every inner cell whose row or column is marked. Finally I zero the first row and first column if they originally had a zero.

O(m times n) time and O(1) extra space."
@code
```python
def set_zeroes(matrix):
    rows, cols = len(matrix), len(matrix[0])
    first_row_zero = any(matrix[0][c] == 0 for c in range(cols))
    first_col_zero = any(matrix[r][0] == 0 for r in range(rows))
    for r in range(1, rows):                 # row 0 and column 0 become markers
        for c in range(1, cols):
            if matrix[r][c] == 0:
                matrix[r][0] = 0
                matrix[0][c] = 0
    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][0] == 0 or matrix[0][c] == 0:
                matrix[r][c] = 0
    if first_row_zero:
        for c in range(cols):
            matrix[0][c] = 0
    if first_col_zero:
        for r in range(rows):
            matrix[r][0] = 0
```
@time O(m * n)
@space O(1)
@test
m = [[1, 1, 1], [1, 0, 1], [1, 1, 1]]; set_zeroes(m); assert m == [[1, 0, 1], [0, 0, 0], [1, 0, 1]]
m = [[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]]; set_zeroes(m); assert m == [[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]]
m = [[1]]; set_zeroes(m); assert m == [[1]]
m = [[1, 0]]; set_zeroes(m); assert m == [[0, 0]]

### [2] Game of Life
@lc 289
@ask Compute the next state of Conway's Game of Life in place. A live cell with 2 or 3 live neighbours lives, a dead cell with exactly 3 becomes alive, and every other cell dies or stays dead.
@eg [[0,1,0],[0,0,1],[1,1,1],[0,0,0]]  ->  [[0,0,0],[1,0,1],[0,1,1],[0,1,0]]
@tags matrix, simulation, in place
@hook All cells change at the same moment, so store the change in extra states: 2 = alive to dead, 3 = dead to alive. Decode at the end.
@say
"Every cell must update using the old board, so if I overwrite a cell too early, its neighbours see the new value.

Instead of a copy, I encode both states in each cell. 2 means 'was alive, will be dead' and 3 means 'was dead, will be alive'. When counting live neighbours, I count cells that are 1 or 2, because those were alive at the start. After all cells are marked, a second pass turns 1 and 3 into 1, and everything else into 0.

O(m times n) time and O(1) extra space."
@code
```python
def game_of_life(board):
    rows, cols = len(board), len(board[0])
    for r in range(rows):
        for c in range(cols):
            live = 0
            for dr in (-1, 0, 1):
                for dc in (-1, 0, 1):
                    nr, nc = r + dr, c + dc
                    if (dr or dc) and 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] in (1, 2):
                        live += 1                # 1 and 2 were alive at the start
            if board[r][c] == 1 and (live < 2 or live > 3):
                board[r][c] = 2                  # alive -> dead
            elif board[r][c] == 0 and live == 3:
                board[r][c] = 3                  # dead -> alive
    for r in range(rows):
        for c in range(cols):
            board[r][c] = 1 if board[r][c] in (1, 3) else 0
```
@time O(m * n)
@space O(1)
@test
b = [[0, 1, 0], [0, 0, 1], [1, 1, 1], [0, 0, 0]]; game_of_life(b)
assert b == [[0, 0, 0], [1, 0, 1], [0, 1, 1], [0, 1, 0]]
b = [[1, 1], [1, 0]]; game_of_life(b); assert b == [[1, 1], [1, 1]]

### [2] Pow(x, n)
@lc 50
@ask Compute x to the power n, where n can be negative, faster than multiplying n times.
@eg x = 2, n = 10 -> 1024,  x = 2, n = -2 -> 0.25
@tags math, fast exponentiation, bit manipulation
@hook Fast exponentiation: square x at every step and multiply it into the answer when the current bit of n is 1. O(log n).
@say
"Multiplying n times is O(n), which is too slow for n around two billion.

Fast exponentiation uses the binary form of n. For example x to the 13 is x to the 8 times x to the 4 times x to the 1, because 13 is 1101 in binary. I keep squaring x, giving x, x squared, x to the 4, x to the 8, and when the current lowest bit of n is 1, I multiply that power into the result. Then I shift n right.

For a negative n, I use 1 over x and make n positive. O(log n) time and O(1) space."
@code
```python
def my_pow(x, n):
    if n < 0:
        x, n = 1 / x, -n
    result = 1.0
    while n:
        if n & 1:                # this bit of n is set
            result *= x
        x *= x                   # x, x^2, x^4, x^8, ...
        n >>= 1
    return result
```
@time O(log n)
@space O(1)
@trap
In Java or C++, `n = -n` overflows when n is the smallest int (-2^31). Store n in a 64-bit long first.
@test
assert abs(my_pow(2.0, 10) - 1024.0) < 1e-9
assert abs(my_pow(2.1, 3) - 9.261) < 1e-9
assert abs(my_pow(2.0, -2) - 0.25) < 1e-12
assert my_pow(5, 0) == 1.0
assert abs(my_pow(1.00001, 123456) - 1.00001 ** 123456) < 1e-6

### [1] Happy Number
@lc 202
@ask Repeatedly replace a number by the sum of the squares of its digits. It's happy if this reaches 1. Otherwise it loops forever.
@eg 19 -> true (1 + 81 = 82, 64 + 4 = 68, 36 + 64 = 100, 1),  2 -> false
@tags math, fast and slow pointers, cycle detection
@hook The sequence either reaches 1 or enters a loop. Detect the loop with a set, or with Floyd's fast and slow pointers.
@say
"The sequence of numbers can only go two ways: it reaches 1 and stays there, or it falls into a cycle that never includes 1. It can't grow forever, because a big number's digit-square sum is much smaller than the number.

So it's cycle detection. A set of seen numbers works. For O(1) space I use Floyd's algorithm: slow takes one step and fast takes two. If fast reaches 1, the number is happy. If slow and fast meet anywhere else, it's a cycle and the number isn't happy.

Each step is O(number of digits), and the number of steps is small, so it's about O(log n) time and O(1) space."
@code
```python
def is_happy(n):
    def next_number(x):
        return sum(int(d) ** 2 for d in str(x))

    slow, fast = n, next_number(n)
    while fast != 1 and slow != fast:        # stop at 1, or when a loop is found
        slow = next_number(slow)
        fast = next_number(next_number(fast))
    return fast == 1
```
@time O(log n)
@space O(1)
@test
assert is_happy(19)
assert not is_happy(2)
assert is_happy(1)
assert is_happy(7)
assert not is_happy(4)

### [2] Multiply Strings
@lc 43
@ask Multiply two non-negative integers given as strings, without converting them to integers directly.
@eg "123" * "456"  ->  "56088"
@tags math, strings, simulation
@hook Grade-school multiplication: digit i times digit j lands in position i + j + 1 of a result array, with its carry going to i + j.
@say
"I do long multiplication like on paper. The result has at most m plus n digits, so I make an array of that size.

For each pair of digits, num1[i] and num2[j], counting from the right, the product belongs at position i plus j plus 1. I add it to what's already there, keep the last digit in that position, and add the carry to position i plus j. Processing from right to left means every carry is handled by a later step.

At the end I join the digits and remove leading zeros. If either number is '0', the answer is '0'. O(m times n) time and O(m plus n) space."
@code
```python
def multiply(num1, num2):
    if num1 == "0" or num2 == "0":
        return "0"
    result = [0] * (len(num1) + len(num2))
    for i in range(len(num1) - 1, -1, -1):
        for j in range(len(num2) - 1, -1, -1):
            total = int(num1[i]) * int(num2[j]) + result[i + j + 1]
            result[i + j + 1] = total % 10       # this digit
            result[i + j] += total // 10         # carry to the left
    return "".join(map(str, result)).lstrip("0")
```
@time O(m * n)
@space O(m + n)
@test
assert multiply("2", "3") == "6"
assert multiply("123", "456") == "56088"
assert multiply("0", "52") == "0"
assert multiply("999", "999") == "998001"
assert multiply("9", "9") == "81"

### [1] Excel Sheet Column Number and Title
@lc 171 / 168
@ask Convert an Excel column title like "AB" to its number (28), and back again.
@eg "A" -> 1, "Z" -> 26, "AA" -> 27, "ZY" -> 701
@tags math, base conversion, strings
@hook It's base 26 with digits 1 to 26 and no zero. Going back, subtract 1 before each % 26 so that Z works.
@say
"Title to number is a base 26 conversion: for each letter, multiply the running number by 26 and add the letter's value, where A is 1 and Z is 26.

Number to title is trickier, because there's no zero digit. A normal base conversion would turn 26 into 'A' and a zero, which doesn't exist. The fix is to subtract 1 before taking the remainder, which maps the values 1 to 26 onto 0 to 25, so A to Z. Then I divide by 26 and repeat, and reverse the letters at the end.

Both are O(log n) time and space."
@code
```python
def title_to_number(title):
    number = 0
    for ch in title:
        number = number * 26 + (ord(ch) - ord("A") + 1)   # A = 1 ... Z = 26
    return number

def convert_to_title(n):
    letters = []
    while n:
        n -= 1                           # shift to 0-25 so Z works
        letters.append(chr(ord("A") + n % 26))
        n //= 26
    return "".join(reversed(letters))
```
@time O(log n)
@space O(log n)
@test
assert title_to_number("A") == 1
assert title_to_number("AB") == 28
assert title_to_number("ZY") == 701
assert title_to_number("FXSHRXW") == 2147483647
assert convert_to_title(1) == "A"
assert convert_to_title(26) == "Z"
assert convert_to_title(28) == "AB"
assert convert_to_title(52) == "AZ"
assert convert_to_title(701) == "ZY"
assert all(title_to_number(convert_to_title(i)) == i for i in range(1, 1000))

### [2] Shuffle an Array
@lc 384
@ask Build a class that returns a uniformly random shuffle of an array, where every order is equally likely, and can reset to the original.
@eg Shuffler([1,2,3]).shuffle()  ->  any of the 6 orders, each with probability 1/6
@tags math, randomness, fisher-yates
@hook Fisher-Yates: from the last index down, swap each position with a random index from 0 up to itself.
@say
"Fisher-Yates gives every order exactly the same chance. I go from the last index down to the first. At position i, I pick a random index j from 0 to i, including i itself, and swap them. Then position i is final and I never touch it again.

Why it's fair: the last position gets each element with probability 1 over n, the next with 1 over n minus 1 among the rest, and so on, which gives each of the n factorial orders probability 1 over n factorial. I shuffle a copy, so reset just returns the original.

O(n) per shuffle and O(n) space."
@code
```python
import random

class Shuffler:
    def __init__(self, nums):
        self.original = nums[:]

    def reset(self):
        return self.original[:]

    def shuffle(self):
        a = self.original[:]
        for i in range(len(a) - 1, 0, -1):
            j = random.randint(0, i)        # from the part not fixed yet
            a[i], a[j] = a[j], a[i]
        return a
```
@time O(n)
@space O(n)
@trap
Picking j from the whole array at every step, `randint(0, n - 1)`. That gives n^n equally likely runs, which can't split evenly over n! orders, so some orders come up more often.
@follow How do you pick a random item from a stream when you don't know its length?
Reservoir sampling: keep the first item, then replace the kept item with the i-th item with probability 1/i. Every item ends up kept with probability 1/n. That is LeetCode 382.
@test
import random
from collections import Counter
random.seed(7)
s = Shuffler([1, 2, 3])
assert sorted(s.shuffle()) == [1, 2, 3]
assert s.reset() == [1, 2, 3]
counts = Counter(tuple(s.shuffle()) for _ in range(6000))
assert len(counts) == 6 and min(counts.values()) > 850 and max(counts.values()) < 1150
assert Shuffler([]).shuffle() == []
