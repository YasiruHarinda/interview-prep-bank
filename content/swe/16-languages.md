@section langs | Language Quickfire: Python, Java, JavaScript, C#
@blurb Short, sharp questions about the languages on your CV. Expect two or three of these in any screening call.

### [1] Python: list vs tuple vs set vs dict?
@tags python, data types
@hook List: ordered and mutable. Tuple: ordered and immutable. Set: unique and unordered. Dict: key to value.
@say
"A list is an ordered, mutable sequence, the general-purpose collection, with O(1) indexing and appending.

A tuple is an ordered, immutable sequence. Because it can't change, it's hashable if its contents are, so it can be a dictionary key or set member, and it signals 'this is a fixed record', like a coordinate pair or a function returning multiple values.

A set is an unordered collection of unique, hashable items with O(1) average membership tests, great for de-duplication and checks like 'have I seen this before'.

A dict maps unique, hashable keys to values with O(1) average lookups, and since Python 3.7 it preserves insertion order.

The most common performance mistake I see is using 'x in some_list' inside a loop, which is O(n) each time; converting to a set first makes it O(1)."

### [1] Python: what is a decorator?
@tags python, functions, decorators
@hook A function that wraps another function to add behaviour, applied with @. Logging, timing, caching, auth.
@say
"A decorator is a function that takes a function and returns a new function that usually wraps it with extra behaviour. Writing @timer above a function definition is just shorthand for my_function equals timer of my_function.

They're used for cross-cutting concerns without cluttering the function itself: logging, timing, retries, caching like functools.lru_cache, access checks, and registering routes in web frameworks, like @app.get in FastAPI.

Two details show you've written real ones. Use functools.wraps inside, so the wrapped function keeps its name and docstring, which matters for debugging and frameworks. And decorators that take arguments, like @retry(times=3), need an extra outer layer: a function that returns the actual decorator."
@deep
```python
import functools, time

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            print(f"{func.__name__} took {time.perf_counter() - start:.3f}s")
    return wrapper

def retry(times=3):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(times):
                try:
                    return func(*args, **kwargs)
                except ConnectionError:
                    if attempt == times - 1:
                        raise
        return wrapper
    return decorator

@retry(times=5)
@timer
def fetch(url): ...
```

### [1] Python: what are generators, and why use them?
@tags python, generators, memory
@hook A function with yield produces values lazily, one at a time, so you can process huge or infinite data in constant memory.
@say
"A generator is a function that uses yield instead of return. Calling it doesn't run the body; it returns an iterator. Each time you ask for the next value, it runs until the next yield, hands back that value and pauses, keeping its local state.

The main benefit is laziness: values are produced on demand, so memory use stays constant no matter how much data there is. Reading a 50 gigabyte log file line by line with a generator uses almost no memory, whereas building a list would crash. They're also great for pipelines, where one generator feeds another, and for infinite sequences.

Generator expressions, with round brackets, are the lazy version of list comprehensions. For example, sum of x squared for x in a range of a billion works without allocating a billion-element list. The trade-off is that a generator can only be iterated once and doesn't support indexing or len."
@deep
```python
def read_errors(path):
    with open(path) as f:
        for line in f:                     # the file object is itself lazy
            if "ERROR" in line:
                yield line.rstrip()

def take(n, it):
    for i, x in enumerate(it):
        if i >= n:
            return
        yield x

for line in take(10, read_errors("app.log")):
    print(line)
```

### [1] Python: what are *args and **kwargs?
@tags python, functions
@hook *args collects extra positional arguments into a tuple; **kwargs collects extra keyword arguments into a dict.
@say
"They let a function accept a variable number of arguments. *args collects any extra positional arguments into a tuple, and **kwargs collects extra keyword arguments into a dictionary. The names are just convention; the stars do the work.

They're used for flexible APIs and especially for wrappers like decorators, which must pass through whatever arguments the wrapped function takes. The same stars also work in reverse when calling a function: star unpacks a list into positional arguments, and double star unpacks a dict into keyword arguments.

A related feature worth mentioning is keyword-only arguments: anything after a bare star in the signature must be passed by name, which makes calls clearer, like send(to, *, retry=True)."

### [2] Python: shallow copy vs deep copy? And is vs ==?
@tags python, objects
@hook Shallow copies the container but shares the contents; deep copies everything recursively. == compares values, is compares identity.
@say
"A shallow copy creates a new container but fills it with references to the same inner objects. So if I shallow-copy a list of lists and modify an inner list, the change shows up in both. list.copy, slicing and copy.copy are shallow.

A deep copy, copy.deepcopy, recursively copies everything, so the new structure is fully independent. It's slower and uses more memory, so I only use it when nested data really needs to be independent.

On is versus ==: double equals compares values, using the object's eq method, while is checks whether two references point to the exact same object in memory. The rule is to use is only for singletons like None, as in 'if x is None', and double equals for everything else. Small integers and some strings may appear to work with is because Python caches them, but that's an implementation detail you should never rely on."
@deep
```python
import copy
grid = [[0, 0], [0, 0]]
shallow = grid.copy()
deep = copy.deepcopy(grid)
grid[0][0] = 9
shallow[0][0]   # 9: inner lists are shared
deep[0][0]      # 0: fully independent

a = [1, 2]; b = [1, 2]
a == b   # True: same value
a is b   # False: different objects
```

### [1] Java: what are the JDK, JRE and JVM?
@tags java, runtime
@hook JVM runs bytecode. JRE is the JVM plus core libraries. JDK is the JRE plus compiler and tools.
@say
"The JVM, the Java Virtual Machine, executes compiled Java bytecode. It handles class loading, memory management with garbage collection, and JIT compilation of hot code to native machine code. It's why Java is 'write once, run anywhere': the bytecode is the same, and each platform has its own JVM.

The JRE, the Java Runtime Environment, is the JVM plus the standard class libraries needed to run Java applications.

The JDK, the Java Development Kit, is everything in the JRE plus development tools: the javac compiler, the debugger, jar, javadoc and diagnostic tools.

A modern detail: since Java 11, Oracle doesn't ship a separate JRE download; you use a JDK, often a slim custom runtime built with jlink for containers. And the JVM runs other languages too, like Kotlin and Scala."

### [1] Java: why are Strings immutable? What is the String pool?
@tags java, strings
@hook Immutability makes strings safe to share, cache, hash and use across threads. The pool reuses identical literals.
@say
"Strings in Java can't be modified after creation; methods like toUpperCase return new strings. There are several reasons. Security: strings hold class names, file paths, URLs and credentials, and if they could change after validation, checks could be bypassed. Thread safety: immutable objects can be shared across threads without synchronisation. Hashing: a string's hash code can be cached, which makes them fast HashMap keys. And it enables the string pool.

The string pool is a special area of the heap where Java stores one copy of each string literal. If two variables are assigned the same literal, they point to the same object, which saves memory. Strings created with new, or at run time, aren't pooled unless you call intern.

That's also why you must compare strings with equals, not double equals: double equals compares references and can give misleading results depending on whether the strings happen to come from the pool. And for building strings in a loop, I use StringBuilder, because repeated concatenation creates a new string each time."

### [1] Java: final vs finally vs finalize?
@tags java, keywords
@hook final: can't change. finally: always runs after try. finalize: deprecated GC hook, don't use it.
@say
"They're unrelated despite the similar names.

final is a modifier. A final variable can only be assigned once; a final method can't be overridden; a final class can't be extended, like String. Note that a final reference to an object means the reference can't change, but the object itself can still be mutated unless it's immutable.

finally is a block after try and catch that always runs, whether or not an exception was thrown, used for cleanup like closing resources. In modern Java, try-with-resources is usually better, since it closes AutoCloseable resources automatically.

finalize was a method called by the garbage collector before reclaiming an object. It was unpredictable, slow and error-prone, has been deprecated for removal, and shouldn't be used. Use try-with-resources or Cleaner instead."

### [2] Java: HashMap vs Hashtable vs ConcurrentHashMap? And what are virtual threads?
@tags java, concurrency, collections
@hook HashMap: not thread-safe. Hashtable: one big lock, legacy. ConcurrentHashMap: fine-grained, the right choice. Virtual threads: millions of cheap threads.
@say
"HashMap isn't thread-safe. Concurrent modifications can corrupt it or lose updates, so it's for single-threaded use or confined data. It allows one null key.

Hashtable is a legacy class where every method is synchronized on the whole table, so only one thread can use it at a time. It's thread-safe but slow under contention, and it doesn't allow nulls.

ConcurrentHashMap is the right choice for shared maps. It allows concurrent reads without locking and uses fine-grained locking and compare-and-swap for writes, so many threads can update different parts at once. It also has atomic compound operations like computeIfAbsent and merge, which avoid check-then-act races.

Virtual threads, final in Java 21, are lightweight threads managed by the JVM rather than the OS. You can create millions of them, and when one blocks on I/O, it's unmounted from its carrier OS thread, which then runs other work. That gives you async-level scalability while writing simple, blocking-style code, which is a big deal for I/O-heavy servers."

### [1] JavaScript: var vs let vs const, and what is hoisting?
@tags javascript, scope
@hook var is function-scoped and hoisted as undefined. let and const are block-scoped and stay in the temporal dead zone until declared. Default to const.
@say
"var is function-scoped, can be redeclared, and is hoisted: the declaration is moved to the top of the function and initialised as undefined, so you can read it before the line where it's declared without an error, which hides bugs.

let and const are block-scoped, meaning they only exist inside the nearest curly braces. They're hoisted too, but not initialised, so accessing them before the declaration throws a ReferenceError; that period is called the temporal dead zone. let can be reassigned; const can't.

Note that const prevents reassigning the variable, not mutating the object it points to; you can still push into a const array. My rule is const by default, let when I need to reassign, and never var in modern code. Function declarations are fully hoisted, which is why you can call them before they appear in the file."

### [1] JavaScript: == vs ===?
@tags javascript, equality
@hook == converts types before comparing, with surprising rules. === compares type and value. Always use ===.
@say
"Triple equals is strict equality: it's true only if both values have the same type and the same value, with no conversion.

Double equals is loose equality: if the types differ, it converts them using a set of coercion rules before comparing. That produces surprises, like the string zero equals false being true, and an empty string equals zero being true.

So I always use triple equals, and linters enforce it. The one idiom some teams allow is 'x == null', which conveniently checks for both null and undefined. Also, NaN isn't equal to anything, even itself, so you check it with Number.isNaN."
@deep
```javascript
0 == "0"          // true
0 == ""           // true
"0" == ""         // false (not even transitive!)
null == undefined // true
null === undefined// false
NaN === NaN       // false; use Number.isNaN(x)
```

### [2] JavaScript: how do promises and async/await work, and how does "this" behave?
@tags javascript, async, promises
@hook A promise is a future value. async/await is nicer syntax over promises. "this" depends on how a function is called, except in arrow functions.
@say
"A promise represents a value that will be available later: it's pending, then either fulfilled with a value or rejected with an error. You chain then and catch, and combinators like Promise.all run things in parallel and fail fast, while Promise.allSettled waits for everything regardless.

async and await are syntax on top of promises. An async function always returns a promise, and await pauses that function, not the whole thread, until the promise settles, so asynchronous code reads like synchronous code, with try and catch for errors. A common mistake is awaiting independent calls one after another in a loop when they could run in parallel with Promise.all.

For this: in a regular function, this is determined by how the function is called. Called as obj.method(), it's obj; called standalone, it's undefined in strict mode. That's why passing a method as a callback loses its this. Arrow functions don't have their own this; they capture it from the surrounding scope, which is why they're the usual fix for callbacks. call, apply and bind set it explicitly."
@deep
```javascript
// Sequential: total time = sum of both
const user = await getUser(id);
const orders = await getOrders(id);

// Parallel: total time = the slower one
const [user2, orders2] = await Promise.all([getUser(id), getOrders(id)]);
```

### [2] Why use TypeScript? Interface vs type?
@tags typescript
@hook Static types for JavaScript: catch bugs at build time, better tooling, safer refactors. Interfaces for object shapes, types for unions and everything else.
@say
"TypeScript adds static types to JavaScript and compiles down to plain JavaScript. The benefits are catching whole classes of bugs before running, like typos in property names, null handling or wrong argument types; much better editor tooling with autocomplete and safe renames; and types that document intent, which matters a lot on large codebases and teams. Types are erased at run time, so they don't validate external data; for API input I still use a runtime validator like Zod.

Interface and type overlap a lot. Interfaces describe object shapes, can be extended with extends, and support declaration merging, so they're good for public object contracts. Type aliases can describe anything: unions like 'success or error', intersections, tuples, mapped and conditional types. My rule of thumb is interface for object shapes others implement or extend, and type for unions and computed types, but consistency within a codebase matters more than the choice.

I always enable strict mode, especially strictNullChecks, because that's where most of the value is."

### [1] C#: value types vs reference types? What are records?
@tags csharp, dotnet, types
@hook Structs are value types copied on assignment; classes are reference types shared by reference. Records give value equality for free.
@say
"Value types, like int, bool, DateTime and user-defined structs, hold their data directly. Assigning one copies the whole value, and they can't be null unless you make them nullable with a question mark. Reference types, like classes, strings, arrays and delegates, hold a reference to an object on the heap. Assigning copies the reference, so both variables point to the same object.

I use structs for small, immutable values that represent a single concept, like a point or money amount, ideally under around 16 bytes, to avoid heap allocations. Large or mutable structs cause confusing copy bugs and performance costs.

Records, added in C# 9, are types designed for data. They have value-based equality, so two records with the same values are equal, built-in immutability with init properties, a readable ToString, and with expressions to create modified copies. A record class is a reference type and a record struct is a value type. I use them for DTOs, domain value objects and events."
@deep
```csharp
public record Money(decimal Amount, string Currency);

var a = new Money(10m, "LKR");
var b = new Money(10m, "LKR");
Console.WriteLine(a == b);             // True: value equality
var c = a with { Amount = 25m };       // non-destructive copy
```

### [2] C#: IEnumerable vs IQueryable? What is deferred execution in LINQ?
@tags csharp, linq, ef core
@hook IEnumerable runs LINQ in memory. IQueryable builds an expression tree that the database provider turns into SQL. Neither runs until you enumerate.
@say
"Both represent sequences you can query with LINQ, but where the query runs is different.

IEnumerable works on in-memory objects. LINQ operators run as C# code over the items, one by one.

IQueryable represents a query against a data source, like Entity Framework Core. Operators like Where and OrderBy build an expression tree, and the provider translates the whole thing into SQL when the query executes. So filtering, sorting and paging happen in the database, and only the needed rows come back.

The classic bug is converting to IEnumerable or calling ToList too early, then filtering. Then EF loads the whole table into memory and filters in C#.

Deferred execution means a LINQ query doesn't run when you define it; it runs when you enumerate it, with foreach, ToList, Count or First. That allows composing queries step by step, but if you enumerate the same query twice, it runs twice, hitting the database twice, so I materialise with ToList when I need the results more than once."
@deep
```csharp
// Good: WHERE and TOP run in SQL
var recent = await db.Orders
    .Where(o => o.CustomerId == id)
    .OrderByDescending(o => o.CreatedAt)
    .Take(20)
    .ToListAsync();

// Bad: loads every order into memory, then filters in C#
var all = db.Orders.AsEnumerable().Where(o => o.CustomerId == id).ToList();
```

### [2] C#: how does async/await work, and what causes async deadlocks?
@tags csharp, async, dotnet
@hook await frees the thread while I/O runs and resumes later. Blocking on async code with .Result or .Wait() can deadlock and starves the thread pool.
@say
"An async method returns a Task. When it hits an await on an incomplete task, it returns control to the caller and frees the thread, and the rest of the method is scheduled as a continuation that runs when the awaited operation completes. For I/O like database or HTTP calls, no thread is blocked while waiting, which is why async ASP.NET Core apps handle far more concurrent requests with the same threads.

The classic deadlock happens when code blocks on async code with .Result or .Wait() in an environment with a synchronization context, like older ASP.NET or desktop UI apps. The blocked thread is waiting for the task, and the task's continuation is waiting to run on that same blocked thread. ASP.NET Core has no synchronization context, so it doesn't deadlock there, but blocking still wastes thread-pool threads and can cause thread-pool starvation under load.

My rules: async all the way down, never .Result or .Wait() on tasks, use ConfigureAwait(false) in library code, avoid async void except for event handlers, pass CancellationTokens through, and use Task.WhenAll for independent operations."

### [2] ASP.NET Core: what is the middleware pipeline?
@tags dotnet, aspnet core, web
@hook A chain of components each request passes through in order, and the response passes back out in reverse. Order matters.
@say
"In ASP.NET Core, every HTTP request flows through a pipeline of middleware components configured in Program.cs. Each middleware can do work before calling the next one, short-circuit the pipeline by writing a response directly, and do more work as the response flows back out. It's essentially the decorator or chain of responsibility pattern.

Typical built-in middleware includes exception handling, HTTPS redirection, static files, routing, CORS, authentication, authorisation, rate limiting, and finally the endpoints that run controllers or minimal APIs.

Order matters a lot. Exception handling must come first, so it can catch errors from everything after it. Authentication must run before authorisation, because you need to know who the user is before checking what they can do. Static files usually come early, so they're served without running auth or MVC.

I write custom middleware for cross-cutting concerns like adding a correlation ID to every request and log, measuring request timing, or translating exceptions into a standard problem-details error format."
@deep
```csharp
var app = builder.Build();
app.UseExceptionHandler("/error");
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
app.Run();

// Custom middleware: correlation ID
app.Use(async (ctx, next) =>
{
    var id = ctx.Request.Headers["X-Correlation-ID"].FirstOrDefault() ?? Guid.NewGuid().ToString();
    ctx.Response.Headers["X-Correlation-ID"] = id;
    using (logger.BeginScope(new Dictionary<string, object> { ["CorrelationId"] = id }))
        await next();
});
```

### [2] Entity Framework Core: change tracking, AsNoTracking and migrations?
@tags dotnet, ef core, orm
@hook The DbContext tracks loaded entities and turns changes into SQL on SaveChanges. Use AsNoTracking for read-only queries. Migrations version the schema.
@say
"EF Core's DbContext is a unit of work. Entities loaded through it are tracked: it keeps a snapshot of their original values, and when you call SaveChanges, it detects what changed and generates the INSERT, UPDATE and DELETE statements in one transaction. The DbContext is meant to be short-lived, typically scoped to one web request, and isn't thread-safe.

For read-only queries, AsNoTracking skips the tracking overhead and memory, which is noticeably faster for large result sets, and I use it by default on read endpoints.

Migrations version the database schema alongside the code: when the model changes, 'dotnet ef migrations add' generates a migration with Up and Down steps, and it's applied with database update or, better in production, a generated idempotent SQL script or migration bundle run by the deployment pipeline, rather than auto-migrating on app startup.

Common pitfalls I watch for: N+1 queries from lazy loading, forgetting Include for related data, loading whole entities when a projection with Select would do, and long-lived contexts that grow huge tracking graphs."
