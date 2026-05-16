# Mutations

A mutation is an async method on your state class. Use React's `useTransition` in the component to track whether it is pending and to keep the UI interactive while it runs.

```ts
class App {
  async createPost(title: string) {
    const post = await submitPost({ title });
    // update local state after the request succeeds
    this.posts = fetchPosts();
    return post;
  }
}

export const app = reactive(new App());
```

```tsx
function NewPost() {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await app.createPost(title);
      setTitle("");
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isPending}
      />
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
```

`startTransition` treats the async callback as a low-priority update. React keeps the form interactive and the button shows a pending state, but the component does not remount or lose its local state.

## Optimistic updates

Apply the change immediately to local state, then sync with the server. If the request fails, revert:

```ts
class App {
  todos: Todo[] = [];

  async toggleTodo(id: number) {
    // apply optimistically
    this.todos = this.todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );

    try {
      await patchTodo(id, { completed: !original.completed });
    } catch {
      // revert on failure
      this.todos = this.todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );
    }
  }
}
```
