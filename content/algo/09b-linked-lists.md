@section linked | Linked Lists

### [1] Intersection of Two Linked Lists
@lc 160
@ask Two lists may join and share their tail. Return the first shared node, or None. Use O(1) memory.
@eg A: 4->1->8->4->5,  B: 5->6->1->8->4->5 (sharing 8->4->5)  ->  node 8
@tags linked list, two pointers
@hook Walk A then B, and B then A. Both pointers travel the same total distance, so they reach the shared node at the same time.
@say
"A hash set of A's nodes works, but uses O(n) space. The neat trick uses two pointers.

Pointer a walks list A and, when it reaches the end, jumps to the head of B. Pointer b does the opposite. Both now travel the length of A plus the length of B. If the lists share a tail, they line up and arrive at the first shared node at the same moment. If they don't share anything, both reach None at the same time, and I return None.

O(n plus m) time and O(1) space."
@code
```python
def get_intersection_node(head_a, head_b):
    a, b = head_a, head_b
    while a is not b:
        a = a.next if a else head_b      # switch lists at the end
        b = b.next if b else head_a
    return a                             # shared node, or None
```
@time O(n + m)
@space O(1)
@trap
Comparing node values instead of the nodes themselves. Two different nodes can hold the same value. Compare with `is`.
@test
common = build_list([8, 4, 5])
a = ListNode(4, ListNode(1, common))
b = ListNode(5, ListNode(6, ListNode(1, common)))
assert get_intersection_node(a, b) is common
assert get_intersection_node(build_list([2, 6, 4]), build_list([1, 5])) is None
assert get_intersection_node(None, None) is None
assert get_intersection_node(common, common) is common

### [2] Reorder List
@lc 143
@ask Reorder L0 -> L1 -> ... -> Ln into L0 -> Ln -> L1 -> Ln-1 -> ... in place.
@eg 1->2->3->4->5  ->  1->5->2->4->3
@tags linked list, fast and slow pointers, reversal
@hook Three steps: find the middle, reverse the second half, then weave the two halves together.
@say
"The pattern takes nodes alternately from the front and from the back. Going backwards in a singly linked list is impossible, so I reverse the back half.

Step one: fast and slow pointers find the middle, and I cut the list there. Step two: I reverse the second half. Step three: I weave them, taking one node from the first half, then one from the reversed second half, and so on, saving the next pointers before I relink.

Each step is O(n), so O(n) time and O(1) space."
@code
```python
def reorder_list(head):
    if not head:
        return
    slow = fast = head                       # 1. find the middle
    while fast.next and fast.next.next:
        slow, fast = slow.next, fast.next.next
    second, slow.next = slow.next, None      # cut the list in two
    prev = None                              # 2. reverse the second half
    while second:
        nxt = second.next
        second.next = prev
        prev, second = second, nxt
    first, second = head, prev               # 3. weave them together
    while second:
        next_first, next_second = first.next, second.next
        first.next = second
        second.next = next_first
        first, second = next_first, next_second
```
@time O(n)
@space O(1)
@test
h = build_list([1, 2, 3, 4]); reorder_list(h); assert list_vals(h) == [1, 4, 2, 3]
h = build_list([1, 2, 3, 4, 5]); reorder_list(h); assert list_vals(h) == [1, 5, 2, 4, 3]
h = build_list([1]); reorder_list(h); assert list_vals(h) == [1]
h = build_list([1, 2]); reorder_list(h); assert list_vals(h) == [1, 2]
reorder_list(None)

### [2] Add Two Numbers
@lc 2
@ask Two numbers are stored as linked lists of digits in reverse order (ones digit first). Return their sum as a list in the same format.
@eg 2->4->3 (342) + 5->6->4 (465)  ->  7->0->8 (807)
@tags linked list, carry, math
@hook Add digit by digit with a carry, like on paper. Keep going while either list or the carry is left.
@say
"The digits are already in reverse order, so the ones digits come first, which is exactly the order we add on paper.

I walk both lists together with a carry. Each step, the total is the carry plus the current digits of the lists that still have nodes. The new digit is total modulo 10 and the new carry is total divided by 10. I append the digit to a result list built from a dummy head. I keep going while either list has nodes or the carry is not zero, so a final carry like in 999 plus 1 isn't lost.

O(max of the two lengths) time and space for the result."
@code
```python
def add_two_numbers(l1, l2):
    dummy = tail = ListNode()
    carry = 0
    while l1 or l2 or carry:
        total = carry
        if l1:
            total += l1.val
            l1 = l1.next
        if l2:
            total += l2.val
            l2 = l2.next
        carry, digit = divmod(total, 10)
        tail.next = ListNode(digit)
        tail = tail.next
    return dummy.next
```
@time O(max(m, n))
@space O(max(m, n)) for the result
@follow What if the digits are stored with the most significant digit first?
Push each list's digits onto two stacks, then pop and add from the ones digit, building the result by inserting at the front. Or reverse both lists first. That is LeetCode 445.
@test
assert list_vals(add_two_numbers(build_list([2, 4, 3]), build_list([5, 6, 4]))) == [7, 0, 8]
assert list_vals(add_two_numbers(build_list([0]), build_list([0]))) == [0]
assert list_vals(add_two_numbers(build_list([9, 9, 9, 9, 9, 9, 9]), build_list([9, 9, 9, 9]))) == [8, 9, 9, 9, 0, 0, 0, 1]
assert list_vals(add_two_numbers(None, build_list([1]))) == [1]

### [2] Copy List with Random Pointer
@lc 138
@ask Each node has a next pointer and a random pointer to any node or None. Make a deep copy of the list.
@eg [[7,null],[13,0],[11,4],[10,2],[1,0]]  (value, index of the random node)
@tags linked list, hash map, deep copy
@hook Map each original node to its copy. First pass makes copies, second pass wires next and random through the map.
@say
"The random pointers can point forward, so when I create a copy, the node its random should point to may not exist yet. Two passes solve that.

In the first pass I create a copy of every node and store it in a hash map from original to copy. In the second pass I set each copy's next and random by looking up the originals' next and random in the map. I put None in the map mapped to None, so I don't need special cases.

O(n) time and O(n) space. There's also an O(1) extra space version that weaves each copy right after its original, then separates the two lists."
@code
```python
class Node:
    def __init__(self, val, next=None, random=None):
        self.val = val
        self.next = next
        self.random = random

def copy_random_list(head):
    copies = {None: None}             # original node -> its copy
    node = head
    while node:                       # pass 1: create every copy
        copies[node] = Node(node.val)
        node = node.next
    node = head
    while node:                       # pass 2: wire next and random
        copies[node].next = copies[node.next]
        copies[node].random = copies[node.random]
        node = node.next
    return copies[head]
```
@time O(n)
@space O(n)
@test
nodes = [Node(v) for v in [7, 13, 11, 10, 1]]
for x, y in zip(nodes, nodes[1:]):
    x.next = y
for i, r in enumerate([None, 0, 4, 2, 0]):
    nodes[i].random = nodes[r] if r is not None else None
copy = copy_random_list(nodes[0])
originals = set(map(id, nodes))
got = []
n = copy
while n:
    assert id(n) not in originals
    got.append((n.val, n.random.val if n.random else None))
    n = n.next
assert got == [(7, None), (13, 7), (11, 1), (10, 11), (1, 7)]
assert copy_random_list(None) is None

### [2] Sort List
@lc 148
@ask Sort a linked list in O(n log n) time.
@eg 4->2->1->3  ->  1->2->3->4
@tags linked list, merge sort
@hook Merge sort fits linked lists: split at the middle with fast and slow pointers, sort both halves, merge them.
@say
"Quicksort and heap sort need fast random access, which linked lists don't have. Merge sort only needs to walk forward, so it's the natural choice.

I find the middle with slow and fast pointers, starting fast one node ahead so that two nodes split into one and one. I cut the list there, sort each half recursively, and merge the two sorted halves with the same code as Merge Two Sorted Lists.

O(n log n) time. Space is O(log n) for the recursion. A bottom-up merge sort, merging runs of size 1, 2, 4 and so on, gets it to O(1) space."
@code
```python
def sort_list(head):
    if not head or not head.next:
        return head
    slow, fast = head, head.next          # slow stops at the first middle
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    second, slow.next = slow.next, None   # cut into two halves
    return merge(sort_list(head), sort_list(second))

def merge(a, b):
    dummy = tail = ListNode()
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next
```
@time O(n log n)
@space O(log n) for the recursion
@trap
Starting `fast` at `head`. Then a two-node list never splits: the first half keeps both nodes and the recursion never ends.
@test
assert list_vals(sort_list(build_list([4, 2, 1, 3]))) == [1, 2, 3, 4]
assert list_vals(sort_list(build_list([-1, 5, 3, 4, 0]))) == [-1, 0, 3, 4, 5]
assert sort_list(None) is None
assert list_vals(sort_list(build_list([1]))) == [1]
assert list_vals(sort_list(build_list([2, 1]))) == [1, 2]
assert list_vals(sort_list(build_list([3, 3, 1]))) == [1, 3, 3]

### [2] Find the Duplicate Number
@lc 287
@ask An array of n + 1 numbers holds values from 1 to n, so one value repeats. Find it without changing the array, using O(1) extra space.
@eg [1,3,4,2,2] -> 2,  [3,1,3,4,2] -> 3
@tags fast and slow pointers, floyd, arrays
@hook Treat index i -> nums[i] as a linked list. The repeated value is where two arrows point to the same node: the start of a cycle.
@say
"Sorting changes the array, and a hash set uses O(n) space. The clever answer turns the array into a linked list: from index i, the next node is index nums[i].

Because every value is between 1 and n, I can always follow the arrows. The duplicate value means two different indexes point to the same next node, and that creates a cycle whose entrance is exactly the duplicate. So I run Floyd's cycle detection: slow and fast pointers starting at index 0 until they meet, then move one back to 0 and step both by one until they meet again. That meeting point is the duplicate.

O(n) time and O(1) space, and the array is not modified."
@code
```python
def find_duplicate(nums):
    slow = fast = 0
    while True:                  # phase 1: meet inside the cycle
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    slow = 0
    while slow != fast:          # phase 2: meet at the cycle entrance
        slow = nums[slow]
        fast = nums[fast]
    return slow
```
@time O(n)
@space O(1)
@pro
Mention the binary search answer too: count how many values are <= mid. If the count is more than mid, the duplicate is <= mid. That is O(n log n) and also leaves the array unchanged.
@test
assert find_duplicate([1, 3, 4, 2, 2]) == 2
assert find_duplicate([3, 1, 3, 4, 2]) == 3
assert find_duplicate([3, 3, 3, 3, 3]) == 3
assert find_duplicate([1, 1]) == 1
assert find_duplicate([2, 2, 2]) == 2

### [3] Reverse Nodes in k-Group
@lc 25
@ask Reverse the nodes of a list k at a time. If fewer than k nodes are left at the end, leave them as they are.
@eg 1->2->3->4->5, k = 2 -> 2->1->4->3->5,  k = 3 -> 3->2->1->4->5
@tags linked list, reversal, dummy node
@hook For each group: check k nodes exist, reverse them, then connect the node before the group to the new front and move to the next group.
@say
"I use a dummy node and a pointer `group_prev`, the node just before the current group.

For each group, I first walk k steps to find the kth node. If the list ends before that, fewer than k nodes are left, so I stop. Otherwise I remember `group_next`, the node after the group, and reverse the group's nodes, starting `prev` at `group_next` so the group's old first node ends up pointing to the rest of the list. Then I connect `group_prev` to the kth node, which is the new front, and move `group_prev` to the old first node, which is now the group's last node.

Each node is visited about twice: O(n) time and O(1) space."
@code
```python
def reverse_k_group(head, k):
    dummy = ListNode(0, head)
    group_prev = dummy
    while True:
        kth = group_prev                  # find the kth node of this group
        for _ in range(k):
            kth = kth.next
            if not kth:
                return dummy.next         # fewer than k left: done
        group_next = kth.next
        prev, curr = group_next, group_prev.next
        while curr is not group_next:     # reverse the group
            nxt = curr.next
            curr.next = prev
            prev, curr = curr, nxt
        first = group_prev.next           # old first node, now the group's last
        group_prev.next = kth
        group_prev = first
```
@time O(n)
@space O(1)
@test
assert list_vals(reverse_k_group(build_list([1, 2, 3, 4, 5]), 2)) == [2, 1, 4, 3, 5]
assert list_vals(reverse_k_group(build_list([1, 2, 3, 4, 5]), 3)) == [3, 2, 1, 4, 5]
assert list_vals(reverse_k_group(build_list([1, 2, 3, 4, 5]), 1)) == [1, 2, 3, 4, 5]
assert list_vals(reverse_k_group(build_list([1, 2]), 2)) == [2, 1]
assert reverse_k_group(None, 2) is None
