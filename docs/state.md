# State

State is where all the logic of your application lives. Not just data — the decisions, transitions, computations, and async operations too. If something involves your domain, it belongs in a state class, not in a component and not in a service.

This separation has a clear payoff: components become predictable views over state, services remain domain-agnostic tools, and your core logic is testable without mounting anything.

## Defining state

A state class is a plain class. Properties hold data, methods express intent, getters compute derived values:

```ts
import { reactive } from "reactx";

class App {
  count = 0;

  increment() {
    this.count++;
  }

  decrement() {
    if (this.count > 0) this.count--;
  }

  get isZero() {
    return this.count === 0;
  }
}

export const app = reactive(new App());
```

No decorators, no store primitives. The class is the state.

## Async operations

Async methods live in the state class. The method does the work and assigns the result — components only call the method and observe the state it produces.

```ts
class App {
  posts: Post[] = [];
  isLoading = false;

  async loadPosts() {
    this.isLoading = true;
    this.posts = await this.services.http.get<Post[]>("/posts");
    this.isLoading = false;
  }

  async createPost(title: string) {
    const post = await this.services.http.post<Post>("/posts", { title });
    this.posts = [...this.posts, post];
  }
}
```

When you want the UI to suspend during an async operation, store the Promise directly as a property and consume it with React's `use()`:

```ts
class App {
  posts = this.services.http.get<Post[]>("/posts");
}
```

```tsx
function PostList() {
  const posts = use(app.posts); // suspends until resolved
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

## Computed values

Getters are computed automatically. They re-evaluate only when the properties they read change:

```ts
class App {
  items: Item[] = [];
  filter: "all" | "active" | "done" = "all";

  get visibleItems() {
    if (this.filter === "all") return this.items;
    return this.items.filter(i => i.status === this.filter);
  }

  get doneCount() {
    return this.items.filter(i => i.status === "done").length;
  }
}
```

## Composing state

Break large state into focused classes. A sub-state class owns its own properties and methods, and the parent class composes them:

```ts
class SessionState {
  user: User | null = null;

  constructor(private services: Services) {}

  async signIn(email: string, password: string) {
    const { user, token } = await this.services.http.post<{ user: User; token: string }>(
      "/auth/login",
      { email, password }
    );
    this.user = user;
    this.services.persistence.set("token", token);
  }

  signOut() {
    this.user = null;
    this.services.persistence.remove("token");
  }

  get isAuthenticated() {
    return this.user !== null;
  }
}

class App {
  session = new SessionState(services);
  // other sub-states...
}

export const app = reactive(new App());
```

Components can receive a sub-state instance as a prop. This scopes re-renders to the component that actually cares about it:

```tsx
function Header({ session }: { session: SessionState }) {
  if (!session.isAuthenticated) return <SignInButton />;
  return <span>Welcome, {session.user!.name}</span>;
}

function Root() {
  return <Header session={app.session} />;
}
```

## Lazy sub-state

Create a sub-state on first access and cache it for the lifetime of the app:

```ts
class App {
  #dashboard?: DashboardState;

  get dashboard() {
    return (this.#dashboard ??= new DashboardState(services));
  }
}
```

`DashboardState` is only instantiated when something first accesses `app.dashboard`.

## Per-key sub-state

One state instance per entity — backed by a private Map:

```ts
class App {
  #profiles = new Map<string, ProfileState>();

  profile(userId: string) {
    if (!this.#profiles.has(userId)) {
      this.#profiles.set(userId, new ProfileState(userId, services));
    }
    return this.#profiles.get(userId)!;
  }
}
```

```tsx
function ProfilePage({ userId }: { userId: string }) {
  const profile = app.profile(userId);
  return <div>{profile.name}</div>;
}
```

## Explicit finite states

Some state is naturally finite — authentication, a multi-step form, a wizard. Model it explicitly so invalid states become unrepresentable:

```ts
class Unauthenticated {
  readonly current = "UNAUTHENTICATED" as const;
  constructor(private session: SessionState) {}

  signIn(credentials: Credentials) {
    this.session.phase = new Authenticating(this.session, credentials);
  }
}

class Authenticating {
  readonly current = "AUTHENTICATING" as const;
  constructor(private session: SessionState, credentials: Credentials) {
    authenticate(credentials).then(
      user  => { this.session.phase = new Authenticated(this.session, user); },
      ()    => { this.session.phase = new Unauthenticated(this.session); }
    );
  }
}

class Authenticated {
  readonly current = "AUTHENTICATED" as const;
  constructor(private session: SessionState, public user: User) {}

  signOut() {
    this.session.phase = new Unauthenticated(this.session);
  }
}

class SessionState {
  phase: Unauthenticated | Authenticating | Authenticated = new Unauthenticated(this);
}
```

Each class only exposes the methods valid in that phase. TypeScript narrows the union as you check `current`, so calling `signOut()` on an unauthenticated session is a compile-time error.

## Live subscriptions

State classes can manage their own subscriptions. Define a `subscribe` method that returns a cleanup function, then wire it to the component lifecycle with `useEffect`:

```ts
class DashboardState {
  statistics: Statistic[] = [];

  constructor(private services: Services) {}

  subscribe() {
    return this.services.realtime.subscribe<Statistic[]>("statistics", (stats) => {
      this.statistics = stats;
    });
  }
}
```

```tsx
function Dashboard() {
  useEffect(() => app.dashboard.subscribe(), []);
  return <div>{app.dashboard.statistics.length} stats</div>;
}
```

If multiple components share the same live state, use a ref-count so the subscription stays active until the last consumer unmounts:

```ts
class DashboardState {
  statistics: Statistic[] = [];
  #count = 0;
  #dispose?: () => void;

  subscribe() {
    if (++this.#count === 1) {
      this.#dispose = this.services.realtime.subscribe<Statistic[]>(
        "statistics",
        (stats) => { this.statistics = stats; }
      );
    }
    return () => {
      if (--this.#count === 0) this.#dispose?.();
    };
  }
}
```
