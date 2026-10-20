@section git | Git and Version Control
@blurb Branching for continuous delivery, protecting main, undoing mistakes and handling the leaked-secret emergency.

### [1] Merge, rebase or squash: which do you use and why?
@tags git, merge, rebase
@hook Rebase your own branch to stay current, squash-merge into main for one clean commit per change, and never rewrite shared history.
@say
"All three integrate work, with different effects on history.

A merge commit preserves the full history of both branches exactly as it happened. It's safe and honest, but main fills with merge commits and small 'fix typo' commits.

Rebasing replays my commits on top of the latest main, giving a linear history. It rewrites commit hashes, so I only rebase branches that nobody else is working on.

Squash merging combines all of a pull request's commits into a single commit on main. Main then has one meaningful commit per change, which makes the history readable, makes reverting a whole feature a single git revert, and maps neatly to deployments.

My usual setup for a service with continuous delivery: developers rebase their short-lived branches on main to resolve conflicts early, and pull requests are squash-merged with a descriptive message. I'd enforce it with repository settings, so it's consistent rather than a matter of taste."

### [1] How do you undo a bad commit that's already on main?
@tags git, revert, rollback
@hook On shared branches, git revert: it adds a new commit that undoes the change, so history stays intact and everyone stays in sync.
@say
"On a shared branch like main, I use git revert with the commit's hash. It creates a new commit that applies the inverse of the bad change, so history is preserved, nobody else's clone breaks, and the revert itself goes through the normal pull request and pipeline. With GitOps, that's also how a deployment rollback works: revert the commit and the cluster syncs back.

For a merge commit, revert needs the -m option to say which parent is the mainline.

git reset, by contrast, moves the branch pointer backwards and discards commits from history. That's fine for cleaning up my own local, unpushed work, but on a shared branch it requires a force push, which rewrites history under everyone else, and branch protection should block it anyway.

If something is urgent in production, the fastest safe path is usually rolling back the deployment to the previous artefact first, and then reverting the commit, so the code and the running system agree."

### [1] Trunk-based development or GitFlow? Which supports continuous delivery better?
@tags branching strategy, ci, cd
@hook Trunk-based: small changes merged to main daily, behind feature flags. It's what continuous delivery needs. GitFlow suits scheduled, versioned releases.
@say
"Trunk-based development supports continuous delivery much better. Everyone merges small, short-lived branches into main at least daily; main is always releasable; incomplete features hide behind feature flags rather than living on long branches. That keeps integration pain low, keeps the pipeline the single path to production, and the DORA research links it to higher delivery performance.

GitFlow uses long-lived develop and release branches with feature and hotfix branches. It fits products with planned, versioned releases and multiple supported versions in the field, like installed software or SDKs. For web services deploying continuously, it adds merge overhead, delays integration, and makes 'what's in production' harder to answer.

Trunk-based development needs some prerequisites: a fast, reliable CI pipeline, good automated tests, branch protection so main stays green, and feature flag discipline, including removing old flags."

### [2] Someone committed a secret to a Git repository. What do you do?
@tags security, secrets, incident
@hook Rotate it first, immediately. Then investigate usage, clean the history if needed, and add scanning so it can't happen again.
@say
"The first step is to treat the secret as compromised and revoke or rotate it immediately, because once it's been pushed, it may already have been cloned, cached or scraped. Automated bots scan public repositories for keys within minutes. Rewriting history doesn't un-leak it.

Then: check the provider's audit logs for any use of the credential between the push and the rotation, like unexpected API calls or resources created, and treat any suspicious activity as a security incident.

After that, clean up: remove the secret from the code and load it from a secrets manager or environment variable instead. If needed, for example for a public repository or policy reasons, remove it from history with git filter-repo or BFG, force-push with coordination, and ask the hosting provider to purge cached views. Everyone must re-clone afterwards.

Finally, prevention: enable secret scanning with push protection on the hosting platform, add a pre-commit hook like gitleaks, keep .env files in .gitignore, and prefer short-lived credentials, like OIDC federation in pipelines, so there's less to leak in the first place. And a blameless conversation, since it's a process gap, not a person to punish."

### [1] What are Git hooks, and how do you use them?
@tags git hooks, pre-commit, automation
@hook Scripts Git runs at certain points, like before a commit or push. Great for fast local checks; never a substitute for CI.
@say
"Git hooks are scripts that Git runs automatically at specific points: pre-commit before a commit is created, commit-msg to validate the message, pre-push before pushing, and server-side hooks like pre-receive on the Git server.

I use client-side hooks for fast feedback: formatting and linting changed files, detecting secrets with gitleaks, validating YAML and Terraform formatting, and enforcing commit message conventions. The pre-commit framework makes hooks shareable and versioned in the repository, so the whole team runs the same checks.

The limitation is that client-side hooks are optional: developers can skip them with --no-verify, or simply not install them. So everything important also runs in the CI pipeline, and the hooks are a convenience that catches problems before CI does. Hooks should be fast, a few seconds, or people will bypass them."

### [2] How do you protect the main branch?
@tags branch protection, governance, ci
@hook Require pull requests, passing checks, reviews from code owners, signed or verified commits if needed, and no force pushes, including for admins.
@say
"I use the hosting platform's branch protection or rulesets on main. Pull requests are required, so no direct pushes. Required status checks must pass: build, tests, linting, security scans and, for infrastructure, a Terraform plan. At least one approving review is required, with CODEOWNERS so changes to sensitive areas, like infrastructure, pipeline definitions or security config, need approval from the owning team. Stale approvals are dismissed when new commits are pushed. Force pushes and branch deletion are blocked. Branches must be up to date, or a merge queue tests the combined result before merging, which avoids 'green individually, broken together' situations.

For higher assurance, I'd add signed commits, protection on the pipeline definitions themselves, so a pull request can't quietly change the deploy workflow to skip checks, and audit logging.

Admins should follow the same rules, with emergency bypass being explicit and logged rather than routine."

### [2] How do you version and tag releases in a pipeline?
@tags versioning, releases, tags
@hook Every build gets a unique, traceable version (commit SHA); releases get semantic version tags, ideally automated from commit messages.
@say
"Every artefact the pipeline builds gets a unique, immutable identifier that traces back to the source, typically the Git commit SHA, used as the container image tag. That's what gets deployed, so I can always answer 'exactly which code is running?'. I avoid deploying mutable tags like latest, because the same tag can point to different images over time; for full immutability, deployments can pin the image digest.

For human-facing releases, especially libraries, APIs and products, I use semantic versioning with Git tags like v2.4.0. To avoid manual mistakes, it can be automated with conventional commit messages, like 'feat:' or 'fix:', and a tool like semantic-release or release-please, which works out the next version, creates the tag, generates the changelog and publishes the release.

The pipeline also records metadata: build number, commit, branch, who triggered it and the test results, and attaches labels or annotations to images, so you can trace from a running pod back to the pull request that produced it."

### [2] How do you find which commit introduced a regression?
@tags git bisect, debugging
@hook git bisect: binary search through history. Mark a good and a bad commit, test the midpoint, repeat. With a test script it runs itself.
@say
"I use git bisect, which performs a binary search through the commit history. I start it, mark the current commit as bad, and mark an older commit where things worked as good. Git checks out the commit halfway between them; I test it and mark it good or bad, and it halves the range again. Even across a thousand commits, it takes about ten steps to find the exact commit that introduced the problem.

If the check can be scripted, like running a specific test or a curl against a locally started service, git bisect run with that script automates the whole search. When it finishes, git bisect reset returns to where I started.

It works best with small, atomic commits that each build and pass tests, which is another argument for squash-merged pull requests on main. In operations, the same idea applies to deployments: if a problem started 'sometime this week', comparing the deploy history with the onset of the problem in the metrics often narrows it down just as fast."
