# Data queries

Data is also state. The difference between data and regular state is that we need to asynchronously fetch the initial state and create a mechanism to keep the state in sync with the server. React with its popular [react-query](https://tanstack.com/query) has shown both the complexity of data management and also contributed with amazing APIs to manage this complexity.

**ReactX** takes inspiration from react-query to provide a similar API allowing you to manage data as efficiently in your state management layer as well as when consuming it in components.

```ts
import { query } from "reactx";

class TodosState {
  todosQuery = query(() => fetchJson("/todos"));
}
```

The query exposes several properties that you can use to track the state of the query in a component or in your state management.

```tsx
function Todos({ todos }) {
  const { isFetching, value, error, isRevalidating } = todos.todosQuery;

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
function Todos({ todos }) {
  const todos = use(todos.todosQuery.promise);

  return (
    <div>
      {todos.map((todo) => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}
```

You can also call `fetch`, to force a fetch, or `revalidate` to update the value in the background. Any call to `fetch` or `revalidate` will abort the current pending request, if any.

::: info

The query is **lazy** which means it will only start fetching the initial data when either of the properties of the query is accessed.

:::

## Single queries

We often think about collections of data, but we also have single pieces of data that we need to fetch. For example we might allow our application to show a single todo using the id in the url. We handle this by creating a record of queries that we dynamically populate based on the todo we want to query.

```ts
import { query, Query } from "reactx";

class TodosState {
  private todoQueries: Record<string, Query<Todo>> = {};
  todosQuery = query(() => fetchJson("/todos"));
  queryTodo(id: string) {
    if (!this.todoQueries[id]) {
      this.todoQueries[id] = query(() => fetchJson(`/todos/${id}`));
    }

    return this.todoQueries[id];
  }
}
```

You can now query a todo when you render a component:

```tsx
function Todo({ id }) {
  const todoQuery = state.todosState.queryTodo(id);
  const todo = use(todoQuery.promise);

  return <div>{todo.title}</div>;
}
```

## Invalidating queries

Often you want to invalidate a query when a component is no longer consuming the query. Since multiple components might look at the same data we need to ensure we do not invalidate until all components have unmounted. We handle this by subscribing to the query.

```tsx
function Todo({ id }) {
  const todoQuery = state.todosState.queryTodo(id);
  const todo = use(todoQuery.promise);

  useEffect(todoQuery.subscribe, []);

  return <div>{todo.title}</div>;
}
```

When the component unmounts and no other components are consuming the query, it will be invalidated and cause a new fetch the next time it is consumed.
