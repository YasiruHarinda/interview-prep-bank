# Loop Ready Interview Bank

Interview question and answer bank for four tracks: Software Engineering, AI Engineering, DevOps Engineering and Algorithms. Every question has a spoken "Say this" answer, a one-line hook, and where useful a deeper dive with code, likely follow-ups, a common trap and a stand-out move. Questions are tagged Fundamentals, Intermediate or Advanced. Algorithm problems use Easy, Medium and Hard instead.

The Algorithms track is grouped by pattern (two pointers, sliding window, binary search, trees, graphs, dynamic programming and more). Each section starts with a pattern card. Each problem has a short statement, an example, the LeetCode number where there is one, the key idea, what to say out loud, a Python 3 solution, its time and space complexity, and edge cases. Every solution has hidden tests and all of them pass.

## Open it

- Double-click `Loop-Ready.html` to use it offline in any browser.
- Or run `node serve.mjs` and open http://localhost:4321.

Your "Got it" and "Review again" marks are saved in your browser only.

## Edit or add questions

Content lives in `content/<track>/*.md`, read in file-name order. A section can continue in another file: repeat the same `@section` id at the top of that file. The format:

```text
@section id | Section title
@blurb One line shown under the section title.

### [2] The question text?
@tags tag one, tag two
@hook One memorable line.
@say
The answer you would say out loud. Markdown-lite: **bold**, `code`, lists, tables, fenced code.
@deep
Optional extra detail, code and tables.
@follow A likely follow-up question?
Its short answer.
@trap
Optional common mistake.
@pro
Optional stand-out tip.
```

The number in `[ ]` is the level: 1 Fundamentals, 2 Intermediate, 3 Advanced (Easy, Medium, Hard on the Algorithms track). Track briefings live in `content/<track>/_track.md`.

Algorithm problems add these fields:

```text
### [2] Two Sum
@lc 1
@ask The problem statement, shown on the card before it opens.
@eg nums = [2,7,11,15], target = 9  ->  [0,1]
@code
(one fenced python block: the solution)
@time O(n)
@space O(n)
@test
assert two_sum([2, 7, 11, 15], 9) == [0, 1]
```

`@test` is plain Python that runs after `@code`. It never appears on the page. Tests can use `ListNode`, `TreeNode`, `build_list`, `list_vals`, `build_tree`, `tree_vals` and `find_node`, defined in `app/test-runner.html`.

## Build

```bash
node build.mjs
```

The build validates every question, prints counts per section and any warnings, and writes `dist/index.html` (the published page), `Loop-Ready.html` (the offline copy) and `dist/tests.json` (the solutions and their tests). The app shell is `app/template.html`.

## Test the solutions

Python doesn't need to be installed. Run `node serve.mjs` and open http://localhost:4321/test. The page loads Pyodide (Python in the browser) from jsDelivr and runs every solution against its tests. Add `?only=binary search` to run only the problems whose title or section contains that text.
