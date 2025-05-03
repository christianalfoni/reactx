# Subscriptions

When you have state that components dynamically access by reading it, you can use a subscription to control any side effects. An example of this could be the current page.

```ts
class Dashboard {
  constructor(private env: Environment) {}
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
  constructor(private env: Environment) {}
  dashboard = new Dashboard(this.env);
  settings = new Settings(this.env);
}
```

And in your dashboard component:

```tsx
function Dashboard({ state }) {
  useEffect(state.dashboard.subscribe, []);

  return <div>Dashboard {state.dashboard.statistics.length}</div>;
}
```
