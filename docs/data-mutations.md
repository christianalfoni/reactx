# Data mutations

Another aspect of data is mutations. Even though mutations also represents a request to the server, returning a promise, it has a very different behavior than a `query`.

An important aspect of performing mutations is showing optimistic data.

```ts
import { query, mutation } from "mobx-lite";

class Data {
  todosQuery = query(() => fetchJson("/todos"));
  addTodoMutation = mutation((title: string) => {
    await postJson("/todos", { title, completed: false });
    await this.todosQuery.revalidate();
  });
}
```

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
