# Pattern: Data Fetching

Data is also state. The difference between data and regular state is that we need to asynchronously fetch the initial state. Making changes to that state needs to be synced with the server, often reffered to as server mutations. There are primarily three different strategies to manage this.

## 1. Local mutations

Fetch data once and apply local mutations to the data, where server mutations is a background process.

```ts
function Data({ persistence }) {
  const data = reactive({
    todos: [],
    addTodo,
  });

  persistence.todos.fetch().then((todos) => (data.todos = todos));

  return reactive.readonly(data);

  function addTodo(todo) {
    data.todos.push(todo);
    persistence.todos.add(todo);
  }
}
```

In this type of data handling you can just toggle the `completed` state of any todo, push new todos on to the existing data array etc.

## 2. Revalidate on mutations

Refetch data after a server mutation is performed. This type of approach gives a stronger guarantee by refetching the data from the server after any mutation.

```ts
function Data({ persistence }) {
  const data = reactive({
    todos: [],
    revalidateTodos,
  });

  revalidateTodos();

  return reactive.readonly(data);

  async function revalidateTodos() {
    data.todos = await persistence.todos.fetch();
  }

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
    addTodo,
  });

  persistence.todos.subscribe((todos) => {
    data.todos = todos;
  });

  return data;

  async function addTodo(todo) {
    // This triggers subscription
    await persistence.todos.add(todo);
  }
}
```

## Data references

When you fetch a list of todos, the array of those todos and each todo has a reference. In the world of React those references matter, because it is what `memo` components use to determine if the component needs to reconcile. The pattern of mapping an array in a "List" component and render a nested "Item" components using `memo` is the most common optimization in React.

If you use a revalidation approach to data fetching the todos array and each todo in that array will change reference on every revalidation. In other words your `TodosList` component and every `Todo` component will reconcile regardless of any change.

Normally this is no concern as reconciliation is fast. But if you are displaying a lot of todos where each todo has a complex UI you risk performance issues.

**Local mutations** strategy is what best optimises references and therefor reconciliation. After that **Automatic sync** where you subscribe to specific changes in the data also best optimises references and therefor reconciliation. We use **Bonsify** for the optimal user experience, which means you should embrace **local mutation** and **subscriptions** to specific changes.

## Extending data

In the examples above we are exposing data directly to components, but you typically want to be able to make changes to it as well. Since all state is `readonly` you achieve this by just extending the data with state management.

```ts
function Todo({ data }) {
  const todo = reactive({
    ...data,
    toggle,
  });

  return reactive.readonly(todo);

  function toggle() {
    todo.completed = !todo.completed;
  }
}

function Data({ persistence }) {
  const data = reactive({
    todos: [],
  });

  persistence.todos.subscribe((todos) => {
    data.todos = todos.map((data) => Todo({ data }));
  });

  return reactive.readonly(data);
}
```

Now we are hiding data from the components and gain control of how components interact with it.

## Deriving data
