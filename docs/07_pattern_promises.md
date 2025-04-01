# Pattern: Promises

React has a suspense feature. You can take advantage of this with `reactive.promise`. This is a good pattern when you want to fetch data when the component is mounting.

```ts
function State({ persistence }) {
  const state = reactive({
    todos: persistence.todos.fetch() as Promise<Todo[]> | Todo[],
    addTodo() {
      const todos = await state.todos;
    },
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
  const todos = state.todos instanceof Promise ? use(state.todos) : state.todos;

  return <div></div>;
}
```

This can also be useful when you dynamically want to fetch state based on what you access.

```ts
function State({ persistence }) {
  const todosDetails = reactive({});
  const state = reactive({
    todos: persistence.todos.fetch(),
    readTodoDetails,
  });

  persistence.todos.subscribe((todos) => {
    state.todos = todos;
  });

  return state;

  function readTodoDetails(id: number) {
    let todoDetails = todosDetails[id];

    if (!todoDetails) {
      todosDetails[id] = todoDetails = fetchTodoDetails(id);
    }

    return todoDetails;
  }

  function fetchTodoDetails(id) {
    fetchTodo()
      .then((value) => {
        todosDetails[id] = { status: "fulfilled", value };
      })
      .catch((error) => {
        todosDetails[id] = { status: "error", error };
      });

    return {
      status: "pending",
    };
  }
}
```

And in the component:

```tsx
function Details({ id, state }) {
  const details = useSuspenseQuery(() => state.readTodoDetails(id));

  useEffect(details.subscribe, []);
}

function Todo({ id, state }) {
  const router = useRouter();

  return (
    <div>
      {router.query.details ? (
        <Suspense>
          <Details id={id} state={state} />
        </Suspense>
      ) : null}
    </div>
  );
}
```

`read` is a common name conventation for functions that can fetch data during render.
