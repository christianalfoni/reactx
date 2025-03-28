import { reactive } from "bonsify";
import "./App.css";
// import { Counter } from "./counter";
// import { utils } from "./utils";
import { Suspense, useEffect } from "react";

function Counter() {
  const counter = reactive({
    nested: {
      count: 0,
      increase() {
        counter.nested.count++;
      },
    },
  });

  return reactive.readonly(counter);
}

const counter = Counter();

function App() {
  useEffect(() => {
    console.log(counter.nested.count);
  }, [counter.nested]);
  return (
    <div>
      <h1 onClick={counter.nested.increase}>Count {counter.nested.count}</h1>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
  );
}
