# Environment Dependencies

Applications run in an environment, typically the browser. You might need to use certain APIs from the environment, for example `localStorage`. The application also typically uses certain 3rd party libraries, for example you use `firebase` for persistence. Your application and its code does not really care about `localStorage` or `firebase`, it only cares about persistence.

Creating an environment interface for your application is a pattern that can clean up your implementation by removing terminology and abstractions that is unrelated to the application itself (like `localStorage` or `firebase`). Additionally you will often avoid adding explicit types in your application code.

The pattern also increases testability as you do not have to mock the environment the tests run in, you rather mock your environment interface.

::: code-group

```tsx [Functional]
function LocalPeristence(namespace: string) {
  return {
    set,
    get,
  };

  function createKey(key) {
    return `${namespace}.${key}`;
  }

  function set(key, value) {
    localStorage.setItem(createKey(key), JSON.stringify(value));
  }

  function get(key) {
    return JSON.parse(localStorage.getItem(createKey(key)));
  }
}

function Environment({ namespace }: { namespace: string }) {
  return {
    localPersistence: LocalPeristence(namespace),
  };
}

function CounterState({ localPersistence }) {
  const state = reactive({
    count: localPersistence.get("count") || 0,
  });

  return {
    get count() {
      return state.count;
    },
    increase,
  };

  function increase() {
    state.count++;
    localPersistence.set("count", state.count);
  }
}

const environment = Environment({ namespace: "my-app" });
const counter = CounterState(environment);
```

```tsx [Object Oriented]
class LocalPeristence {
  constructor(private namespace: string) {}
  set(key: string, value: any) {
    localStorage.setItem(`${this.namespace}.${key}`, JSON.stringify(value));
  }
  get(key: string) {
    return JSON.parse(localStorage.getItem(`${this.namespace}.${key}`));
  }
}

class Environment {
  localPersistence: LocalPeristence;
  constructor({ namespace }: { namespace: string }) {
    this.localPersistence = new LocalPeristence(namespace);
  }
}

class CounterState {
  count = 0;
  constructor(private localPersistence: LocalPeristence) {
    reactive(this);
  }
  get count() {
    return this.localPersistence.get("count") || 0;
  }
  increase() {
    this.count++;
    this.localPersistence.set("count", this.count);
  }
}

const environment = new Environment({ namespace: "my-app" });
const counter = new CounterState(environment.localPersistence);
```

:::

## Multiple environments

If your state management is to be shared between for example a browser and native application, you can define a generic environment interface. Even though the browser and the native app uses the same state management, they have each their own implementation of their environment dependencies.

```ts
export interface LocalPersistence {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export interface Environment {
  localPersistence: LocalPersistence;
}
```

**Browser implementation**

::: code-group

```ts [Functional]
import { LocalPersistence } from "../interface";

export function BrowserLocalPersistence(): LocalPersistence {
  return {
    set,
    get,
  };

  async function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async function get(key) {
    return JSON.parse(localStorage.getItem(key));
  }
}

export function BrowserEnvironment() {
  return {
    localPersistence: BrowserLocalPersistence(),
  };
}
```

```ts [Object Oriented]
import { LocalPersistence } from "../interface";

export class BrowserLocalPersistence implements LocalPersistence {
  async set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  async get(key) {
    return JSON.parse(localStorage.getItem(key));
  }
}

export class BrowserEnvironment {
  localPersistence = new BrowserLocalPersistence();
}
```

:::

**Native implementation**

::: code-group

```ts [Functional]
import { LocalPersistence } from "../interface";

export function NativeLocalPersistence(): LocalPersistence {
  return {
    set,
    get,
  };

  async function set(key, value) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async function get(key) {
    const value = await AsyncStorage.getItem(key);

    return value ? JSON.parse(value) : undefined;
  }
}

export function NativeEnvironment() {
  return {
    localPersistence: NativeLocalPersistence(),
  };
}
```

```ts [Object Oriented]
import { LocalPersistence } from "../interface";

export class NativeLocalPersistence implements LocalPersistence {
  async set(key, value) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
  async get(key) {
    const value = await AsyncStorage.getItem(key);

    return value ? JSON.parse(value) : undefined;
  }
}

export class NativeEnvironment {
  localPersistence = new NativeLocalPersistence();
}
```

:::
