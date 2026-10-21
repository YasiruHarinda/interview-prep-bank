@section bits | Bit Manipulation
@blurb Treat numbers as rows of bits. A handful of tricks give O(1) space answers, especially XOR, where equal values cancel out.

### [1] Pattern: which bit tricks should you know?
@tags pattern, bit manipulation, xor
@hook x & 1 tests odd. x & (x - 1) drops the lowest 1 bit. x & -x keeps only the lowest 1 bit. a ^ a = 0, so pairs cancel.
@say
"A few operations cover most bit questions.

`x & 1` tells me if x is odd. `x >> 1` divides by two, `x << 1` multiplies by two. `x & (x minus 1)` removes the lowest set bit, which makes counting bits and checking powers of two easy. `x & -x` keeps only the lowest set bit. To work with bit i, I use the mask `1 << i`: OR sets it, AND with the inverted mask clears it, XOR flips it.

The most useful is **XOR**: a XOR a is 0 and a XOR 0 is a, and the order doesn't matter. So XOR-ing a list where everything appears twice except one value leaves exactly that value.

One Python detail: integers have no fixed size, and negative numbers behave like an infinite row of 1s. For 32-bit problems I apply the mask 0xFFFFFFFF."
@deep
| Trick | Meaning |
|---|---|
| `x & 1` | 1 if x is odd |
| `x >> k`, `x << k` | divide or multiply by 2^k |
| `x & (x - 1)` | x with its lowest 1 bit removed |
| `x & -x` | only the lowest 1 bit of x |
| `x & ~(1 << i)` | clear bit i |
| `x ^ (1 << i)` | flip bit i |
| `(x >> i) & 1` | read bit i |
| `a ^ a == 0`, `a ^ 0 == a` | pairs cancel out |
| `x & 0xFFFFFFFF` | keep the low 32 bits (Python) |

To set bit i, use OR: `x | (1 << i)`. Bitmasks also list subsets: for `mask` from 0 to 2^n - 1, bit i says whether item i is in the subset.
@trap
Leaving out brackets. In C, Java and JavaScript, `x & 1 == 0` means `x & (1 == 0)`, because `==` binds tighter than `&`. Python does it the other way round. Write `(x & 1) == 0` so it means the same in every language.

### [1] Single Number
@lc 136
@ask Every number appears twice except one. Find it in O(n) time and O(1) extra space.
@eg [4,1,2,1,2]  ->  4
@tags bit manipulation, xor
@hook XOR everything together. Pairs cancel to 0, and only the single number is left.
@say
"A hash set or counting works but uses O(n) space. XOR solves it in O(1) space.

XOR has three useful properties: a XOR a is 0, a XOR 0 is a, and the order doesn't matter. So if I XOR all the numbers together, every pair cancels out to 0, and the result is the number that appears only once.

One pass: O(n) time and O(1) space. It works for negative numbers too."
@code
```python
def single_number(nums):
    result = 0
    for x in nums:
        result ^= x              # pairs cancel: a ^ a = 0
    return result
```
@time O(n)
@space O(1)
@test
assert single_number([2, 2, 1]) == 1
assert single_number([4, 1, 2, 1, 2]) == 4
assert single_number([1]) == 1
assert single_number([-1, -1, -2]) == -2

### [1] Number of 1 Bits
@lc 191
@ask Return how many bits are 1 in the binary form of a non-negative integer (its Hamming weight).
@eg 11 (binary 1011)  ->  3
@tags bit manipulation
@hook n & (n - 1) removes the lowest 1 bit. Count how many times you can do it before n is 0.
@say
"The simple way checks the last bit with n AND 1 and shifts right, 32 times for a 32-bit number.

Faster, n AND (n minus 1) removes exactly the lowest 1 bit: subtracting one flips the lowest 1 to 0 and the zeros below it to 1, and the AND clears all of them. So I repeat that until n is 0 and count the steps.

The loop runs once per 1 bit, so O(number of set bits), at most 32, and O(1) space. Python also has `bin(n).count('1')`, or `n.bit_count()` in Python 3.10 and later."
@code
```python
def hamming_weight(n):
    count = 0
    while n:
        n &= n - 1               # remove the lowest 1 bit
        count += 1
    return count
```
@time O(number of 1 bits)
@space O(1)
@test
assert hamming_weight(11) == 3
assert hamming_weight(128) == 1
assert hamming_weight(0) == 0
assert hamming_weight(4294967293) == 31

### [1] Counting Bits
@lc 338
@ask For every i from 0 to n, return the number of 1 bits in i.
@eg n = 5  ->  [0,1,1,2,1,2]
@tags bit manipulation, dynamic programming
@hook bits[i] = bits[i >> 1] + (i & 1). Shifting right drops the last bit, which you add back.
@say
"Counting bits separately for each number is O(n log n). With DP it's O(n).

The number i shifted right by one is i with its last bit removed, and it's smaller than i, so its answer is already known. Then I add back the last bit, i AND 1. So bits[i] equals bits[i shifted right by 1] plus i AND 1.

O(n) time, and O(n) for the output."
@code
```python
def count_bits(n):
    bits = [0] * (n + 1)
    for i in range(1, n + 1):
        bits[i] = bits[i >> 1] + (i & 1)    # i without its last bit, plus that bit
    return bits
```
@time O(n)
@space O(n) for the output
@test
assert count_bits(2) == [0, 1, 1]
assert count_bits(5) == [0, 1, 1, 2, 1, 2]
assert count_bits(0) == [0]

### [1] Reverse Bits
@lc 190
@ask Reverse the 32 bits of an unsigned integer.
@eg 43261596 (00000010100101000001111010011100)  ->  964176192 (00111001011110000010100101000000)
@tags bit manipulation
@hook 32 times: shift the result left, copy n's lowest bit into it, then shift n right.
@say
"I build the answer one bit at a time. 32 times, I shift the result left by one to make room, put n's lowest bit into it with OR, and shift n right to bring the next bit down. After 32 steps, the bit that started on the right is on the left.

O(32), which is O(1), time and space. If this function is called millions of times, I'd cache the reversed value of every byte and combine four lookups."
@code
```python
def reverse_bits(n):
    result = 0
    for _ in range(32):
        result = (result << 1) | (n & 1)     # move n's last bit onto result
        n >>= 1
    return result
```
@time O(1), always 32 steps
@space O(1)
@test
assert reverse_bits(43261596) == 964176192
assert reverse_bits(4294967293) == 3221225471
assert reverse_bits(0) == 0
assert reverse_bits(1) == 2**31

### [1] Missing Number
@lc 268
@ask An array holds n distinct numbers from 0 to n, so exactly one is missing. Find it.
@eg [3,0,1] -> 2,  [9,6,4,2,3,5,7,0,1] -> 8
@tags bit manipulation, xor, math
@hook XOR all indexes 0 to n with all values. Every number that is present cancels out, and the missing one is left.
@say
"Two neat ways. With math: the sum of 0 to n is n times n plus 1, divided by 2, so the missing number is that minus the actual sum.

With XOR: I XOR together all the indexes 0 to n and all the values. Every number that's in the array appears twice, once as an index and once as a value, so it cancels. The missing number appears only once, as an index, so it's what remains. I start with n because the indexes only go up to n minus 1.

Both are O(n) time and O(1) space. The XOR version can't overflow in languages with fixed-size integers."
@code
```python
def missing_number(nums):
    missing = len(nums)                  # the index n has no slot
    for i, x in enumerate(nums):
        missing ^= i ^ x                 # numbers that are present cancel out
    return missing
```
@time O(n)
@space O(1)
@test
assert missing_number([3, 0, 1]) == 2
assert missing_number([0, 1]) == 2
assert missing_number([9, 6, 4, 2, 3, 5, 7, 0, 1]) == 8
assert missing_number([0]) == 1
assert missing_number([1]) == 0

### [1] Power of Two
@lc 231
@ask Return true if n is a power of two.
@eg 16 -> true,  3 -> false,  0 -> false
@tags bit manipulation
@hook A power of two has exactly one 1 bit, so n & (n - 1) is 0. Check n > 0 first.
@say
"A power of two in binary is a single 1 followed by zeros, like 1000. Subtracting one gives 0111, so n AND (n minus 1) is zero. For any other positive number, more than one bit is set, and removing the lowest one still leaves something.

Zero and negative numbers aren't powers of two, so I check n is greater than 0 first. O(1) time and space."
@code
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0  # exactly one bit is set
```
@time O(1)
@space O(1)
@test
assert is_power_of_two(1)
assert is_power_of_two(16)
assert not is_power_of_two(3)
assert not is_power_of_two(0)
assert not is_power_of_two(-16)
assert is_power_of_two(2**30)

### [2] Sum of Two Integers
@lc 371
@ask Add two 32-bit integers without using + or -.
@eg a = 2, b = 3 -> 5,  a = -2, b = -3 -> -5
@tags bit manipulation, xor
@hook XOR adds without carrying. AND, shifted left, gives the carries. Repeat until there's no carry.
@say
"Binary addition has two parts. XOR adds bits without carrying: 1 plus 1 gives 0. AND finds the positions where both bits are 1, which produce a carry into the next position, so the carry is a AND b, shifted left by one.

I repeat: a becomes a XOR b, b becomes the carry, until the carry is zero. In Java or C++ that's all. In Python, integers never overflow, so a negative carry would keep going forever. I keep everything inside 32 bits with the mask 0xFFFFFFFF, and at the end, if the top bit is set, I turn the pattern back into a negative number.

At most 32 rounds, so O(1) time and space."
@code
```python
def get_sum(a, b):
    MASK = 0xFFFFFFFF                    # keep 32 bits, like an int in C
    a &= MASK
    b &= MASK
    while b:
        carry = ((a & b) << 1) & MASK    # positions where both are 1 carry left
        a = (a ^ b) & MASK               # sum without the carries
        b = carry
    return a if a <= 0x7FFFFFFF else a - (1 << 32)   # top bit set: negative
```
@time O(1), at most 32 rounds
@space O(1)
@test
assert get_sum(1, 2) == 3
assert get_sum(2, 3) == 5
assert get_sum(-1, 1) == 0
assert get_sum(-2, -3) == -5
assert get_sum(-12, -8) == -20
assert get_sum(0, 0) == 0
assert get_sum(2147483647, -1) == 2147483646

### [2] Single Number III
@lc 260
@ask Exactly two numbers appear once and every other number appears twice. Find the two, in O(n) time and O(1) space.
@eg [1,2,1,3,2,5]  ->  [3,5]
@tags bit manipulation, xor
@hook XOR of everything = a ^ b. Any 1 bit in it is a place where a and b differ. Split the numbers by that bit and XOR each group.
@say
"XOR-ing everything leaves a XOR b, because all pairs cancel. That isn't the answer yet, but it's not zero, since a and b are different. Any 1 bit in it marks a position where a and b differ.

I take the lowest such bit with x AND minus x. Then I split all numbers into two groups by whether that bit is set. a and b fall into different groups, and every pair lands together in one group. So XOR-ing each group gives a in one and b in the other.

Two passes: O(n) time and O(1) space."
@code
```python
def single_number_iii(nums):
    both = 0
    for x in nums:
        both ^= x                        # = a ^ b
    bit = both & -both                   # a bit where a and b differ
    a = b = 0
    for x in nums:
        if x & bit:                      # split by that bit
            a ^= x
        else:
            b ^= x
    return sorted([a, b])
```
@time O(n)
@space O(1)
@test
assert single_number_iii([1, 2, 1, 3, 2, 5]) == [3, 5]
assert single_number_iii([-1, 0]) == [-1, 0]
assert single_number_iii([0, 1]) == [0, 1]
