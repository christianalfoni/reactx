---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "ReactX"
  text: "Transparent reactivity"
  tagline: Plain classes for state, pure functions for UI — React does the rest
  actions:
    - theme: brand
      text: Get Started
      link: /get-started
    - theme: alt
      text: Hello World
      link: /hello-world

features:
  - title: Just classes
    details: Define state as a plain class. No decorators, no store primitives, no boilerplate.
  - title: Transparent reactivity
    details: Components re-render only when the state they actually read changes — automatically.
  - title: React-native async
    details: Async data is a Promise property. Consume it with use(), Suspense, and useTransition — no custom query layer needed.
---

```tsx
/*
  DO YOU REMEMBER THESE?
*/
class CounterComponent {
  state = { count: 0 };
  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };
  render() {
    return <h1 onClick={this.increment}>Count is {this.state.count}</h1>;
  }
}

/*
  HOW RIGHT IT FELT WHEN THIS WAS INTRODUCED?
*/
function PureComponent(props) {
  return <h1 onClick={props.increment}>Count is {props.count}</h1>;
}

/*
  AND HOW WRONG IT FELT WHEN THIS WAS INTRODUCED?
*/
function PureComponent() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(count + 1);
  return <h1 onClick={increment}>Count is {count}</h1>;
}

/*
  WHAT IF WE JUST KEPT CLASSES FOR STATE
 */
class Counter {
  count = 0;
  increment() {
    this.count++;
  }
}

const counter = reactive(new Counter());

/*
  AND JUST DERIVE UI?
*/
function App() {
  return <h1 onClick={counter.increment}>Count is {counter.count}</h1>;
}
```
