@section process | Git, CI/CD and Ways of Working
@blurb Version control, delivery pipelines and agile rituals, from the developer's side of the desk.

### [1] Git merge vs rebase. When do you use each?
@tags git
@hook Merge keeps history exactly as it happened. Rebase rewrites your commits on top of the latest base for a clean line. Never rebase shared history.
@say
"Both integrate changes from one branch into another.

Merge creates a merge commit that ties the two histories together. It's non-destructive, history shows exactly what happened, and it's safe on shared branches. The downside is a busier history with lots of merge commits.

Rebase replays my commits one by one on top of the target branch, as if I'd started my work from its latest commit. The result is a clean, linear history that's easier to read and bisect. But it rewrites commit hashes, so the golden rule is: never rebase commits that others have already pulled, because their history will diverge from yours.

My usual workflow: I rebase my local feature branch on main to keep it current and tidy, maybe squashing fixup commits with an interactive rebase, then merge into main through a pull request, often with squash merge so main has one commit per feature."
@deep
```bash
# Keep a feature branch up to date with main
git fetch origin
git rebase origin/main          # resolve conflicts, then: git rebase --continue
git push --force-with-lease     # safer than --force: refuses if someone else pushed
```
`--force-with-lease` is the detail interviewers like to hear.

### [1] git reset vs git revert vs git restore?
@tags git
@hook Revert adds a new commit that undoes an old one, so it's safe on shared branches. Reset moves the branch pointer and can throw away history.
@say
"git revert creates a new commit that applies the inverse of an earlier commit. History is preserved, so it's the safe way to undo something that's already been pushed and shared, like a bad change on main.

git reset moves the current branch pointer to another commit. With soft, the changes from the removed commits stay staged. With mixed, the default, they stay in the working directory unstaged. With hard, they're discarded completely. Reset is fine for cleaning up local, unpushed commits, but on shared branches it rewrites history.

git restore is for files: discarding uncommitted changes in the working directory or unstaging a file. It's the modern, clearer replacement for those uses of checkout.

And if I ever lose commits after a bad reset, git reflog shows where HEAD has been, so I can usually recover them."

### [1] How do you resolve a merge conflict?
@tags git, collaboration
@hook Understand both sides before choosing, resolve, run the tests, and talk to the other author when the intent is unclear.
@say
"A conflict happens when two branches changed the same lines, or one deleted a file the other modified, and Git can't decide automatically.

Git marks the conflicting sections in the file with the two versions. I don't just pick 'mine' or 'theirs'; I read both changes to understand the intent of each, because the right answer is often a combination. If it's not obvious, I talk to the person who wrote the other change. Then I edit the file to the correct result, remove the markers, stage it and continue the merge or rebase. Crucially, I build and run the tests afterwards, because code can merge cleanly and still be broken.

To reduce conflicts in the first place: small, short-lived branches, merging main into my branch often, and agreeing on formatting with an automatic formatter so whitespace changes don't create noise."

### [2] GitFlow vs trunk-based development?
@tags git, branching strategy, ci
@hook GitFlow: long-lived develop and release branches for scheduled releases. Trunk-based: everyone merges small changes to main daily, behind feature flags.
@say
"GitFlow uses several long-lived branches: main for production releases, develop for integration, plus feature, release and hotfix branches. It suits software with scheduled, versioned releases, like installed desktop apps or libraries supporting several versions. The downside is long-lived branches that drift apart, painful merges and slower delivery.

Trunk-based development has everyone integrate small changes into main, the trunk, at least daily, through short-lived branches and pull requests. Incomplete features are hidden behind feature flags rather than kept on branches. Main is always releasable, which is what enables continuous delivery.

For web services and SaaS, I'd recommend trunk-based development. The research behind the DORA metrics links it to higher delivery performance. It requires good automated tests and CI, because main must stay green, and feature flags need cleanup discipline."

### [1] What is CI/CD from a developer's point of view?
@tags ci, cd, devops
@hook CI: every change is built and tested automatically. CD: every passing change is ready to release, or released automatically.
@say
"Continuous integration means every developer merges small changes into the main branch frequently, and each change automatically triggers a build and a test run. Problems are found within minutes of being introduced, while the change is still fresh in your head, instead of in a painful integration phase weeks later.

Continuous delivery extends that: every change that passes the pipeline is automatically packaged and deployed to staging, so it's always ready to go to production at the push of a button. Continuous deployment goes one step further and releases every passing change to production automatically, with no manual gate.

As a developer, it changes how I work: small pull requests, keeping main green, writing tests as part of the feature, and treating a broken build as the top priority. A typical pipeline runs linting, unit tests, a build, security scans, integration tests, building a container image, deploying to staging, smoke tests, and then a gated or automatic production deploy, often as a canary."

### [1] Agile, Scrum and Kanban. What's the difference?
@tags agile, scrum, kanban
@hook Agile is the mindset. Scrum is a framework with sprints and roles. Kanban is continuous flow with work-in-progress limits.
@say
"Agile is a set of values from the Agile Manifesto: deliver working software in small increments, collaborate closely with customers, and respond to change rather than following a rigid plan.

Scrum is a specific framework for doing it. Work happens in fixed sprints, usually two weeks. There are three roles: the product owner, who owns and prioritises the backlog; the Scrum master, who facilitates and removes blockers; and the developers. And there are set events: sprint planning, a short daily stand-up, a sprint review to demo the work, and a retrospective to improve the process.

Kanban is about continuous flow. Work items move across a board through columns like to do, in progress, review and done, with limits on how many items can be in progress at once. There are no sprints; the focus is on finishing work and measuring cycle time. It suits teams with unpredictable incoming work, like support or platform teams.

Many teams mix them. What matters more than the label is delivering in small increments and actually acting on retrospectives."

### [2] How do you estimate work? What are story points?
@tags estimation, planning
@hook Estimate relative size, break big things down, include uncertainty, and track actuals to calibrate.
@say
"Story points are a relative measure of effort, complexity and uncertainty, not hours. The team compares a new story to reference stories, 'this is about twice as big as that one', often using a Fibonacci-like scale such as 1, 2, 3, 5, 8, 13, where the gaps grow because uncertainty grows with size. Planning poker, where everyone reveals estimates at once, avoids anchoring and surfaces disagreements, which usually reveal missing information.

For my own estimates, I break work into small tasks I understand, identify unknowns and spike them first if they're big, and include the work people forget: tests, code review, deployment, documentation and buffer for surprises. I give ranges when uncertain, like three to five days.

Over time, the team's velocity, the points actually completed per sprint, helps forecast. And when an estimate turns out wrong, I flag it early rather than at the deadline."

### [1] What is semantic versioning?
@tags versioning, releases
@hook MAJOR.MINOR.PATCH: breaking change, new feature, bug fix.
@say
"Semantic versioning uses three numbers, major dot minor dot patch, like 2.4.1. You increment the patch version for backwards-compatible bug fixes, the minor version for new backwards-compatible features, and the major version for breaking changes. Pre-releases can be tagged, like 3.0.0-beta.1.

It's a promise to consumers of a library or API: upgrading from 2.4.1 to 2.5.0 should be safe, but 3.0.0 might require code changes. Package managers rely on it for version ranges, such as caret 2.4.0 in npm, meaning any 2.x from 2.4.0 up.

In practice, I pin exact versions with lock files for reproducible builds and use automated tools like Dependabot or Renovate to propose upgrades, so updates are deliberate and tested rather than surprises."

### [2] What are feature flags, and what are the risks?
@tags feature flags, releases
@hook Ship code dark and turn it on with config. Decouples deploy from release. The risk is flag debt.
@say
"A feature flag is a runtime switch that turns a feature on or off without deploying new code. It separates deployment, putting code in production, from release, exposing it to users.

That enables several things: merging unfinished work to main safely in trunk-based development; gradual rollouts, like 1 percent, then 10, then 100 percent of users; targeting specific users or beta testers; A/B experiments; and kill switches to turn off a misbehaving feature instantly without a rollback.

The risks are flag debt, meaning old flags that nobody removes and that multiply the code paths, so every flag needs an owner and an expiry plan; complexity in testing combinations of flags; and the flag service becoming a dependency, so I'd use sensible defaults if it's unavailable. Tools like LaunchDarkly, Unleash or OpenFeature-compatible providers handle the targeting and auditing."
