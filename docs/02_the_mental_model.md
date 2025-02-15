# The mental model

![todomvc](./todomvc.png)

When you look at this piece of UI you probably have a pretty strong intuition of what components exists in this application, without considering what tool is used.

```tsx
<TodoMVC>
  <AddTodo />
  <TodosList />
  <TodosFooter />
</TodoMVC>
```

And the same goes for the state and related functionality. You have no idea what tool is used, but you might be thinking something similar to this:

```ts
const state = {
  filter: "all",
  newTodoTitle: "",
  editTodoTitle: "",
  todos: [
    {
      title: "bring back the fun",
      completed: false,
    },
  ],
  get currentTodos() {},
  addTodo() {},
  setFilter() {},
  toggleCompleted() {},
  editTodo() {},
  removeTodo() {},
};
```

It does no matter what source your UI derives its state from, it being from a DOM element, component, a parent component, a context, a global state store or wherever. At any point when you look at the UI of your application you can imagine a state tree where it derived its state from.

And this is exactly what components gave us. They gave us the ability to look at a UI and mentally draw rectangles around sections, reason about the encapsulations of UI code and find directories and files that to some degree reflects that mental model.

But this is not the case for state. If the application has many components where some state originates from the component, some state is passed as props from parent components, maybe some state in a context and some in a global state store, you will have a much harder time reasoning about the encapsulations of state code and find directories and files that to some degree reflects that mental model.

With **bonsify** you think about your application state as a state tree. That means the state tree you derive from looking at the UI of the application will have similar encapsulations, directories and folders in the codebase.

## Forced guarantees

We are often taught that certain abstractions and primitives are there to create guarantees. For example React went on somewhat of a crusade of "mutability is the root of all evil". Yes, immutability guarantees values will not change from under you, but stating that mutability is inherently bad and immutability is inherently good is absolute bullshit. Immutability has a big cost in JavaScript. The performance and memory footprint might be minimal, but the language has no built in primitives for immutability. That means you have to break down the intuition of expressing changes in the language and learn new primitives, or at least new verbose patterns of expressing change. Also reconciliation by value comparison (React), as opposed to observation (Vue), is why React has performance issues.

We are also taught that reducers has the guarantee of ensuring changes can only happen within the reducer. This is true and also led to Mobx protecting state changes behind the concept of "actions", leading to async functions not being able to perform state changes, leading to yet another primitive of `flow` etc. Isolating state changes in reducers to guarantee source of change is also complete bullshit. It is theoretically correct, but in practice it creates a lot more friction than value.

