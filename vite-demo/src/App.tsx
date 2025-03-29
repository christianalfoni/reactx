import { createSubscription, useSubscription } from "bonsify";
import "./App.css";
import { useEffect } from "react";
import { Counter } from "./counter";

function App({ counter }: { counter: Counter }) {
  console.log("App");
  useEffect(() => {
    console.log(counter.nested.count);
  }, [counter.nested]);

  return (
    <div>
      <Deeper counter={counter} />
      <Nested />
      <button onClick={counter.addItem}>Add item</button>
      <ul>
        {counter.items.map((item) => (
          <li key={item.test.id} onClick={item.test.increase}>
            {item.test.count}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Deeper({ counter }: { counter: Counter }) {
  console.log("Deeper");
  return (
    <h1 onClick={counter.nested.increase}>Count {counter.nested.count}</h1>
  );
}

function Nested() {
  console.log("Nested");
  return <div>hello</div>;
}

const stateSubscription = createSubscription(Counter());

export default function AppWrapper() {
  const counter = useSubscription(stateSubscription);

  return <App counter={counter} />;
}
