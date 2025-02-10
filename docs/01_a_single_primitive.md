# A single primitive

```ts
import { reactive } from "bonsify";

export const app = reactive({
  count: 0,
  increase() {
    this.count++;
  },
});
```

## Story time

For several years I have been obsessing about state management. Specifically state management in complex rich clients. It all started 10 years ago with [JSFridge](https://www.youtube.com/watch?v=6F7Me4wk3XM). Creating an editor experience like this is not an experience moving from page to page, but many interactions within the same page. Many of those interactions managing asynchronous flows. Additionally the project was able to record and replay state changes.

To manage the complexity of interactions I was using Angular JS with a root scope pattern. It allowed me to share state and functions to change that state across the app without friction. Even though at the time I was just trying to find the path of least resistance to get my ideas working, 10 years later I can reflect back on learning two very important lessons:

1. Angular JS introduced me to think about my application as a state tree which the UI derived from
2. Angular JS allowed me to use plain JavaScript to express state and changes to state

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

And I am not talking about the signature, but the fact that this state management runs inside a reconciliation loop. A hidden abstraction that is transparent in the context of updating UIs, but melts your brain when it comes to state management. Additionally React is not performant out of the box. It requires you as a developer to organise your components and use special primitives to make it performant enough.

There has been many state management solutions to help you manage state and performance in React. I have contributed with a couple myself, [Cerebral JS](https://cerebraljs.com/) and [Overmind JS](https://overmindjs.org/). But they all come with abstractions and primitives that removes us from this simple idea of your application just being a UI derived from a state tree. We have been introduced to terms like reducers, slices, atoms, signals, computed, effects, selectors, models, types, observables, stores dispatchers etc. etc. All of these terms are just abstractions and primitives, technical implementation details that gives some theoretical guarantee. But I just want to use JavaScript. I want to look at the UI of the application, reason about the state tree it derives from and find code reflecting that mental model.

A state management tool for React only needs to do one thing; **make state reactive**. There should be no other primitives or abstractions beyond that. How a state change makes the UI update should be completely transparent and performant. To manage complexity of your application you rather rely on the language itself.
