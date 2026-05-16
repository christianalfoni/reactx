# Explicit states

Some state is naturally finite — it can only ever be in one of a known set of states, and each state has its own available behaviour. Modelling this explicitly (rather than as a bag of booleans) makes invalid states unrepresentable and makes it clear what actions are valid at any point.

Instead of:

```ts
type SessionState = {
  user: User | null;
  isAuthenticating: boolean;
  signin(): void;
  signout(): void;
};
```

Describe the states explicitly:

```ts
class Unauthenticated {
  readonly current = "UNAUTHENTICATED";
  constructor(private session: SessionState) {}

  signin(credentials: Credentials) {
    this.session.state = new Authenticating(this.session, credentials);
  }
}

class Authenticating {
  readonly current = "AUTHENTICATING";
  constructor(
    private session: SessionState,
    credentials: Credentials
  ) {
    authenticate(credentials).then(
      (user) => { this.session.state = new Authenticated(this.session, user); },
      ()     => { this.session.state = new Unauthenticated(this.session); }
    );
  }
}

class Authenticated {
  readonly current = "AUTHENTICATED";
  constructor(
    private session: SessionState,
    public user: User
  ) {}

  signout() {
    this.session.state = new Unauthenticated(this.session);
  }
}

class SessionState {
  state: Unauthenticated | Authenticating | Authenticated =
    new Unauthenticated(this);
}

export const app = reactive(new App());
```

In components, narrow the type by checking `current`:

```tsx
function Header() {
  const { state } = app.session;

  if (state.current === "AUTHENTICATED") {
    return (
      <div>
        Welcome {state.user.name}
        <button onClick={state.signout}>Sign out</button>
      </div>
    );
  }

  if (state.current === "AUTHENTICATING") {
    return <Spinner />;
  }

  return <button onClick={() => state.signin(credentials)}>Sign in</button>;
}
```

Each class only exposes the methods that are valid in that state. TypeScript narrows the type as you check `current`, so calling `state.signout()` when the session is unauthenticated is a compile-time error.
