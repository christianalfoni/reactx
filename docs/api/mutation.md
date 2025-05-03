# mutation

```ts
class Data {
  addTodoMutation = mutation((title: string) =>
    postJson("/todos", {
      title,
      completed: false,
    })
  );
}
```

Returns a `mutation` object that you can use to track the state of the mutation in a component or in your state management. The following properties are available:

```ts
const {
  // When mutation is running
  isPending,
  // If the mutation results in an error
  error,
  // The parameters that are currently pending, used for optimistic updates
  pendingParams,
  // The promise representing the current mutation
  promise,
} = mutation;
```

## mutate

```ts
mutation.mutate(title);
```

Runs the mutation, returning the promise of the mutation.
