@section fundamentals | Programming Fundamentals
@blurb The "explain it like you mean it" questions. Short to ask, easy to fumble.

### [1] What is the difference between a compiled and an interpreted language? Where does JIT fit?
@tags languages, runtime
@hook Compiled: translate everything first, then run. Interpreted: translate as you go. JIT: start interpreting, compile the hot parts.
@say
"A compiled language is translated ahead of time into machine code for a specific platform, like C, C++, Rust or Go. You pay the cost once at build time, so it starts fast and runs fast, and many errors are caught before the program runs.

An interpreted language is executed by an interpreter that reads the code at run time, like classic Python or Ruby. It's more flexible and portable, with quicker edit-and-run cycles, but usually slower.

Most modern runtimes are a hybrid. Java and C# compile to bytecode, which a virtual machine runs. The JIT, or just-in-time compiler, watches which code runs most often and compiles those hot paths to optimised machine code while the program runs. That's why a Java service can be slow for the first few seconds and then very fast. JavaScript engines like V8 do the same thing."
@deep
| | Ahead-of-time compiled | Interpreted | Bytecode + JIT |
|---|---|---|---|
| Examples | C, C++, Rust, Go | CPython, Ruby (classic), Bash | Java, C#, JavaScript (V8), PyPy |
| Startup | Fast | Fast | Slower (warm-up) |
| Peak speed | Very high | Lower | Very high after warm-up |
| Portability | Rebuild per platform | Anywhere the interpreter runs | Anywhere the VM runs |

"Compiled vs interpreted" is a property of an **implementation**, not of a language. Python has CPython (bytecode interpreter) and PyPy (JIT). .NET also supports ahead-of-time compilation (Native AOT) for fast startup in containers and serverless.
@trap
Saying "Java is interpreted." It compiles to bytecode, and the JIT compiles hot code to native machine code.

### [1] Static vs dynamic typing, and strong vs weak typing?
@tags types
@hook Static or dynamic is about when types are checked. Strong or weak is about how much the language converts types for you.
@say
"Static versus dynamic is about when types are checked. In a statically typed language like Java, C# or TypeScript, types are checked at compile time, so a whole class of bugs is caught before running, and tooling like autocomplete and refactoring works better. In a dynamically typed language like Python or JavaScript, types belong to values at run time, which is faster to write and more flexible, but some errors only appear when that line runs.

Strong versus weak is about implicit conversion. Python is dynamic but strong: adding a string to an integer raises an error. JavaScript is dynamic and weak: '5' plus 1 gives '51', because it silently converts.

In practice, many teams add static checking on top of dynamic languages, with TypeScript or Python type hints plus mypy, to get the safety without losing the flexibility."
@deep
```python
# Python: dynamic but strong
"5" + 1          # TypeError

# JavaScript: dynamic and weak
"5" + 1          // "51"
"5" - 1          // 4
```
Type inference (`var` in C#, `let` in TypeScript, `auto` in C++) is still static typing. The compiler works out the type for you; it is still fixed at compile time.

### [1] What is the difference between stack and heap memory?
@tags memory
@hook Stack: fast, automatic, per thread, for short-lived frames. Heap: flexible, shared, for objects that outlive a function call.
@say
"The stack is a region of memory each thread uses for function calls. When a function is called, a frame is pushed with its local variables and return address, and when it returns the frame is popped. Allocation is just moving a pointer, so it's extremely fast, and cleanup is automatic. But it's limited in size, and data on it disappears when the function returns.

The heap is a large pool used for data whose size or lifetime isn't known at compile time, like objects, arrays and strings that need to outlive the function that created them. It's shared across threads, and allocation is slower. Memory has to be freed, either manually as in C, or by a garbage collector as in Java, C#, Python and Go.

In a language like Java, a local variable holding an object reference lives on the stack, but the object itself lives on the heap."
@deep
| | Stack | Heap |
|---|---|---|
| Speed | Very fast (pointer bump) | Slower (allocator, possible GC) |
| Lifetime | Until the function returns | Until freed or collected |
| Size | Small (often 1 to 8 MB per thread) | Large, limited by RAM |
| Scope | Per thread | Shared by all threads |
| Typical errors | Stack overflow (deep recursion) | Leaks, fragmentation, use-after-free |

In C#, value types (`struct`, `int`) declared as locals usually live on the stack, while class instances live on the heap. Compilers can also use **escape analysis** to put objects that never leave a function on the stack.
@follow What causes a stack overflow?
Usually unbounded or very deep recursion, where each call adds a frame until the stack's fixed size runs out. Fix it with a base case, by converting to iteration with an explicit stack, or by reducing depth.

### [1] Pass by value vs pass by reference?
@tags memory, functions
@hook Pass by value copies the thing. Pass by reference passes the original. Java and Python copy the reference itself.
@say
"With pass by value, the function receives a copy, so changing the parameter doesn't affect the caller's variable. With pass by reference, the function receives an alias to the caller's variable, so reassigning it changes the caller's variable too. C++ supports both, and C# has the ref keyword.

Java and Python are often misunderstood. They always pass by value, but for objects the value being copied is a reference. So if the function mutates the object, like appending to a list, the caller sees the change because both references point to the same object. But if the function reassigns the parameter to a new object, the caller doesn't see that, because only the local copy of the reference changed."
@deep
```python
def mutate(items):
    items.append(4)      # caller sees this: same object

def reassign(items):
    items = [9, 9]       # caller does NOT see this: local name now points elsewhere

nums = [1, 2, 3]
mutate(nums)    # nums == [1, 2, 3, 4]
reassign(nums)  # nums is still [1, 2, 3, 4]
```
@trap
Saying "Java passes objects by reference." The precise answer is that it passes references by value.

### [2] How does garbage collection work?
@tags memory, gc, runtime
@hook Find what is still reachable from the roots, free everything else. Generational GC bets that most objects die young.
@say
"Garbage collection automatically frees heap memory that the program can no longer reach. The main approach is tracing: the collector starts from roots, like local variables on thread stacks, static fields and CPU registers, follows every reference, and marks everything it can reach. Anything unmarked is garbage and gets swept, and many collectors also compact the survivors to avoid fragmentation.

Most production collectors, in Java and .NET for example, are generational. They're based on the observation that most objects die young, so new objects go into a small young generation that's collected very often and cheaply. Objects that survive a few collections are promoted to an older generation that's collected less often.

The other approach is reference counting, used by CPython and Swift: every object counts its references and is freed when the count reaches zero. It's immediate and predictable, but it can't free cycles on its own, so Python adds a cycle detector.

The trade-off with any GC is pauses and CPU overhead versus safety. Modern collectors like Java's G1 and ZGC do most of the work concurrently to keep pauses very short."
@deep
| Approach | How | Pros | Cons |
|---|---|---|---|
| Mark and sweep | Mark reachable objects, free the rest | Handles cycles | Pauses, fragmentation |
| Mark, sweep, compact | Also slides survivors together | No fragmentation | More work per cycle |
| Copying (young gen) | Copy survivors to a fresh space | Very fast for short-lived objects | Needs spare space |
| Reference counting | Count references per object | Immediate, predictable | Cycles, counter overhead |
| Generational | Separate young and old objects | Cheap frequent collections | Write barriers needed |

Practical tuning levers: allocate less in hot loops, reuse buffers, avoid huge object graphs that stay alive, and size the heap correctly in containers (set memory limits the runtime can see).
@follow What is a "stop-the-world" pause?
A phase where all application threads are paused so the collector can work safely. Modern collectors shrink these pauses by doing most marking concurrently, which matters for latency-sensitive services.

### [2] Can you have a memory leak in a garbage-collected language? How would you find one?
@tags memory, debugging, production
@hook Yes. The GC only frees unreachable objects, so anything you keep a reference to by accident leaks.
@say
"Yes. A garbage collector only frees objects that are unreachable. If the program keeps references to objects it no longer needs, they can never be collected. Classic causes are unbounded caches or static collections that only grow, event listeners or callbacks that are registered but never removed, long-lived objects holding onto short-lived ones, and unclosed resources like connections or file handles.

To find one, I first confirm it's a leak: memory keeps climbing over hours and doesn't drop after full GCs, eventually ending in out-of-memory errors or container restarts. Then I take two or three heap dumps some time apart and compare them, using a tool like Eclipse MAT for Java, dotnet-dump or dotMemory for .NET, Chrome DevTools for Node, or tracemalloc for Python. I look for the object types whose counts keep growing and then follow the reference chain back to the root that's keeping them alive. That chain usually points straight at the cache, map or listener responsible.

The fix is usually bounding the cache with a size limit or TTL, unregistering listeners, using weak references where appropriate, or closing resources with try-with-resources or using blocks."
@deep
Step-by-step investigation:
1. Graph memory over time (container metrics, GC logs). A sawtooth that returns to the same baseline is healthy; a rising baseline is a leak.
2. Reproduce under load in staging if you can.
3. Take heap snapshot A, run traffic, take snapshot B, diff them.
4. Sort by retained size or instance-count growth.
5. Inspect the "path to GC roots" for a sample of leaked objects.
6. Fix, then confirm the baseline is flat under the same load.
@pro
Mention that in Kubernetes a leak often shows up as pods being OOMKilled every few hours with exit code 137, and that a temporary restart policy hides it but doesn't fix it.

### [1] Mutable vs immutable objects. Why does immutability matter?
@tags design, concurrency
@hook Immutable objects can't change after creation, so they're safe to share, cache and reason about.
@say
"A mutable object can change after it's created, like a Python list or a Java ArrayList. An immutable object can't; any 'change' creates a new object, like strings in Java, Python and C#, or tuples in Python.

Immutability matters for three reasons. First, thread safety: if nothing can change, threads can share the object without locks. Second, predictability: you can pass an object to any function without worrying it'll be modified behind your back, which removes a whole category of bugs. Third, it makes objects safe to use as hash map keys and safe to cache.

The cost is that creating new objects for every change can mean more allocation, so for heavy string building, for example, you use a StringBuilder or join instead of concatenating in a loop."
@deep
```java
// Java: an immutable value type with a record
public record Money(String currency, long cents) {}
```
```python
# Python: classic pitfall with a mutable default argument
def add(item, bucket=[]):   # the same list is reused on every call
    bucket.append(item)
    return bucket

def add_fixed(item, bucket=None):
    bucket = [] if bucket is None else bucket
    bucket.append(item)
    return bucket
```
@trap
Mutable objects as hash keys. If the key changes after insertion, its hash changes and the entry becomes unreachable.

### [1] Recursion vs iteration. When would you use each?
@tags recursion, algorithms
@hook Recursion fits problems that are naturally self-similar, like trees. Iteration is safer for deep or simple loops.
@say
"Recursion is when a function solves a problem by calling itself on smaller versions of it, with a base case to stop. It's the natural fit for self-similar structures: tree and graph traversal, divide-and-conquer algorithms like merge sort, and backtracking. The code is often shorter and closer to the mathematical definition.

Iteration uses loops and explicit state. It avoids the overhead of function calls and, crucially, the risk of a stack overflow on deep inputs.

Anything recursive can be written iteratively with an explicit stack. So I'll use recursion when it makes the logic clearer and depth is bounded, like a balanced tree with log n depth, and switch to iteration when depth could be large, like a linked list with a million nodes or a deep graph."
@deep
```python
# Recursive DFS on a tree
def depth(node):
    if node is None:
        return 0
    return 1 + max(depth(node.left), depth(node.right))

# Iterative version with an explicit stack: no recursion limit issues
def depth_iter(root):
    best, stack = 0, [(root, 1)] if root else []
    while stack:
        node, d = stack.pop()
        best = max(best, d)
        for child in (node.left, node.right):
            if child:
                stack.append((child, d + 1))
    return best
```
Tail recursion (the recursive call is the very last action) can be optimised into a loop by some compilers (Scheme, Scala with `@tailrec`, sometimes C/C++), but **not** by Python or Java. Python's default recursion limit is about 1,000 frames.

### [1] What is a closure?
@tags functions, javascript, python
@hook A function bundled with the variables from the scope where it was created. It remembers them even after that scope has finished.
@say
"A closure is a function that captures variables from the scope where it was defined, and keeps access to them even after that outer function has returned.

For example, a function makeCounter can define a count variable and return an inner function that increments it. Each call to makeCounter creates a new, private count that only that inner function can touch. That's how you get private state without a class.

Closures are everywhere: callbacks and event handlers in JavaScript, decorators in Python, and lambdas in Java and C# that capture local variables. A classic pitfall is capturing a loop variable: in older JavaScript with var, all callbacks shared the same variable and saw its final value; let fixes it by creating a new binding per iteration."
@deep
```javascript
function makeCounter() {
  let count = 0;               // captured by the closure
  return () => ++count;
}
const next = makeCounter();
next(); // 1
next(); // 2
```
```python
def make_multiplier(n):
    def multiply(x):
        return x * n             # n is captured
    return multiply

triple = make_multiplier(3)
triple(10)  # 30
```

### [1] How should errors and exceptions be handled?
@tags error handling, clean code
@hook Fail fast, catch only what you can handle, keep the context, never swallow silently.
@say
"My rules are simple. First, validate inputs early and fail fast with a clear error, rather than letting bad data travel deep into the system. Second, only catch an exception where I can actually do something useful: retry, fall back, add context or translate it into a proper response. Otherwise I let it propagate. Third, never swallow exceptions silently. An empty catch block hides bugs and makes debugging miserable. Fourth, preserve the original cause when wrapping, so the stack trace isn't lost. And fifth, always clean up resources with try-with-resources, using blocks or context managers.

At the boundary of a service, I translate exceptions into meaningful responses: a 400 for validation errors, a 404 for not found, and a 500 with a correlation ID for unexpected errors, while logging the full details server-side and never leaking stack traces to users."
@deep
- **Checked vs unchecked (Java):** checked exceptions must be declared or caught (IOException); unchecked ones (RuntimeException) don't. Many modern codebases prefer unchecked exceptions plus good boundaries.
- **Exceptions vs result types:** Go returns `(value, err)`; Rust uses `Result<T, E>`. Many teams use result types for expected failures (validation) and exceptions for truly exceptional ones.
- **Don't use exceptions for normal control flow.** They're slower and hide intent.
```python
try:
    order = repo.get(order_id)
except ConnectionError as e:
    raise ServiceUnavailable("order store unreachable") from e   # keeps the cause
```
@trap
`catch (Exception e) {}` or `except: pass`. Interviewers love to ask what's wrong with it. It hides every error, including the ones you did not expect.

### [2] Synchronous vs asynchronous code. What is the event loop?
@tags async, concurrency, javascript
@hook Async lets one thread start slow I/O, do other work, and come back when the result is ready. The event loop is the scheduler that makes that happen.
@say
"Synchronous code runs one step after another, so if a step waits on I/O, like a database query or HTTP call, the thread just sits there blocked. Asynchronous code starts the I/O and gives the thread back, so it can handle other work, and resumes when the result is ready.

The event loop is what makes this work in Node.js, Python's asyncio and browsers. There's a single thread running a loop: it takes the next ready task from a queue, runs it until it hits an await or finishes, and moves on. When an I/O operation completes, the operating system notifies the loop and the continuation is queued.

That's why one Node process can serve thousands of concurrent connections: it's never blocked waiting. The flip side is that any CPU-heavy work, like a big JSON parse or image processing, blocks the whole loop and every request stalls, so that kind of work belongs in worker threads or separate processes."
@deep
In JavaScript, the order is: run the current synchronous code, then **all microtasks** (resolved promises, `queueMicrotask`), then the next **macrotask** (timers, I/O callbacks).
```javascript
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
// Output: A, D, C, B
```
@follow Is async the same as multithreading?
No. Async is about not blocking while waiting; it can run on a single thread. Multithreading runs code in parallel on multiple threads. Async is great for I/O-bound work; threads or processes are what you need for CPU-bound work.

### [1] What are generics, and why use them?
@tags types, reuse
@hook Write the code once, keep it type-safe for many types. List of T instead of List of Object.
@say
"Generics let you write classes and functions that work with many types while keeping compile-time type safety. Instead of a List that holds Object and forces casts everywhere, you write List of T, and the compiler knows a List of String only contains strings.

The benefits are reuse, because one implementation serves every type, type safety, because mistakes are caught at compile time instead of as a ClassCastException at run time, and readability, since the types document intent.

You can also constrain them, like 'T must implement Comparable', so a generic sort function can safely compare elements. One detail worth knowing: Java implements generics with type erasure, so the type information is gone at run time, while C# keeps it, which is why C# can do things like new T() with the right constraint."
@deep
```csharp
public T Max<T>(IEnumerable<T> items) where T : IComparable<T>
{
    T best = default!;
    bool first = true;
    foreach (var item in items)
        if (first || item.CompareTo(best) > 0) { best = item; first = false; }
    return best;
}
```

### [2] Why does 0.1 + 0.2 not equal 0.3, and how should you store money?
@tags floating point, correctness
@hook Binary floating point can't represent 0.1 exactly. Store money as integer cents or a decimal type.
@say
"Floating-point numbers, following the IEEE 754 standard, are stored in binary. Just like one third can't be written exactly in decimal, 0.1 and 0.2 can't be represented exactly in binary, so they're stored as the nearest approximation. Adding the two approximations gives 0.30000000000000004.

For most scientific work that tiny error is fine, but never for money, where errors accumulate and auditors notice. For money I either store integer minor units, like cents in a long, or use a decimal type: BigDecimal in Java, decimal in C# and Python's Decimal. And when comparing floats in general, I compare with a tolerance, like 'the absolute difference is less than 1e-9', instead of using equals."
@deep
```python
0.1 + 0.2 == 0.3                      # False
abs((0.1 + 0.2) - 0.3) < 1e-9         # True

from decimal import Decimal
Decimal("0.1") + Decimal("0.2") == Decimal("0.3")   # True
```
Also store the currency alongside the amount, and decide on a rounding rule (banker's rounding vs half-up) explicitly.

### [1] What are pure functions and higher-order functions?
@tags functional programming
@hook Pure: same input, same output, no side effects. Higher-order: takes or returns a function.
@say
"A pure function always returns the same output for the same input and has no side effects: it doesn't modify global state, write to a database or print anything. That makes it trivially testable, safe to run in parallel, and safe to cache.

A higher-order function is one that takes a function as an argument or returns one. map, filter and reduce are the classic examples: you pass in what to do with each element, and they handle the iteration.

I don't treat functional programming as all or nothing. In practice I keep the core business logic as pure functions that are easy to test, and push side effects like I/O to the edges of the system. It's sometimes called 'functional core, imperative shell'."
@deep
```python
prices = [120, 45, 300, 80]
expensive = list(filter(lambda p: p > 100, prices))     # [120, 300]
with_tax  = list(map(lambda p: round(p * 1.1, 2), expensive))
total     = sum(with_tax)
```

### [1] What is the difference between a library and a framework?
@tags architecture, inversion of control
@hook You call a library. A framework calls you. That's inversion of control.
@say
"The key difference is who's in control. With a library, my code is in charge and calls the library when it needs something, like calling a date-formatting or HTTP library.

With a framework, the framework owns the overall flow and calls my code at defined extension points. In ASP.NET Core, Spring or Django, I write controllers and handlers, and the framework decides when to call them based on incoming requests. That's called inversion of control, sometimes summarised as 'don't call us, we'll call you.'

Frameworks give you structure and a lot for free, like routing, dependency injection and security, at the cost of following their conventions. Libraries give more freedom but leave the architecture to you."
