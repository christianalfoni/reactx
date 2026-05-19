# Patterns

Condensed examples for common scenarios. Each shows the state setup and the component side-by-side.

---

## Composing state

Break large state into focused classes. A single `reactive()` call on the root propagates into all nested instances.

**Eager** — instantiate sub-state as a class property:

```ts
class UserState {
  name = "Alice"
  rename(name: string) { this.name = name }
}

class AppState {
  user = new UserState()
}

export const app = reactive(new AppState())
```

**Lazy** — instantiate on first access and cache:

```ts
class AppState {
  private _dashboard?: DashboardState

  get dashboard() {
    return (this._dashboard ??= new DashboardState())
  }
}
```

**Per-key** — one instance per entity ID:

```ts
class AppState {
  private _profiles = new Map<string, ProfileState>()

  profile(userId: string) {
    if (!this._profiles.has(userId)) {
      this._profiles.set(userId, new ProfileState(userId))
    }
    return this._profiles.get(userId)!
  }
}
```

**Scoping re-renders** — pass sub-state as props so each component only re-renders when its slice changes:

```tsx
function UserCard({ user }: { user: UserState }) {
  return <input value={user.name} onChange={e => user.rename(e.target.value)} />
}

function App() {
  return <UserCard user={app.user} />
}
```

---

## Services

Define interface, provide browser implementation, inject via constructor:

```ts
// services/interface.ts
export interface Http {
  get<T>(url: string): Promise<T>
  post<T>(url: string, body: unknown): Promise<T>
}

export interface Persistence {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  remove(key: string): void
}

export interface Services { http: Http; persistence: Persistence }
```

```ts
// app.ts
class AppState {
  token: string | undefined

  constructor(private services: Services) {
    this.token = services.persistence.get<string>("token")
  }

  async signIn(email: string, password: string) {
    const { token } = await this.services.http.post<{ token: string }>(
      "/auth/login", { email, password }
    )
    this.token = token
    this.services.persistence.set("token", token)
  }

  signOut() {
    this.token = undefined
    this.services.persistence.remove("token")
  }
}

export const app = reactive(new AppState(browserServices))
```

**Testing** — swap in lightweight in-memory implementations, no mocking needed:

```ts
const testServices: Services = {
  persistence: {
    store: new Map<string, unknown>(),
    get<T>(key: string) { return this.store.get(key) as T | undefined },
    set<T>(key: string, value: T) { this.store.set(key, value) },
    remove(key: string) { this.store.delete(key) },
  },
  http: {
    async get<T>() { return fixtureData as T },
    async post<T>() { return fixtureData as T },
  },
}

const app = reactive(new AppState(testServices))
```

---

## Blocking async data

Store a Promise on state; use React's `use()` to unwrap it. The component suspends until the data arrives; a `Suspense` boundary controls the loading UI:

```ts
class AppState {
  posts = this.services.http.get<Post[]>("/posts")
}
```

```tsx
function PostList() {
  const posts = use(app.posts)
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}

function Feed() {
  return (
    <Suspense fallback={<Spinner />}>
      <PostList />
    </Suspense>
  )
}
```

---

## Non-blocking async operations

Use `useTransition` when the UI already has content and the operation should run without suspending:

```tsx
function RefreshButton() {
  const [isPending, startTransition] = useTransition()
  return (
    <button onClick={() => startTransition(() => app.loadPosts())} disabled={isPending}>
      {isPending ? "Refreshing…" : "Refresh"}
    </button>
  )
}
```

The same pattern works for form submissions:

```tsx
function NewPostForm() {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const title = new FormData(e.currentTarget).get("title") as string
    startTransition(() => app.createPost(title))
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" disabled={isPending} />
      <button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save"}</button>
    </form>
  )
}
```

---

## Finite state

Model explicit phases as a union type. TypeScript narrows what's available in each branch — no nullable fields, no boolean flags:

```tsx
function SessionView() {
  const { phase } = app.session

  if (phase.current === "AUTHENTICATED") {
    return (
      <div>
        Welcome, {phase.user.name}
        <button onClick={phase.signOut}>Sign out</button>
      </div>
    )
  }

  if (phase.current === "AUTHENTICATING") {
    return <Spinner />
  }

  return <SignInForm onSubmit={phase.signIn} />
}
```

---

## Subscriptions

Wire a state subscription to the component lifecycle with `useEffect`. Because `subscribe` returns its own cleanup, no wrapper is needed:

```tsx
function Dashboard() {
  useEffect(() => app.dashboard.subscribe(), [])

  return (
    <ul>
      {app.dashboard.statistics.map(s => (
        <li key={s.id}>{s.label}: {s.value}</li>
      ))}
    </ul>
  )
}
```
