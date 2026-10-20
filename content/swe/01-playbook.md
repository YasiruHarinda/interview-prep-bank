@section playbook | The Interview Playbook
@blurb The meta-game. How to open, how to run a coding or design round, and how to close.

### [1] Tell me about yourself.
@tags opener, pitch
@hook Present, past, future in about 90 seconds. End on why this role.
@say
"I'm a software engineer who likes building things people actually use. Right now I'm [finishing my degree in X / working at Y], and my strongest area is [backend and cloud]. Most recently I built [project], a [one-line description], where I owned [the API design and the CI/CD pipeline] and [cut deployment time from a manual process to under ten minutes].

Before that I [internship or earlier project], which taught me [a concrete skill, like writing production code with tests and code review].

What I'm looking for now is a team where I can ship real features and learn from strong engineers. That's why this role stood out: [one specific reason about their product or engineering]."
@deep
The structure is **Present, Past, Future**:

1. **Present:** who you are professionally and what you are doing now.
2. **Past:** one or two highlights, each with a number (users, latency, time saved, grade, ranking).
3. **Future:** what you want next and why this company fits.

Tailor the highlights to the role. For a backend role, lead with APIs and databases. For an AI role, lead with the model or RAG project. For DevOps, lead with the pipeline or the cluster.

Keep it to 60 to 90 seconds. Practise it out loud with a timer until it sounds natural, not memorised.
@follow Why did you choose software engineering?
Give a real, short origin plus what keeps you in it: "I got hooked when a small script I wrote saved my team hours every week. What keeps me here is that feeling of turning a messy problem into something reliable that other people depend on."
@trap
Reciting your CV line by line, or starting from school days. They have your CV. They want the story and the direction.
@pro
End with a hook they can pull: "Happy to go deeper on how we cut the build time." You steer the next ten minutes toward your strongest story.

### [1] How do you approach a coding problem in an interview?
@tags coding round, process
@hook Clarify, example, brute force, optimise, code, test. Talk the whole way.
@say
"I use the same six steps every time.

First, I restate the problem and ask clarifying questions: how big is the input, can there be duplicates or negatives, what if it's empty, what should I return if there's no answer.

Second, I work through a small example by hand, including one edge case.

Third, I say the brute-force solution and its complexity out loud, even if I won't code it, so we have a baseline.

Fourth, I find the bottleneck and optimise, usually with a better data structure: a hash map to remove a nested loop, a heap for top-k, two pointers on sorted data. I confirm the approach with the interviewer before writing code.

Fifth, I write clean code with clear names and narrate as I go.

Finally, I test: I trace my example through the code, check the edge cases, and state the final time and space complexity."
@deep
Pattern spotting. When you see the signal on the left, try the tool on the right:

| Signal in the problem | Try this |
|---|---|
| Sorted array, or "find a target" | Binary search, two pointers |
| "Top k", "k largest", "k closest" | Heap of size k |
| Contiguous subarray or substring | Sliding window, prefix sums |
| All combinations, subsets, permutations | Backtracking |
| Shortest path, unweighted | BFS |
| Dependencies or ordering | Topological sort |
| Overlapping subproblems, "number of ways" | Dynamic programming |
| Fast lookups, "seen before?" | Hash map or set |
| Matching brackets, "next greater element" | Stack |
| Connected components, grouping | DFS, BFS or Union-Find |

Constraint hints: n up to about 10^5 means you need O(n log n) or better. n up to 20 means exponential (2^n) might be fine.
@follow What if you can't find the optimal solution in time?
Code the brute force cleanly and correctly, state its complexity, and explain where the bottleneck is and what you would try next. A working, well-tested simple solution beats a half-finished clever one.
@follow How do you pick test cases?
A normal case, the smallest input (empty, one element), duplicates, negative numbers or zero, already sorted or reverse sorted, and the largest input size for performance.
@trap
Typing within the first minute. Interviewers read it as guessing, and you often end up solving the wrong problem.
@pro
Write two or three test cases before you code and check them afterwards. It signals the discipline they want on their team.

### [2] How do you approach a system design interview?
@tags system design, process
@hook Requirements, numbers, API, data model, high-level design, deep dive, trade-offs. You drive.
@say
"I treat it like a design review that I'm leading.

I start with requirements: the functional ones, meaning what the system must do, and the non-functional ones, like scale, latency, availability and consistency.

Then I do quick back-of-the-envelope maths: requests per second, storage per year, read-to-write ratio. Those numbers drive every later decision.

Next I define the API and the core data model. Then I sketch a simple end-to-end design: clients, load balancer, stateless services, database, cache, and a queue if there's async work.

Once that works, I either ask which part they want to explore or pick the hardest part myself, like scaling the database or handling hot keys.

The whole time I call out trade-offs explicitly, for example: 'I'm choosing eventual consistency for the feed, because availability matters more here than seeing a post within one second.' I finish with bottlenecks, failure modes and monitoring."
@deep
A 45-minute budget:

| Minutes | What you do |
|---|---|
| 0 to 5 | Functional and non-functional requirements, scope |
| 5 to 10 | Estimates: users, QPS, storage, bandwidth |
| 10 to 15 | API and data model |
| 15 to 25 | High-level design, end to end |
| 25 to 40 | Deep dive: scaling, consistency, failures |
| 40 to 45 | Bottlenecks, monitoring, what you would do next |

Numbers worth memorising:
- 1 day is about 86,400 seconds, call it 10^5. So 1 million requests per day is about 12 per second.
- Main memory reference: about 100 ns. SSD random read: about 100 microseconds. Round trip inside a data centre: about 0.5 ms. Round trip across continents: about 150 ms.
- One well-tuned relational database node handles a few thousand to tens of thousands of simple queries per second. One Redis node handles around 100k operations per second.
@follow What if the interviewer keeps changing requirements?
That is the test. Acknowledge the change, say what it breaks in your current design, and adapt the specific component instead of starting over. "If we now need global users, the single-region database becomes the bottleneck, so I'd add read replicas per region and route writes to a primary."
@trap
Drawing fifteen boxes (Kafka, Redis, Cassandra, Elasticsearch) before agreeing on requirements. Buzzwords without a reason lose points.
@pro
Derive decisions from numbers out loud: "100 million daily users times 10 reads is a billion reads a day, roughly 12,000 a second on average and maybe 3x at peak. One database won't serve that, so caching is required, not optional."

### [2] The interviewer lets you use an AI assistant in the coding round. How do you use it well?
@tags ai-assisted, coding round, 2026
@hook You are the engineer and the AI is a fast junior. Decompose, delegate, verify, narrate.
@say
"I spend the first few minutes without the AI: restating the problem, asking about edge cases and sketching the functions and data flow, so I know exactly what I want before I prompt anything.

Then I use the assistant where it's strongest: boilerplate, test scaffolding, or an API whose exact signature I don't remember. I keep the core logic under my own control.

I read every suggestion before I accept it and say what I'm checking, like 'this is close, but it doesn't handle an empty list, so I'll fix that.' When something fails, I diagnose it rather than re-prompting blindly.

And I verify behaviour, not just compilation: I run it on sample input and add a couple of small tests for edge cases the AI missed. I treat it like pairing with a very fast junior developer. Helpful, but I own the design and the correctness."
@deep
What interviewers grade in AI-allowed rounds (from 2026 candidate reports and platform guidance):
- Did you decompose the problem before prompting?
- Did you know what you wanted before you asked?
- Did you read the output critically?
- Did you verify behaviour, not just that it compiles?
- How did you react when the AI was wrong?

Useful lines to say out loud:
- "I'm asking for a function that does X; I want to check how it handles the boundary."
- "I'll skip the AI here; the logic is small and I want full control of it."
- "Let me write the test first so I'm sure I understand the requirement."
@follow What if the AI gives you wrong code with total confidence?
Say so, explain why it's wrong, then fix it or write that part yourself. Never defend AI output you haven't verified. Catching the AI's mistake is one of the best signals you can give in this format.
@follow Some companies still ban AI in interviews. How do you prepare for both?
Practise a couple of weeks without any assistant before an AI-free loop. The process is the same either way: clarify, plan, implement, verify.
@trap
Pasting output without reading it, or re-prompting until something passes. Reports from AI-allowed rounds list these as the top reasons candidates get rejected.
@pro
Write a failing test first and ask the AI to make it pass. It shows you define correctness before you trust generation.

### [1] What do you do when you get stuck during an interview?
@tags coding round, communication
@hook Get unstuck out loud: shrink the problem, use examples, reread constraints, ask a sharp question.
@say
"First, I say that I'm stuck and exactly what I'm stuck on, because silence helps nobody.

Then I use a few tactics. I go back to a small concrete example and solve it by hand, watching what I actually do. I reread the constraints: an input size of 10^5 tells me I need roughly O(n log n), and sorted input hints at binary search or two pointers. I try a simpler version of the problem, like dropping one constraint. And I run through my mental list of data structures: would a hash map, heap or stack help here?

If I'm still stuck after a couple of minutes, I ask a targeted question, like 'am I right that the output order doesn't matter?' Taking a hint well is a positive signal. Going quiet for ten minutes is not."
@trap
Pretending you're fine and going silent. They cannot give credit for thinking they cannot hear.

### [1] Why do you want to work here?
@tags opener, motivation
@hook Them, you, and the overlap. Specific enough that it couldn't be pasted into another company's interview.
@say
"Three reasons. First, the product: [what they build and for whom], and [a specific detail you noticed or used]. Second, the engineering: I read [their engineering blog post, talk or open-source repo] about [topic], and that's exactly the kind of problem I want to work on. Third, the fit with where I'm heading: I've been building [related experience], and this role lets me go deeper on [skill] at real scale. So it's not just a job I could do. It's the one where I'd learn the most and contribute fastest."
@trap
"You're a great company with a great culture." Generic answers tell them you did not prepare.
@pro
Mention one concrete detail from their engineering blog, changelog or a recent launch. Twenty minutes of research puts you ahead of most candidates.

### [1] What is your greatest weakness?
@tags behavioral, self-awareness
@hook A real, job-relevant weakness, the system you built to manage it, and proof it's working.
@say
"Earlier on, I tended to over-polish work before sharing it. I'd spend an extra day refactoring code nobody had reviewed yet, and once I found out late that I'd misunderstood a requirement.

So I changed how I work. Now I open a draft pull request within about a day and share a rough design before building anything big. On my last project that caught two misunderstandings in the first week instead of the last. I still care a lot about quality, but now I get feedback before I polish, not after."
@trap
Humble-brags like "I'm a perfectionist" with no evidence of change. Also avoid weaknesses that are the core of the job, like "I struggle with debugging."

### [1] What are your salary expectations?
@tags recruiter, negotiation
@hook Research the band, delay the number if you can, and give a range anchored at the top of the market.
@say
"I'd like to learn more about the role and the team before I put a firm number on it, and I'm sure we can find something fair. Could you share the budgeted range for this position?

[If they press:] Based on my research for this role and level in [city or remote market], I'm looking at a range of [X to Y]. I'm flexible depending on the total package, including equity, learning budget and growth path."
@deep
- Research first: levels.fyi, Glassdoor, local salary surveys, people in your network.
- Many regions now require employers to publish salary bands. Ask for it.
- Give a range whose bottom is a number you are genuinely happy with.
- Discuss pay with the recruiter, not in the technical rounds.
@trap
Naming a low number early because you are nervous. The first number spoken tends to anchor the whole negotiation.

### [1] Do you have any questions for us?
@tags closer
@hook Always yes. Ask about the work, the team, and how success is measured.
@say
"Yes, a few. What would success look like in this role after six months? What's the biggest technical challenge the team is facing right now? How does the team decide what to build, and how much say do engineers have? How do code review and on-call work here? And what do you personally enjoy most about working on this team?"
@deep
Good categories:
- **The work:** current challenges, roadmap, what a typical week looks like.
- **The team:** code review, testing culture, on-call, how decisions are made.
- **Growth:** mentorship, how promotions work, learning time.
- **The interviewer:** what they enjoy, what surprised them when they joined.

Save salary and leave questions for the recruiter.
@trap
"No, I think you covered everything." It reads as low interest.
@pro
Ask a follow-up to something the interviewer mentioned earlier. It proves you were listening, which is half of what they are testing.
