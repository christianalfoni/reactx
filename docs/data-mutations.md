# Data mutations

Another aspect of data is mutations. Even though mutations also represents a request to the server, returning a promise, it has a very different behavior from a `query`.

An important aspect of performing mutations is showing optimistic data.

::: code-group

```ts [Functional]
function Data() {
  const data = reactive({
    todos: reactive.query(fetchTodos),
    addTodo: reactive.mutation(addTodo),
  });

  return data;

  function fetchTodos() {
    return fetch("/todos").then((response) => response.json());
  }

  function addTodo({
    title,
    completed,
  }: {
    title: string;
    completed: boolean;
  }) {
    await fetch("/todos", {
      method: "POST",
      body: JSON.stringify({ title, completed }),
    });
    await data.todos.revalidate();
  }
}
```

```ts [Object Oriented]
type AddTodoParams = {
  title: string;
  completed: boolean;
};

class Data {
  todos = reactive.query(() => this.fetchTodos());
  addTodo = reactive.mutation((params: AddTodoParams) => this.addTodo(params));
  constructor() {
    reactive(this);
  }
  private fetchTodos() {
    return fetch("/todos").then((response) => response.json());
  }
  private async addTodo({ title, completed }: AddTodoParams) {
    await fetch("/todos", {
      method: "POST",
      body: JSON.stringify({ title, completed }),
    });
    await this.todos.revalidate();
  }
}
```

:::

The mutation has a `mutate` method to call the mutation, but it also exposes the state of the mutation itself.

```tsx
function Todos({ data }) {
  const todos = use(data.todos.promise);
  const addTodo = data.addTodo;

  return (
    <div>
      <button
        onClick={() => addTodo.mutate({ title: "New Todo", completed: false })}
      >
        Add Todo
      </button>
      {addTodo.state.status === "REJECTED" && (
        <p>Error: {addTodo.state.error.message}</p>
      )}
      <ul>
        {addTodo.state.status === "PENDING" ? (
          <li>{addTodo.state.params.title}</li>
        ) : null}
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  );
}
```
