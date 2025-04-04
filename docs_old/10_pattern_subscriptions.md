# Pattern: Subscriptions

When you have state that components dynamically access by reading it, you can use a subscription to control any side effects. An example of this could be the current page state, or data.

```tsx
function Dashboard() {
  const dashboard = reactive({
    subscribe,
  });

  return dashboard;

  function subscribe() {}
}

function State() {
  const state = reactive({
    dashboard: Dashboard(),
    settings: Settings(),
  });

  return reactive.readonly(state);
}
```
