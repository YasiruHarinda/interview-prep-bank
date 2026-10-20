# Loop Ready Interview Bank

Interview question and answer bank for three tracks: Software Engineering, AI Engineering and DevOps Engineering. Every question has a spoken "Say this" answer, a one-line hook, and where useful a deeper dive with code, likely follow-ups, a common trap and a stand-out move. Questions are tagged Fundamentals, Intermediate or Advanced.

## Open it

- Double-click `Loop-Ready.html` to use it offline in any browser.
- Or run `node serve.mjs` and open http://localhost:4321.

Your "Got it" and "Review again" marks are saved in your browser only.

## Edit or add questions

Content lives in `content/<track>/*.md`, one file per section, read in file-name order. The format:

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

The number in `[ ]` is the level: 1 Fundamentals, 2 Intermediate, 3 Advanced. Track briefings live in `content/<track>/_track.md`.

## Build

```bash
node build.mjs
```

The build validates every question, prints counts per section and any warnings, and writes `dist/index.html` (the published page) and `Loop-Ready.html` (the offline copy). The app shell is `app/template.html`.
