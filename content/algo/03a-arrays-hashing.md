@section hashing | Arrays and Hashing
@blurb The most common first round. A hash map or set usually turns an O(n^2) search into one O(n) pass.

### [1] Pattern: when do you reach for a hash map or a hash set?
@tags pattern, hash map, hash set
@hook If you keep asking "have I seen this before?" or "how many of these are there?", a hash map turns an O(n) search into O(1).
@say
"A hash map gives O(1) average time to insert and look up, so it can remove a whole inner loop. I use it in four common ways.

A **seen set** answers 'have I met this value before?', for duplicates. A **counter** stores how many times each value appears, for anagrams and frequencies. An **index map** stores where I saw a value, like in Two Sum. And a **group map** maps a key to a list of items, like grouping anagrams under the same sorted key.

The cost is O(n) extra memory, and a hash map doesn't keep values sorted. If I need order, I sort first or use a tree map instead. In Python the key must be hashable, so I use a tuple, not a list."
@deep
```python
from collections import Counter, defaultdict

seen = set()                       # 1. seen before?
for x in nums:
    if x in seen: ...
    seen.add(x)

freq = Counter(nums)               # 2. how many of each?

index_of = {}                      # 3. where did I see it?
for i, x in enumerate(nums):
    index_of[x] = i

groups = defaultdict(list)         # 4. group by a key
for word in words:
    groups["".join(sorted(word))].append(word)
```
| Problem | Which use |
|---|---|
| Contains Duplicate | Seen set |
| Two Sum | Index map |
| Valid Anagram, Top K Frequent | Counter |
| Group Anagrams | Group map |
| Longest Consecutive Sequence | Set for O(1) "is x + 1 here?" |
| Subarray Sum Equals K | Counter of prefix sums |
@trap
Saying hash map lookups are always O(1). They are O(1) on average. With many collisions they can be O(n).

### [1] Two Sum
@lc 1
@ask Return the indices of the two numbers in `nums` that add up to `target`. Exactly one answer exists, and you can't use the same element twice.
@eg nums = [2,7,11,15], target = 9  ->  [0,1]
@tags hash map, arrays
@hook For each number, ask a hash map: "have I already seen target minus this number?"
@say
"The brute force checks every pair, which is O(n squared).

Instead I walk the array once and keep a hash map from each value I've seen to its index. For each number x, the partner I need is target minus x. If the partner is already in the map, I return both indices. If not, I store x and move on. I check before I insert, so an element can never pair with itself.

That's O(n) time and O(n) space."
@code
```python
def two_sum(nums, target):
    seen = {}                       # value -> index
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []
```
@time O(n)
@space O(n)
@follow What if the array is sorted?
Use two pointers at both ends. If the sum is too small, move the left pointer right. If it's too big, move the right pointer left. O(n) time and O(1) space.
@test
assert two_sum([2, 7, 11, 15], 9) == [0, 1]
assert two_sum([3, 2, 4], 6) == [1, 2]
assert two_sum([3, 3], 6) == [0, 1]
assert two_sum([-1, 4, 5], 3) == [0, 1]
assert two_sum([1, 2], 7) == []

### [1] Contains Duplicate
@lc 217
@ask Return true if any value appears at least twice in the array.
@eg [1,2,3,1] -> true,  [1,2,3,4] -> false
@tags hash set, arrays
@hook Add each number to a set. If it's already there, you found a duplicate.
@say
"Comparing every pair is O(n squared). Sorting first and checking neighbours is O(n log n) with O(1) extra space.

The fastest way is a hash set. I go through the numbers, and for each one I check if it's already in the set. If yes, I return true immediately. If not, I add it. If I finish the loop, there are no duplicates.

That's O(n) time and O(n) space. I'd mention the sorting option too, in case memory is limited."
@code
```python
def contains_duplicate(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return True
        seen.add(x)
    return False
```
@time O(n)
@space O(n)
@pro
The one-liner `len(set(nums)) != len(nums)` is also fine to mention, but the loop can stop early at the first duplicate.
@test
assert contains_duplicate([1, 2, 3, 1])
assert not contains_duplicate([1, 2, 3, 4])
assert not contains_duplicate([])
assert contains_duplicate([1, 1])

### [1] Valid Anagram
@lc 242
@ask Return true if string t uses exactly the same letters as string s, the same number of times.
@eg "anagram", "nagaram" -> true,  "rat", "car" -> false
@tags hash map, counting, strings
@hook Count letters up for s and down for t. Every count must end at zero.
@say
"Two strings are anagrams if every character appears the same number of times in both. First, if the lengths differ, I return false.

Then I use one count map. For each position, I add one for the character in s and subtract one for the character in t. At the end, every count must be zero.

That's O(n) time. The space is O(1) for lowercase letters, because there are at most 26 keys. Sorting both strings and comparing also works, but it's O(n log n)."
@code
```python
def is_anagram(s, t):
    if len(s) != len(t):
        return False
    counts = {}
    for a, b in zip(s, t):
        counts[a] = counts.get(a, 0) + 1
        counts[b] = counts.get(b, 0) - 1
    return all(c == 0 for c in counts.values())
```
@time O(n)
@space O(1), at most 26 letters
@follow What if the input can contain any Unicode character?
The hash map version already works for any character. An array of 26 counts would not, which is why a map is the safer choice.
@test
assert is_anagram("anagram", "nagaram")
assert not is_anagram("rat", "car")
assert is_anagram("", "")
assert not is_anagram("a", "ab")
assert is_anagram("ab", "ba")

### [2] Group Anagrams
@lc 49
@ask Group a list of words so that anagrams end up in the same group.
@eg ["eat","tea","tan","ate","nat","bat"]  ->  [["eat","tea","ate"],["tan","nat"],["bat"]]
@tags hash map, grouping, strings
@hook Anagrams share a key. Use the letter counts (or the sorted word) as the key of a hash map of lists.
@say
"Anagrams have the same letters, so I need a key that is the same for all of them. One option is the sorted word: 'eat', 'tea' and 'ate' all sort to 'aet'. A faster option is a count of each letter, 26 numbers, stored as a tuple so it can be a dictionary key.

I keep a hash map from key to a list of words. For each word I build its key and append the word to that list. At the end, the values of the map are the groups.

With the count key it's O(n times k) time, where n is the number of words and k is the longest word. With the sorted key it's O(n times k log k)."
@code
```python
from collections import defaultdict

def group_anagrams(words):
    groups = defaultdict(list)
    for word in words:
        key = [0] * 26
        for ch in word:
            key[ord(ch) - ord("a")] += 1
        groups[tuple(key)].append(word)      # lists can't be keys, tuples can
    return list(groups.values())
```
@time O(n * k)
@space O(n * k)
@trap
Using a list as a dictionary key. Python raises `TypeError: unhashable type`. Convert it to a tuple.
@test
def norm(groups):
    return sorted(sorted(g) for g in groups)
assert norm(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])) == norm([["bat"], ["nat", "tan"], ["ate", "eat", "tea"]])
assert group_anagrams([""]) == [[""]]
assert group_anagrams(["a"]) == [["a"]]

### [2] Top K Frequent Elements
@lc 347
@ask Return the k values that appear most often in the array, in any order.
@eg nums = [1,1,1,2,2,3], k = 2  ->  [1,2]
@tags hash map, bucket sort, heap
@hook Count with a hash map, then put values into buckets by frequency. Read the buckets from the highest frequency down.
@say
"First I count each value with a hash map. Then I need the k values with the highest counts.

Sorting by count is O(n log n). A min-heap of size k gives O(n log k). But there's an O(n) way: bucket sort. A frequency can never be more than n, so I make a list of n plus 1 buckets, where bucket i holds the values that appear exactly i times. Then I walk the buckets from the highest frequency down and collect values until I have k of them.

That's O(n) time and O(n) space."
@code
```python
from collections import Counter

def top_k_frequent(nums, k):
    counts = Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]   # index = frequency
    for num, freq in counts.items():
        buckets[freq].append(num)
    result = []
    for freq in range(len(buckets) - 1, 0, -1):
        for num in buckets[freq]:
            result.append(num)
            if len(result) == k:
                return result
    return result
```
@time O(n)
@space O(n)
@deep
The heap version, O(n log k), is shorter and also a good answer:

```python
import heapq
from collections import Counter

def top_k_frequent_heap(nums, k):
    counts = Counter(nums)
    return heapq.nlargest(k, counts.keys(), key=counts.get)
```
@follow What if the data is a stream that never ends?
Keep the counts in a hash map and a min-heap of size k. Or, if memory is tight, use an approximate structure like Count-Min Sketch.
@test
assert sorted(top_k_frequent([1, 1, 1, 2, 2, 3], 2)) == [1, 2]
assert top_k_frequent([1], 1) == [1]
assert sorted(top_k_frequent([4, 4, 5, 5, 6], 2)) == [4, 5]
assert top_k_frequent([5, 3, 3, 1, 1, 1], 1) == [1]

### [2] Product of Array Except Self
@lc 238
@ask Return an array where each position holds the product of all other numbers. Don't use division, and run in O(n).
@eg [1,2,3,4]  ->  [24,12,8,6]
@tags prefix product, arrays
@hook Answer[i] = (product of everything on the left) x (product of everything on the right). Two passes.
@say
"Division would break with zeros, and it's not allowed anyway. Instead I notice that the answer at i is the product of everything to the left of i times the product of everything to the right of i.

So I do two passes. Left to right, I keep a running prefix product and write it into the answer before multiplying in the current number. Then right to left, I keep a running suffix product and multiply it into the answer.

That's O(n) time, and O(1) extra space if the output array doesn't count."
@code
```python
def product_except_self(nums):
    n = len(nums)
    answer = [1] * n
    prefix = 1
    for i in range(n):
        answer[i] = prefix          # product of everything left of i
        prefix *= nums[i]
    suffix = 1
    for i in range(n - 1, -1, -1):
        answer[i] *= suffix         # times everything right of i
        suffix *= nums[i]
    return answer
```
@time O(n)
@space O(1) extra, not counting the output
@trap
Using division and forgetting about zeros. One zero makes every other product 0, and two zeros make every product 0.
@test
assert product_except_self([1, 2, 3, 4]) == [24, 12, 8, 6]
assert product_except_self([-1, 1, 0, -3, 3]) == [0, 0, 9, 0, 0]
assert product_except_self([2, 3]) == [3, 2]
assert product_except_self([0, 0]) == [0, 0]
