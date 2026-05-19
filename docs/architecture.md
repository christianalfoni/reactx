# Architecture

reactx divides an application into four layers. At each end you have something completely generic with no knowledge of your domain. In the middle, the two layers that are specific to your application.

```
services → state → components → ui-components
```

**Services** and **ui-components** know nothing about your app. **State** and **components** know everything about it.

---

## Services

Services give state classes access to the environment: the network, local storage, push notifications, third-party SDKs, a WebSocket connection.

A service has no knowledge of your domain. It knows how to `get`, `post`, `subscribe`, and `store` — it has no idea what a user, a post, or a shopping cart is.

```ts
// ✓ A service: infrastructure verbs, no domain knowledge
interface Http {
  get<T>(url: string): Promise<T>
  post<T>(url: string, body: unknown): Promise<T>
  patch<T>(url: string, body: unknown): Promise<T>
  delete(url: string): Promise<void>
}

// ✗ Not a service: domain logic wearing a service costume
interface UserService {
  fetchCurrentUser(): Promise<User>
  updateUsername(id: string, name: string): Promise<void>
}
```

The second example isn't a service — it's domain logic. That code belongs as methods on a state class that calls `http.get` and `http.patch`.

This distinction keeps services reusable across every feature, trivially swappable when the platform changes (web → native), and easy to replace with in-memory fakes in tests.

Services are injected into state classes through the constructor, never imported directly:

```ts
class AppState {
  constructor(private services: Services) {}

  async signIn(email: string, password: string) {
    const { token } = await this.services.http.post<{ token: string }>(
      "/auth/login",
      { email, password }
    )
    this.token = token
    this.services.persistence.set("token", token)
  }
}

export const app = reactive(new AppState(browserServices))
```

`AppState` knows nothing about `fetch`, `localStorage`, or any particular HTTP client. It works against an interface. Swap the implementation and the state class is untouched.

---

## State

State owns the truth of your application. It holds data, exposes computed values derived from that data, and provides methods through which everything is mutated.

```ts
class AppState {
  count = 0                              // data

  get doubled() { return this.count * 2 } // derived value

  increment() { this.count++ }           // mutation
}

export const app = reactive(new AppState())
```

**Properties** are plain class fields — no decorators, no boilerplate. reactx makes them observable automatically.

**Getters** are computed values. They recalculate only when the data they depend on changes.

**Methods** are the only place mutations belong. Components never write to state directly — they call a method and let state take responsibility for what changes.

Everything that has meaning in your application belongs here: which user is signed in, what items are in the list, whether a request is in flight, which tab is active. If you'd want to see it in DevTools, test it without mounting a component, or access it from two different parts of the UI — it's state.

---

## Components

A component's job is to derive UI from state. It reads what it needs, renders it, and calls methods on state when the user acts.

```tsx
function Header() {
  return (
    <header>
      <span>{app.session.user?.name}</span>
      <button onClick={app.session.signOut}>Sign out</button>
    </header>
  )
}
```

No providers. No context. No selectors. No subscription hooks. Import state and use it.

Components re-render only when the specific properties they read actually change — not on every state update, just the ones that are relevant to what they rendered.

---

## UI Components

Just like services have no knowledge of your domain, UI components have no knowledge of your application. A `<Tooltip />`, `<Dropdown />`, or `<Input />` is a generic building block — it doesn't know what app it's in.

These are the only components that should use `useState`. Their internal state (hover, open/closed, focus) has no meaning outside themselves and no reason to live anywhere else.

The moment a component knows it's a `<NewPost />` or a `<UserSettings />`, it's no longer a UI component — it's a component, and its state belongs in a state class.
