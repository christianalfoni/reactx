# Patterns

Condensed examples for common scenarios. Each shows the state setup and the component side-by-side.

---

## Composing state

Break large state into focused classes. A single `reactive()` call on the root propagates into all nested instances.

**Eager** — instantiate sub-state as a class property:

```ts
class UserState {
  name = "Alice";
  rename(name: string) {
    this.name = name;
  }
}

class AppState {
  user = new UserState();
}

export const app = reactive(new AppState());
```

**Lazy** — instantiate on first access and cache:

```ts
class AppState {
  private _dashboard?: DashboardState;

  get dashboard() {
    return (this._dashboard ??= new DashboardState());
  }
}
```

**Per-key** — one instance per entity ID:

```ts
class AppState {
  private _profiles = new Map<string, ProfileState>();

  profile(userId: string) {
    if (!this._profiles.has(userId)) {
      this._profiles.set(userId, new ProfileState(userId));
    }
    return this._profiles.get(userId)!;
  }
}
```

**Scoping re-renders** — pass sub-state as props so each component only re-renders when its slice changes:

```tsx
function UserCard({ user }: { user: UserState }) {
  return (
    <input value={user.name} onChange={(e) => user.rename(e.target.value)} />
  );
}

function App() {
  return <UserCard user={app.user} />;
}
```

---

## Services

Define interface, provide browser implementation, inject via constructor:

```ts
// services/interface.ts
export interface Http {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body: unknown): Promise<T>;
}

export interface Persistence {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export interface Services {
  http: Http;
  persistence: Persistence;
}
```

```ts
// app.ts
class AppState {
  token: string | undefined;

  constructor(private services: Services) {
    this.token = services.persistence.get<string>("token");
  }

  async signIn(email: string, password: string) {
    const { token } = await this.services.http.post<{ token: string }>(
      "/auth/login",
      { email, password },
    );
    this.token = token;
    this.services.persistence.set("token", token);
  }

  signOut() {
    this.token = undefined;
    this.services.persistence.remove("token");
  }
}

export const app = reactive(new AppState(browserServices));
```

**Testing** — swap in lightweight in-memory implementations, no mocking needed:

```ts
const testServices: Services = {
  persistence: {
    store: new Map<string, unknown>(),
    get<T>(key: string) {
      return this.store.get(key) as T | undefined;
    },
    set<T>(key: string, value: T) {
      this.store.set(key, value);
    },
    remove(key: string) {
      this.store.delete(key);
    },
  },
  http: {
    async get<T>() {
      return fixtureData as T;
    },
    async post<T>() {
      return fixtureData as T;
    },
  },
};

const app = reactive(new AppState(testServices));
```

---

## Invariants

Some state is nullable at the top level but guaranteed non-null in certain contexts — an authenticated user, a loaded resource, a selected item. Rather than threading null checks through every component that can only ever render when the value exists, define a getter that throws if the invariant is violated:

```ts
class AppState {
  user: User | null = null;

  get authenticatedUser(): User {
    if (!this.user) throw new Error("No authenticated user");
    return this.user;
  }
}
```

Components rendered inside an authenticated route use the invariant directly — no null check, no prop drilling, no ceremony:

```tsx
function Profile() {
  return <div>{app.authenticatedUser.name}</div>;
}
```

If the invariant fires it's a programming error (wrong render tree), not a runtime condition to handle gracefully. This is the same contract `useContext` enforces when you throw on missing provider — the guarantee lives at the boundary (the route, the provider), not scattered across every consumer.

---

## Subscriptions

Wire a state subscription to the component lifecycle with `useEffect`. Because `subscribe` returns its own cleanup, no wrapper is needed:

```tsx
function Dashboard() {
  useEffect(() => app.dashboard.subscribe(), []);

  return (
    <ul>
      {app.dashboard.statistics.map((s) => (
        <li key={s.id}>
          {s.label}: {s.value}
        </li>
      ))}
    </ul>
  );
}
```
