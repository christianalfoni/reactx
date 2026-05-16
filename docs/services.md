# Services

Applications depend on the environment they run in — the browser, a native runtime, third-party SDKs like Firebase. Your state classes should not reference those directly. Instead, define a service interface and inject concrete implementations at startup.

This keeps your state classes free of environment-specific terminology, makes them trivially testable (inject a mock), and makes it straightforward to share state between platforms (web vs. native).

## Basic example

```ts
// services/interface.ts
export interface Persistence {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
}

export interface Services {
  persistence: Persistence;
}
```

```ts
// services/browser.ts
import type { Persistence } from "./interface";

class LocalStoragePersistence implements Persistence {
  get<T>(key: string) {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  }
  set<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export const browserServices = {
  persistence: new LocalStoragePersistence(),
};
```

Inject services into your state class via the constructor:

```ts
// app.ts
import { reactive } from "reactx";
import { browserServices } from "./services/browser";
import type { Services } from "./services/interface";

class App {
  count: number;

  constructor(private services: Services) {
    this.count = services.persistence.get<number>("count") ?? 0;
  }

  increment() {
    this.count++;
    this.services.persistence.set("count", this.count);
  }
}

export const app = reactive(new App(browserServices));
```

## Multiple platforms

When the same state runs on both web and native, define the interface once and provide platform-specific implementations:

```ts
// services/native.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Persistence } from "./interface";

class AsyncStoragePersistence implements Persistence {
  get<T>(key: string) {
    // simplified — in practice use async init
    return undefined as T | undefined;
  }
  set<T>(key: string, value: T) {
    AsyncStorage.setItem(key, JSON.stringify(value));
  }
}

export const nativeServices = {
  persistence: new AsyncStoragePersistence(),
};
```

The state class stays identical across platforms. Only the services entry point changes.

## Testing

In tests, provide a lightweight in-memory implementation — no environment mocking required:

```ts
const testServices = {
  persistence: {
    store: new Map<string, unknown>(),
    get<T>(key: string) { return this.store.get(key) as T | undefined; },
    set<T>(key: string, value: T) { this.store.set(key, value); },
  },
};

const app = reactive(new App(testServices));
```
