# async

```ts
import { async } from "reactx";

class UserData {
  userAsync = async(() => fetchJson("/api/user"));
}
```

Creates an `async` primitive that wraps a promise and tracks its state. The promise resolves a single time and the primitive provides reactive access to its pending, resolved, or error state. It also provides a promise that works with React Suspense.

## Properties

```ts
const {
  // Whether the async operation is pending
  isPending,
  // The resolved value when successful
  value,
  // The error if the operation failed
  error,
  // The promise representing the current operation, supports Suspense
  promise,
} = userAsync;
```

## Options

### lazy

```ts
const lazyAsync = async(() => fetchData(), { lazy: true });
```

When `lazy: true`, the async operation won't start until one of its properties is accessed. This is useful for deferring expensive operations until they're actually needed.

## Usage with Suspense

```tsx
import { use } from "react";

function UserProfile({ state }) {
  const userData = use(state.userAsync.promise);

  return <div>{userData.name}</div>;
}

// Wrap with Suspense boundary
<Suspense fallback={<div>Loading...</div>}>
  <UserProfile state={state} />
</Suspense>
```

## Manual State Handling

```tsx
function UserProfile({ state }) {
  if (state.userAsync.isPending) {
    return <div>Loading...</div>;
  }

  if (state.userAsync.error) {
    return <div>Error: {state.userAsync.error.message}</div>;
  }

  return <div>{state.userAsync.value.name}</div>;
}
```
