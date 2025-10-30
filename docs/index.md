---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "ReactX"
  text: "Transparent reactivity"
  tagline: Managing state and data in rich client applications
  actions:
    - theme: brand
      text: Get Started
      link: /get-started
    - theme: alt
      text: API
      link: /api/reactive

features:
  - title: Best of both worlds
    details: Object oriented state management with functional UI components
  - title: Transparent reactivity
    details: Just write state management and UI code, free from reactivity boilerplate
  - title: Data Management
    details: Query and mutation utilities for modern data management with React
---

```tsx
// Do you remember these?
class CounterComponent {
  state = {
    count: 0,
  };
  increment = () => {
    this.setState({
      count: this.state.count + 1,
    });
  };
  render() {
    return <h1 onClick={this.increment}>Count is {this.state.count}</h1>;
  }
}

// How right it felt when this was introduced?
function PureComponent(props) {
  return <h1 onClick={props.increment}>Count is {props.count}</h1>;
}

// And how wrong it felt when this was introduced?
function PureComponent() {
  const [count, setCount] = useState(0);
  const increment = () =>
    setCount({
      count: count + 1,
    });

  return <h1 onClick={increment}>Count is {count}</h1>;
}

// What if we did not put state into pure functions, but kept classes for state...
class CounterState {
  count = 0;
  increment() {
    this.count++;
  }
}

// ...and pure components for UI?
function App({ counter }) {
  return <h1 onClick={counter.increment}>Count is {counter.count}</h1>;
}

// React observing state and reconciling UI
```
