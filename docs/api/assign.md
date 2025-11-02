# Assign

```ts
import { Assign } from "reactx";

type AUTHENTICATING = {
  isAuthenticating: true;
  user: null;
};

type AUTHENTICATED = {
  isAuthenticating: false;
  user: string;
};

type AUTH = AUTHENTICATING | AUTHENTICATED;

class Auth extends Assign<AUTH> {
  isAuthenticating = false;
  user = null;

  async signIn(username: string) {
    this.assign({
      isAuthenticating: true,
      user: null,
    });
    await validateUserName(username);
    this.assign({
      isAuthenticating: false,
      user: username,
    });
  }

  signOut() {
    this.assign({
      isAuthenticating: false,
      user: null,
    });
  }
}
```

Base class that provides type-safe property assignment with discriminated union support. By extending `Assign` with your discriminated union type, you get a protected `assign` method that ensures property assignments are validated against the union type. All assignments are wrapped in a MobX transaction for optimal reactivity performance, ensuring that multiple property updates trigger only a single reaction cycle.
