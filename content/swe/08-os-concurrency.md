@section os | Operating Systems and Concurrency
@blurb Processes, threads, locks and memory. The questions that separate "it works on my machine" from "it works under load".

### [1] What is the difference between a process and a thread?
@tags processes, threads
@hook A process is an isolated program with its own memory. Threads are workers inside one process, sharing its memory.
@say
"A process is a running program with its own isolated memory space, file handles and resources. Because processes are isolated, a crash in one doesn't corrupt another, but communicating between them needs inter-process communication like pipes, sockets or shared memory, and creating them is relatively expensive.

A thread is a unit of execution inside a process. All threads in a process share the same heap and resources, but each has its own stack, registers and program counter. That makes threads cheaper to create and switch between, and communication is just reading shared memory, which is also the danger: shared mutable state leads to race conditions, so it needs synchronisation.

A web browser is a good example of both: Chrome runs each tab in its own process for isolation and security, while each process uses many threads for rendering, networking and JavaScript."
@deep
| | Process | Thread |
|---|---|---|
| Memory | Own address space | Shares the process heap, own stack |
| Creation cost | High | Low |
| Context switch | Slower (address space change) | Faster |
| Communication | IPC: pipes, sockets, shared memory | Shared variables (needs locks) |
| Failure isolation | Strong | A bad thread can crash the whole process |

### [1] What is a context switch, and why is it expensive?
@tags scheduling, performance
@hook The CPU saves one task's state and loads another's. Direct cost is small; the cache and TLB damage is the real bill.
@say
"A context switch is when the operating system stops running one thread or process and starts another on the same CPU core. It saves the current task's registers, program counter and stack pointer, picks the next task, and restores that task's saved state.

The direct cost is a few microseconds, but the indirect cost is bigger. The new task's data isn't in the CPU caches, so it suffers cache misses. Switching between processes also changes the address space, which can flush the TLB, the cache of virtual-to-physical address translations.

That's why having thousands of threads that constantly switch can make a system slower, and why high-performance servers use thread pools sized close to the number of cores, plus async I/O, so a few threads handle many connections without constant switching."

### [1] What is the difference between concurrency and parallelism?
@tags concurrency, parallelism
@hook Concurrency is dealing with many things at once. Parallelism is doing many things at once.
@say
"Concurrency is about structure: multiple tasks are in progress during the same period, and their execution can interleave. A single-core CPU can run a web server that handles thousands of requests concurrently by switching between them while each waits on I/O.

Parallelism is about execution: multiple tasks literally run at the same instant on multiple cores or machines, like splitting an image across eight cores to process it eight times faster.

You can have concurrency without parallelism, like an async event loop on one thread, and parallelism is one way to execute concurrent work. As a rule of thumb, concurrency helps I/O-bound workloads, and parallelism helps CPU-bound workloads."

### [1] What is a race condition, and how do you prevent one?
@tags concurrency, race condition
@hook Two threads touch shared data and the result depends on timing. Fix: don't share, make it immutable, or synchronise.
@say
"A race condition happens when the correctness of a program depends on the timing of threads accessing shared data, and at least one of them writes. The classic example is two threads incrementing a counter. count++ is actually read, add, write. If both threads read 5 at the same time, both write 6, and one increment is lost.

There are three ways to prevent it. First, avoid sharing: give each thread its own data, or pass messages instead of sharing memory. Second, make shared data immutable. Third, synchronise access: use a lock or mutex around the critical section, or atomic operations like an AtomicInteger or Interlocked.Increment for simple counters.

Race conditions also happen outside a single program. Two web requests can both read a stock level of 1 and both sell the item. There the fix is at the database level: a transaction with the right isolation, a conditional update like UPDATE stock SET qty = qty minus 1 WHERE qty > 0, or optimistic locking with a version number."
@deep
```python
import threading
count = 0
lock = threading.Lock()

def work():
    global count
    for _ in range(100_000):
        with lock:              # without this, the final count is often wrong
            count += 1
```
Races are hard to test because they're timing-dependent. Tools: ThreadSanitizer (C/C++/Go), Go's `-race` flag, stress tests with many threads, and code review focused on shared state.

### [2] Mutex vs semaphore vs monitor?
@tags synchronisation, locks
@hook Mutex: one thread at a time, and the owner unlocks. Semaphore: up to N at a time. Monitor: a lock plus condition waiting, built into the object.
@say
"A mutex, or mutual exclusion lock, allows exactly one thread into a critical section. It has ownership: the thread that locked it must unlock it. It protects shared data like a balance or a list.

A semaphore is a counter that allows up to N threads at once. Threads call acquire, which decrements the counter and blocks at zero, and release, which increments it. I'd use one to limit concurrency, like allowing at most ten simultaneous database connections or five parallel downloads. A binary semaphore looks like a mutex but has no ownership; any thread can release it, which makes it useful for signalling.

A monitor combines a mutex with condition variables, so threads can wait for a condition inside the lock and be notified when it changes. Java's synchronized with wait and notify, and C#'s lock with Monitor.Wait, are monitors. It's what you use for patterns like producer-consumer, where a consumer waits until the queue is not empty."

### [2] What is a deadlock? What conditions cause it, and how do you prevent it?
@tags deadlock, concurrency
@hook Four conditions must all hold: mutual exclusion, hold and wait, no preemption, circular wait. Break any one.
@say
"A deadlock is when two or more threads are each waiting for a resource another one holds, so none of them can ever proceed. Thread A holds lock 1 and waits for lock 2, while thread B holds lock 2 and waits for lock 1.

It requires four conditions at once, known as the Coffman conditions: mutual exclusion, meaning resources can't be shared; hold and wait, meaning a thread holds one resource while waiting for another; no preemption, meaning resources can't be forcibly taken; and circular wait, meaning a cycle of threads each waiting on the next.

Preventing any one of them prevents deadlock. The most practical technique is breaking circular wait with a global lock ordering: every thread always acquires locks in the same order, say by account ID, when transferring money between two accounts. Other techniques are using tryLock with a timeout and backing off, acquiring all needed locks at once, and keeping critical sections small. Databases detect deadlocks automatically by finding cycles in their wait-for graph and aborting one transaction, so the application should catch that error and retry."
@deep
```java
void transfer(Account a, Account b, long amount) {
    Account first  = a.id() < b.id() ? a : b;   // consistent global order
    Account second = a.id() < b.id() ? b : a;
    synchronized (first) {
        synchronized (second) {
            a.withdraw(amount);
            b.deposit(amount);
        }
    }
}
```
@follow What is a livelock, and what is starvation?
In a livelock, threads keep changing state in response to each other but make no progress, like two people repeatedly stepping aside in a corridor. Randomised backoff fixes it. Starvation is when a thread never gets the resource because others keep winning, often caused by unfair locks or priorities. Fair locks and ageing fix it.

### [2] Why use a thread pool?
@tags threads, performance
@hook Creating a thread per task is expensive and unbounded. A pool reuses a fixed set of workers and queues the rest.
@say
"Creating and destroying a thread for every task is costly, and if tasks arrive faster than they finish, you can end up with thousands of threads, which wastes memory on stacks and burns CPU on context switching until the system falls over.

A thread pool keeps a fixed or bounded set of worker threads and a queue of tasks. Workers take tasks from the queue, run them and come back for more. That reuses threads, caps concurrency and gives you a natural place for back-pressure: when the queue is full, you can reject new work or slow callers down.

Sizing depends on the work. For CPU-bound tasks, roughly the number of cores. For I/O-bound tasks, more threads, because most of them are waiting, or better, async I/O. Java's ExecutorService, .NET's ThreadPool and Python's concurrent.futures are all thread pools. The main gotcha is an unbounded queue, which hides overload until you run out of memory."

### [2] Async/await vs threads. And what is the GIL in Python?
@tags async, threads, python, gil
@hook Async multiplexes waiting tasks on few threads; threads run truly concurrently. The GIL stops Python threads running Python code in parallel.
@say
"Threads give you real concurrent execution, managed by the OS, each with its own stack. Async/await is cooperative: a task runs until it awaits something, then yields so another task can run, usually on a small number of threads. For I/O-bound work with many concurrent operations, like a server waiting on databases and APIs, async scales much better, because waiting doesn't occupy a thread. For CPU-bound work, async doesn't help; you need real parallelism.

The GIL, Python's Global Interpreter Lock in CPython, allows only one thread to execute Python bytecode at a time. So Python threads are fine for I/O-bound work, because the GIL is released while waiting on I/O, but they don't speed up CPU-bound Python code. For CPU-bound work in Python, I use multiprocessing, or libraries like NumPy that release the GIL in native code.

Worth knowing: Python 3.13 introduced an experimental free-threaded build without the GIL, and it's become officially supported in later versions, but most production code still assumes the GIL today."
@deep
| Workload | Python | Java / C# | Node.js |
|---|---|---|---|
| Many I/O waits | asyncio, threads | async/await, virtual threads (Java 21) | Event loop (default) |
| CPU heavy | multiprocessing, native libs | Threads / parallel streams / Parallel.For | Worker threads |

### [2] What is virtual memory, and what is a page fault?
@tags memory, os
@hook Each process sees its own big, private address space; the OS maps it to real RAM in pages and loads missing pages on demand.
@say
"Virtual memory gives each process the illusion of its own large, contiguous, private address space. The OS and the CPU's memory management unit translate virtual addresses to physical RAM addresses using page tables, in fixed-size chunks called pages, typically 4 kilobytes.

That gives isolation, since one process can't read another's memory; flexibility, since the physical memory doesn't need to be contiguous; and the ability to use more memory than physically exists, by keeping less-used pages on disk.

A page fault happens when a process touches a page that isn't currently mapped in RAM. The OS handles it: if the page is on disk or not loaded yet, it loads it, updates the page table and resumes the process. That's a minor fault if the page is already somewhere in memory, and a major fault if it has to be read from disk, which is far slower. If a system is constantly swapping pages in and out because there isn't enough RAM, it's called thrashing, and performance collapses."
@follow What is the TLB?
The Translation Lookaside Buffer is a small cache in the CPU for recent virtual-to-physical address translations, so most memory accesses don't need to walk the page tables.

### [2] What is the difference between user mode and kernel mode? What is a system call?
@tags os, kernel
@hook Apps run in a restricted mode. To touch hardware, files or the network, they ask the kernel through a system call.
@say
"The CPU has privilege levels. Applications run in user mode, where they can't directly access hardware or other processes' memory. The kernel runs in kernel mode with full access.

When an application needs something privileged, like reading a file, opening a socket, allocating memory or creating a process, it makes a system call, such as read, write, open or fork. The CPU switches to kernel mode, the kernel does the work after checking permissions, and then returns to user mode.

That switch has a cost, which is why buffered I/O, which batches many small writes into fewer system calls, is much faster than unbuffered I/O. It's also the security boundary: a buggy app can crash itself, but not the kernel or other processes. Containers rely on this too: they're just processes that make system calls to a shared kernel, with namespaces and cgroups limiting what they see and use."

### [1] What CPU scheduling algorithms do you know?
@tags scheduling, os
@hook FIFO, shortest job first, round robin, priority. Real kernels blend them for fairness and responsiveness.
@say
"First come, first served runs jobs in arrival order. It's simple, but one long job makes everyone behind it wait, which is the convoy effect.

Shortest job first minimises average waiting time, but you rarely know job lengths in advance, and long jobs can starve.

Round robin gives each task a fixed time slice and rotates. It's fair and responsive, which suits interactive systems. The slice length is a trade-off: too short wastes time on context switches, too long feels laggy.

Priority scheduling runs higher-priority tasks first, with ageing to prevent low-priority tasks from starving.

Real kernels combine these. Linux's scheduler, for example, aims to give every task a fair share of CPU time weighted by priority. The same ideas show up in system design: request queues, Kubernetes pod priority, and fair scheduling across tenants."

### [2] What are atomic operations and compare-and-swap?
@tags atomics, lock-free
@hook An atomic operation can't be interrupted halfway. CAS says "set it to new only if it still equals old", which enables lock-free code.
@say
"An atomic operation completes as a single indivisible step: other threads see it either not done or fully done, never halfway. Incrementing an AtomicInteger is atomic, whereas count++ on a normal integer isn't.

Compare-and-swap is the CPU instruction behind most atomics. It takes a memory location, an expected old value and a new value, and writes the new value only if the location still holds the expected value, returning whether it succeeded. You use it in a loop: read the value, compute the new one, try CAS, and if another thread changed it in between, retry.

That's how lock-free data structures and counters work without blocking threads. It's faster than locks under low contention, but under heavy contention threads waste time retrying. There's also the ABA problem, where a value changes from A to B and back to A, so CAS wrongly succeeds; version counters solve it. The same idea appears in databases as optimistic concurrency control."
@follow What does volatile do in Java?
It guarantees visibility and ordering: a write to a volatile field is immediately visible to other threads, and reads and writes aren't reordered around it. It doesn't make compound operations like count++ atomic.

### [2] Explain the producer-consumer problem and how to solve it.
@tags concurrency, queues
@hook Producers add to a bounded buffer, consumers take from it. Block producers when full and consumers when empty.
@say
"Producers generate work items and consumers process them, sharing a bounded buffer. The challenges are: consumers must wait when the buffer is empty, producers must wait when it's full, and access to the buffer itself must be thread-safe.

The classic solution is a mutex for the buffer plus two condition variables, notEmpty and notFull. A producer locks, waits on notFull while the buffer is full, adds the item and signals notEmpty. A consumer does the mirror image.

In practice I use a blocking queue that already implements this, like Java's ArrayBlockingQueue, .NET's Channel or BlockingCollection, Go channels or Python's queue.Queue. The bounded size is important: it creates back-pressure, so a fast producer slows down instead of exhausting memory. At system scale, the same pattern is a message broker like Kafka or RabbitMQ between services."
@deep
```python
import queue, threading

jobs = queue.Queue(maxsize=100)     # bounded: producers block when full

def producer():
    for i in range(1000):
        jobs.put(i)                 # blocks if full
    jobs.put(None)                  # poison pill to stop the consumer

def consumer():
    while (item := jobs.get()) is not None:
        process(item)
        jobs.task_done()

threading.Thread(target=producer).start()
threading.Thread(target=consumer).start()
```
