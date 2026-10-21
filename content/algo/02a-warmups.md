@section warmups | Warm-ups
@blurb Short problems that often open a phone screen. Solve them quickly and cleanly, and still say the complexity.

### [1] FizzBuzz
@lc 412
@ask For each number from 1 to n, return "Fizz" if it divides by 3, "Buzz" if it divides by 5, "FizzBuzz" if both, otherwise the number as a string.
@eg n = 5  ->  ["1","2","Fizz","4","Buzz"]
@tags loops, modulo
@hook Build the word from parts, so 15 gets "Fizz" + "Buzz" with no special case.
@say
"I loop from 1 to n. For each number I start with an empty word, add 'Fizz' if it divides by 3 and 'Buzz' if it divides by 5. If the word is still empty, I use the number itself.

Building the word from parts means I don't need a separate check for 15, and it's easy to extend: a new rule like 'Bazz' for 7 is one more line. It's O(n) time and O(n) for the output."
@code
```python
def fizz_buzz(n):
    out = []
    for i in range(1, n + 1):
        word = ""
        if i % 3 == 0:
            word += "Fizz"
        if i % 5 == 0:
            word += "Buzz"
        out.append(word or str(i))
    return out
```
@time O(n)
@space O(n) for the output
@trap
Checking `i % 3` before `i % 15` in an if/elif chain, so 15 prints "Fizz". Building the word avoids this.
@follow How would you make the rules configurable?
Keep a list of `(divisor, word)` pairs and loop over it for each number. New rules need no new code.
@test
assert fizz_buzz(5) == ["1", "2", "Fizz", "4", "Buzz"]
assert fizz_buzz(15)[-1] == "FizzBuzz"
assert fizz_buzz(1) == ["1"]
assert fizz_buzz(0) == []

### [1] Reverse a String In Place
@lc 344
@ask Reverse a list of characters in place, using O(1) extra memory.
@eg ["h","e","l","l","o"]  ->  ["o","l","l","e","h"]
@tags two pointers, strings
@hook Two pointers at both ends. Swap, move inward, stop when they meet.
@say
"I put one pointer at the start and one at the end. I swap the two characters, then move both pointers toward the middle. When they meet or cross, every character has been swapped once.

That's O(n) time and O(1) extra space. In Python, `s[::-1]` is shorter but it creates a new copy, so it uses O(n) space and doesn't reverse in place."
@code
```python
def reverse_string(s):
    left, right = 0, len(s) - 1
    while left < right:
        s[left], s[right] = s[right], s[left]
        left += 1
        right -= 1
```
@time O(n)
@space O(1)
@trap
Python strings can't be changed, which is why the input is a list of characters. Returning `s[::-1]` doesn't change the list the caller passed in.
@test
a = list("hello"); reverse_string(a); assert a == list("olleh")
a = list("ab"); reverse_string(a); assert a == ["b", "a"]
a = []; reverse_string(a); assert a == []
a = ["x"]; reverse_string(a); assert a == ["x"]

### [1] Palindrome Number
@lc 9
@ask Return true if an integer reads the same forwards and backwards. Try it without turning it into a string.
@eg 121 -> true,  -121 -> false,  10 -> false
@tags math, digits
@hook Reverse only the second half of the digits, then compare it with the first half.
@say
"The easy way is to compare the string with its reverse. Without strings, I reverse the number digit by digit using modulo 10 and integer division by 10.

To avoid overflow and save time, I only reverse half of it. I keep taking the last digit off x and adding it to `reversed_half` until `reversed_half` is at least as big as x. Then for an even number of digits they must be equal, and for an odd number I drop the middle digit with one more division by 10.

Negative numbers are never palindromes, and numbers ending in 0 are only palindromes if they are 0. It's O(log n) time, because a number has about log base 10 of n digits, and O(1) space."
@code
```python
def is_palindrome(x):
    if x < 0 or (x % 10 == 0 and x != 0):
        return False
    reversed_half = 0
    while x > reversed_half:
        reversed_half = reversed_half * 10 + x % 10
        x //= 10
    # Even length: x == reversed_half. Odd length: drop the middle digit.
    return x == reversed_half or x == reversed_half // 10
```
@time O(log n)
@space O(1)
@trap
Forgetting numbers like 10 or 100. Their reversed form starts with 0, so they can't be palindromes, and the half-reversal loop gets them wrong without the early check.
@test
assert is_palindrome(121)
assert not is_palindrome(-121)
assert not is_palindrome(10)
assert is_palindrome(0)
assert is_palindrome(1221)
assert is_palindrome(12321)
assert not is_palindrome(123)

### [2] Reverse Integer
@lc 7
@ask Reverse the digits of a 32-bit signed integer. Return 0 if the result does not fit in 32 bits.
@eg 123 -> 321,  -123 -> -321,  120 -> 21
@tags math, overflow
@hook Pop digits with % 10, push them with * 10, and check the 32-bit range.
@say
"I remember the sign and work with the absolute value. Then I repeat: take the last digit with modulo 10, append it to the result by multiplying the result by 10 and adding the digit, and remove the digit from x with integer division.

At the end I put the sign back and check the 32-bit range, minus 2 to the 31 up to 2 to the 31 minus 1. If it's outside, I return 0.

Python integers never overflow, so a final check is enough here. In Java or C# I would check before each multiply: if the result is already bigger than max divided by 10, the next step would overflow. It's O(log n) time and O(1) space."
@code
```python
def reverse(x):
    sign = -1 if x < 0 else 1
    x = abs(x)
    result = 0
    while x:
        result = result * 10 + x % 10
        x //= 10
    result *= sign
    return result if -2**31 <= result <= 2**31 - 1 else 0
```
@time O(log n), one step per digit
@space O(1)
@trap
In Python, `-123 % 10` is 7, not -3, and `//` rounds down. Working with the absolute value avoids both surprises.
@test
assert reverse(123) == 321
assert reverse(-123) == -321
assert reverse(120) == 21
assert reverse(0) == 0
assert reverse(1534236469) == 0
assert reverse(-2147483648) == 0

### [1] Fibonacci Number
@lc 509
@ask Return the nth Fibonacci number, where F(0) = 0, F(1) = 1 and F(n) = F(n-1) + F(n-2).
@eg n = 10  ->  55
@tags recursion, dynamic programming
@hook Plain recursion is O(2^n). Keep only the last two values and it becomes O(n) time and O(1) space.
@say
"The direct recursive version calls itself twice per step, so it repeats a huge amount of work and runs in O(2 to the n).

Adding memoization, a cache of results, brings it to O(n), because each value is computed once. But I only ever need the last two values, so the best version is a loop with two variables: `a` is F(i) and `b` is F(i+1). Each step moves them forward.

That's O(n) time and O(1) space. It's the simplest example of dynamic programming: overlapping subproblems that I solve once and reuse."
@code
```python
def fib(n):
    a, b = 0, 1          # F(0), F(1)
    for _ in range(n):
        a, b = b, a + b
    return a
```
@time O(n)
@space O(1)
@deep
The three versions side by side:

```python
def fib_slow(n):                  # O(2^n) time
    return n if n < 2 else fib_slow(n - 1) + fib_slow(n - 2)

from functools import cache
@cache
def fib_memo(n):                  # O(n) time, O(n) space for cache and stack
    return n if n < 2 else fib_memo(n - 1) + fib_memo(n - 2)
```
@pro
Mention that matrix exponentiation or fast doubling gives O(log n), useful when n is huge and the answer is taken modulo some number.
@test
assert fib(0) == 0
assert fib(1) == 1
assert fib(2) == 1
assert fib(10) == 55
assert fib(30) == 832040

### [2] Count Primes
@lc 204
@ask Count the prime numbers that are strictly less than n.
@eg n = 10  ->  4   (2, 3, 5, 7)
@tags math, sieve
@hook Sieve of Eratosthenes: for each prime p, cross out p*p, p*p+p, and so on. What stays is prime.
@say
"Checking each number by trial division is about O(n times the square root of n). The Sieve of Eratosthenes is much faster.

I make a list of booleans, all true, and mark 0 and 1 as not prime. Then for each number p from 2 up to the square root of n, if p is still marked prime, I cross out its multiples starting from p times p. I can start at p squared because smaller multiples like 2p and 3p were already crossed out by smaller primes. At the end I count what's still true.

That's O(n log log n) time, which is almost linear, and O(n) space."
@code
```python
def count_primes(n):
    if n < 3:
        return 0
    is_prime = [True] * n
    is_prime[0] = is_prime[1] = False
    for p in range(2, int(n ** 0.5) + 1):
        if is_prime[p]:
            for multiple in range(p * p, n, p):
                is_prime[multiple] = False
    return sum(is_prime)
```
@time O(n log log n)
@space O(n)
@follow How do you check if one number is prime?
Try dividing by 2, then by odd numbers up to the square root of n. If none divide it, it's prime. That's O(square root of n), because any factor bigger than the square root pairs with one smaller than it.
@test
assert count_primes(10) == 4
assert count_primes(0) == 0
assert count_primes(1) == 0
assert count_primes(2) == 0
assert count_primes(3) == 1
assert count_primes(100) == 25

### [1] Greatest Common Divisor and Least Common Multiple
@ask Write gcd(a, b) and lcm(a, b) for non-negative integers.
@eg gcd(12, 18) -> 6,  lcm(4, 6) -> 12
@tags math, euclid
@hook Euclid: gcd(a, b) = gcd(b, a % b) until b is 0. Then lcm = a / gcd * b.
@say
"I use Euclid's algorithm. The GCD of a and b is the same as the GCD of b and a modulo b, so I keep replacing the pair until b becomes 0. Then a is the answer. Each step shrinks the numbers fast, so it's O(log of the smaller number).

For the LCM, I use the fact that gcd times lcm equals a times b. I divide before I multiply, a divided by gcd, then times b, which keeps the numbers small and avoids overflow in other languages."
@code
```python
def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

def lcm(a, b):
    return a // gcd(a, b) * b
```
@time O(log min(a, b))
@space O(1)
@follow Greatest Common Divisor of Strings: the longest string that divides both s and t?
A divisor string exists only if `s + t == t + s`. If it does, the answer is the prefix of length `gcd(len(s), len(t))`.
@test
assert gcd(12, 18) == 6
assert gcd(17, 5) == 1
assert gcd(0, 7) == 7
assert gcd(7, 0) == 7
assert lcm(4, 6) == 12
assert lcm(21, 6) == 42

### [1] Second Largest Number
@ask Return the second largest distinct value in an array, or None if there isn't one. Do it in one pass.
@eg [3,1,4,1,5] -> 4,  [5,5,4] -> 4,  [7] -> None
@tags arrays, single pass
@hook Track the best two values as you go. A new maximum pushes the old maximum down to second place.
@say
"Sorting would work but costs O(n log n). Instead I keep two variables, `first` and `second`, and walk the array once.

If a number is bigger than `first`, the old `first` becomes `second` and the number becomes `first`. Otherwise, if it is different from `first` and bigger than `second`, it becomes the new `second`. I skip values equal to `first`, so duplicates of the maximum don't count twice.

It's O(n) time and O(1) space. I return None when every value is the same or the array has fewer than two elements."
@code
```python
def second_largest(nums):
    first = second = None
    for x in nums:
        if first is None or x > first:
            first, second = x, first
        elif x != first and (second is None or x > second):
            second = x
    return second
```
@time O(n)
@space O(1)
@trap
Starting `first` and `second` at 0 breaks on all-negative arrays. Starting with None, or negative infinity, is safe.
@test
assert second_largest([3, 1, 4, 1, 5]) == 4
assert second_largest([5, 5, 4]) == 4
assert second_largest([7]) is None
assert second_largest([2, 2]) is None
assert second_largest([-1, -2]) == -2
assert second_largest([]) is None
