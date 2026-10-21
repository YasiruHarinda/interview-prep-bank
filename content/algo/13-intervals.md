@section intervals | Intervals
@blurb Ranges with a start and an end: meetings, bookings, time windows. Sort them first, then compare each one with the last one you kept.

### [1] Pattern: how do you handle interval problems?
@tags pattern, intervals, sorting, sweep line
@hook Sort by start to merge. Sort by end to keep the most non-overlapping intervals. Use a sweep line or a heap to count overlaps.
@say
"Almost every interval problem starts with sorting. Two intervals [a, b] and [c, d] overlap when a is at most d and c is at most b.

To **merge** overlapping intervals, I sort by start, then compare each interval with the last merged one: if it starts before the last one ends, I extend the end, otherwise I start a new interval. To keep the **most intervals without overlap**, I sort by end and greedily keep each interval that starts after the last kept one ends, because finishing early leaves the most room. To find the **most overlapping at once**, like meeting rooms, I use a sweep line: plus one at each start, minus one at each end, or a min-heap of end times.

I always ask whether touching intervals like [1, 2] and [2, 3] count as overlapping, because it changes `<` to `<=`."
@deep
```python
# Do [a, b] and [c, d] overlap? (closed intervals)
overlap = a <= d and c <= b

# Merge: sort by start
intervals.sort(key=lambda iv: iv[0])
merged = []
for start, end in intervals:
    if merged and start <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], end)
    else:
        merged.append([start, end])

# Sweep line: the most intervals open at the same time
events = sorted([(s, 1) for s, e in intervals] + [(e, -1) for s, e in intervals])
open_now = peak = 0
for _, change in events:      # at equal times, -1 sorts first: ends free a room
    open_now += change
    peak = max(peak, open_now)
```
| Goal | Sort by | Then |
|---|---|---|
| Merge overlaps | start | extend the last merged interval |
| Most non-overlapping kept | end | keep if start >= last kept end |
| Rooms or resources needed | start | min-heap of end times, or a sweep line |
| Intersections of two lists | already sorted | two pointers, advance the one that ends first |

### [2] Merge Intervals
@lc 56
@ask Merge all overlapping intervals and return the result.
@eg [[1,3],[2,6],[8,10],[15,18]]  ->  [[1,6],[8,10],[15,18]]
@tags intervals, sorting
@hook Sort by start. If an interval starts before the last merged one ends, stretch the last one. Otherwise add it as new.
@say
"After sorting by start, any interval that overlaps an earlier one must overlap the most recent merged interval, so I only ever compare with the last one in my result.

For each interval, if its start is less than or equal to the last merged interval's end, they overlap, and I extend the end to the larger of the two ends. I take the larger, because the new interval might sit completely inside the last one. If it doesn't overlap, I add it as a new interval.

Sorting is O(n log n) and the scan is O(n), so O(n log n) time and O(n) for the output."
@code
```python
def merge(intervals):
    intervals.sort(key=lambda iv: iv[0])
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:          # overlaps the last one
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
```
@time O(n log n)
@space O(n)
@trap
Writing `merged[-1][1] = end`. For [1, 10] and [2, 3], that would shrink the merged interval to [1, 3].
@test
assert merge([[1, 3], [2, 6], [8, 10], [15, 18]]) == [[1, 6], [8, 10], [15, 18]]
assert merge([[1, 4], [4, 5]]) == [[1, 5]]
assert merge([[1, 4], [2, 3]]) == [[1, 4]]
assert merge([]) == []
assert merge([[5, 6], [1, 2]]) == [[1, 2], [5, 6]]

### [2] Insert Interval
@lc 57
@ask Insert a new interval into a sorted list of non-overlapping intervals, merging where needed.
@eg [[1,2],[3,5],[6,7],[8,10],[12,16]] + [4,8]  ->  [[1,2],[3,10],[12,16]]
@tags intervals, merging
@hook Three phases: copy the intervals that end before the new one, absorb the ones that overlap it, then copy the rest.
@say
"The list is already sorted, so I don't need to sort again. I walk through it in three phases.

First, every interval that ends before the new interval starts can't overlap, so I copy it to the result. Second, every interval that starts before or when the new interval ends overlaps it, so I absorb it by taking the smaller start and the bigger end. Then I add the merged new interval. Third, everything left starts after the new interval ends, so I copy it.

One pass: O(n) time and O(n) for the output."
@code
```python
def insert(intervals, new):
    result, i, n = [], 0, len(intervals)
    start, end = new
    while i < n and intervals[i][1] < start:          # ends before: copy
        result.append(intervals[i])
        i += 1
    while i < n and intervals[i][0] <= end:           # overlaps: absorb
        start = min(start, intervals[i][0])
        end = max(end, intervals[i][1])
        i += 1
    result.append([start, end])
    result.extend(intervals[i:])                      # starts after: copy
    return result
```
@time O(n)
@space O(n)
@test
assert insert([[1, 3], [6, 9]], [2, 5]) == [[1, 5], [6, 9]]
assert insert([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]) == [[1, 2], [3, 10], [12, 16]]
assert insert([], [5, 7]) == [[5, 7]]
assert insert([[1, 5]], [6, 8]) == [[1, 5], [6, 8]]
assert insert([[1, 5]], [0, 0]) == [[0, 0], [1, 5]]
assert insert([[1, 5]], [5, 7]) == [[1, 7]]

### [2] Non-overlapping Intervals
@lc 435
@ask Return the fewest intervals to remove so the rest don't overlap. Touching ends like [1,2] and [2,3] are fine.
@eg [[1,2],[2,3],[3,4],[1,3]]  ->  1
@tags intervals, greedy, sorting
@hook Keep as many as possible: sort by end and always keep the interval that finishes first. Everything that clashes with it gets removed.
@say
"Removing the fewest is the same as keeping the most. That's the classic activity selection problem, and the greedy rule is: always keep the interval that ends earliest, because it leaves the most room for the others.

So I sort by end. I track the end of the last interval I kept. If the next interval starts at or after that end, I keep it and update the end. Otherwise it overlaps, so I count it as removed.

Why it's safe: if some best answer keeps a different first interval, I can swap it for the earliest-ending one without causing any new overlap. O(n log n) time and O(1) extra space."
@code
```python
def erase_overlap_intervals(intervals):
    intervals.sort(key=lambda iv: iv[1])        # earliest end first
    removed = 0
    prev_end = float("-inf")
    for start, end in intervals:
        if start >= prev_end:
            prev_end = end                     # keep it
        else:
            removed += 1                       # clashes: remove it
    return removed
```
@time O(n log n)
@space O(1)
@trap
Sorting by start and keeping the earliest start. A long interval that starts first, like [1, 100], would block everything else.
@test
assert erase_overlap_intervals([[1, 2], [2, 3], [3, 4], [1, 3]]) == 1
assert erase_overlap_intervals([[1, 2], [1, 2], [1, 2]]) == 2
assert erase_overlap_intervals([[1, 2], [2, 3]]) == 0
assert erase_overlap_intervals([]) == 0
assert erase_overlap_intervals([[1, 100], [11, 22], [1, 11], [2, 12]]) == 2

### [1] Meeting Rooms
@lc 252
@ask Given meeting time intervals, can one person attend all of them?
@eg [[0,30],[5,10],[15,20]] -> false,  [[7,10],[2,4]] -> true
@tags intervals, sorting
@hook Sort by start. If any meeting starts before the previous one ends, there's a clash.
@say
"One person can attend everything only if no two meetings overlap. After sorting by start time, I only need to compare neighbours: if a meeting starts before the previous meeting ends, there's a clash and I return false.

A meeting that starts exactly when the previous one ends is fine. O(n log n) time for the sort and O(1) extra space."
@code
```python
def can_attend_meetings(intervals):
    intervals.sort(key=lambda iv: iv[0])
    for i in range(1, len(intervals)):
        if intervals[i][0] < intervals[i - 1][1]:     # starts before the last ends
            return False
    return True
```
@time O(n log n)
@space O(1)
@test
assert not can_attend_meetings([[0, 30], [5, 10], [15, 20]])
assert can_attend_meetings([[7, 10], [2, 4]])
assert can_attend_meetings([])
assert can_attend_meetings([[1, 5], [5, 8]])

### [2] Meeting Rooms II
@lc 253
@ask Return the minimum number of rooms needed to hold all meetings.
@eg [[0,30],[5,10],[15,20]]  ->  2
@tags intervals, heap, sweep line
@hook Sort by start. Keep a min-heap of end times for rooms in use. If the earliest room is free by now, reuse it, otherwise open a new one.
@say
"I process meetings in order of start time and keep a min-heap of the end times of rooms currently in use. The top of the heap is the room that frees up first.

For each meeting, if that earliest end time is at or before this meeting's start, the room is free, so I reuse it: I replace its end time with this meeting's end. Otherwise every room is busy, so I open a new room by pushing this end time. At the end, the heap's size is the number of rooms I needed.

O(n log n) time and O(n) space. A sweep line over sorted start and end times gives the same answer."
@code
```python
import heapq

def min_meeting_rooms(intervals):
    intervals.sort(key=lambda iv: iv[0])
    ends = []                                 # end times of rooms in use
    for start, end in intervals:
        if ends and ends[0] <= start:
            heapq.heapreplace(ends, end)      # reuse the room that frees first
        else:
            heapq.heappush(ends, end)         # every room is busy: open one
    return len(ends)
```
@time O(n log n)
@space O(n)
@deep
The sweep line version with two sorted lists:

```python
def min_meeting_rooms_sweep(intervals):
    starts = sorted(s for s, e in intervals)
    ends = sorted(e for s, e in intervals)
    rooms = best = j = 0
    for s in starts:
        while j < len(ends) and ends[j] <= s:   # meetings that ended free a room
            rooms -= 1
            j += 1
        rooms += 1
        best = max(best, rooms)
    return best
```
@test
assert min_meeting_rooms([[0, 30], [5, 10], [15, 20]]) == 2
assert min_meeting_rooms([[7, 10], [2, 4]]) == 1
assert min_meeting_rooms([]) == 0
assert min_meeting_rooms([[1, 5], [5, 8]]) == 1
assert min_meeting_rooms([[1, 10], [2, 7], [3, 19], [8, 12], [10, 20], [11, 30]]) == 4

### [2] Interval List Intersections
@lc 986
@ask Two lists of closed intervals are each sorted and non-overlapping. Return their intersections.
@eg [[0,2],[5,10]] and [[1,5],[8,12]]  ->  [[1,2],[5,5],[8,10]]
@tags intervals, two pointers
@hook Intersection = [max of starts, min of ends] if that is non-empty. Then move past whichever interval ends first.
@say
"I keep one pointer in each list. Two intervals intersect on the range from the larger start to the smaller end. If that start is at most that end, it's a real intersection and I add it.

Then I move forward in the list whose current interval ends first, because it can't intersect anything further in the other list. The other interval might still overlap the next one, so it stays.

O(m plus n) time, and O(m plus n) for the output."
@code
```python
def interval_intersection(first, second):
    i = j = 0
    result = []
    while i < len(first) and j < len(second):
        start = max(first[i][0], second[j][0])
        end = min(first[i][1], second[j][1])
        if start <= end:
            result.append([start, end])
        if first[i][1] < second[j][1]:     # drop the one that ends first
            i += 1
        else:
            j += 1
    return result
```
@time O(m + n)
@space O(m + n) for the output
@test
assert interval_intersection([[0, 2], [5, 10], [13, 23], [24, 25]], [[1, 5], [8, 12], [15, 24], [25, 26]]) == [[1, 2], [5, 5], [8, 10], [15, 23], [24, 24], [25, 25]]
assert interval_intersection([[1, 3], [5, 9]], []) == []
assert interval_intersection([[1, 7]], [[3, 10]]) == [[3, 7]]

### [2] Minimum Number of Arrows to Burst Balloons
@lc 452
@ask Each balloon covers [start, end] on the x-axis. An arrow shot at x bursts every balloon with start <= x <= end. Find the fewest arrows.
@eg [[10,16],[2,8],[1,6],[7,12]]  ->  2   (shoot at 6 and 12)
@tags intervals, greedy, sorting
@hook Sort by end. Shoot at the end of the first balloon not yet burst, because that point hits every balloon that has started by then.
@say
"This is the same greedy idea as keeping non-overlapping intervals. I sort the balloons by their end. The first balloon must be hit by some arrow, and shooting at its end is the best choice, because that point also hits every other balloon that has already started.

So I keep the position of the last arrow. For each balloon, if it starts after that position, it isn't burst yet, so I shoot a new arrow at its end. Otherwise it's already burst.

O(n log n) time and O(1) extra space."
@code
```python
def find_min_arrow_shots(points):
    points.sort(key=lambda p: p[1])          # by end
    arrows = 0
    arrow_x = float("-inf")
    for start, end in points:
        if start > arrow_x:                  # not burst yet
            arrows += 1
            arrow_x = end                    # shoot at its end
    return arrows
```
@time O(n log n)
@space O(1)
@test
assert find_min_arrow_shots([[10, 16], [2, 8], [1, 6], [7, 12]]) == 2
assert find_min_arrow_shots([[1, 2], [3, 4], [5, 6], [7, 8]]) == 4
assert find_min_arrow_shots([[1, 2], [2, 3], [3, 4], [4, 5]]) == 2
assert find_min_arrow_shots([]) == 0
