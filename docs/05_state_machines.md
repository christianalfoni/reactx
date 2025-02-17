# State machines

State machines is a useful concept in state management. At its core it puts state and related functionality behind an explicit state. This has several benefits:

- The explicit states is a string that describes that actual state
- With TypeScript you can narrow down what values are available in each state and you can exhaust what states are available
- You can guarantee that certain logic is only run in certain states

Normally a state machine is implemented with a dispatcher type of concept. That means you can ask it to do anything at any point in time, but its internal implementation guards the execution by checking the current state. The bad side to this is that you will never know from a consumption perspective what functionality belongs to what state.

By simply using a pattern we can resolve this:

```ts
import { reactive } from "bonsify";

// We create our machine by defining functions transitioning to
// the explicit states. The state functions close over the object
// representing the state. You can do whatever you want there, like
// starting an interval
function createCounter() {
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

const app = reactive({
  counter: createCounter(),
});
```
