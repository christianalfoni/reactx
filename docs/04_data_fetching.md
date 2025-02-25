# Data Fetching

Data is also state. The difference between data and regular state is that we need to asynchronously fetch the initial state. Making changes to that state needs to be synced with the server, often reffered to as server mutations. There are primarily three different strategies to manage this.

### 1. Local mutations

Fetch data once and rather manually apply local mutations to the data, where server mutations is a background process.

```ts
function createData(backend) {
  const data = reactive({
    todos: [],
  });

  backend.fetchTodos().then((todos) => (data.todos = todos));

  return data;
}
```

In this type of data handling you can just toggle the `completed` state of any todo, push new todos on to the existing data array etc.

```ts
function createApp(backend) {
  const data = createData(backend);

  const app = reactive({
    get todos() {
      return data.todos;
    },
    addTodo(todo) {
      data.todos.push(todo);
      backend.addTodo(todo);
    },
  });

  return app;
}
```

### 2. Revalidate on mutations

Refetch data after a server mutation is performed. This type of approach gives a stronger guarantee that whenever the client requests a server mutation the data will be synced with what is actually on the server.

```ts
function createData(backend) {
  const data = reactive({
    todos: [],
    async revalidateTodos() {
      try {
        data.todos = await backend.fetchTodos();
      } catch {}
    },
  });

  data.revalidateTodos();

  return data;
}
```

```ts
function createState(backend) {
  const data = createData(backend);

  const state = reactive({
    get todos() {
      return data.todos;
    },
    async addTodo(todo) {
      await backend.addTodo(todo);
      await data.revalidateTodos();
    },
  });

  return state;
}
```

### 3. Automatic sync

Subscribe to data and get updates automatically. This type of approach simplifies data fetching and server mutations as you only interact with the server, there is no manual intermediate step to keep data in sync.

```ts
function createData(backend) {
  const data = reactive({
    todos: [],
  });

  backend.subscribeTodos((todos) => {
    data.todos = todos;
  });

  return data;
}
```

```ts
function createState(backend) {
  const data = createData(backend);

  const state = reactive({
    get todos() {
      return data.todos;
    },
    async addTodo(todo) {
      // This triggers subscription
      await backend.addTodo(todo);
    },
  });

  return state;
}
```

## Data references

When you fetch a list of todos, the array of those todos and each todo has a reference. In the world of React those references matter, because it is what `memo` components use to determine if the component needs to reconcile. The pattern of mapping an array and render nested `memo` components is the most common optimization in React.

If you use a revalidation approach to data fetching it means that the todos array and each todo in that array will change reference whenever you request any change to the array or any item in the array. In other words your `TodosList` component and every `Todo` component will reconcile regardless of any change.

Normally this is no concern as reconciliation is fast. But if you are displaying a lot of todos where each todo has a complex UI you risk performance issues.

**Local mutations** strategy is what best optimises references and therefor reconciliation. After that **Automatic sync** where you subscribe to specific changes in the data also best optimises references and therefor reconciliation. Make sure you reflect on how your data fetching affects your data references and the reconciliation of components. It can be a good idea to default to **Revalidate on mutations**, but optimise with **Local mutation** or a change subscription if available.

## Deriving data

In the examples above we are exposing data directly to components, but you might want to rather derive data to some state management that exposes the data in a more controlled way.

```ts
function createTodo(data) {
  const todo = reactive({
    get id() {
      return data.id;
    },
    toggle() {
      data.completed = !data.completed;
    },
  });

  return todo;
}

function createState() {
  const data = createData();

  const state = reactive({
    get todos() {
      return data.todos.map(createTodo);
    },
  });

  return state;
}
```

Now we are hiding data from the components and gain control of how components interact with it.

## Deriving data references

If our data fetching ensures the integrety of data references we break that integrity when deriving.

```ts
export function createState(data) {
  const state = reactive({
    get todos() {
      return data.todos.map(createTodo);
    },
  });

  return state;
}
```

Even if our `data.todos` ensures consistent references our `map` and `createTodo` will always create a new array and new state objects in that array. To make sure the `createTodo` state object is only created when the underlying `todo` data reference actually changes, we can use a reference cache:

```ts
function createReferenceCache<R extends object, S>(create: (ref: D) => S) {
  const cache = new WeakMap<D, S>();

  return (ref: R) => {
    let state = cache.get(ref);

    if (!state) {
      state = create(ref);
      cache.add(state);
    }

    return state;
  };
}
```

Let us see it in action:

```ts
function createTodo(data) {
  const todo = reactive({
    get id() {
      return data.id;
    },
    toggle() {
      data.completed = !data.completed;
    },
  });

  return todo;
}

const createState()  {
  const data = createData();
  const createCachedTodo = createReferenceCache(createTodo);

  const state = reactive({
    get todos() {
      return data.todos.map(createCachedTodo);
    },
  });

  return state;
};
```

When calling `createCachedTodo` it will first check if the data reference is in the `WeakMap`, if so, it returns the existing state. If not, it creates the state as normal and caches it. Using a `WeakMap` is perfect because we do not have to clean up the cache. When the data reference is no longer available, the state removes itself.
