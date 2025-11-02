# ensure

`ensure` enables a pattern where the UI drives state creation rather than having the state layer prepare everything upfront. Instead of initializing state in route hooks or managing state lifecycle manually, each component simply asks for the state it needs when it renders.

The factory function must return an object with a `dispose()` method for proper cleanup:

```ts
interface Disposable {
  dispose(): void;
}
```

## Singleton by Default

By default, `ensure` creates a singleton - it always returns the same instance regardless of what parameters you pass:

```tsx
import { reactive, ensure } from "reactx";

class DashboardState {
  metrics = [];

  async loadMetrics() {
    this.metrics = await fetch("/api/metrics").then((r) => r.json());
  }

  dispose() {
    // Cleanup subscriptions, timers, etc.
  }
}

class AppState {
  ensureDashboard = ensure(() => new DashboardState());
}

const state = reactive(new AppState());

// Dashboard route component
function Dashboard() {
  const dashboard = state.ensureDashboard();

  return <div>{/* Use dashboard state */}</div>;
}
```

The singleton is created on first access and reused forever after. Even if you called `state.ensureDashboard()` with different arguments, it would still return the same instance.

## Key-Based Caching

To cache different instances based on parameters, provide a key function as the second argument. The key function determines which cached instance to return based on the parameters:

```tsx
class ProfileState {
  user = null;

  constructor(public userId: number) {}

  async loadUser() {
    this.user = await fetch(`/api/users/${this.userId}`).then((r) => r.json());
  }

  dispose() {
    // Cleanup
  }
}

class AppState {
  ensureDashboard = ensure(() => new DashboardState());
  ensureProfile = ensure(
    (userId: number) => new ProfileState(userId),
    (userId) => userId // Use userId as the cache key
  );
}

const state = reactive(new AppState());

// Profile route component
function Profile({ userId }: { userId: number }) {
  const profile = state.ensureProfile(userId);

  return <div>{/* Use profile state */}</div>;
}
```

The key function (`(userId) => userId`) tells `ensure` what value determines caching. When you navigate to `/profile/123`, then `/profile/456`, then back to `/profile/123`, each unique userId gets its own cached instance. Without the key function, it would just return a singleton.

## Benefits of This Pattern

- **Lazy creation**: State is only created when first accessed by the UI
- **Automatic persistence**: State persists across component mount/unmount cycles
- **Simple by default**: Singleton behavior with no parameters needed
- **Flexible when needed**: Key-based caching for parameterized state
- **UI-driven**: Components naturally pull in the state they need
- **Clean separation**: No initialization logic or lifecycle management in the state layer

## Cleanup

When you're done with all cached instances (e.g., on app unmount), call `dispose()` on the ensured factory:

```tsx
// Clean up all cached dashboard and profile instances
state.ensureDashboard.dispose();
state.ensureProfile.dispose();
```
