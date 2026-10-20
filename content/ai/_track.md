@track ai
@name AI Engineering
@brief
- 2026 AI engineer loops are about **building and running LLM systems**. One guide estimates classic ML topics are about a quarter of technical rounds; **RAG, evals, production prompting and agent design** fill most of the rest.
- Expect a **project deep dive** ("walk me through an AI system you shipped"), an **LLM system design** (support assistant, enterprise search, tool-using agent) and a **build or debug task** (chunking, retrieval, reranking, output parsing, an eval harness). Some labs still ask you to implement attention from scratch.
- Interviewers reward separate retrieval and generation metrics, explicit eval gates before shipping, cost and latency budgets, least-privilege tools, and knowing when **not** to use an agent.
- **MCP** questions are now common. The current spec revision (2026-07-28) made the protocol stateless, so know both the old handshake model and the new one.
@tips
- **Always talk about evaluation.** How would you know it works, and how would you know it broke?
- **Put numbers on cost and latency:** tokens per request, time to first token, cost per 1,000 requests.
- **Treat the model as an unreliable dependency:** validate, retry with limits, fall back.
- **Climb the ladder only when needed:** prompt, then RAG, then fine-tune, then agent.
- **In project stories,** separate what the team did from what you did.
