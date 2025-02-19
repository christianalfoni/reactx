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
  removeTodo() {},
};
```

It does no matter what source your UI derives its state from, it being from a DOM element, component, a parent component, a context, a global state store or wherever. At any point when you look at the UI of your application you can imagine a state tree where it derived its state from.

And this is exactly what components gave us. They gave us the mental model to look at a UI and find directories, files and code that to some degree reflects that mental model.

But this is not the case for state. If the application has many components where some state originates from the component, some state is passed as props from parent components, maybe some state in a context and some in a global state store, you will have a much harder time finding a match between your mental model and directories, files and code reflecting that mental model.

With **bonsify** you think about your application state as a state tree. That means the state tree you derive from looking at the UI of the application will have similar directories, files and code.
