@section stack | Stacks and Monotonic Stacks

### [2] Car Fleet
@lc 853
@ask Cars drive toward a target. A faster car that catches a slower one joins it and moves at its speed. How many groups (fleets) arrive?
@eg target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]  ->  3
@tags stack, sorting
@hook Sort by position, closest to the target first. A car that would arrive later than the fleet ahead of it starts a new fleet.
@say
"I work out when each car would reach the target on its own: distance left divided by speed.

Then I go through the cars from the one closest to the target backwards. The fleet in front of a car arrives at some time. If this car would arrive at the same time or earlier, it catches that fleet and joins it, so nothing changes. If it would arrive later, it can never catch up, so it starts a new fleet, and its time becomes the time to beat for the cars behind it.

This is a stack of fleet arrival times where I only ever look at the top, so one variable is enough. Sorting makes it O(n log n), and space is O(n)."
@code
```python
def car_fleet(target, position, speed):
    cars = sorted(zip(position, speed), reverse=True)   # closest to target first
    fleets = 0
    slowest = 0.0                  # arrival time of the fleet just ahead
    for pos, spd in cars:
        time = (target - pos) / spd
        if time > slowest:         # can't catch the fleet ahead
            fleets += 1
            slowest = time
    return fleets
```
@time O(n log n)
@space O(n)
@test
assert car_fleet(12, [10, 8, 0, 5, 3], [2, 4, 1, 1, 3]) == 3
assert car_fleet(10, [3], [3]) == 1
assert car_fleet(100, [0, 2, 4], [4, 2, 1]) == 1
assert car_fleet(10, [6, 8], [3, 2]) == 2

### [2] Decode String
@lc 394
@ask Decode strings like "3[a2[c]]", where k[text] means text repeated k times. Brackets can be nested.
@eg "3[a2[c]]" -> "accaccacc",  "2[abc]3[cd]ef" -> "abcabccdcdcdef"
@tags stack, strings, nesting
@hook On "[", save the text so far and the number on a stack and start fresh. On "]", pop and build: saved text + current text * number.
@say
"Nesting means I need to pause the outer string while I build the inner one, which is exactly what a stack does.

I keep the current string and the current number. Digits build up the number, since it can have more than one digit. On an opening bracket, I push the current string and the number, then reset both. Letters are added to the current string. On a closing bracket, I pop the saved string and count, and the current string becomes the saved string plus the current string repeated count times.

The time is proportional to the length of the output, and the stack depth is the nesting depth."
@code
```python
def decode_string(s):
    stack = []                       # (text before "[", repeat count)
    current, num = "", 0
    for ch in s:
        if ch.isdigit():
            num = num * 10 + int(ch)
        elif ch == "[":
            stack.append((current, num))
            current, num = "", 0
        elif ch == "]":
            prev, count = stack.pop()
            current = prev + current * count
        else:
            current += ch
    return current
```
@time O(output length)
@space O(output length)
@trap
Reading only one digit. "10[a]" needs the number 10, so build it with `num * 10 + digit`.
@test
assert decode_string("3[a]2[bc]") == "aaabcbc"
assert decode_string("3[a2[c]]") == "accaccacc"
assert decode_string("2[abc]3[cd]ef") == "abcabccdcdcdef"
assert decode_string("abc") == "abc"
assert decode_string("10[a]") == "a" * 10

### [2] Simplify Path
@lc 71
@ask Turn a Unix file path into its simplest form. "." means this folder, ".." means the parent folder, and repeated slashes count as one.
@eg "/a/./b/../../c/"  ->  "/c"
@tags stack, strings
@hook Split on "/". Push folder names, pop on "..", skip "" and ".". Join with "/" at the end.
@say
"I split the path on slashes, which gives me the parts between them. Empty parts come from double slashes and can be ignored. A single dot means 'stay here', so I ignore it too.

For a double dot, I go up one folder by popping the stack, if it isn't already empty, since you can't go above the root. Anything else is a folder name, so I push it. At the end I join the stack with slashes and put one slash at the front.

O(n) time and O(n) space."
@code
```python
def simplify_path(path):
    stack = []
    for part in path.split("/"):
        if part == "..":
            if stack:
                stack.pop()
        elif part and part != ".":
            stack.append(part)
    return "/" + "/".join(stack)
```
@time O(n)
@space O(n)
@trap
Treating "..." as special. Only "." and ".." have a meaning. "..." is a normal folder name.
@test
assert simplify_path("/home/") == "/home"
assert simplify_path("/../") == "/"
assert simplify_path("/home//foo/") == "/home/foo"
assert simplify_path("/a/./b/../../c/") == "/c"
assert simplify_path("/...") == "/..."
assert simplify_path("/") == "/"

### [2] Asteroid Collision
@lc 735
@ask Positive asteroids move right, negative ones move left, all at the same speed. When two meet, the smaller one explodes, and equal ones both explode. Return what is left.
@eg [5,10,-5] -> [5,10],  [8,-8] -> [],  [10,2,-5] -> [10]
@tags stack, simulation
@hook Only a left-moving asteroid hitting a right-moving one on the stack can crash. Keep crashing until one side is gone.
@say
"I use the stack for asteroids that are still alive, in order. A collision only happens when the new asteroid moves left and the top of the stack moves right.

While that's true, I compare sizes. If the top is smaller, it explodes, I pop it and keep checking, because the new asteroid may hit the next one. If they're equal, both explode. If the top is bigger, the new one explodes. If the new asteroid survives all of this, I push it.

Each asteroid is pushed and popped at most once: O(n) time and O(n) space."
@code
```python
def asteroid_collision(asteroids):
    stack = []
    for a in asteroids:
        alive = True
        while alive and a < 0 and stack and stack[-1] > 0:
            if stack[-1] < -a:
                stack.pop()            # the right-mover explodes, keep going
            elif stack[-1] == -a:
                stack.pop()            # both explode
                alive = False
            else:
                alive = False          # the new one explodes
        if alive:
            stack.append(a)
    return stack
```
@time O(n)
@space O(n)
@trap
Making [-2, 2] crash. A left-mover on the left and a right-mover on the right move apart, so they never meet.
@test
assert asteroid_collision([5, 10, -5]) == [5, 10]
assert asteroid_collision([8, -8]) == []
assert asteroid_collision([10, 2, -5]) == [10]
assert asteroid_collision([-2, -1, 1, 2]) == [-2, -1, 1, 2]
assert asteroid_collision([1, -2, -2, -2]) == [-2, -2, -2]

### [1] Remove All Adjacent Duplicates in String
@lc 1047
@ask Repeatedly remove two equal letters that sit next to each other, until you can't. Return the result.
@eg "abbaca"  ->  "ca"
@tags stack, strings
@hook Push each letter. If it equals the top, pop instead. The stack is the answer.
@say
"Removing a pair can make new pairs touch, like 'abba': removing 'bb' leaves 'aa'. A stack handles this naturally.

I go through the letters. If the stack's top equals the current letter, they form a pair, so I pop. Otherwise I push the letter. Whatever is left on the stack, joined together, is the answer.

O(n) time and O(n) space, instead of rescanning the string after each removal."
@code
```python
def remove_duplicates(s):
    stack = []
    for ch in s:
        if stack and stack[-1] == ch:
            stack.pop()
        else:
            stack.append(ch)
    return "".join(stack)
```
@time O(n)
@space O(n)
@test
assert remove_duplicates("abbaca") == "ca"
assert remove_duplicates("azxxzy") == "ay"
assert remove_duplicates("") == ""
assert remove_duplicates("aa") == ""
assert remove_duplicates("abc") == "abc"

### [2] Minimum Remove to Make Valid Parentheses
@lc 1249
@ask Remove the fewest parentheses so the string becomes valid. Letters stay. Return any valid result.
@eg "lee(t(c)o)de)" -> "lee(t(c)o)de",  "))((" -> ""
@tags stack, strings
@hook Match brackets with a stack of "(" indexes. Remove every ")" with no match and every "(" left on the stack.
@say
"I need to find the brackets that can't be matched, and remove only those.

I scan once with a stack of indexes of open brackets. On a closing bracket, if the stack has an open one, they match and I pop it. If the stack is empty, this closing bracket has no partner, so I mark it for removal. After the scan, any indexes left on the stack are open brackets that were never closed, so I mark those too. Then I build the string without the marked characters.

O(n) time and O(n) space."
@code
```python
def min_remove_to_make_valid(s):
    chars = list(s)
    stack = []                       # indexes of unmatched "("
    for i, ch in enumerate(chars):
        if ch == "(":
            stack.append(i)
        elif ch == ")":
            if stack:
                stack.pop()
            else:
                chars[i] = ""        # ")" with no partner
    for i in stack:
        chars[i] = ""                # "(" never closed
    return "".join(chars)
```
@time O(n)
@space O(n)
@test
assert min_remove_to_make_valid("lee(t(c)o)de)") == "lee(t(c)o)de"
assert min_remove_to_make_valid("a)b(c)d") == "ab(c)d"
assert min_remove_to_make_valid("))((") == ""
assert min_remove_to_make_valid("") == ""
assert min_remove_to_make_valid("(a(b)") == "a(b)"

### [2] Basic Calculator II
@lc 227
@ask Evaluate a string with non-negative integers, + - * / and spaces, but no brackets. Division truncates toward zero.
@eg "3+2*2" -> 7,  " 3+5 / 2 " -> 5
@tags stack, expressions, parsing
@hook Push + and - numbers onto a stack as signed values. Do * and / right away with the top of the stack. Sum the stack at the end.
@say
"Multiplication and division must happen before addition and subtraction. A stack handles that without building a parse tree.

I read the number digit by digit and remember the operator that came before it. When I reach the next operator or the end of the string, I apply the previous operator. For plus I push the number, for minus I push the negative number. For times and divide, I pop the top, combine it with the number, and push the result, because those bind tighter. At the end, the answer is the sum of the stack.

O(n) time and O(n) space. It can be done in O(1) space by keeping just the last term instead of a stack."
@code
```python
def calculate(s):
    stack = []
    num, op = 0, "+"                 # op is the operator before num
    for i, ch in enumerate(s):
        if ch.isdigit():
            num = num * 10 + int(ch)
        if ch in "+-*/" or i == len(s) - 1:
            if op == "+":
                stack.append(num)
            elif op == "-":
                stack.append(-num)
            elif op == "*":
                stack.append(stack.pop() * num)
            else:
                stack.append(int(stack.pop() / num))   # truncate toward zero
            op, num = ch, 0
    return sum(stack)
```
@time O(n)
@space O(n)
@test
assert calculate("3+2*2") == 7
assert calculate(" 3/2 ") == 1
assert calculate(" 3+5 / 2 ") == 5
assert calculate("14-3/2") == 13
assert calculate("1-1+1") == 1
assert calculate("2*3*4") == 24
assert calculate("0") == 0

### [3] Largest Rectangle in Histogram
@lc 84
@ask Bars of width 1 have the given heights. Return the area of the largest rectangle inside the histogram.
@eg [2,1,5,6,2,3]  ->  10   (the bars 5 and 6, height 5, width 2)
@tags monotonic stack, arrays
@hook For each bar, the widest rectangle at its height stretches to the first lower bar on each side. An increasing stack finds both edges.
@say
"For every bar, the biggest rectangle that uses its full height spreads left and right until it meets a lower bar. Checking that for every bar is O(n squared).

With a stack of indexes whose heights are increasing, I get both edges in one pass. When a new bar is lower than the bar on top of the stack, the top bar can't spread any further right. So I pop it. Its right edge is the current index, and its left edge is the new top of the stack, which is the first lower bar on its left. The width is right minus left minus 1, and I compute the area.

I add a 0 height at the end so every bar gets popped. Each bar is pushed and popped once: O(n) time, O(n) space."
@code
```python
def largest_rectangle_area(heights):
    heights = heights + [0]          # a final 0 pops every bar left
    stack = []                       # indexes, heights increasing
    best = 0
    for i, h in enumerate(heights):
        while stack and heights[stack[-1]] >= h:
            top = stack.pop()
            left = stack[-1] if stack else -1      # first lower bar on the left
            best = max(best, heights[top] * (i - left - 1))
        stack.append(i)
    return best
```
@time O(n)
@space O(n)
@follow How do you find the largest rectangle of 1s in a binary matrix?
Treat each row as the ground of a histogram, where each column's height is how many 1s are stacked above it. Run this function on every row. That is LeetCode 85, Maximal Rectangle, in O(rows x cols).
@test
assert largest_rectangle_area([2, 1, 5, 6, 2, 3]) == 10
assert largest_rectangle_area([2, 4]) == 4
assert largest_rectangle_area([]) == 0
assert largest_rectangle_area([1]) == 1
assert largest_rectangle_area([2, 2, 2]) == 6
assert largest_rectangle_area([6, 2, 5, 4, 5, 1, 6]) == 12
