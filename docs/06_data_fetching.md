# Data Fetching

There are three types of data fetching you can do. None of them are wrong, but they have different performance characteristic and approaches to mutations.

### 1. Manual mutations

Fetch data once and rather manually apply mutations to the data, where server mutations is a background process. This type of approach gives an incredibly snappy UX as there are absolutely no pending states for data changes and there are no reference changes causing unwanted reconciliation. Any errors are rather handled as a type of notification where user can try to run the mutation again or revert the change.

```ts
const createData = () => {
  const data = reactive({
    todos: [],
  });

  fetchTodos().then((todos) => (data.todos = todos));

  return data;
};
```

In this type of data handling you can just toggle the `completed` state of any todo, push new todos on to the existing data array etc.

```ts
const createApp = () => {
  const data = createData();

  const app = reactive({
    get todos() {
      return data.todos;
    },
    addTodo(todo) {
      data.todos.push(todo);
      // Talk to server and remove todo if it fails
    },
  });

  return app;
};
```

### 2. Revalidate on mutations

Refetch data every time a mutation is performed. This type of approach gives a stronger guarantee that whenever the client makes a mutation the data will be synced with what is actually on the server. This stronger guarantee has a cost as by default all data references will change, meaning the reconciler is not able to compare what data references is still the same.

```ts
const createData = () => {
  const data = reactive({
    todos: [],
    async revalidateTodos() {
      try {
        const todos = await fetchTodos();
        data.todos = todos;
      } catch {}
    },
  });

  data.revalidateTodos();

  return data;
};
```

```ts
const createApp = () => {
  const data = createData();

  const app = reactive({
    get todos() {
      return data.todos;
    },
    async addTodo(todo) {
      // Do mutation on server
      await data.revalidateTodos();
    },
  });

  return app;
};
```

### 3. Automatic sync

Subscribe to data and get updates automatically. This type of approach simplifies data fetching and mutations as you only interact with the server, there is no manual intermediate step to keep data in sync.

```ts
const createData = (firebase) => {
  const data = reactive({
    todos: [],
  });

  firebase.onDataSnapshot(firebase.todosCollection, (todos) => {
    data.todos = todos;
  });

  return data;
};
```

```ts
const createApp = () => {
  const data = createData();

  const app = reactive({
    get todos() {
      return data.todos;
    },
    async addTodo(todo) {
      // Do mutation on firebase, it will sync back immediately
    },
  });

  return app;
};
```

Depending on the syncing solution the references of data will be kept during a sync, given a change has not happened, or all references will be updated.

## Bind data to state

In the examples above we are exposing data directly to components, but you might want to rather wrap data with some state management. For example:

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

## Optimize binding of data to state

Binding data to state works for all data fetching solutions. But if the data fetching solution ensures consistent data references when no changes are made, we miss out on an optimiation. When components render lists and passes items to nested components you typically use `memo` to avoid non changing items to reconcile when other items or the list changes. When we `map` over the todos in this example we will always generate new references for state. You can avoid this by creating a **reference cache**, as shown here with full typing:

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

When calling `createCachedTodo` it will first check if the data reference is in the `WeakMap`, if so, it returns the existing state. If not, it creates the state as normal and caches it. Using a `WeakMap` is great because we do not have to clean up the cache. When the data reference is no longer available, it removes itself.
