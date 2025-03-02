# Pattern: Data Fetching

Data is also state. The difference between data and regular state is that we need to asynchronously fetch the initial state. Making changes to that state needs to be synced with the server, often reffered to as server mutations. There are primarily three different strategies to manage this.

## 1. Local mutations

Fetch data once and apply local mutations to the data, where server mutations is a background process.

```ts
function Data({ persistence }) {
  const data = reactive({
    todos: [],
  });

  persistence.todos.fetch().then((todos) => (data.todos = todos));

  return data;
}
```

In this type of data handling you can just toggle the `completed` state of any todo, push new todos on to the existing data array etc.

```ts
function State({ persistence }) {
  const data = Data({ persistence });

  return {
    get todos() {
      return data.todos;
    },
    addTodo,
  };

  function addTodo(todo) {
    data.todos.push(todo);
    persistence.todos.add(todo);
  }
}
```

## 2. Revalidate on mutations

Refetch data after a server mutation is performed. This type of approach gives a stronger guarantee that whenever the client requests a server mutation the data will be synced with what is actually on the server.

```ts
function Data({ persistence }) {
  const state = reactive({
    todos: [],
  });

  revalidateTodos();

  return {
    get todos() {
      return state.todos;
    },
    revalidateTodos,
  };

  async function revalidateTodos() {
    try {
      state.todos = await persistence.todos.fetch();
    } catch {}
  }
}
```

```ts
function State({ persistence }) {
  const data = Data({ persistence });

  return {
    get todos() {
      return data.todos;
    },
    addTodo,
  };

  async function addTodo(todo) {
    await persistence.todos.add(todo);
    await data.revalidateTodos();
  }
}
```

## 3. Automatic sync

Subscribe to data and get updates automatically. This type of approach simplifies data fetching and server mutations as you only interact with the server, there is no manual intermediate step to keep data in sync.

```ts
function Data({ persistence }) {
  const data = reactive({
    todos: [],
  });

  persistence.todos.subscribe((todos) => {
    data.todos = todos;
  });

  return data;
}
```

```ts
function State({ persistence }) {
  const data = Data({ persistence });

  return {
    get todos() {
      return data.todos;
    },
    addTodo,
  };

  async function addTodo(todo) {
    // This triggers subscription
    await backend.todos.add(todo);
  }
}
```

## Data references

When you fetch a list of todos, the array of those todos and each todo has a reference. In the world of React those references matter, because it is what `memo` components use to determine if the component needs to reconcile. The pattern of mapping an array in a "List" component and render nested "Item" components using `memo` is the most common optimization in React.

If you use a revalidation approach to data fetching it means that the todos array and each todo in that array will change reference whenever you request any change to the array or any item in the array. In other words your `TodosList` component and every `Todo` component will reconcile regardless of any change.

Normally this is no concern as reconciliation is fast. But if you are displaying a lot of todos where each todo has a complex UI you risk performance issues.

**Local mutations** strategy is what best optimises references and therefor reconciliation. After that **Automatic sync** where you subscribe to specific changes in the data also best optimises references and therefor reconciliation. Make sure you reflect on how your data fetching affects your data references and the reconciliation of components. It can be a good idea to default to **Revalidate on mutations**, but optimise with **Local mutation** or a change subscription if available.

## Deriving data

In the examples above we are exposing data directly to components, but you might want to rather derive data to some state management that exposes the data in a more controlled way.

```ts
function Todo(todo) {
  return {
    get id() {
      return todo.id;
    },
    get completed() {
      return todo.completed;
    },
    toggle,
  };

  function toggle() {
    todo.completed = !todo.completed;
  }
}

function State() {
  const data = Data();

  return {
    get todos() {
      return data.todos.map(Todo);
    },
  };
}
```

Now we are hiding data from the components and gain control of how components interact with it.

## Deriving data references

If our data fetching ensures the integrety of data references we break that integrity when deriving.

```ts
export function State() {
  const data = Data();

  return {
    get todos() {
      return data.todos.map(Todo);
    },
  };
}
```

Even if our `data.todos` ensures consistent references our `map` will always create a new array and `Todo` will always create a new state object. To make sure the `Todo` state object is only created when the underlying `todo` data reference actually changes, we can use a reference cache:

```ts
function createReferenceCache<R extends object, S, A extends any[]>(
  create: (ref: D, ...args: A) => S
) {
  const cache = new WeakMap<D, S>();

  return (ref: R, ...args: A) => {
    let state = cache.get(ref);

    if (!state) {
      state = create(ref, ...args);
      cache.add(state);
    }

    return state;
  };
}
```

Let us see it in action:

```ts
function Todo(todo) {
  return {
    get id() {
      return todo.id;
    },
    get completed() {
      return todo.completed;
    },
    toggle,
  };

  function toggle() {
    todo.completed = !todo.completed;
  }
}

function State() {
  const data = Data();
  const CachedTodo = createReferenceCache(Todo);

  return {
    get todos() {
      return data.todos.map(CachedTodo);
    },
  };
}
```

When calling `CachedTodo` it will first check if the data reference is in the `WeakMap`, if so, it returns the existing state. If not, it creates the state as normal and caches it. Using a `WeakMap` is perfect because we do not have to clean up the cache. When the data reference is no longer available, the state removes itself.

## Optimistic data

With **local mutations** you are free to change data "in place" and rather revert it if the background server mutation fails. But with revalidation you want to show data that is "in flight", often with some UI indication that shows it is loading or show the data as optimistic data. This can be done by exposing a mutation state:

```ts
function State({ persistence }) {
  const data = Data({ persistence });
  const state = reactive({
    addingTodo: undefined,
  });

  return {
    get todos() {
      return data.todos;
    },
    get addingTodo() {
      return state.addingTodo;
    },
    addTodo,
  };

  async function addTodo(todo) {
    state.addingTodo = {
      status: "pending",
      todo,
    };
    try {
      await persistence.todos.add(todo);
      await data.revalidateTodos();
      state.addingTodo = undefined;
    } catch (error) {
      state.addingTodo = {
        status: "error",
        todo,
        error,
      };
    }
  }
}
```

A component can now use this state to show a temporary todo:

```tsx
function Todos({ state }) {
  return (
    <ul>
      {state.addingTodo?.status === "pending" ? (
        <li>Pending: {state.addingTodo.todo.title}</li>
      ) : null}
      {state.addingTodo?.status === "error" ? (
        <li>
          Eror: {state.addingTodo.todo.title} - {state.addingTodo.error.message}
        </li>
      ) : null}
      {state.todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```
