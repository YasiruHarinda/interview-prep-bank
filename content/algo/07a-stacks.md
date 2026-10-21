@section stack | Stacks and Monotonic Stacks
@blurb Last in, first out. Use it for matching brackets, nested structures, undo and expressions. A monotonic stack finds the next greater or smaller element in O(n).

### [1] Pattern: when do you use a stack, and what is a monotonic stack?
@tags pattern, stack, monotonic stack
@hook Use a stack when the most recent unfinished thing must be handled first. A monotonic stack keeps items in sorted order and pops them when their answer arrives.
@say
"A stack is last in, first out. I reach for it when the most recent open item must be closed first: matching brackets, nested structures like '3[a2[c]]', undoing steps like '..' in a file path, and evaluating expressions.

A **monotonic stack** is a special use. It keeps indexes whose values are always increasing or always decreasing. It answers 'what is the next greater element?' for every position in one pass. Each index waits on the stack until a bigger value arrives. When it does, I pop the waiting indexes and record the answer for each.

Every index is pushed once and popped at most once, so the whole thing is O(n), even though there is a loop inside a loop."
@deep
```python
# Next greater element to the right of each index, or -1
def next_greater(nums):
    result = [-1] * len(nums)
    stack = []                              # indexes still waiting for an answer
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            result[stack.pop()] = x         # x is their next greater value
        stack.append(i)
    return result
```
| Question | Stack keeps values | Pop when the new value is |
|---|---|---|
| Next greater element | decreasing | bigger |
| Next smaller element | increasing | smaller |
| Previous greater element | decreasing | bigger or equal (answer is the top after popping) |
| Largest rectangle in histogram | increasing | smaller |
@trap
Calling a monotonic stack solution O(n^2) because of the inner while loop. Count the pushes and pops instead: at most n each, so O(n).

### [1] Valid Parentheses
@lc 20
@ask Return true if every bracket in a string of `()[]{}` is closed by the same type, in the right order.
@eg "()[]{}" -> true,  "(]" -> false,  "([)]" -> false
@tags stack, strings
@hook Push openers. On a closer, the top of the stack must be its matching opener. The stack must be empty at the end.
@say
"I use a stack and a map from each closing bracket to its opening bracket.

I scan the string. An opening bracket goes on the stack. For a closing bracket, the stack must not be empty and the top must be the matching opener, so I pop and compare. If it doesn't match, the string is invalid. At the end the stack must be empty, otherwise some brackets were never closed.

O(n) time and O(n) space. A quick extra check: an odd-length string can never be valid."
@code
```python
def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:                         # a closing bracket
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack
```
@time O(n)
@space O(n)
@trap
Only counting brackets. Counts can't catch "([)]", where every count matches but the order is wrong.
@test
assert is_valid("()")
assert is_valid("()[]{}")
assert not is_valid("(]")
assert not is_valid("([)]")
assert is_valid("{[]}")
assert is_valid("")
assert not is_valid("((")
assert not is_valid("))")

### [2] Min Stack
@lc 155
@ask Design a stack with push, pop, top and get_min, all in O(1) time.
@eg push(-2), push(0), push(-3), get_min() -> -3, pop(), top() -> 0, get_min() -> -2
@tags stack, design
@hook Store each value together with the minimum at that moment. The top pair always knows the current minimum.
@say
"The hard part is get_min after a pop. If I kept a single min variable, I'd lose the old minimum when the current one is popped.

So each stack entry stores a pair: the value, and the minimum of the stack up to and including that value. When I push, the new minimum is the smaller of the value and the previous top's minimum. Pop just removes the top pair, and the minimum underneath is automatically correct again.

Every operation is O(1). Space is O(n). A space-saving version uses a second stack that only stores a value when it is a new minimum."
@code
```python
class MinStack:
    def __init__(self):
        self.stack = []          # (value, min of the stack at this point)

    def push(self, val):
        current_min = min(val, self.stack[-1][1]) if self.stack else val
        self.stack.append((val, current_min))

    def pop(self):
        self.stack.pop()

    def top(self):
        return self.stack[-1][0]

    def get_min(self):
        return self.stack[-1][1]
```
@time O(1) for every operation
@space O(n)
@test
ms = MinStack()
ms.push(-2); ms.push(0); ms.push(-3)
assert ms.get_min() == -3
ms.pop()
assert ms.top() == 0
assert ms.get_min() == -2
ms2 = MinStack()
ms2.push(1); ms2.push(1); ms2.pop()
assert ms2.get_min() == 1

### [2] Evaluate Reverse Polish Notation
@lc 150
@ask Evaluate an expression in postfix form, like ["2","1","+","3","*"]. Division truncates toward zero.
@eg ["4","13","5","/","+"]  ->  6
@tags stack, expressions
@hook Numbers go on the stack. An operator pops two numbers (right one first), applies itself, and pushes the result.
@say
"In postfix notation every operator comes after its two operands, so a stack evaluates it in one pass.

When I see a number, I push it. When I see an operator, I pop two numbers. The first one I pop is the right operand and the second is the left operand, which matters for minus and divide. I apply the operator and push the result. At the end, the only number left on the stack is the answer.

O(n) time and O(n) space."
@code
```python
def eval_rpn(tokens):
    stack = []
    for tok in tokens:
        if tok in {"+", "-", "*", "/"}:
            b = stack.pop()             # right operand comes off first
            a = stack.pop()
            if tok == "+":
                stack.append(a + b)
            elif tok == "-":
                stack.append(a - b)
            elif tok == "*":
                stack.append(a * b)
            else:
                stack.append(int(a / b))    # truncate toward zero
        else:
            stack.append(int(tok))
    return stack[0]
```
@time O(n)
@space O(n)
@trap
Python's `//` rounds down, so `-7 // 2` is -4, but the problem wants -3. Use `int(a / b)` to truncate toward zero.
@test
assert eval_rpn(["2", "1", "+", "3", "*"]) == 9
assert eval_rpn(["4", "13", "5", "/", "+"]) == 6
assert eval_rpn(["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]) == 22
assert eval_rpn(["-7", "2", "/"]) == -3
assert eval_rpn(["3"]) == 3

### [2] Daily Temperatures
@lc 739
@ask For each day, return how many days you wait for a warmer temperature, or 0 if it never comes.
@eg [73,74,75,71,69,72,76,73]  ->  [1,1,4,2,1,1,0,0]
@tags monotonic stack, arrays
@hook Keep a stack of days still waiting for a warmer day. A warmer day pops them and fills in their answers.
@say
"Checking every later day for each day is O(n squared). This is a 'next greater element' problem, so I use a monotonic stack.

The stack holds indexes of days that haven't found a warmer day yet, so their temperatures are decreasing from bottom to top. For each new day, while it's warmer than the day on top of the stack, I pop that day and set its answer to the difference in indexes. Then I push the new day. Days left on the stack at the end keep the answer 0.

Each day is pushed and popped at most once: O(n) time and O(n) space."
@code
```python
def daily_temperatures(temps):
    answer = [0] * len(temps)
    stack = []                       # days still waiting for a warmer day
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            answer[j] = i - j
        stack.append(i)
    return answer
```
@time O(n)
@space O(n)
@test
assert daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]) == [1, 1, 4, 2, 1, 1, 0, 0]
assert daily_temperatures([30, 40, 50, 60]) == [1, 1, 1, 0]
assert daily_temperatures([30, 60, 90]) == [1, 1, 0]
assert daily_temperatures([]) == []
assert daily_temperatures([50, 50]) == [0, 0]

### [1] Next Greater Element
@lc 496
@ask nums1 is a subset of nums2. For each value in nums1, find the first bigger value to its right in nums2, or -1.
@eg nums1 = [4,1,2], nums2 = [1,3,4,2]  ->  [-1,3,-1]
@tags monotonic stack, hash map
@hook Run the monotonic stack once over nums2 and save each answer in a map. Then just look up nums1.
@say
"Values are unique, so I can solve it for all of nums2 first and store the answers in a hash map.

I scan nums2 with a stack of values still waiting for a bigger one. When a new value is bigger than the top, it's the next greater element for that top, so I pop and record it in the map. I keep popping while that's true, then push the new value. Anything left on the stack has no bigger value to its right.

Then the answer for nums1 is a map lookup with -1 as the default. O(n plus m) time and O(n) space."
@code
```python
def next_greater_element(nums1, nums2):
    next_greater = {}
    stack = []
    for x in nums2:
        while stack and stack[-1] < x:
            next_greater[stack.pop()] = x
        stack.append(x)
    return [next_greater.get(x, -1) for x in nums1]
```
@time O(n + m)
@space O(n)
@follow What if the array is circular, so the search wraps around to the start?
Loop over the indexes twice, using `i % n`, and only push indexes during the first pass. That is LeetCode 503.
@test
assert next_greater_element([4, 1, 2], [1, 3, 4, 2]) == [-1, 3, -1]
assert next_greater_element([2, 4], [1, 2, 3, 4]) == [3, -1]
assert next_greater_element([], [1]) == []
