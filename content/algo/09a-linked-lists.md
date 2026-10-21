@section linked | Linked Lists
@blurb Pointer surgery. Three tools solve almost all of these: a dummy head node, fast and slow pointers, and in-place reversal.

### [1] Pattern: what are the core techniques for linked list problems?
@tags pattern, linked list
@hook Dummy head for edge cases, fast and slow pointers for middles and cycles, and the three-pointer reversal. Always save next before you rewire.
@say
"Most linked list problems use three tools.

A **dummy head** is a fake node placed before the real head. It means I never need a special case when the head itself changes, for example when deleting the first node or merging lists. I return `dummy.next` at the end.

**Fast and slow pointers:** fast moves two steps, slow moves one. When fast reaches the end, slow is in the middle. If there's a cycle, they meet. A fixed gap between two pointers finds the nth node from the end.

**In-place reversal:** walk with `prev` and `curr`, and flip each `next` pointer backwards, saving `curr.next` first so I don't lose the rest of the list.

I draw the boxes and arrows before I code, and I test with an empty list, one node and two nodes."
@deep
```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Dummy head: no special case for the first node
dummy = tail = ListNode()
# ... tail.next = node; tail = tail.next
# return dummy.next

# Fast and slow: middle of the list
slow = fast = head
while fast and fast.next:
    slow, fast = slow.next, fast.next.next

# Reverse in place
prev, curr = None, head
while curr:
    nxt = curr.next
    curr.next = prev
    prev, curr = curr, nxt
# prev is the new head
```
@trap
Losing the rest of the list. If you set `curr.next = prev` before saving `curr.next`, every node after it is gone.

### [1] Reverse Linked List
@lc 206
@ask Reverse a singly linked list and return the new head.
@eg 1 -> 2 -> 3 -> 4 -> 5  ->  5 -> 4 -> 3 -> 2 -> 1
@tags linked list, reversal
@hook Walk the list with prev and curr. Save next, point curr back at prev, step forward.
@say
"I use three pointers: `prev`, `curr` and a saved `nxt`. `prev` starts as None and `curr` at the head.

For each node, I first save `curr.next`, so I don't lose the rest of the list. Then I point `curr.next` back to `prev`. Then I move both forward: `prev` becomes `curr`, and `curr` becomes the saved next. When `curr` is None, `prev` is the new head.

O(n) time and O(1) space. The recursive version is shorter but uses O(n) stack space."
@code
```python
def reverse_list(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next          # save the rest of the list
        curr.next = prev         # flip the pointer
        prev, curr = curr, nxt
    return prev
```
@time O(n)
@space O(1)
@deep
The recursive version: reverse the rest, then hook the current node onto the end.

```python
def reverse_recursive(head):
    if head is None or head.next is None:
        return head
    new_head = reverse_recursive(head.next)
    head.next.next = head        # the next node points back at me
    head.next = None
    return new_head
```
@test
assert list_vals(reverse_list(build_list([1, 2, 3, 4, 5]))) == [5, 4, 3, 2, 1]
assert reverse_list(None) is None
assert list_vals(reverse_list(build_list([1]))) == [1]
assert list_vals(reverse_list(build_list([1, 2]))) == [2, 1]

### [1] Merge Two Sorted Lists
@lc 21
@ask Merge two sorted linked lists into one sorted list by relinking their nodes.
@eg 1->2->4 and 1->3->4  ->  1->1->2->3->4->4
@tags linked list, dummy node, merging
@hook A dummy head and a tail pointer. Attach the smaller front node each step, then attach whatever is left.
@say
"I create a dummy node and a `tail` pointer that starts at it. While both lists have nodes, I compare their front values, attach the smaller node to `tail`, and move forward in that list. Then `tail` moves to the node I just attached.

When one list runs out, the other is already sorted, so I attach all of it in one step. The answer is `dummy.next`.

O(n plus m) time and O(1) extra space, since I reuse the existing nodes."
@code
```python
def merge_two_lists(l1, l2):
    dummy = tail = ListNode()
    while l1 and l2:
        if l1.val <= l2.val:
            tail.next, l1 = l1, l1.next
        else:
            tail.next, l2 = l2, l2.next
        tail = tail.next
    tail.next = l1 or l2          # attach whatever is left
    return dummy.next
```
@time O(n + m)
@space O(1)
@test
assert list_vals(merge_two_lists(build_list([1, 2, 4]), build_list([1, 3, 4]))) == [1, 1, 2, 3, 4, 4]
assert merge_two_lists(None, None) is None
assert list_vals(merge_two_lists(None, build_list([0]))) == [0]
assert list_vals(merge_two_lists(build_list([5]), build_list([1, 2]))) == [1, 2, 5]

### [2] Linked List Cycle, and Where It Starts
@lc 141 / 142
@ask Return whether a linked list has a cycle. Then return the node where the cycle starts, or None. Use O(1) memory.
@eg 3 -> 2 -> 0 -> -4 -> (back to 2)  ->  true, starts at the node 2
@tags linked list, fast and slow pointers, floyd
@hook Floyd: fast and slow meet inside the cycle. Then move one pointer back to the head and step both by one. They meet at the cycle start.
@say
"A hash set of visited nodes works, but uses O(n) memory. Floyd's algorithm uses two pointers. Slow moves one step and fast moves two. If there's no cycle, fast reaches the end. If there is one, fast catches up with slow from behind, so they meet.

To find where the cycle starts, I put one pointer back at the head and leave the other at the meeting point. Then I move both one step at a time. They meet exactly at the start of the cycle.

Why: say the start is a steps from the head and they met b steps into the cycle. Slow walked a plus b, fast walked twice that, and the extra distance is whole laps of the cycle. So a plus b is a multiple of the cycle length, which means walking a more steps from the meeting point lands on the start. O(n) time, O(1) space."
@code
```python
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            return True
    return False

def detect_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:                 # met inside the cycle
            slow = head
            while slow is not fast:      # same speed now: meet at the start
                slow, fast = slow.next, fast.next
            return slow
    return None
```
@time O(n)
@space O(1)
@test
head = build_list([3, 2, 0, -4])
nodes = []
n = head
while n:
    nodes.append(n)
    n = n.next
nodes[-1].next = nodes[1]
assert has_cycle(head)
assert detect_cycle(head) is nodes[1]
h2 = build_list([1, 2])
assert not has_cycle(h2) and detect_cycle(h2) is None
assert not has_cycle(None)
h3 = build_list([1])
h3.next = h3
assert detect_cycle(h3) is h3

### [1] Middle of the Linked List
@lc 876
@ask Return the middle node. If there are two middles, return the second one.
@eg 1->2->3->4->5 -> node 3,  1->2->3->4->5->6 -> node 4
@tags linked list, fast and slow pointers
@hook Fast moves two steps, slow moves one. When fast reaches the end, slow is in the middle.
@say
"Counting the nodes and walking to half takes two passes. With fast and slow pointers it's one pass.

Both start at the head. While fast can move two steps, slow moves one step and fast moves two. Fast covers the list twice as fast, so when fast reaches the end, slow is halfway. With an even number of nodes, this loop stops with slow on the second middle, which is what the problem asks for.

O(n) time and O(1) space."
@code
```python
def middle_node(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    return slow
```
@time O(n)
@space O(1)
@pro
If you need the first middle instead, for example to split a list in half for merge sort, start fast at `head.next`.
@test
assert list_vals(middle_node(build_list([1, 2, 3, 4, 5]))) == [3, 4, 5]
assert list_vals(middle_node(build_list([1, 2, 3, 4, 5, 6]))) == [4, 5, 6]
assert list_vals(middle_node(build_list([1]))) == [1]
assert middle_node(None) is None

### [2] Remove Nth Node From End of List
@lc 19
@ask Remove the nth node from the end of the list in one pass, and return the head.
@eg 1->2->3->4->5, n = 2  ->  1->2->3->5
@tags linked list, two pointers, dummy node
@hook Move fast n + 1 steps ahead of slow, starting from a dummy. When fast hits the end, slow is just before the node to delete.
@say
"I want the node just before the one to delete, so I can skip over it. I start two pointers at a dummy node placed before the head. The dummy handles the case where the head itself is removed.

First I move fast n plus 1 steps ahead. Then I move both together until fast falls off the end. The gap between them stays n plus 1, so slow ends just before the nth node from the end. I set `slow.next` to `slow.next.next` and return `dummy.next`.

One pass, O(n) time and O(1) space."
@code
```python
def remove_nth_from_end(head, n):
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n + 1):           # open a gap of n + 1 nodes
        fast = fast.next
    while fast:
        slow, fast = slow.next, fast.next
    slow.next = slow.next.next       # skip the target node
    return dummy.next
```
@time O(n)
@space O(1)
@trap
Starting at the head instead of a dummy. Removing the first node, like n = length, then needs a special case or crashes.
@test
assert list_vals(remove_nth_from_end(build_list([1, 2, 3, 4, 5]), 2)) == [1, 2, 3, 5]
assert remove_nth_from_end(build_list([1]), 1) is None
assert list_vals(remove_nth_from_end(build_list([1, 2]), 1)) == [1]
assert list_vals(remove_nth_from_end(build_list([1, 2]), 2)) == [2]

### [1] Palindrome Linked List
@lc 234
@ask Is the linked list a palindrome? Try O(n) time and O(1) extra space.
@eg 1->2->2->1 -> true,  1->2 -> false
@tags linked list, fast and slow pointers, reversal
@hook Find the middle, reverse the second half, then compare the two halves node by node.
@say
"Copying the values into an array and checking it with two pointers is easy but uses O(n) space.

For O(1) space I combine the tools. First, fast and slow pointers find the middle. Second, I reverse the second half in place. Third, I walk from the head and from the head of the reversed half at the same time, comparing values. If all pairs match, it's a palindrome.

O(n) time and O(1) space. This changes the list, so in real code I'd reverse the second half again to put it back."
@code
```python
def is_palindrome_list(head):
    slow = fast = head                   # 1. find the middle
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    prev = None                          # 2. reverse the second half
    while slow:
        nxt = slow.next
        slow.next = prev
        prev, slow = slow, nxt
    left, right = head, prev             # 3. compare the halves
    while right:
        if left.val != right.val:
            return False
        left, right = left.next, right.next
    return True
```
@time O(n)
@space O(1)
@test
assert is_palindrome_list(build_list([1, 2, 2, 1]))
assert not is_palindrome_list(build_list([1, 2]))
assert is_palindrome_list(build_list([1]))
assert is_palindrome_list(None)
assert is_palindrome_list(build_list([1, 2, 3, 2, 1]))
assert not is_palindrome_list(build_list([1, 2, 3, 1]))
