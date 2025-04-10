# Data queries

Data is also state. The difference between data and regular state is that we need to asynchronously fetch the initial state and create a mechanism to keep the state in sync with the server. React with its popular [react-query](https://tanstack.com/query) has shown both the complexity of data management and also contributed with amazing APIs to manage this complexity.

**Mobx Lite** takes inspiration from react-query to provide a similar API allowing you to manage data as efficiently in your state management layer as well as when consuming it in components.

::: code-group

```ts [Functional]
import { reactive } from "mobx-lite";

function TodosState() {
  const state = reactive({
    todosQuery: reactive.query(fetchTodos),
  });

  return state;

  function fetchTodos() {
    return fetch("/todos").then((response) => response.json());
  }
}
```

```ts [Object Oriented]
import { reactive } from "mobx-lite";

class TodosState {
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

## Single queries

We often think about collections of data, but we also have single pieces of data that we need to fetch. For example we might allow our application to show a single todo using the id in the url. We handle this by creating a record of queries that we dynamically populate based on the todo we want to query.

::: code-group

```ts [Functional]
import { reactive } from "mobx-lite";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

function TodosState() {
  const todoQueries: Record<string, reactive.Query<Todo>> = {};
  const state = reactive({
    todosQuery: reactive.query(fetchTodos),
    queryTodo,
  });

  return state;

  function fetchTodos(): Promise<Todo[]> {
    return fetch("/todos").then((response) => response.json());
  }

  function queryTodo(id: string) {
    if (!todoQueries[id]) {
      todoQueries[id] = reactive.query(() => fetchTodo(id));
    }

    return todoQueries[id];
  }

  function fetchTodo(id: string): Promise<Todo> {
    return fetch(`/todos/${id}`).then((response) => response.json());
  }
}
```

```ts [Object Oriented]
import { reactive } from "mobx-lite";

class TodosState {
  private todoQueries: Record<string, reactive.Query<Todo>> = {};
  todosQuery = reactive.query(() => this.fetchTodos());
  constructor() {
    reactive(this);
  }
  queryTodo(id: string) {
    if (!this.todoQueries[id]) {
      this.todoQueries[id] = reactive.query(() => this.fetchTodo(id));
    }

    return this.todoQueries[id];
  }
  private fetchTodos() {
    return fetch("/todos").then((response) => response.json());
  }
  private fetchTodo(id: string): Promise<Todo> {
    return fetch(`/todos/${id}`).then((response) => response.json());
  }
}
```

:::

You can now query a todo when you render a component:

```tsx
function Todo({ id }) {
  const todoQuery = state.todosState.queryTodo(id);
  const todo = use(todoQuery.promise);

  return <div>{todo.title}</div>;
}
```
