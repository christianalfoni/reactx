# Pattern: Promises

React has a suspense feature. You can take advantage of this with `reactive.promise`. This is a good pattern when you want to fetch data when the component is mounting.

```ts
function State({ persistence }) {
  const state = reactive({
    todos: persistence.todos.fetch(),
  });

  persistence.todos.subscribe((todos) => {
    state.todos = todos;
  });

  return state;
}
```

In the component you can now:

```tsx
function Todos({ state }) {
  const todos = use(state.todos);

  return <div></div>;
}
```

This can also be useful when you dynamically want to fetch state based on what you access.

```ts
function State({ persistence }) {
  const todosDetails = reactive({});
  const state = reactive({
    todos: reactive.promise(persistence.todos.fetch()),
    readTodoDetails,
  });

  persistence.todos.subscribe((todos) => {
    state.todos = reactive.promise(todos);
  });

  return state;

  function readTodoDetails(id: number) {
    let todoDetails = todosDetails[id];

    if (!todoDetails) {
      todosDetails[id] = todoDetails = reactive.promise(
        persistence.todos.fetch(id)
      );
    }

    return todoDetails;
  }
}
```

And in the component:

```tsx
function Todo({ id, state }) {
  const todo = use(state.readTodoDetails(id));

  return <div></div>;
}
```

`read` is a common name conventation for functions that can fetch data during render.
