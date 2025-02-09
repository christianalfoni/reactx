# Patterns, not abstractions

So I built a tool for educational purposes. This tool does exactly what I described. It has a single primitive that represents state and functions to change that state.

```ts
import { state } from "just-build-it";

const appState = state({
  count: 0,
  increase() {
    this.count++;
  },
});
```

There is no more expressive way to describe counter app in JavaScript. If you understand JavaScript, you understand what this does.

This works just fine for a global counter app, but we need to address several aspects of increased complexity.

- Nested state
- Dynamically initialise state
- Derived state
- Parent state dependencies
- Disposing state
- State machines
- Testing
- Hydration

## Nested state

If your application goes beyond the scope of a simple counter, you will likely start to think about domains of state. It can be related to functionality or specific features in the app. You will naturally lean to the filesystem, using folders and multiple files to define this structure of domains and how they relate. This also aids discovery for someone who is new to the team:

```sh
app/
  dashboard/
    posts/
  settings/
    profile/
```

This state is not necessarily a one to one mapping with the UI, but the UI derives all its state from this single state tree.

```ts
import { state } from "just-build-it";
import { dashboard } from "./dashboard";
import { settings } from "./settings";

export const app = state({
  dashboard,
  settings,

  darkMode: false,
  toggleDarkMode() {
    this.darkMode = !this.darkMode;
  },
});
```

```ts
import { state } from "just-build-it";
import { posts } from "./posts";

export const dashboard = state({
  currentView: "drafts",
  posts: [],
  drafts: [],
});
```

Again we can not expressive this any more precise. That application state, independent of its UI, needs this state to operate and we compose it together by simply importing files. There is no composition abstraction or primitives, it is just how you naturally compose objects in JavaScript.

## Initialise state

Sometimes you want to initialise state depending on the environment, rehydrate state from the server or you simply do not want one instance of that state. There is no reason for any abstractions or primitives to handle this, simply define your state as a function:

```ts
import { state } from "just-build-it";

const createAppState = () =>
  state({
    count: 0,
    increase() {
      this.count++;
    },
  });
```

Now you are free to pass in initial state:

```ts
import { state } from "just-build-it";

const createAppState = (initialCount) =>
  state({
    count: initialCount,
    increase() {
      this.count++;
    },
  });
```

Or you make sure that state can be removed and added again with its default values:

```ts
import { state } from "just-build-it";
import { createEditPost } from "./editPost";

const createAppState = () =>
  state({
    posts: [],
    editPost(index) {
      this.editPost = createEditPost(this.posts[index]);
    },
    cancelEditPost() {
      delete this.editPost;
    },
  });
```

## Derive state

A common concept is to define state as derived from other state. Many libraries has explicit primitives like `computed` or `derived` for this. But JavaScript has a pattern for deriving state:

```ts
import { state } from "just-build-it";

const appState = state({
  count: 0,
  get double() {
    return this.count * 2;
  },
  increase() {
    this.count++;
  },
});
```

Primitives such as `computed` and `derived` has an optimisation though. They cache the derived value. But most derived values absolutely does not have to be cached, most of the state presented in the UI is derived anyways. Where you would want to use caching would be for something with expensive computation. But if that is the case... why derive it? If you have something computationally expensive you should set that state exactly when it makes sense.

```ts
import { state } from "just-build-it";

const appState = state({
  count: 0,
  expensiveDouble: 0,
  increase() {
    this.count++;
    this.expensiveDouble = calculateExpensiveDouble(this.count);
  },
});
```

You can argue that derived would be "safer", but I am arguing it is not worth exposing special primitives for it. Some of them even have options to determine their behavior. It is exhausting.

## Parent state dependencies

Some nested state might depend on state from its parent(s). This can be tricky because the `app` depends on the `nested` to initialise, but `nested` needs access to the initialised `app`. But we have already shown the pattern that enables this.

```ts
import { state } from "just-build-it";

const createAppState = () => {
  const app = state({
    count: 0,
    get nested() {
      return nested;
    },
    increase() {
      this.count++;
    },
  });

  const nested = createNestedState(app);

  return app;
};
```

Dependency injection requires abstractions and sometimes primitives, but here we use a simple pattern to pass down what is needed.

## Disposing state

As part of initialising state or change state you might be running side effects that needs to be disposed when the state is disposed of. Normally you achieve this in components by using `useEffect`, but now we are just working with plain objects. Just dispose of it.

```ts
import { state } from "just-build-it";
import { createFeature } from "./feature";

const createAppState = () =>
  state({
    feature: undefined,
    openFeature() {
      this.feature = createFeature();
    },
    closeFeature() {
      this.feature.dispose();
      this.feature = undefined;
    },
  });
```

```ts
import { state } from "just-build-it";

export const createFeature = () => {
  const feature = state({
    count: 0,
    dispose() {
      clearInterval(interval);
    },
  });

  const interval = setInterval(() => {
    feature.count++;
  }, 1000);

  return feature;
};
```

## State machines

A common concept in state management is to use state machines. They represent explicit states and only one state can be active at any time. There are several primitives that allows you to handle this, but the core concept of a state machine is simply explicit states.

```ts
import { state } from "just-build-it";
import { createDashboard } from "./dashboard";

const createSession = (utils, setSession) => {
  const UNAUTHENTICATED = () => ({
    state: "UNAUTHENTICATED",
    async login() {
      setSession(AUTHENTICATING());
      const user = await utils.authentication.authenticate();
      setSession(AUTHENTICATED(user));
    },
  });
  const AUTHENTICATING = () => ({
    status: "AUTHENTICATING",
  });
  const AUTHENTICATED = (user) => ({
    state: "AUTHENTICATED",
    dashboard: createDashboard(user),
    logout() {
      utils.authentication.clear();
      setSession(UNAUTHENTICATED());
    },
  });

  return UNAUTHENTICATED();
};

export const createState = (utils) => {
  const app = state({
    session: createSession(utils, (session) => (app.session = session)),
  });

  return app;
};
```

## Testing

We can again use the same pattern of creating state with a function to support testing. By passing in any environment dependencies we are able to simply mock those dependencies during a test.

```ts
import { state } from "just-build-it";
import { createFeature } from "./feature";

const createApp = (utils) =>
  state({
    async updateUsername(username) {
      await utils.api.updateUser({
        username,
      });
    },
  });
```

Write a test that calls `createApp` and passes a mocked utils.

## Observing changes

```tsx
import { state } from "just-build-it";

const appState = state({
  count: 0,
  increase() {
    this.count++;
  },
});

export function App() {
  return (
    <button onClick={() => appState.increase()}>
      Count is {appState.count}
    </button>
  );
}
```

**Just build it** makes every single component, explicitly defined as a function in your source code, an observer of changes to state with memoization. This performance boost of observation and memo far exceeds the tiny overhead of this observation. Note that this does not happen to components you import from 3rd party libraries or create from 3rd party libraries for styling etc. By eliminating observation primitives from your code we also remove a mental overhead. When you build an application you should not have to think about HOW and WHEN a component updates, you should just build the freakin' app.

But having a global reference like this is not good. But instead of exposing a new primitive to solve that we can rely on patterns.

_appStateContext.js_

```tsx
import { createContext } from "react-dom/client";

export const appStateContext = createContext();
export const useAppState = () => useContext(context);
```

_main.jsx_

```tsx
import { createRoot } from "react-dom/client";
import { appState } from "./appState";
import { appStateContext } from "./appStateContext";

const domNode = document.getElementById("root");
const root = createRoot(domNode);

root.render(
  <appStateContext.Provider value={appState}>
    <App />
  </appStateContext.Provider>
);
```

- What about passing effects
- Deriving
- What about accessing root state
- What about debugging
- What about optimizing rendering
- What about state machines?
- What about testing?
