# Data mutations

Another aspect of data is mutations. Even though mutations also represents a request to the server, returning a promise, it has a very different behavior than a `query`.

An important aspect of performing mutations is showing optimistic data.

::: code-group

```ts [Functional]
function TodosState() {
  const state = reactive({
    todosQuery: reactive.query(fetchTodos),
    addTodoMutation: reactive.mutation(addTodo),
  });

  return state;

  function fetchTodos() {
    return fetch("/todos").then((response) => response.json());
  }

  function addTodo(title: string) {
    await fetch("/todos", {
      method: "POST",
      body: JSON.stringify({ title, completed: false }),
    });

    await state.todosQuery.revalidate();
  }
}
```

```ts [Object Oriented]
class Data {
  todosQuery = reactive.query(() => this.fetchTodos());
  addTodoMutation = reactive.mutation((title: string) => this.addTodo(title));
  constructor() {
    reactive(this);
  }
  private fetchTodos() {
    return fetch("/todos").then((response) => response.json());
  }
  private async addTodo(title: string) {
    await fetch("/todos", {
      method: "POST",
      body: JSON.stringify({ title, completed: false }),
    });
    await this.todosQuery.revalidate();
  }
}
```

:::

The mutation has a `mutate` method to call the mutation, but it also exposes the state of the mutation itself.

```tsx
function Todos({ todos }) {
  const { todosQuery, addTodoMutation } = todos;
  const todos = use(todosQuery.promise);

  return (
    <div>
      <button
        onClick={() => {
          addTodoMutation.mutate("New Todo");
        }}
      >
        Add Todo
      </button>
      {addTodoMutation.error && <p>Error: {addTodoMutation.error.message}</p>}
      <ul>
        {addTodoMutation.pendingParams && (
          <li>{addTodoMutation.pendingParams[0]}</li>
        )}
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  );
}
```
