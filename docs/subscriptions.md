# Subscriptions

Some state depends on a live data source — a WebSocket, a Firestore listener, a polling interval. A subscription sets up the source when a component mounts and tears it down on unmount.

Define a `subscribe` method on the relevant state class that returns a cleanup function:

```ts
class DashboardState {
  statistics: Statistic[] = [];

  constructor(private services: Services) {}

  subscribe() {
    const unsubscribe = this.services.realtime.onStatistics((stats) => {
      this.statistics = stats;
    });

    return unsubscribe;
  }
}

class App {
  #dashboard?: DashboardState;

  get dashboard() {
    return (this.#dashboard ??= new DashboardState(services));
  }
}

export const app = reactive(new App());
```

Use `useEffect` to wire the lifecycle to the component:

```tsx
function Dashboard() {
  useEffect(() => app.dashboard.subscribe(), []);

  return <div>Statistics: {app.dashboard.statistics.length}</div>;
}
```

`useEffect` returns the cleanup function directly — no wrapper needed because `subscribe` already returns one.

## Shared subscriptions

If multiple components consume the same live state, you may want the subscription to stay active as long as at least one component is mounted and tear down only when the last one unmounts. A simple ref-count handles this:

```ts
class DashboardState {
  statistics: Statistic[] = [];
  #subscribers = 0;
  #unsubscribe?: () => void;

  subscribe() {
    if (++this.#subscribers === 1) {
      this.#unsubscribe = this.services.realtime.onStatistics((stats) => {
        this.statistics = stats;
      });
    }

    return () => {
      if (--this.#subscribers === 0) {
        this.#unsubscribe?.();
      }
    };
  }
}
```
