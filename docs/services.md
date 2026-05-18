# Services

A service is a general-purpose tool that gives your state classes access to the environment — the browser, a native runtime, a third-party SDK, a backend. Services speak the language of infrastructure, not the language of your application.

**A service should not know anything about your domain.** It does not know about users, posts, or shopping carts. It knows about `get`, `set`, `post`, `subscribe`. This distinction matters: it keeps services reusable across features, trivially testable, and easy to swap when the platform changes.

Your state classes are responsible for translating domain concepts into service calls.

```ts
// ✓ Right: a service speaks infrastructure
interface HttpService {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body: unknown): Promise<T>;
}

// ✗ Wrong: this is domain logic, not a service
interface UserService {
  fetchCurrentUser(): Promise<User>;
  updateUsername(id: string, name: string): Promise<void>;
}
```

## Defining services

Define an interface for each service, then provide concrete implementations at startup.

```ts
// services/interface.ts
export interface Persistence {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export interface Http {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body: unknown): Promise<T>;
  patch<T>(url: string, body: unknown): Promise<T>;
  delete(url: string): Promise<void>;
}

export interface Services {
  persistence: Persistence;
  http: Http;
}
```

```ts
// services/browser.ts
class LocalStoragePersistence implements Persistence {
  get<T>(key: string) {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  }
  set<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  remove(key: string) {
    localStorage.removeItem(key);
  }
}

class FetchHttp implements Http {
  async get<T>(url: string) {
    const res = await fetch(url);
    return res.json() as Promise<T>;
  }
  async post<T>(url: string, body: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json() as Promise<T>;
  }
  // ...
}

export const browserServices: Services = {
  persistence: new LocalStoragePersistence(),
  http: new FetchHttp(),
};
```

Inject services into state classes via the constructor:

```ts
// app.ts
import { reactive } from "reactx";
import { browserServices } from "./services/browser";
import type { Services } from "./services/interface";

class AppState {
  token: string | undefined;

  constructor(private services: Services) {
    this.token = services.persistence.get<string>("token");
  }

  async signIn(email: string, password: string) {
    const { token } = await this.services.http.post<{ token: string }>(
      "/auth/login",
      { email, password }
    );
    this.token = token;
    this.services.persistence.set("token", token);
  }

  signOut() {
    this.token = undefined;
    this.services.persistence.remove("token");
  }
}

export const app = reactive(new App(browserServices));
```

Notice that `App` has no idea what storage mechanism or HTTP client is being used. It only works with the interface.

## Multiple platforms

When the same state runs on both web and native, the interface stays identical — only the implementation file changes:

```ts
// services/native.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

class AsyncStoragePersistence implements Persistence {
  get<T>(key: string) {
    // simplified — use an async init pattern in practice
    return undefined as T | undefined;
  }
  async set<T>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  }
}

export const nativeServices: Services = {
  persistence: new AsyncStoragePersistence(),
  http: new FetchHttp(),
};
```

The state class is untouched. Swap the services entry point and everything works.

## Real-time services

Services can also wrap subscriptions. The service provides a generic subscribe mechanism; the state class decides what to do with the data.

```ts
interface Realtime {
  subscribe<T>(channel: string, handler: (data: T) => void): () => void;
}
```

```ts
class DashboardState {
  statistics: Statistic[] = [];

  constructor(private services: Services) {}

  subscribe() {
    return this.services.realtime.subscribe<Statistic[]>(
      "statistics",
      (stats) => { this.statistics = stats; }
    );
  }
}
```

## Testing

In tests, provide a lightweight in-memory implementation. No environment mocking, no test doubles for fetch:

```ts
const testServices: Services = {
  persistence: {
    store: new Map<string, unknown>(),
    get<T>(key: string) { return this.store.get(key) as T | undefined; },
    set<T>(key: string, value: T) { this.store.set(key, value); },
    remove(key: string) { this.store.delete(key); },
  },
  http: {
    async get<T>(url: string) { /* return fixture data */ },
    async post<T>(url: string, body: unknown) { /* return fixture data */ },
  },
};

const app = reactive(new App(testServices));
```

Because services have no domain knowledge, the same in-memory implementations work for every test that exercises the state layer.
