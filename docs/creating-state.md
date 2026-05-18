# Creating state

Define state as a plain class and expose it as a module-level singleton:

```ts
import { reactive } from "reactx";

class AppState {
  count = 0;

  increment() {
    this.count++;
  }

  get doubled() {
    return this.count * 2;
  }
}

export const app = reactive(new AppState());
```

Components import and use it directly — no providers or hooks needed:

```tsx
function Counter() {
  return (
    <button onClick={app.increment}>
      {app.count} (doubled: {app.doubled})
    </button>
  );
}
```

Components only re-render when the specific properties they read change.

## Nested state

Break large state into composed classes. Passing sub-state as props naturally scopes re-renders to the component that cares about it:

```ts
class UserState {
  name = "Alice";

  rename(name: string) {
    this.name = name;
  }
}

class AppState {
  user = new UserState();
}

export const app = reactive(new AppState());
```

```tsx
// UserCard only re-renders when user state changes
function UserCard({ user }: { user: UserState }) {
  return (
    <input value={user.name} onChange={(e) => user.rename(e.target.value)} />
  );
}

function Feed() {
  return <UserCard user={app.user} />;
}
```

## Lazy sub-state

Use a getter backed by a private field to create a sub-state instance on first access and cache it for the lifetime of the app:

```ts
class AppState {
  private _dashboard?: DashboardState;

  get dashboard() {
    return (this._dashboard ??= new DashboardState());
  }
}

export const app = reactive(new AppState());
```

`DashboardState` is only instantiated the first time `app.dashboard` is accessed. After that the same instance is always returned.

## Per-key sub-state

For one instance per entity (e.g. one state object per user ID), back a method with a private `Map`:

```ts
class AppState {
  private _profiles = new Map<string, ProfileState>();

  profile(userId: string) {
    if (!this._profiles.has(userId)) {
      this._profiles.set(userId, new ProfileState(userId));
    }
    return this._profiles.get(userId)!;
  }
}

export const app = reactive(new App());
```

```tsx
function ProfilePage({ userId }: { userId: string }) {
  // Same ProfileState instance returned for the same userId
  const profile = app.profile(userId);
  return <div>{profile.name}</div>;
}
```
