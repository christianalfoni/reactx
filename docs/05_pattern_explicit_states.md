# Pattern: Explicit States

Explicit states, unions, algebraic data types or finite state machines, the concepts are very similar. The idea is that you define state that is in one of either explicit states.

So instead of writing:

```ts
type Session = {
  user: UserDTO | null;
  isAuthenticating: boolean;
  signin(): void;
  signout(): void;
};
```

You describe more correctly the specific states a session can be in and what behavior is available in each state:

```ts
type AUTHENTICATED = {
  current: "AUTHENTICATED";
  user: UserDTO;
  signout(): void;
};

type UNAUTHENTICATED = {
  current: "UNAUTHENTICATED";
  signin(): void;
};

type AUTHENTICATING = {
  current: "AUTHENTICATING";
};

type SessionState = AUTHENTICATED | UNAUTHENTICATED | AUTHENTICATING;
```

This has several benefits:

- The explicit states is a string that describes the actual state
- With TypeScript you can narrow down what values are available in each state and you can exhaust what states are available
- You can guarantee that certain behaviors is only run in certain states

Normally a finite state machine is implemented with a dispatcher type of concept. That means you can ask it to do anything at any point in time, but its internal implementation guards the execution by checking the current state. The bad side to this is that you will never know from a consumption perspective what functionality belongs to what state.

By simply using a pattern we can resolve this:

```ts
import { reactive } from "bonsify";

function Counter() {
  const counter = reactive({
    state: IDLE(),
    count: 0,
  });

  return counter;

  function IDLE() {
    return {
      current: "IDLE",
      start() {
        counter.state = COUNTING();
      },
    };
  }

  function COUNTING() {
    const interval = setInterval(() => {
      counter.count++;
    }, 1000);

    return {
      current: "COUNTING",
      stop() {
        clearInterval(interval);
        counter.state = IDLE();
      },
    };
  }
}

function State() {
  return {
    counter: Counter(),
  };
}
```
