@section strings | Strings
@blurb Parsing, building and searching text. Many string problems are really hash map, two pointer or sliding window problems, so this section covers the ones that are about the text itself.

### [1] Pattern: what should you remember for string problems?
@tags pattern, strings
@hook Strings are immutable in Python: build a list and join it once. Use ord/chr for letter maths, and ask about case, spaces, Unicode and empty input.
@say
"First, the basics. Python strings can't be changed, so adding characters one by one in a loop can be O(n squared). I collect pieces in a list and call `''.join` once at the end. For letter maths, `ord(ch) - ord('a')` gives 0 to 25, which is perfect for a count array of 26.

Then I recognise the pattern behind the string: comparing from both ends is **two pointers**, the longest or shortest substring is a **sliding window**, anagrams and counts are a **hash map**, brackets and nesting are a **stack**, comparing two strings is often **DP**, and searching for a word inside text is **KMP** or a **rolling hash**.

I always clarify: upper and lower case, spaces and punctuation, only ASCII or any Unicode, and what to return for an empty string."
@deep
```python
s = "Hello, World"
s.lower(), s.isalnum(), s.split(), s[::-1]
ord("c") - ord("a")                    # 2
chr(ord("a") + 2)                      # "c"
counts = [0] * 26
for ch in "banana":
    counts[ord(ch) - ord("a")] += 1

parts = []                             # build strings with a list
for word in ["a", "b", "c"]:
    parts.append(word.upper())
result = "-".join(parts)               # "A-B-C"
```
| Problem type | Usual technique |
|---|---|
| Palindromes | Two pointers, expand around center |
| Longest or shortest substring with a rule | Sliding window |
| Anagrams, counts | Hash map or array of 26 |
| Brackets, nested encoding | Stack |
| Compare or align two strings | DP (LCS, edit distance) |
| Find a pattern in text | KMP, rolling hash (Rabin-Karp) |
| Many prefixes | Trie |
@trap
Building a string with `+=` inside a loop. Each `+=` may copy the whole string, so a long loop becomes O(n^2).

### [2] String to Integer (atoi)
@lc 8
@ask Parse a string into a 32-bit integer: skip leading spaces, read an optional sign, read digits until a non-digit, and clamp the result to the 32-bit range.
@eg "   -42" -> -42,  "4193 with words" -> 4193,  "words 987" -> 0,  "-91283472332" -> -2147483648
@tags strings, parsing, overflow
@hook Four steps in order: skip spaces, read the sign, read digits, clamp. Stop at the first character that doesn't fit.
@say
"This question is about handling every edge case calmly, so I go step by step with one index.

First I skip leading spaces. Then, if there's a plus or minus, I record the sign and move on. Then I read digits one by one, building the number with result times 10 plus the digit, and stop at the first non-digit. As soon as the number goes past 2 to the 31 minus 1, I can return the clamped value, because more digits only make it bigger. Finally I apply the sign.

O(n) time and O(1) space. In Java or C#, I'd check for overflow before multiplying, since the number itself would overflow."
@code
```python
def my_atoi(s):
    INT_MAX, INT_MIN = 2**31 - 1, -2**31
    i, n = 0, len(s)
    while i < n and s[i] == " ":           # 1. skip leading spaces
        i += 1
    sign = 1
    if i < n and s[i] in "+-":             # 2. optional sign
        sign = -1 if s[i] == "-" else 1
        i += 1
    result = 0
    while i < n and "0" <= s[i] <= "9":    # 3. read the digits
        result = result * 10 + int(s[i])
        if result > INT_MAX:               # 4. clamp
            return INT_MAX if sign == 1 else INT_MIN
        i += 1
    return sign * result
```
@time O(n)
@space O(1)
@test
assert my_atoi("42") == 42
assert my_atoi("   -42") == -42
assert my_atoi("4193 with words") == 4193
assert my_atoi("words and 987") == 0
assert my_atoi("-91283472332") == -2147483648
assert my_atoi("91283472332") == 2147483647
assert my_atoi("") == 0
assert my_atoi("+-12") == 0
assert my_atoi("  +0 123") == 0
assert my_atoi("2147483648") == 2147483647
assert my_atoi("-2147483648") == -2147483648

### [2] Find the Index of the First Occurrence in a String
@lc 28
@ask Return the index where needle first appears in haystack, or -1. Do better than checking every position when asked.
@eg haystack = "sadbutsad", needle = "sad" -> 0,  "hello", "ll" -> 2
@tags strings, kmp, pattern matching
@hook KMP: precompute, for each prefix of the needle, its longest border (a prefix that is also a suffix). On a mismatch, fall back to the border instead of starting over.
@say
"The simple way tries every start position and compares, which is O(n times m) in the worst case, like searching 'aab' in 'aaaa...ab'. In an interview I mention that first, since Python's `find` is fine in practice.

KMP gets O(n plus m). I precompute an array `lps`: for each position in the needle, the length of the longest proper prefix that is also a suffix of the needle up to there. Then I scan the haystack once, tracking how many needle characters currently match. On a mismatch, instead of moving back in the haystack, I fall back to lps of the matched length, because those characters are already known to match. When the match length reaches the needle's length, I've found it.

Building lps is O(m), the scan is O(n), and lps uses O(m) space."
@code
```python
def str_str(haystack, needle):
    if not needle:
        return 0
    lps = [0] * len(needle)        # longest border of needle[:i + 1]
    k = 0
    for i in range(1, len(needle)):
        while k and needle[i] != needle[k]:
            k = lps[k - 1]
        if needle[i] == needle[k]:
            k += 1
        lps[i] = k
    k = 0                          # needle characters matched so far
    for i, ch in enumerate(haystack):
        while k and ch != needle[k]:
            k = lps[k - 1]         # fall back, never move i backwards
        if ch == needle[k]:
            k += 1
        if k == len(needle):
            return i - k + 1
    return -1
```
@time O(n + m)
@space O(m)
@test
import random
assert str_str("sadbutsad", "sad") == 0
assert str_str("leetcode", "leeto") == -1
assert str_str("hello", "ll") == 2
assert str_str("aaaaab", "aab") == 3
assert str_str("abc", "") == 0
assert str_str("", "a") == -1
assert str_str("mississippi", "issip") == 4
assert str_str("ababcabcabababd", "ababd") == 10
random.seed(11)
for _ in range(300):
    h = "".join(random.choice("ab") for _ in range(random.randint(0, 12)))
    nd = "".join(random.choice("ab") for _ in range(random.randint(1, 4)))
    assert str_str(h, nd) == h.find(nd)

### [1] Longest Palindrome
@lc 409
@ask Return the length of the longest palindrome you can build using the letters of s (case-sensitive).
@eg "abccccdd"  ->  7   (for example "dccaccd")
@tags strings, hash map, counting, greedy
@hook Use every letter in pairs, one on each side. If any letter has an odd count left over, one of them can sit in the middle.
@say
"A palindrome mirrors around its middle, so every letter is used in pairs, except possibly one letter in the exact center.

I count each letter. From each count I use the biggest even number, count divided by 2, times 2. If any letter had an odd count, I add 1 for the center.

O(n) time and O(1) space for a fixed alphabet."
@code
```python
from collections import Counter

def longest_palindrome_length(s):
    length, has_odd = 0, False
    for count in Counter(s).values():
        length += count // 2 * 2               # pairs, one on each side
        if count % 2:
            has_odd = True
    return length + (1 if has_odd else 0)      # one letter can go in the middle
```
@time O(n)
@space O(1), fixed alphabet
@test
assert longest_palindrome_length("abccccdd") == 7
assert longest_palindrome_length("a") == 1
assert longest_palindrome_length("Aa") == 1
assert longest_palindrome_length("") == 0
assert longest_palindrome_length("aaa") == 3
assert longest_palindrome_length("bananas") == 5

### [2] String Compression
@lc 443
@ask Compress a list of characters in place: each group of repeated characters becomes the character followed by its count if the count is more than 1. Return the new length.
@eg ["a","a","b","b","c","c","c"]  ->  6, and the list starts with ["a","2","b","2","c","3"]
@tags strings, two pointers, in place
@hook A read pointer finds the end of each group. A write pointer writes the character, then the count's digits one by one.
@say
"I use two pointers in the same list. `read` scans the input, and `write` marks where the compressed output goes. Writing never overtakes reading, because a group of length k becomes at most k characters.

For each group, I remember the character and its start, and move `read` past every copy of it. I write the character. If the group is longer than 1, I write the count's digits one at a time, since a count like 12 takes two cells.

O(n) time and O(1) extra space."
@code
```python
def compress(chars):
    write = read = 0
    while read < len(chars):
        ch, start = chars[read], read
        while read < len(chars) and chars[read] == ch:
            read += 1                          # skip the whole group
        chars[write] = ch
        write += 1
        if read - start > 1:
            for digit in str(read - start):    # 12 becomes "1", "2"
                chars[write] = digit
                write += 1
    return write
```
@time O(n)
@space O(1)
@test
a = list("aabbccc"); k = compress(a); assert k == 6 and a[:k] == list("a2b2c3")
a = ["a"]; assert compress(a) == 1 and a == ["a"]
a = list("abbbbbbbbbbbb"); k = compress(a); assert a[:k] == ["a", "b", "1", "2"]
assert compress([]) == 0
a = list("aaabbaa"); k = compress(a); assert a[:k] == list("a3b2a2")

### [2] Reverse Words in a String
@lc 151
@ask Reverse the order of the words. Remove leading and trailing spaces, and use a single space between words.
@eg "  hello world  " -> "world hello",  "a good   example" -> "example good a"
@tags strings, two pointers
@hook In Python: " ".join(reversed(s.split())). Without split: read the words by hand, then reverse their order with two pointers.
@say
"The Python one-liner is `' '.join(reversed(s.split()))`, because `split` with no argument already drops extra spaces. I'd say it, then show that I can do it by hand, since that's usually the point.

By hand, I walk the string with an index: skip spaces, then read characters until the next space, and that's one word. I collect the words, reverse their order with two pointers, and join them with single spaces.

O(n) time and O(n) space. If the input were a mutable character array, I could do it in O(1) extra space: reverse the whole array, then reverse each word back."
@code
```python
def reverse_words(s):
    words, i, n = [], 0, len(s)
    while i < n:
        while i < n and s[i] == " ":
            i += 1                             # skip spaces
        start = i
        while i < n and s[i] != " ":
            i += 1                             # read one word
        if start < i:
            words.append(s[start:i])
    left, right = 0, len(words) - 1
    while left < right:                        # reverse the word order
        words[left], words[right] = words[right], words[left]
        left += 1
        right -= 1
    return " ".join(words)
```
@time O(n)
@space O(n)
@test
assert reverse_words("the sky is blue") == "blue is sky the"
assert reverse_words("  hello world  ") == "world hello"
assert reverse_words("a good   example") == "example good a"
assert reverse_words("") == ""
assert reverse_words("   ") == ""

### [2] Integer to Roman
@lc 12
@ask Convert an integer from 1 to 3999 to a Roman numeral.
@eg 58 -> "LVIII",  1994 -> "MCMXCIV"
@tags strings, greedy, math
@hook Greedy with a table that already includes the subtraction pairs (900 CM, 400 CD, 90 XC...). Take the biggest value that fits, repeat.
@say
"Roman numerals are written greedily from the biggest value down. The trick is to put the six subtraction pairs, 900, 400, 90, 40, 9 and 4, into the table next to the normal symbols. Then no special rules are needed.

I go through the table from 1000 down to 1. For each value, I take as many copies as fit using divmod, append the symbol that many times, and continue with the remainder.

The table has 13 entries and the number is at most 3999, so it's O(1) time and space."
@code
```python
def int_to_roman(num):
    table = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"),
             (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"),
             (5, "V"), (4, "IV"), (1, "I")]
    parts = []
    for value, symbol in table:
        count, num = divmod(num, value)        # how many times it fits
        parts.append(symbol * count)
    return "".join(parts)
```
@time O(1)
@space O(1)
@test
assert int_to_roman(3) == "III"
assert int_to_roman(4) == "IV"
assert int_to_roman(9) == "IX"
assert int_to_roman(58) == "LVIII"
assert int_to_roman(1994) == "MCMXCIV"
assert int_to_roman(3749) == "MMMDCCXLIX"
def back(s):
    v = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    return sum(-v[c] if i + 1 < len(s) and v[c] < v[s[i + 1]] else v[c] for i, c in enumerate(s))
assert all(back(int_to_roman(n)) == n for n in range(1, 4000))

### [2] Repeated DNA Sequences
@lc 187
@ask Return every 10-letter sequence that appears more than once in a DNA string of the letters A, C, G and T.
@eg "AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"  ->  ["AAAAACCCCC","CCCCCAAAAA"]
@tags strings, hash set, rolling hash, bit manipulation
@hook Slide a window of 10 and keep a set of windows seen. Stand-out: encode each letter in 2 bits so a window is one 20-bit number.
@say
"I slide a window of length 10 across the string. A set holds windows I've already seen, and a second set collects the ones I see again. Using a set for the answers stops a sequence that appears three times from being reported twice.

Slicing each window costs 10, so it's O(10 n), which is fine. The stand-out version uses a rolling hash. With only four letters, each fits in 2 bits, so a window of 10 letters is a 20-bit integer. Moving the window is a shift left by 2, OR in the new letter, and a mask to keep the last 20 bits. That's O(1) per step and the set stores small integers instead of strings.

Both are O(n) time and O(n) space."
@code
```python
def find_repeated_dna_sequences(s):
    seen, repeated = set(), set()
    for i in range(len(s) - 9):
        window = s[i:i + 10]
        if window in seen:
            repeated.add(window)
        else:
            seen.add(window)
    return sorted(repeated)

def find_repeated_dna_bits(s):
    code = {"A": 0, "C": 1, "G": 2, "T": 3}
    seen, repeated = set(), set()
    window = 0
    for i, ch in enumerate(s):
        window = ((window << 2) | code[ch]) & 0xFFFFF   # last 10 letters = 20 bits
        if i >= 9:
            if window in seen:
                repeated.add(s[i - 9:i + 1])
            else:
                seen.add(window)
    return sorted(repeated)
```
@time O(n)
@space O(n)
@test
for f in (find_repeated_dna_sequences, find_repeated_dna_bits):
    assert f("AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT") == ["AAAAACCCCC", "CCCCCAAAAA"]
    assert f("AAAAAAAAAAAAA") == ["AAAAAAAAAA"]
    assert f("ACGT") == []
    assert f("") == []

### [2] Zigzag Conversion
@lc 6
@ask Write the string in a zigzag over num_rows rows (down, then diagonally up, repeating), then read it row by row.
@eg "PAYPALISHIRING", 3 rows  ->  "PAHNAPLSIIGYIR"
@tags strings, simulation
@hook Keep one list per row. Walk the rows down and up, bouncing at the top and bottom, and add each character to the current row.
@say
"I simulate the writing. I keep one list of characters for each row, and a current row with a direction. For each character, I add it to the current row. When I'm at the top row, the direction becomes down; at the bottom row, it becomes up. Then I move one row in that direction.

At the end I join all the rows in order. If there's only one row, or more rows than characters, the string is unchanged, which also avoids bouncing between row 0 and itself.

O(n) time and O(n) space."
@code
```python
def convert(s, num_rows):
    if num_rows == 1 or num_rows >= len(s):
        return s
    rows = [[] for _ in range(num_rows)]
    row, step = 0, 1
    for ch in s:
        rows[row].append(ch)
        if row == 0:
            step = 1                           # bounce down at the top
        elif row == num_rows - 1:
            step = -1                          # bounce up at the bottom
        row += step
    return "".join("".join(r) for r in rows)
```
@time O(n)
@space O(n)
@test
assert convert("PAYPALISHIRING", 3) == "PAHNAPLSIIGYIR"
assert convert("PAYPALISHIRING", 4) == "PINALSIGYAHRPI"
assert convert("A", 1) == "A"
assert convert("AB", 1) == "AB"
assert convert("ABC", 5) == "ABC"
