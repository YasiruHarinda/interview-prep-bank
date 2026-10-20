@section oop | OOP, SOLID and Design Patterns
@blurb Pillars, principles and the patterns interviewers love to poke at, plus the low-level design round.

### [1] What are the four pillars of object-oriented programming?
@tags oop, basics
@hook Encapsulation hides state, abstraction hides complexity, inheritance reuses, polymorphism swaps.
@say
"The four pillars are encapsulation, abstraction, inheritance and polymorphism.

Encapsulation means bundling data with the methods that operate on it and hiding the internal state, so other code can only change it through a controlled interface. A BankAccount exposes deposit and withdraw, not a public balance field anyone can overwrite.

Abstraction means exposing what an object does while hiding how it does it. I call send on a notification service without caring whether it uses email or SMS underneath.

Inheritance lets a class reuse and extend another class's behaviour, modelling an 'is-a' relationship, like SavingsAccount extends Account.

Polymorphism means one interface, many implementations: I can call area on any Shape, and the right version runs for a Circle or a Rectangle at run time. That's what lets code depend on general types and still behave correctly for specific ones."
@deep
```java
abstract class Shape {                 // abstraction
    abstract double area();
}
class Circle extends Shape {           // inheritance
    private final double r;            // encapsulation
    Circle(double r) { this.r = r; }
    double area() { return Math.PI * r * r; }
}
class Rect extends Shape {
    private final double w, h;
    Rect(double w, double h) { this.w = w; this.h = h; }
    double area() { return w * h; }
}
double total(List<Shape> shapes) {     // polymorphism
    return shapes.stream().mapToDouble(Shape::area).sum();
}
```
@pro
Add that in modern code, polymorphism through interfaces is used far more than deep inheritance trees. It shows you know how the pillars are used in practice, not just their definitions.

### [1] What is the difference between abstraction and encapsulation?
@tags oop
@hook Abstraction decides what to show. Encapsulation decides how to protect what's hidden.
@say
"They're related but different. Abstraction is a design idea: show only the essential behaviour and hide the complexity. A car gives you a steering wheel and pedals; you don't need to know how fuel injection works. In code, that's an interface like PaymentGateway with a charge method.

Encapsulation is the mechanism that protects an object's internal state: private fields, with access only through methods that keep the object valid. The car's engine is sealed under the bonnet, so you can't accidentally pull a wire.

So abstraction is about simplifying the view from outside, and encapsulation is about guarding the inside. Good classes do both."

### [1] Abstract class vs interface. When do you use each?
@tags oop, java, csharp
@hook Interface: a capability contract, many per class. Abstract class: a partial implementation shared by close relatives, one per class.
@say
"An interface defines a contract, meaning what a type can do, without dictating how. A class can implement many interfaces, so they're great for capabilities that cut across unrelated classes, like Comparable, Serializable or IPaymentProvider.

An abstract class is a partially implemented base class. It can have fields, constructors and shared method implementations, but a class can only extend one. I use it when several closely related classes share real state and behaviour, like a BaseRepository with common logging and connection handling.

The lines have blurred, since Java and C# interfaces can now have default methods. But my rule of thumb is: start with an interface, because it keeps coupling low and is easy to mock in tests, and introduce an abstract class only when there's genuinely shared state or code among related types."
@deep
| | Interface | Abstract class |
|---|---|---|
| Multiple per class | Yes | No (single inheritance) |
| Fields / state | No instance fields | Yes |
| Constructors | No | Yes |
| Method bodies | Default methods only | Yes |
| Relationship | "Can do" | "Is a" |
| Best for | Contracts, testing seams, plugins | Shared base behaviour in a family |

### [1] Method overloading vs overriding?
@tags polymorphism
@hook Overloading: same name, different parameters, chosen at compile time. Overriding: same signature in a subclass, chosen at run time.
@say
"Overloading is defining multiple methods with the same name but different parameter lists in the same class, like add(int, int) and add(double, double). The compiler picks which one to call based on the argument types, so it's called compile-time or static polymorphism.

Overriding is when a subclass provides its own implementation of a method that already exists in its parent, with the same signature. Which version runs is decided at run time based on the actual object type, which is runtime or dynamic polymorphism. It's what lets a List of Animal call speak and get 'woof' or 'meow'.

In Java I always use the Override annotation, and C# requires the virtual and override keywords, so the compiler catches mistakes like a typo that would accidentally create a new method instead of overriding."
@follow Can you override a static method?
No. Static methods belong to the class, not the instance, so they're resolved at compile time. A subclass can declare a static method with the same signature, but that's hiding, not overriding.

### [1] Composition vs inheritance. Why is composition often preferred?
@tags design, oop
@hook Inheritance is "is-a" and welds classes together. Composition is "has-a" and lets you swap parts.
@say
"Inheritance models an 'is-a' relationship and reuses code by extending a parent class. Composition models a 'has-a' relationship: a class holds references to other objects and delegates work to them.

Composition is usually preferred for three reasons. First, inheritance creates tight coupling: a change in the base class can break every subclass, which is called the fragile base class problem. Second, inheritance hierarchies get rigid. If you have FlyingDuck and SwimmingDuck, what do you do for a duck that does both, or a rubber duck that does neither? Third, composition is flexible at run time: you can inject a different FlyBehavior, or a mock in a test.

I still use inheritance when there's a true, stable 'is-a' relationship and the subclass genuinely is substitutable for the parent. But by default I reach for interfaces plus composition."
@deep
```java
interface Engine { void start(); }
class ElectricEngine implements Engine { public void start() { /* ... */ } }
class PetrolEngine implements Engine { public void start() { /* ... */ } }

class Car {
    private final Engine engine;          // has-a
    Car(Engine engine) { this.engine = engine; }
    void drive() { engine.start(); }
}
// Swap behaviour without a new subclass:
new Car(new ElectricEngine());
```

### [1] What are the SOLID principles?
@tags solid, design principles
@hook Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion.
@say
"SOLID is five principles for code that's easy to change.

S is Single Responsibility: a class should have one reason to change. An Invoice class shouldn't also format PDFs and send emails.

O is Open-Closed: open for extension, closed for modification. To add a new payment method, I add a new class implementing PaymentMethod, rather than editing a giant switch statement.

L is Liskov Substitution: a subclass must be usable anywhere its parent is expected without breaking behaviour.

I is Interface Segregation: many small, focused interfaces are better than one fat one, so classes don't implement methods they don't need.

D is Dependency Inversion: high-level code should depend on abstractions, not concrete classes. My OrderService depends on an IOrderRepository interface, not directly on a SQL repository, so I can swap the database or mock it in tests.

Together they reduce coupling and make change local, but I apply them with judgement. Over-applying them creates a maze of tiny classes."
@deep
Open-closed in practice:
```python
# Before: every new type edits this function
def area(shape):
    if shape.kind == "circle": return 3.14159 * shape.r ** 2
    if shape.kind == "square": return shape.side ** 2

# After: new shapes extend, nothing existing is modified
class Shape:
    def area(self) -> float: ...
class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self): return 3.14159 * self.r ** 2
```
@trap
Reciting the five names without an example each. Interviewers will immediately ask "give me a violation of one of them from real code."

### [2] Explain the Liskov Substitution Principle with an example of a violation.
@tags solid, lsp
@hook If code works with the parent, it must keep working with any child. Square-extends-Rectangle breaks that.
@say
"Liskov says that objects of a subclass should be replaceable for objects of the parent class without breaking the program's correctness. Subclasses can extend behaviour, but they can't weaken the parent's promises.

The classic violation is Square extending Rectangle. A Rectangle lets you set width and height independently. A Square has to keep them equal, so setting the width also changes the height. Now a function that takes a Rectangle, sets width to 5 and height to 4, and expects an area of 20, gets 16 when passed a Square. The subclass broke the parent's contract.

Other common violations are a subclass throwing NotSupportedException for an inherited method, like a ReadOnlyList that throws on add, or requiring stricter inputs than the parent. The fix is usually a better hierarchy: Square and Rectangle can both implement a Shape interface instead of one inheriting from the other."
@deep
LSP rules of thumb for a subclass:
- Preconditions cannot be strengthened (don't demand more from callers).
- Postconditions cannot be weakened (don't promise less).
- Invariants of the parent must still hold.
- Don't throw new exception types callers wouldn't expect.

### [2] What is dependency injection, and how does it relate to dependency inversion?
@tags di, ioc, solid, dotnet
@hook Inversion is the principle: depend on abstractions. Injection is the technique: hand dependencies in from outside.
@say
"Dependency inversion is the principle: high-level modules shouldn't depend on low-level details; both should depend on abstractions. Dependency injection is a technique for achieving it: instead of a class creating its own dependencies with new, they're passed in, usually through the constructor.

So OrderService takes an IOrderRepository and an IEmailSender in its constructor. In production, a DI container wires up the real SQL repository and SMTP sender; in tests, I pass in fakes. That gives loose coupling, easy testing, and the ability to swap implementations through configuration.

Frameworks like ASP.NET Core and Spring have built-in containers that also manage lifetimes. In .NET those are transient, a new instance every time, scoped, one per HTTP request, which is typical for a database context, and singleton, one for the whole app. A classic bug is injecting a scoped service into a singleton, which accidentally keeps one request's object alive forever."
@deep
```csharp
public class OrderService
{
    private readonly IOrderRepository _repo;
    private readonly IEmailSender _email;
    public OrderService(IOrderRepository repo, IEmailSender email)
    {
        _repo = repo; _email = email;
    }
}

// Program.cs
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();
builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<OrderService>();
```
@follow Constructor injection vs property injection?
Constructor injection is the default: dependencies are explicit, required and can be immutable. Property injection is for truly optional dependencies. A constructor with eight parameters is a smell that the class has too many responsibilities.

### [1] What do coupling and cohesion mean?
@tags design principles
@hook Aim for low coupling between modules and high cohesion inside each one.
@say
"Coupling is how much one module depends on the internals of another. High coupling means a change in one place ripples through many others. Cohesion is how closely related the responsibilities inside a single module are. High cohesion means everything in the class serves one clear purpose.

The goal is low coupling and high cohesion. For example, a UserService that handles registration, login and password reset is cohesive. If it also generates sales reports, cohesion is low. And if the ReportService reaches directly into the UserService's database tables, that's tight coupling. I'd have them communicate through a defined interface or API instead.

Low coupling plus high cohesion is what makes a codebase easy to test, easy to change and easy to split into services later if needed."

### [1] What do DRY, KISS and YAGNI mean, and when can they go wrong?
@tags design principles, clean code
@hook Don't repeat knowledge, keep it simple, don't build for imaginary futures. Each one can be overdone.
@say
"DRY, Don't Repeat Yourself, means every piece of knowledge should have a single source of truth, so a business rule changes in one place. KISS, Keep It Simple, means prefer the simplest design that works, because simple code has fewer bugs and is easier for the next person. YAGNI, You Aren't Gonna Need It, means don't build features or abstractions for requirements you only imagine.

Each can be overdone, though. Applying DRY too aggressively couples things that only look similar: two functions that happen to share code today may need to evolve separately, and a forced shared abstraction becomes painful. I follow the rule of three: tolerate duplication twice, and abstract on the third occurrence once the pattern is clear. Duplication is far cheaper than the wrong abstraction."

### [1] What are design patterns, and what categories are there?
@tags design patterns
@hook Named, reusable solutions to recurring design problems. Creational, structural and behavioral.
@say
"Design patterns are proven, named solutions to common design problems. Their real value is a shared vocabulary: saying 'use a strategy here' communicates a whole design in three words.

The classic Gang of Four book groups them into three categories. Creational patterns deal with object creation, like Singleton, Factory and Builder. Structural patterns deal with composing objects, like Adapter, Decorator, Facade and Proxy. Behavioral patterns deal with how objects interact and share responsibilities, like Strategy, Observer, Command and State.

I use them when the problem actually calls for them. Forcing patterns into simple code just adds indirection."
@deep
| Pattern | One-line purpose | Where you have seen it |
|---|---|---|
| Singleton | Exactly one instance | Logger, config (often via DI) |
| Factory | Create objects without naming the concrete class | `LoggerFactory.CreateLogger()` |
| Builder | Build complex objects step by step | `StringBuilder`, `HttpRequest.newBuilder()` |
| Adapter | Make one interface fit another | Wrapping a third-party SDK |
| Decorator | Add behaviour by wrapping | Java I/O streams, middleware |
| Facade | Simple front for a complex subsystem | An SDK client class |
| Proxy | Stand-in that controls access | Lazy loading, ORM entities |
| Strategy | Swap algorithms at run time | Sorting comparators, payment methods |
| Observer | Notify subscribers of changes | UI events, `addEventListener` |
| Command | Encapsulate a request as an object | Undo/redo, job queues |
| State | Behaviour changes with internal state | Order status, vending machine |

### [1] Implement a thread-safe Singleton. Why is Singleton controversial?
@tags design patterns, singleton, concurrency
@hook One instance, global access. Easy to write, easy to abuse: it's hidden global state.
@say
"A Singleton ensures a class has exactly one instance and provides a global access point to it. The simplest thread-safe version in Java is eager initialisation with a private constructor and a static final instance; the JVM guarantees class initialisation is thread-safe. If I need lazy loading, I use the holder idiom, or in C# the Lazy of T type.

It's controversial because it's essentially global state. Any code can reach it, so dependencies are hidden, tests become order-dependent because state leaks between them, and it's hard to replace with a mock. So in modern applications, I get the 'one instance' benefit from the DI container instead: I register the service as a singleton lifetime, and classes receive it through their constructor. Same single instance, but explicit and testable."
@deep
```java
// Lazy, thread-safe, no locking cost: the holder idiom
public final class Config {
    private Config() {}
    private static class Holder { static final Config INSTANCE = new Config(); }
    public static Config getInstance() { return Holder.INSTANCE; }
}
```
```csharp
public sealed class Config
{
    private static readonly Lazy<Config> _instance = new(() => new Config());
    public static Config Instance => _instance.Value;
    private Config() { }
}
```
Double-checked locking also works in Java but needs the field to be `volatile`; forgetting that is a classic bug.

### [2] Factory Method vs Abstract Factory vs Builder?
@tags design patterns, creational
@hook Factory: which class to make. Abstract factory: a matching family of classes. Builder: how to assemble one complex object.
@say
"All three are creational patterns, but they solve different problems.

A Factory Method decides which concrete class to instantiate, so callers depend only on an interface. For example, NotificationFactory.create('sms') returns an SmsNotifier, and the caller only knows Notifier.

An Abstract Factory creates families of related objects that must be used together. A UI toolkit might have a DarkThemeFactory and a LightThemeFactory, each producing a matching Button, Checkbox and Dialog, so you never mix a dark button with a light dialog.

A Builder constructs one complex object step by step, which is ideal when there are many optional parameters. Instead of a constructor with ten arguments where half are null, you write HttpRequest.newBuilder().uri(...).timeout(...).header(...).build(). It's readable, and the build step can validate the final object."
@deep
```python
class PizzaBuilder:
    def __init__(self): self._size, self._toppings, self._crust = "M", [], "thin"
    def size(self, s): self._size = s; return self
    def topping(self, t): self._toppings.append(t); return self
    def crust(self, c): self._crust = c; return self
    def build(self):
        if not self._toppings: raise ValueError("at least one topping")
        return Pizza(self._size, tuple(self._toppings), self._crust)

pizza = PizzaBuilder().size("L").topping("cheese").topping("olives").build()
```

### [2] Explain the Strategy pattern with an example.
@tags design patterns, behavioral
@hook Put each algorithm behind the same interface and swap them at run time. It replaces big if-else chains.
@say
"The Strategy pattern defines a family of interchangeable algorithms behind one interface, and lets the client choose one at run time.

Say an e-commerce checkout supports different discount rules: none, percentage off, buy-one-get-one, and loyalty pricing. Instead of a growing if-else block in the checkout code, I define a DiscountStrategy interface with an apply method, and each rule is its own small class. The checkout just calls strategy.apply(cart). Adding a new promotion means adding one class, with no change to checkout, which is the open-closed principle in action, and each strategy is easy to test alone.

In languages with first-class functions, a strategy can simply be a function passed as a parameter, like the key function you pass to sorted in Python or the comparator in Java."
@deep
```typescript
interface DiscountStrategy { apply(total: number): number; }
const none: DiscountStrategy = { apply: t => t };
const tenPercent: DiscountStrategy = { apply: t => t * 0.9 };
const flat5: DiscountStrategy = { apply: t => Math.max(0, t - 5) };

function checkout(total: number, discount: DiscountStrategy) {
  return discount.apply(total);
}
```

### [2] Explain the Observer pattern. How is it different from pub/sub?
@tags design patterns, events
@hook Observer: the subject keeps a list and calls subscribers directly. Pub/sub: a broker sits in the middle, and nobody knows anybody.
@say
"In the Observer pattern, a subject keeps a list of observers and notifies them directly when its state changes. A stock ticker notifies every chart and alert widget when the price updates. Observers can subscribe and unsubscribe at run time, and the subject only knows them through an interface. Event listeners in the browser and C# events are this pattern.

Publish-subscribe is a looser, often distributed version. Publishers send messages to a topic on a broker, like Kafka, RabbitMQ or Redis, and subscribers receive from that topic. Publishers and subscribers don't know each other exist, can run in different processes, and can be scaled or deployed independently. The broker can also buffer messages if a subscriber is slow or down.

So Observer is usually in-process and synchronous; pub/sub is usually cross-process, asynchronous and more decoupled."
@trap
Forgetting to unsubscribe observers. The subject holds references to them, which is a classic memory leak in long-lived apps.

### [2] Decorator vs Adapter vs Proxy vs Facade?
@tags design patterns, structural
@hook All four wrap something. Decorator adds behaviour, Adapter changes the interface, Proxy controls access, Facade simplifies.
@say
"All four wrap other objects, but for different reasons.

A Decorator keeps the same interface and adds behaviour. You can wrap a data source in a CompressionDecorator and then an EncryptionDecorator, stacking features at run time. Java's I/O streams and HTTP middleware pipelines work this way.

An Adapter converts one interface into another that the client expects. If my code expects a PaymentGateway interface and a new provider's SDK has a completely different API, I write an adapter that translates calls.

A Proxy has the same interface and controls access to the real object: lazy loading, caching, access checks, or calling a remote service as if it were local. ORMs use proxies to lazily load related entities.

A Facade provides one simple interface over a complex subsystem. A VideoConverter facade might hide ten classes for codecs, audio mixing and file handling behind one convert method."

### [2] What is MVC, and what does a typical layered architecture look like?
@tags architecture, mvc, layers
@hook Split by responsibility: input, business rules, data. Each layer only talks to the one below.
@say
"MVC stands for Model, View, Controller. The Model holds the data and business rules, the View renders the user interface, and the Controller handles input, calls the model and picks a view. It separates concerns so UI changes don't touch business logic.

For backend services I usually use a layered structure. The API or presentation layer handles HTTP: routing, validation and mapping to DTOs. The service or application layer contains the business logic and orchestrates use cases. The data access layer, often using the repository pattern, talks to the database. Each layer only calls the one below it.

The repository pattern is worth calling out: it wraps data access behind an interface like IOrderRepository with methods like getById and save. Business logic doesn't know whether data comes from SQL, a document store or an in-memory fake in tests."
@trap
Putting business rules in controllers. "Fat controllers" are one of the most common code-review comments in web apps.

### [3] What are Clean Architecture and Hexagonal Architecture?
@tags architecture, ddd, ports and adapters
@hook Business logic sits in the middle and depends on nothing. Databases, web and queues are plug-in adapters around it.
@say
"Both put the business logic at the centre and make it independent of frameworks, databases and the UI.

In Hexagonal Architecture, also called ports and adapters, the core domain defines ports, which are interfaces like OrderRepository or PaymentGateway. Adapters implement those ports for specific technologies: a Postgres adapter, a Stripe adapter, a REST controller adapter, a Kafka consumer adapter. The core never imports any of them.

Clean Architecture formalises the same idea as concentric layers: entities in the centre, then use cases, then interface adapters, then frameworks and drivers on the outside. The dependency rule is that source code dependencies only point inward.

The benefits are that the core is testable without a database or web server, and you can swap infrastructure, say from REST to gRPC, without touching business rules. The cost is more interfaces and mapping code, so I'd use it for services with real domain complexity, and keep simple CRUD services simple."
@deep
```text
          +-----------------------------+
 HTTP --> | Adapter: REST controller    |
          +-------------+---------------+
                        v  (port: PlaceOrder use case)
          +-----------------------------+
          |  Domain core: Order, rules  |
          +-------------+---------------+
                        v  (port: OrderRepository)
          +-----------------------------+
          | Adapter: Postgres repository| --> DB
          +-----------------------------+
```

### [2] Low-level design: design a parking lot.
@tags lld, object-oriented design
@hook Clarify, find the nouns (classes) and verbs (methods), keep responsibilities single, pick patterns where they earn their place.
@say
"I'd start with requirements. Say: multiple floors, spot sizes for motorcycles, cars and trucks, tickets on entry, fees on exit based on duration, and a display of free spots per floor.

Then I pick out the core classes. ParkingLot holds Floors. Each Floor holds ParkingSpots, which have a size and an occupied flag. Vehicle is an abstract class or interface with a size, with Car, Motorcycle and Truck. A Ticket records the vehicle, spot and entry time. Then there's an EntryGate and ExitGate, and a FeeCalculator.

For behaviour: parkVehicle finds a free spot of a suitable size, assigns it and issues a ticket. On exit, the FeeCalculator computes the fee from the ticket, and the spot is freed.

A few design choices I'd call out. The spot-finding rule is a Strategy, for example nearest spot first or fill lowest floor first, so it can change without touching the lot. Pricing is also a Strategy, so weekend or hourly pricing can be swapped. And since many gates run concurrently, assigning a spot must be atomic, using a lock per floor or a compare-and-set on the spot, so two cars never get the same spot."
@deep
```python
from enum import Enum
from datetime import datetime
import threading

class Size(Enum): SMALL = 1; MEDIUM = 2; LARGE = 3

class Spot:
    def __init__(self, sid, size): self.id, self.size, self.vehicle = sid, size, None
    def fits(self, v): return self.vehicle is None and self.size.value >= v.size.value

class Floor:
    def __init__(self, spots): self.spots, self.lock = spots, threading.Lock()
    def assign(self, vehicle):
        with self.lock:                                  # no double booking
            for s in self.spots:
                if s.fits(vehicle):
                    s.vehicle = vehicle
                    return s
        return None

class ParkingLot:
    def __init__(self, floors, pricing): self.floors, self.pricing = floors, pricing
    def park(self, vehicle):
        for f in self.floors:
            spot = f.assign(vehicle)
            if spot:
                return Ticket(vehicle, spot, datetime.now())
        raise LotFullError()
    def leave(self, ticket):
        ticket.spot.vehicle = None
        return self.pricing.fee(ticket.entry, datetime.now())
```
The same method works for other LLD prompts: elevator system (State pattern for elevator states, a scheduler strategy), vending machine (State pattern), library management, chess, splitting expenses, a rate limiter class, an LRU cache.
@follow How would you extend it for electric charging spots or reservations?
Add an ElectricSpot subtype or a capability flag on Spot, and make the spot-finding strategy aware of the vehicle's needs. For reservations, add a Reservation entity with a time window and have the assignment check it. The existing classes barely change, which is the point of the design.
@pro
Say which parts you would make thread-safe and why. Most candidates draw the classes and forget that two gates can race for the last spot.
