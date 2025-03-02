# Pattern: Environment Dependencies

Applications runs in an environment, typically the browser. You might need to use certain APIs from the environment, for example `localStorage`. It also typically uses certain 3rd party libraries, for example you use `firebase` for persistence. Your application and its code does not really care about `localStorage` or `firebase`, it only cares about persistence.

Creating an environment interface for your application is a pattern that can clean up your implementation by removing terminology and abstractions that is unrelated to the application itself (like `localStorage` or `firebase`). Additionally you will often avoid adding explicit types in your application code.

The pattern also increases testability as you do not have to mock the environment during testing, you rather mock your environment interface.

We can also apply the **constructor pattern** here:

```tsx
function LocalPeristence({ namespace }) {
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

function Environment({ namespace }) {
  return {
    localPersistence: LocalPeristence({ namespace }),
  };
}

function State({ localPersistence }) {
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
const state = State(environment);

render(<App state={state}></App>);
```

## Multiple environments

If your state management is to be shared between for example a browser and native application, you can define an environment interface. Even though the browser and the native app uses the same state management, they have each their own implementation of their environment dependencies.

```ts
interface LocalPersistence {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

interface Environment {
  localPersistence: LocalPersistence;
}
```

**Browser implementation**

```ts
function BrowserLocalPersistence() {
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

function BrowserEnvironment() {
  return {
    localPersistence: BrowserLocalPersistence(),
  };
}
```

**Native implementation**

```ts
function NativeLocalPersistence() {
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

function NativeEnvironment() {
  return {
    localPersistence: NativeLocalPersistence(),
  };
}
```
