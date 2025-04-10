# Explicit states

Explicit states, unions, algebraic data types or finite state machines, the concepts are very similar. The idea is that you define state that is in one of either explicit states.

So instead of writing:

```ts
type SessionState = {
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

::: code-group

```ts [Functional]
import { reactive } from "mobx-lite";

function CounterState() {
  const state = reactive({
    state: IDLE() as ReturnType<typeof IDLE> | ReturnType<typeof COUNTING>,
    count: 0,
  });

  return state;

  function IDLE() {
    return {
      current: "IDLE" as const,
      start() {
        state.state = COUNTING();
      },
    };
  }

  function COUNTING() {
    const interval = setInterval(() => {
      state.count++;
    }, 1000);

    return {
      current: "COUNTING" as const,
      stop() {
        clearInterval(interval);
        state.state = IDLE();
      },
    };
  }
}
```

```ts [Object Oriented]
import { reactive } from "mobx-lite";

class IDLE {
  readonly current = "IDLE";
  constructor(private counter: CounterState) {
    reactive(this);
  }
  start() {
    this.counter.state = new COUNTING(this.counter);
  }
}

class COUNTING {
  readonly current = "COUNTING";
  private interval: number;
  constructor(private counter: CounterState) {
    reactive(this);
    this.interval = setInterval(() => {
      this.counter.count++;
    }, 1000);
  }
  stop() {
    clearInterval(this.interval);
    this.counter.state = new IDLE(this.counter);
  }
}

class CounterState {
  state: IDLE | COUNTING;
  count = 0;
  constructor() {
    reactive(this);
    this.state = new IDLE(this);
  }
}
```

:::
