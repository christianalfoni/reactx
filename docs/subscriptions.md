# Subscriptions

When you have state that components dynamically access by reading it, you can use a subscription to control any side effects. An example of this could be the current page.

::: code-group

```ts [Functional]
function Dashboard(env: Environment) {
  const state = reactive({
    statistics: [] as DashboardStatistics[],
    subscribe,
  });

  return state;

  function subscribe() {
    const disposeDashboardStatistics =
      env.persistence.subscribeDashboardStatistics((stats) => {
        state.statistics = stats;
      });

    return () => {
      disposeDashboardStatistics();
    };
  }
}

function State(env: Environment) {
  const state = reactive({
    dashboard: Dashboard(env),
    settings: Settings(env),
  });

  return reactive.readonly(state);
}
```

```ts [Object Oriented]
class Dashboard {
  constructor(private env: Environment) {
    reactive(this);
  }
  statistics: DashboardStatistics[] = [];
  subscribe() {
    const disposeDashboardStatistics =
      this.env.persistence.subscribeDashboardStatistics((stats) => {
        this.statistics = stats;
      });

    return () => {
      disposeDashboardStatistics();
    };
  }
}

class State {
  constructor(private env: Environment) {
    reactive(this);
  }
  dashboard = new Dashboard(this.env);
  settings = new Settings(this.env);
}
```

:::

And in your dashboard component:

```tsx
function Dashboard({ state }) {
  useEffect(state.dashboard.subscribe, []);

  return <div>Dashboard {state.dashboard.statistics.length}</div>;
}
```
