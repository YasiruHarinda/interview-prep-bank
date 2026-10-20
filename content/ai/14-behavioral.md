@section aibehav | Behavioral Questions for AI Roles
@blurb STAR stories with an AI twist: failures, trade-offs, ethics and explaining uncertainty. Swap in your own facts and keep the shape.

### [1] Tell me about a time an AI feature behaved badly. What did you do?
@tags failure, incident, ownership
@hook Own it, show how you detected it, how you contained it, how you found the root cause, and the eval or guardrail that now prevents it.
@say
"In our tutoring assistant pilot, a tutor flagged that the assistant had told a student their code was correct when it didn't even compile.

I treated it as an incident. First, containment: we switched feedback to 'draft for tutor review' mode for that course the same day, so nothing reached students unreviewed. Then I pulled traces for all feedback generated that week and found the pattern: about 1 in 20 submissions with syntax errors got positive feedback. The root cause was that the model only saw the source code and the rubric, never the compiler output, so it judged the code by appearance.

The fix had two parts: we ran every submission through the compiler and tests first and put the results into the context as ground truth, and added a verification step that rejected feedback contradicting the test results. I added 40 broken-code cases to the eval set as a hard gate.

On the expanded eval set, the false-praise rate dropped to zero, and we re-enabled direct feedback a week later. The lesson I took is that the model should never be the only source of truth for facts we can check deterministically."

### [1] How do you explain the limitations of LLMs to non-technical stakeholders?
@tags communication, stakeholders, expectations
@hook Use a human analogy, give concrete numbers from your own evals, and turn limitations into product decisions.
@say
"I avoid both hype and jargon. A framing that works well is: 'Think of it as a very fast, well-read new hire who's sometimes confidently wrong. It's great at drafting, summarising and answering common questions, but it needs clear instructions, access to the right documents, and someone checking its work on anything important.'

Then I make it concrete with our own numbers rather than general claims: 'On 300 real customer questions, it answered 88 percent correctly, said it didn't know on 8 percent, and got 4 percent wrong, mostly on questions about older policies.'

And I turn the limitations into decisions they can make: 'If we launch for billing questions only, with a human reviewing refunds, the expected wrong-answer rate is under 1 percent. Do you want to start there?' Stakeholders don't need to understand transformers; they need to understand the risk, the cost and the options."

### [2] Tell me about a time you decided not to use AI, or chose a simpler solution.
@tags judgement, simplicity
@hook Show that you choose the tool for the problem, with evidence, even when the shinier option is available.
@say
"A team wanted an LLM to route incoming support emails into eight categories, and the plan was to build an agent that read each email and decided where to send it.

Before building anything, I looked at the data. About 70 percent of emails could be routed by simple signals, like the sender's form, keywords and the product field. For the rest, I compared a small fine-tuned classifier with an LLM prompt on a labelled sample of 500 emails. The classifier reached 94 percent accuracy at a tiny fraction of the cost and latency, and the LLM wasn't meaningfully better.

So we shipped rules plus the small classifier, with an LLM only as a fallback for low-confidence cases, about 5 percent of traffic. It cost a small fraction of the original plan, ran in milliseconds and was easy to debug. The team was initially disappointed it wasn't 'more AI', but the results won them over. My takeaway: the job is to solve the problem reliably, and AI is one tool among several."

### [2] Tell me about a time you had to balance quality against shipping speed.
@tags trade-offs, prioritisation
@hook Make the trade-off explicit, ship a bounded version with guardrails, and keep improving with data from real usage.
@say
"We had a demo deadline for a document Q&A feature, and our evals showed it handled simple lookups well but struggled with questions needing information from several documents, around 60 percent accuracy on those.

Rather than delaying everything or shipping it as if it were finished, I proposed scoping the launch: enable single-document questions, which were at 92 percent on our evals, and for multi-document questions, show the retrieved sources with a note that the answer may be incomplete, plus a feedback button. I documented the known limitation and the plan to address it.

We hit the deadline, and the feedback data from real users turned out to be valuable: it showed that the multi-document questions users actually asked were different from the ones we'd written. Two sprints later, using those real examples to tune query decomposition, we got multi-document accuracy to 85 percent and removed the warning. Shipping a bounded version early gave us better data than more weeks of guessing would have."

### [2] Tell me about a time you raised an ethical or safety concern about an AI system.
@tags ethics, responsible ai, courage
@hook Raise it early, with evidence, and with a constructive alternative. Focus on the people affected.
@say
"In a project to summarise student feedback forms for lecturers, I noticed during testing that the summaries sometimes included details that could identify individual students, like a reference to 'the only mature student in the tutorial group', even though the forms were supposed to be anonymous.

I raised it with the project lead before launch, with five concrete examples rather than a vague worry. I framed it around the students' trust: if they felt they could be identified, they'd stop giving honest feedback, which would defeat the purpose.

I proposed a fix: a redaction step for identifying details before summarisation, an instruction and an output check against identifying specifics, plus a minimum group size below which no summary is generated. We also added a privacy test set to the evals.

The lead agreed, and it delayed the launch by a week. Afterwards the faculty adopted the minimum-group-size rule for other survey tools too. What I learned is that concerns land better with evidence and a solution than as objections."

### [2] How do you work with domain experts to define what "good" looks like?
@tags collaboration, evaluation, domain experts
@hook Involve experts early, turn their judgement into rubrics and labelled examples, measure agreement, and make reviewing easy for them.
@say
"I treat domain experts as co-owners of quality, because in most AI products the engineer can't judge correctness alone.

Early on, I sit with them and review real outputs together. I ask them to explain why an answer is good or bad, and I turn those explanations into explicit criteria. For a tutoring system, the tutors' criteria became rubric items like 'identifies the most important error first', 'doesn't give away the solution' and 'is encouraging but specific'.

Then I ask them to label a set of examples, a hundred or two, and if there are several experts, I measure how much they agree, because disagreements usually reveal criteria that need sharpening. Those labels become the eval set and the calibration data for an LLM judge.

I keep their effort low and their impact visible: a simple review interface, short sessions, and showing them how their feedback changed the system's scores. Experts stay engaged when they see their judgement shaping the product, rather than just being asked to label data."
