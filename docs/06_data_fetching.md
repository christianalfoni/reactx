# Data Fetching

There are primarily three types of data fetching you can do. They have different performance characteristic and approaches to mutations.

### 1. Manual mutations

Fetch data once and rather manually apply mutations to the data, where server mutations is a background process. This type of approach gives an incredibly snappy UX as there are no pending states for data changes and there are no reference changes causing unwanted reconciliation.

```ts
const createData = (backend) => {
  const data = reactive({
    todos: [],
  });

  backend.fetchTodos().then((todos) => (data.todos = todos));

  return data;
};
```

In this type of data handling you can just toggle the `completed` state of any todo, push new todos on to the existing data array etc.

```ts
const createApp = (backend) => {
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
};
```

### 2. Revalidate on mutations

Refetch data every time a mutation is performed. This type of approach gives a stronger guarantee that whenever the client makes a mutation the data will be synced with what is actually on the server. This stronger guarantee has a cost though. By default all data references will change on every mutation, meaning components are not able to compare what data references is still the same.

```ts
const createData = (backend) => {
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
};
```

```ts
const createApp = (backend) => {
  const data = createData(backend);

  const app = reactive({
    get todos() {
      return data.todos;
    },
    async addTodo(todo) {
      await backend.addTodo(todo);
      await data.revalidateTodos();
    },
  });

  return app;
};
```

### 3. Automatic sync

Subscribe to data and get updates automatically. This type of approach simplifies data fetching and mutations as you only interact with the server, there is no manual intermediate step to keep data in sync.

```ts
const createData = (backend) => {
  const data = reactive({
    todos: [],
  });

  backend.subscribeTodos((todos) => {
    data.todos = todos;
  });

  return data;
};
```

```ts
const createApp = (backend) => {
  const data = createData(backend);

  const app = reactive({
    get todos() {
      return data.todos;
    },
    async addTodo(todo) {
      // This triggers subscription
      await backend.addTodo(todo);
    },
  });

  return app;
};
```

Depending on the syncing solution the references of data will be kept during a sync.

## Deriving data

In the examples above we are exposing data directly to components, but you might want to rather derive data to some state management that exposes the data in a more controlled way .

```ts
const createTodo = (data) =>
  reactive({
    get id() {
      return data.id;
    },
    toggle() {
      data.completed = !data.completed;
    },
  });

const createApp = () => {
  const data = createData();

  const app = reactive({
    get todos() {
      return data.todos.map(createTodo);
    },
  });

  return app;
};
```

Now we are hiding data from the components and gain control of how components interact with it.

## Optimize deriving data

When components render lists and passes items to nested components you typically use `memo` to avoid non changing items to reconcile when other items in the list changes. When we `map` over the todos in `get todos` in the example above we will always generate new references for the state, even though the data it wraps did not change its reference. You can avoid this by creating a **reference cache**, as shown here with full typing:

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
const createTodo = (data) =>
  reactive({
    get id() {
      return data.id;
    },
    toggle() {
      data.completed = !data.completed;
    },
  });

const createApp = () => {
  const data = createData();
  const createCachedTodo = createReferenceCache(createTodo);

  const app = reactive({
    get todos() {
      return data.todos.map(createCachedTodo);
    },
  });

  return app;
};
```

When calling `createCachedTodo` it will first check if the data reference is in the `WeakMap`, if so, it returns the existing state. If not, it creates the state as normal and caches it. Using a `WeakMap` is great because we do not have to clean up the cache. When the data reference is no longer available, the state removes itself.
