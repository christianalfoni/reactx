# Components

A component's job is to derive UI from state. It reads what it needs, renders it, and calls methods on state when the user acts. That's it.

The practical rule: if something is about your application domain — data, loading state, whether a user is signed in — it lives in a state class. `useState` is reserved for things that exist purely within the UI and have no meaning outside it.

## Reading state

Import state directly and read from it. No providers, no context, no selectors:

```tsx
import { app } from "./app";

function Header() {
  return (
    <header>
      <span>{app.session.user?.name}</span>
      <button onClick={app.session.signOut}>Sign out</button>
    </header>
  );
}
```

Components re-render only when the properties they actually read change — nothing more.

## Scoping re-renders

Pass a sub-state instance as a prop to limit a component's re-render scope to exactly the state it cares about:

```tsx
function UserCard({ user }: { user: UserState }) {
  return (
    <div>
      <strong>{user.name}</strong>
      <button onClick={() => user.archive()}>Archive</button>
    </div>
  );
}

function UserList() {
  return (
    <ul>
      {app.users.map(user => (
        <li key={user.id}>
          <UserCard user={user} />
        </li>
      ))}
    </ul>
  );
}
```

`UserCard` re-renders only when that specific user's state changes. `UserList` re-renders only when the list itself changes.

## When to use local state

`useState` is appropriate when the state controls something that is entirely a UI concern and has no meaning in the application model:

```tsx
function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <span onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && <div role="tooltip">{content}</div>}
    </span>
  );
}
```

Whether a tooltip is visible is a rendering detail. The application does not care and should not know. If you find yourself reaching for `useState` to track loading state, fetched data, or anything related to your domain, move it to the state class instead.

## Blocking async data

When there is nothing meaningful to show until data is ready, store the Promise on the state class and consume it with `use()`. The component suspends; a `Suspense` boundary above controls the loading UI:

```ts
class App {
  posts = this.services.http.get<Post[]>("/posts");
}
```

```tsx
function PostList() {
  const posts = use(app.posts);
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}

function Feed() {
  return (
    <Suspense fallback={<Spinner />}>
      <PostList />
    </Suspense>
  );
}
```

## Non-blocking async operations

When the UI already has content and you want to run an operation in the background, use `useTransition`. It tracks the pending state without suspending and keeps the page interactive:

```tsx
function RefreshButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => app.loadPosts())}
      disabled={isPending}
    >
      {isPending ? "Refreshing…" : "Refresh"}
    </button>
  );
}
```

`startTransition` expects the callback to return a Promise. Async methods on state classes satisfy this naturally.

The same pattern applies to mutations — forms, creates, deletes:

```tsx
function NewPostForm() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = new FormData(e.currentTarget).get("title") as string;
    startTransition(() => app.createPost(title));
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
```

## Finite state

When the state class models explicit phases, narrow the union by checking `current` and render accordingly. TypeScript knows exactly what is available in each branch:

```tsx
function SessionView() {
  const { phase } = app.session;

  if (phase.current === "AUTHENTICATED") {
    return (
      <div>
        Welcome, {phase.user.name}
        <button onClick={phase.signOut}>Sign out</button>
      </div>
    );
  }

  if (phase.current === "AUTHENTICATING") {
    return <Spinner />;
  }

  return <SignInForm onSubmit={phase.signIn} />;
}
```

No `isLoading` boolean, no nullable `user`. The union type makes every branch explicit.

## Subscriptions

Wire a state subscription to the component lifecycle with `useEffect`. Because `subscribe` returns its own cleanup function, no wrapper is needed:

```tsx
function Dashboard() {
  useEffect(() => app.dashboard.subscribe(), []);

  return (
    <ul>
      {app.dashboard.statistics.map(s => (
        <li key={s.id}>{s.label}: {s.value}</li>
      ))}
    </ul>
  );
}
```
