# A single primitive

```ts
import { reactive } from "just-build-it";

export const app = reactive({
  count: 0,
  increase() {
    this.count++;
  },
});
```

## Story time

For several years I have been obsessing about state management. Specifically state management in complex rich clients. It all started 10 years ago with [JSFridge](https://www.youtube.com/watch?v=6F7Me4wk3XM). Creating an editor experience like this is not an experience moving from page to page, but many interactions within the same page. Many of those interactions managing asynchronous flows. Additionally the project was able to record and replay state changes.

To manage the complexity of interactions I was using Angular JS with a root scope pattern. It allowed me to share state and functions to change that state across the app without friction. Even though I leaned to this pattern to avoid friction, allowing me to get into a flow of productive programming, I also learned a shift of perspective. My application was two trees. A state tree with related functions to change that state, and a UI tree derived from the state tree. But 10 years later I have another reflection. Angular JS allowed me to just change this state tree using plain JavaScript, no abstractions. Angular JS at the time certainly had performance issues as a result, but the developer experience was amazing and you felt increadibly productive.

When React came on the scene shortly after it got my attention. The concept of components and JSX was a big deal. You would be able to use JavaScript to express the dynamic nature of the UI. This is an amazing concept, but unlike Angular JS dirty checking, React depends on immutability. The result of this is that we needed abstractions to make our state and state changes immutable. Instead of:

```js
controller("MyController", {
  count: 0,
  increase() {
    this.count++;
  },
});
```

You have:

```js
createComponent({
  state: {
    count: 0,
  },
  increase() {
    this.setState((current) => {
      count: current.count + 1;
    });
  },
});
```

Later with the introduction of the function component and hooks, the state abstractions got even more exotic:

```jsx
function Counter() {
  const [state, setState] = useState({ count: 0 });
}
```

And I am not talking about the signature primarily here, but the fact that this state management runs inside a reconciliation loop. A hidden abstraction that is completely transparent in the context of updating UIs, but completely melts your brain when it comes to state management. Additionally React does not take full responsibility of the performance, it is put into the hands of the developers to make it performant enough.

There has been many state management solutions to help you manage state and performance in React, but they all come with abstractions and primitives that removes us from this simple idea of your application just being a UI tree derived from a state tree. Abstractions like reducers and action creators. Primitives like signals, effects and reactions. None if these concepts are introduced with the intention of reducing developer experience or productivity, but they do. Building an application should not be this hard, with such a blurred interface between how you think about state and how you express it. There should not be so many abstractions and primitives. It should be simpler. It should be fun!

I want to argue that a state management tool for React only needs to do one thing; **make state reactive**. There should be no other primitives or abstractions beyond that. How a state change makes the UI update is completely transparent and performant. To manage complexity of your application you rather rely on programming patterns.
