# Scaling up

reactx is designed to grow with your app. You start with almost nothing and add structure only when you feel a specific pressure — never preemptively. Each step below is a response to a problem the previous step creates. If you don't have the problem yet, don't take the step.

```
single class → services → service interfaces → DI container → platform-split components
```

---

## 1. Start with a single state class

Most apps begin here, exactly like the [quick example](../README.md#quick-example). One class holds your state, and `reactive()` makes it observable. No services, no interfaces, no container.

```ts
// app.ts
import { reactive } from "reactx";

class AppState {
  count = 0;

  increment() {
    this.count++;
  }

  get doubled() {
    return this.count * 2;
  }
}

export const app = reactive(new AppState());
```

This carries you a long way. Add more classes and compose them (see [Patterns → Composing state](patterns.md#composing-state)) as the domain grows. You only need the next step once your state starts reaching outside itself.

---

## 2. Introduce services

The moment a method needs to talk to the network, read from storage, or set a timer, that side effect doesn't belong inline in state — it belongs in a **service**. State stays pure domain logic; the service owns the messy infrastructure.

```ts
// services/browser.ts
export class BrowserHttp {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(url);
    return res.json();
  }
  async post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return res.json();
  }
}
```

```ts
// app.ts
class AppState {
  posts: Post[] = [];

  constructor(private http: BrowserHttp) {}

  async loadPosts() {
    this.posts = await this.http.get<Post[]>("/api/posts");
  }
}

export const app = reactive(new AppState(new BrowserHttp()));
```

State no longer knows *how* a request happens — only that it can ask for one. That separation is the whole point ([Architecture → Services](architecture.md#services)).

---

## 3. Give services an interface

As soon as you need the same state to run in more than one environment — server-side rendering, a native client, or just tests — the concrete `BrowserHttp` becomes a liability. Define the **contract** as an interface and provide an implementation per environment.

```ts
// services/interface.ts
export interface Http {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body: unknown): Promise<T>;
}
```

```ts
// services/browser.ts
export class BrowserHttp implements Http {
  /* uses fetch */
}

// services/server.ts
export class ServerHttp implements Http {
  /* uses the server's own client, forwards cookies, etc. */
}
```

State depends on `Http`, not on any implementation:

```ts
class AppState {
  constructor(private http: Http) {}
}

// browser entry
export const app = reactive(new AppState(new BrowserHttp()));

// server entry
export const app = reactive(new AppState(new ServerHttp()));
```

Tests swap in a lightweight in-memory implementation with no mocking framework (see [Patterns → Services](patterns.md#services)). One state class, many environments.

---

## 4. Wire dependencies with tsyringe

Hand-wiring works until the graph gets deep — a dozen services, some depending on each other, each needing the right implementation for the current environment. At that point constructor wiring at the entry point becomes a chore and a source of mistakes. [tsyringe](https://github.com/microsoft/tsyringe) resolves the whole graph for you: register implementations once, ask for the root, get everything wired.

Use **abstract classes** as service contracts. Interfaces are erased at runtime, but abstract classes are preserved, so tsyringe can resolve them via `reflect-metadata` without explicit injection tokens.

```ts
// services/http.ts
export abstract class Http {
  abstract get<T>(url: string): Promise<T>;
  abstract post<T>(url: string, body: unknown): Promise<T>;
}

// services/persistence.ts
export abstract class Persistence {
  abstract get<T>(key: string): T | null;
  abstract set<T>(key: string, value: T): void;
  abstract remove(key: string): void;
}
```

```ts
// services/browser.ts
@injectable()
export class BrowserHttp extends Http {
  async get<T>(url: string) { /* ... */ }
  async post<T>(url: string, body: unknown) { /* ... */ }
}

@injectable()
export class BrowserPersistence extends Persistence {
  get<T>(key: string) { /* ... */ }
  set<T>(key: string, value: T) { /* ... */ }
  remove(key: string) { /* ... */ }
}
```

```ts
// container.ts
container.registerSingleton(Http, BrowserHttp);
container.registerSingleton(Persistence, BrowserPersistence);
```

```ts
// app.ts
@singleton()
class AppState {
  constructor(
    private http: Http,
    private persistence: Persistence,
  ) {}
}

export const app = reactive(container.resolve(AppState));
```

Tests register in-memory implementations before resolving — the environment swap from step 3, now driven by the container:

```ts
container.registerInstance(Http, {
  get: async () => fixtureData,
  post: async () => fixtureData,
});
container.registerInstance(Persistence, new InMemoryPersistence());

const app = reactive(container.resolve(AppState));
```

---

## 5. Split components by platform

Everything so far has scaled the *state* and *service* layers — the part of the app that has no idea what it looks like. The component layer is where platform differences finally appear.

When you support desktop and mobile, you have a choice:

**Responsive components** — one component tree, CSS breakpoints, and conditional layout. This is the right default *when the two experiences are fundamentally the same* and only the arrangement differs. A list that becomes a narrower list, a sidebar that collapses into a drawer.

**Platform-specific components** — separate component trees over a **shared state layer**. Reach for this when the experiences differ more than they resemble each other: different navigation models, different gestures, different information density, different flows entirely. Trying to express that divergence through breakpoints in a single tree produces components riddled with conditionals that serve neither platform well.

Because state and services know nothing about the UI, the split is clean. Both trees consume the *same* `AppState`:

```
src/
  state/            # shared — one source of truth
  services/         # shared
  components/
    desktop/        # desktop-specific experience
    mobile/         # mobile-specific experience
    common/         # truly cross-platform components
```

```tsx
// entry — pick the tree once, hand both the same state
const app = reactive(container.resolve(AppState));

const Root = isMobile ? MobileApp : DesktopApp;

createRoot(el).render(
  <AppContext.Provider value={app}>
    <Root />
  </AppContext.Provider>,
);
```

The argument for this structure is that **divergence belongs in the layer that actually diverges**. The platforms disagree about presentation and interaction, not about what a user or a post *is* — so let them disagree in `desktop/` and `mobile/` while agreeing completely in `state/`.

A `components/common/` folder is the pressure valve for the things that genuinely don't differ — an avatar, a formatted timestamp, a brand mark. Keep it for *truly* shared components only. The temptation is to push a component into `common/` because it's "mostly the same"; resist it. The moment a shared component sprouts `if (isMobile)` branches, it has stopped being shared and wants to be two components. Duplication across `desktop/` and `mobile/` is cheaper than a common component that secretly serves two masters.
