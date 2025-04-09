# Data queries

Data is also state. The difference between data and regular state is that we need to asynchronously fetch the initial state and create a mechanism to keep the state in sync with the server. React with its popular [react-query](https://tanstack.com/query) has shown both the complexity of data management and also contributed with amazing APIs to manage this complexity.

**Mobx Lite** takes inspiration from react-query to provide a similar API allowing you to manage data as efficiently in your state management layer as well as when consuming it in components.

::: code-group

```ts [Functional]
import { reactive } from "mobx-lite";

function Data() {
  const data = reactive({
    todosQuery: reactive.query(fetchTodos),
  });

  return data;

  function fetchTodos() {
    return fetch("/todos").then((response) => response.json());
  }
}
```

```ts [Object Oriented]
import { reactive } from "mobx-lite";

class Data {
  todosQuery = reactive.query(() => this.fetchTodos());
  constructor() {
    reactive(this);
  }
  private fetchTodos() {
    return fetch("/todos").then((response) => response.json());
  }
}
```

:::

The query exposes several properties that you can use to track the state of the query in a component or in your state management.

```tsx
function Todos({ data }) {
  const { isFetching, value, error, isRevalidating } = data.todosQuery;

  if (isFetching) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error.message}</div>;
  }

  return (
    <div>
      {value.map((todo) => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}
```

Or you can consume a suspense compatible promise:

```tsx
function Todos({ data }) {
  const todos = use(data.todosQuery.promise);

  return (
    <div>
      {todos.map((todo) => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}
```

You can also call `fetch`, to force a fetch, or `revalidate` to update the value in the background.

::: info

The query is **lazy** which means it will only start fetching the initial data when either of the properties of the query is accessed.

Any call to `fetch` or `revalidate` will abort the current pending request, if any.

:::
