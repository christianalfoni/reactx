# The mental model

It does no matter where your UI derives its state from. It being from a DOM element, component, a parent component, a context, a global state store or wherever. At any point when you look at the UI tree of your application there is an equivalent state tree.

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

And this is why components are so powerful. They map directly to how we think about what we see in the UI and observing its behavior. It gives us insight into how the code is structured. But this is not the case for the state. If the application has some state from components, some state from a parent component, maybe some state in a context and some in a global state store, it has no resemblence to your mental model of the state and its functions. The mental model litraly breaks. The different sources of state might also use different primitives and abstractions to express that state and how it is changed. The end result is more friction and complexity, reduced productivity and less fun.

With **just-built-it** you think about your application state as a state tree with related functions that changes it. By looking at a piece of UI you should be able to derive a very similar tree to what is actually implemented in the application. Terms like reducers, slices, atoms, signals, computed, effects, selectors, models, types, observables, stores dispatchers etc. etc. None of these concepts has any conceptual meaning to state management, they are just technical implementation details that guarantees some theoretical guarantee. We have lost our way and it is time to handle state as just that... state!

## Ignoring guarantees

We are often taught that certain abstractions and primitives are there to create guarantees. For example React went on somewhat of a crusade of "mutability is the root of all evil". Yes, immutability guarantees values will not change from under you, but stating that mutability is inherently bad and immutability is inherently good is absolute bullshit. Immutability has a big cost in JavaScript. The performance and memory footprint might be minimal, but the language has no built in primitives for immutability. That means you have to break down the intuition of expressing changes in the language and learn new primitives, or at least new verbose patterns of expressing change. Also reconciliation by value comparison (React), as opposed to observation (Vue), is why React is considered the least performant.

We are also taught that reducers has the guarantee of ensuring changes can only happen within the reducer. This is true and also led to Mobx protecting state changes behind the concept of "actions", leading to async functions not being able to perform state changes, leading to a concept of `flow` etc. Reducers are also complete bullshit. It is theoretically correct, but in practice it creates a lot more friction than value.

We have to start ignoring these theoretically correct concepts, as opposed to striving for them. We have to become pragmatic developers and focus on creating actual value.
