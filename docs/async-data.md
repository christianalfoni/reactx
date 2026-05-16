# Async data

There are two distinct patterns for async data depending on whether the UI can show anything before the data arrives.

## Blocking async data

Use this when there is nothing meaningful to show until the data is ready — the initial page load, a detail view, etc.

Store the Promise as a property and consume it with React's `use()` hook. The component suspends until it resolves. A `Suspense` boundary above controls the loading state; an `ErrorBoundary` above catches rejections.

```ts
// app.ts
class App {
  posts = fetchPosts();
}

export const app = reactive(new App());
```

```tsx
function PostList() {
  const posts = use(app.posts); // suspends until resolved

  return (
    <ul>
      {posts.map((p) => <li key={p.id}>{p.title}</li>)}
    </ul>
  );
}

function Feed() {
  return (
    <Suspense fallback={<Spinner />}>
      <PostList />
    </Suspense>
  );
}
```

To reassign the Promise (e.g. on route change), the component re-suspends automatically and the `Suspense` fallback shows again.

## Non-blocking async data

Use this when the UI already has content to show and you want to update it in the background — a refresh button, a poll, a mutation that appends to a list.

Store a plain array (or value) as the property instead of a Promise. An async method fetches and assigns the result. `startTransition` tracks the Promise returned by the method, keeping `isPending` true until it resolves — with no Suspense fallback, no flash.

```ts
// app.ts
class App {
  posts: Post[] = [];

  async loadPosts() {
    this.posts = await fetchPosts();
  }

  async refreshPosts() {
    this.posts = await fetchPosts();
  }
}

export const app = reactive(new App());
```

```tsx
function PostList() {
  const [isRefreshing, startTransition] = useTransition();

  useEffect(() => {
    app.loadPosts();
  }, []);

  return (
    <>
      <button
        onClick={() => startTransition(() => app.refreshPosts())}
        disabled={isRefreshing}
      >
        {isRefreshing ? "Refreshing…" : "Refresh"}
      </button>
      <ul style={{ opacity: isRefreshing ? 0.5 : 1 }}>
        {app.posts.map((p) => <li key={p.id}>{p.title}</li>)}
      </ul>
    </>
  );
}
```

`startTransition` expects a `Promise<void>` — async methods naturally satisfy this. The component re-renders reactively when `app.posts` is reassigned; no Suspense boundary is needed.

## Mutations

Mutations follow the non-blocking pattern. The async method does the work and updates state; `startTransition` tracks pending state in the UI.

```ts
class App {
  posts: Post[] = [];

  async createPost(title: string): Promise<Post> {
    const post = await submitPost({ title });
    this.posts = [...this.posts, post];
    return post;
  }
}
```

```tsx
function NewPost() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = new FormData(e.currentTarget).get("title") as string;
    startTransition(() => app.createPost(title));
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" />
      <button disabled={isPending}>{isPending ? "Saving…" : "Save"}</button>
    </form>
  );
}
```

## Per-key blocking data

For data fetched per entity, back a method with a private `Map` of Promises:

```ts
class App {
  #postRequests = new Map<number, Promise<Post>>();

  post(id: number) {
    if (!this.#postRequests.has(id)) {
      this.#postRequests.set(id, fetchPost(id));
    }
    return this.#postRequests.get(id)!;
  }
}

export const app = reactive(new App());
```

```tsx
function PostPage({ id }: { id: number }) {
  const post = use(app.post(id));
  return <h1>{post.title}</h1>;
}
```
