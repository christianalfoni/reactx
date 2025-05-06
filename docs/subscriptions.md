# Subscriptions

When you have state that components dynamically access by reading it, you can use a subscription to control any side effects. An example of this could be the current page.

```ts
class Dashboard {
  statistics: DashboardStatistics[] = [];
  constructor(private env: Environment) {}
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
  dashboard: Dashboard;
  settings: Settings;
  constructor(env: Environment) {
    this.dashboard = new Dashboard(env);
    this.settings = new Settings(env);
  }
}
```

And in your dashboard component:

```tsx
function Dashboard({ state }) {
  useEffect(state.dashboard.subscribe, []);

  return <div>Dashboard {state.dashboard.statistics.length}</div>;
}
```
