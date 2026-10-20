@section testing | Testing, Code Quality and Debugging
@blurb How you prove code works, keep it clean, and find out why it does not.

### [1] Unit vs integration vs end-to-end tests. What is the testing pyramid?
@tags testing, pyramid
@hook Many fast unit tests at the base, fewer integration tests in the middle, a handful of end-to-end tests at the top.
@say
"Unit tests check one small piece, like a function or class, in isolation, with dependencies replaced by fakes. They run in milliseconds, so you can have thousands, and they pinpoint failures exactly.

Integration tests check that several pieces work together for real, like my repository against an actual database in a container, or a service calling a real message broker. They're slower but catch problems unit tests can't, like a wrong SQL query or a serialisation mismatch.

End-to-end tests drive the whole system like a user, through the UI or public API, across real services. They give the most confidence that a critical flow works, but they're slow, expensive to maintain and more prone to flakiness.

The testing pyramid says to have many unit tests, a moderate number of integration tests, and few end-to-end tests covering only the critical user journeys, like sign-up and checkout. The anti-pattern is the ice-cream cone: mostly manual or end-to-end tests, which makes feedback slow and the suite brittle."
@deep
| | Unit | Integration | End-to-end |
|---|---|---|---|
| Scope | One function or class | A few components with real infrastructure | The whole system |
| Speed | Milliseconds | Seconds | Seconds to minutes |
| Flakiness | Very low | Low to medium | Higher |
| Finds | Logic bugs | Wiring, queries, contracts | Broken user journeys |
| Tools | xUnit, JUnit, pytest, Jest | Testcontainers, WebApplicationFactory | Playwright, Cypress |

Also worth naming: **contract tests** (Pact) check that a service and its consumers agree on an API without running both, which is very useful for microservices.

### [2] What is TDD? What are its benefits and drawbacks?
@tags tdd, testing
@hook Red, green, refactor. Write a failing test, make it pass with the simplest code, then clean up.
@say
"Test-driven development is a short loop: write a small failing test for the next bit of behaviour, which is red; write the simplest code that makes it pass, which is green; then refactor the code and tests while keeping everything green. Repeat.

The benefits are that it forces you to think about the interface and expected behaviour before the implementation, it leads to naturally testable, loosely coupled code, it gives a safety net for refactoring, and the tests become living documentation.

The drawbacks are that it can feel slower at first, it's awkward for exploratory work where you don't yet know what you're building, like UI prototypes or spikes, and badly done TDD produces tests coupled to implementation details that break on every refactor.

I use it pragmatically: definitely for business logic with clear rules, bug fixes, where I write a test that reproduces the bug first, and tricky algorithms. Less strictly for UI layout or throwaway prototypes."

### [1] Mocks vs stubs vs fakes?
@tags testing, test doubles
@hook Stub: returns canned answers. Mock: verifies it was called correctly. Fake: a working lightweight implementation.
@say
"They're all test doubles, stand-ins for real dependencies, but they do different jobs.

A stub returns predefined responses so the code under test can run. For example, a stubbed exchange-rate service that always returns 1.1. You assert on the output of your code, not on the stub.

A mock is programmed with expectations and verifies the interaction: was sendEmail called exactly once with this address? It's for testing behaviour where the side effect is the point.

A fake is a real, simplified working implementation, like an in-memory repository backed by a dictionary, or an in-memory database. Fakes make tests realistic without infrastructure.

My rule is to prefer real objects or fakes where possible, use stubs for inputs, and use mocks sparingly, only to verify important outgoing side effects. Over-mocking couples tests to implementation details, so tests break when you refactor even though behaviour didn't change, and they can pass while the real integration is broken."

### [1] How do you write testable code?
@tags testing, design
@hook Inject dependencies, keep logic pure, separate decisions from side effects, avoid hidden globals like time and randomness.
@say
"Testable code mostly follows from good design.

First, dependency injection: pass collaborators like repositories, HTTP clients and email senders through the constructor as interfaces, so tests can substitute fakes.

Second, separate pure logic from side effects. Calculation and decision code should take inputs and return outputs; I/O like databases and network calls stays at the edges. Pure functions are trivial to test.

Third, avoid hidden dependencies: static singletons, global state, and direct calls to the current time or random number generators. I inject a clock or a random source, so a test can freeze time and check, say, that a token expires after 15 minutes.

Fourth, keep functions small with a single responsibility, so each test checks one behaviour.

And when something is hard to test, I treat that as feedback about the design: usually it's doing too much or is too coupled."
@deep
```csharp
// Hard to test: hidden dependency on the system clock
public bool IsExpired(Token t) => DateTime.UtcNow > t.ExpiresAt;

// Testable: inject time (.NET 8+ has TimeProvider built in)
public class TokenValidator(TimeProvider clock)
{
    public bool IsExpired(Token t) => clock.GetUtcNow() > t.ExpiresAt;
}
// In tests: new FakeTimeProvider(start) and advance it as needed
```

### [1] What do you look for when reviewing a pull request?
@tags code review, collaboration
@hook Correctness first, then design, readability, tests, security and performance. Be kind, specific and ask questions.
@say
"I go roughly in order of importance.

First, correctness: does it do what the ticket says, and does it handle edge cases like empty input, nulls, errors, concurrency and retries?

Second, design: is the change in the right place, does it fit existing patterns, and is it simpler than it could be? I'd rather catch a design problem than a naming nit.

Third, tests: are the important behaviours and edge cases covered, and would the tests actually fail if the code broke?

Fourth, security and data: input validation, authorisation checks, no secrets in code, no SQL injection, no sensitive data in logs.

Fifth, performance where it matters: N+1 queries, unbounded loops or loading everything into memory.

Then readability: clear names, small functions, comments that explain why rather than what.

On tone, I ask questions rather than issuing orders, explain the reasoning, mark nitpicks as optional, and praise good work. I leave formatting to automated linters so humans focus on what tools can't catch. And I try to review promptly, because slow reviews block the whole team."
@pro
Mention that you review AI-generated code with extra care for plausible-looking mistakes: invented APIs, missing edge cases and subtle security issues.

### [1] What makes code "clean"?
@tags clean code, readability
@hook Code that the next person can understand, change and trust quickly. Names, small functions, no surprises.
@say
"Clean code is code that someone else, or me in six months, can read, understand and safely change quickly.

Concretely: names that reveal intent, like daysUntilExpiry rather than d. Small functions that do one thing at one level of abstraction. No duplicated knowledge. Consistent structure and formatting. Errors handled explicitly, not swallowed. Minimal nesting, using guard clauses and early returns. And comments that explain why something is done, like a business rule or a workaround, rather than restating what the code does.

It also means no surprises: functions do what their names say, without hidden side effects, and the code follows the conventions of the codebase, even ones I'd personally do differently. Readability matters because code is read far more often than it's written."
@deep
```python
# Before
def proc(d):
    if d is not None:
        if d["active"]:
            if d["balance"] > 0:
                return d["balance"] * 0.02
    return 0

# After: guard clauses, intent-revealing names
INTEREST_RATE = 0.02

def monthly_interest(account):
    if account is None or not account["active"]:
        return 0
    if account["balance"] <= 0:
        return 0
    return account["balance"] * INTEREST_RATE
```

### [2] How do you deal with technical debt?
@tags tech debt, prioritisation
@hook Make it visible, measure its cost in team time or incidents, and pay it down continuously, not in a mythical rewrite.
@say
"Technical debt is the future cost of shortcuts, whether deliberate, like shipping fast to meet a launch, or accidental, from designs that aged badly. Some debt is a reasonable business decision, as long as it's a conscious one.

I manage it in four steps. Make it visible: record it in the backlog with a clear description, rather than as a vague complaint. Quantify the cost: how much time does it waste each sprint, how many incidents or bugs does it cause, does it slow onboarding? That turns 'the code is ugly' into 'this module causes 30 percent of our incidents', which is a conversation product managers can prioritise.

Then pay it down continuously: reserve some capacity each sprint, often 15 to 20 percent, and apply the boy scout rule of leaving code a little better whenever you touch it. Prioritise debt in areas that change often, because debt in code nobody touches costs almost nothing.

And avoid big-bang rewrites when possible. Incremental refactoring, or the strangler fig pattern, where new code gradually replaces old behind a stable interface, is much safer."

### [2] How do you refactor safely?
@tags refactoring
@hook Tests first, small steps, one kind of change at a time, keep it shippable after every step.
@say
"Refactoring means changing the structure of code without changing its behaviour, so the first step is making sure behaviour is protected. If the code lacks tests, I write characterisation tests that capture what it currently does, even if that behaviour is a bit odd.

Then I work in small steps: rename, extract a method, move a class, each followed by running the tests, and commit often so any step can be reverted. I keep refactoring separate from behaviour changes, ideally in separate pull requests, so reviewers can verify each kind of change easily. I lean on IDE automated refactorings, which are safer than manual edits.

For big refactors in production systems, I use techniques like the strangler fig pattern, branch by abstraction, where you introduce an interface, build the new implementation behind it and switch over, and feature flags to roll out gradually. The goal is that the system is shippable after every single step."

### [2] A production service is returning intermittent 500 errors. How do you investigate?
@tags debugging, production, incident
@hook Scope and timeline first, correlate with changes, find the pattern in the failing requests, mitigate, then root-cause.
@say
"First I scope it: what percentage of requests fail, which endpoints, since when, and whether users are affected. If the impact is large, I mitigate first, for example by rolling back a recent deploy, before digging deeper.

Then I correlate with change: a deploy, a config change, a dependency update, a traffic spike, or a change in another team's service at the same time.

Next I look for the pattern in the failures. Using logs filtered by the error, and traces, I check what the failing requests have in common: one endpoint, one instance or availability zone, specific user input, a certain payload size, or a downstream dependency timing out. One bad instance points to a host or deploy issue; a specific input points to a code path; everything timing out on one dependency points there.

Then I look at the stack traces and the dependency metrics for that path: database connection pool exhaustion, timeouts, rate limits from a third-party API, memory pressure, or thread starvation are common causes of intermittent errors.

Once I have a hypothesis, I reproduce it in staging or with a test, fix the root cause, add a regression test, and add monitoring or alerts so it's caught earlier next time. Afterwards, a short blameless write-up."

### [2] How do you deal with flaky tests?
@tags testing, ci, reliability
@hook Flaky tests teach people to ignore red builds. Quarantine fast, find the source of non-determinism, fix it properly.
@say
"A flaky test passes and fails without any code change. They're dangerous, because once people learn to just re-run the build, real failures get ignored too.

When I find one, I quarantine it quickly, meaning I move it to a separate non-blocking run with a ticket and an owner, so it stops blocking everyone but isn't forgotten. Then I find the source of non-determinism. The usual causes are: timing, like fixed sleeps instead of waiting for a condition; shared state between tests, like a shared database or static variables that leak across tests, which shows up as order dependence; real external dependencies like network calls; time and dates, such as tests that fail at midnight or month end; randomness without a fixed seed; and concurrency races.

The fixes are to wait for conditions with timeouts instead of sleeping, isolate test data with unique IDs or fresh containers, inject clocks and seeds, and replace external calls with fakes. Running the test hundreds of times in a loop, or in random order, helps confirm the fix. CI systems that track flaky rates across runs make them visible."

### [1] Is 100% code coverage a good goal?
@tags testing, coverage
@hook Coverage shows what isn't tested, not what is tested well. Aim high on critical logic, don't chase the number.
@say
"Not as a target in itself. Coverage measures which lines ran during tests, not whether the tests check anything meaningful. You can hit 100 percent with tests that have no assertions, and chasing the last few percent often means testing trivial getters or contorting code.

It's useful as a signal of what's untested. Low coverage on critical business logic is a real risk. So I aim for high coverage on core domain logic and complex code paths, and accept lower coverage on generated code, simple glue and UI layout.

Better indicators of test quality are whether tests fail when the code is broken, which mutation testing measures directly, how often bugs escape to production, and whether people feel safe refactoring. Many teams use a coverage gate on new code, like 'don't decrease coverage', rather than a global number."
