import { reactive } from "bonsify";
import "./App.css";
import { Counter } from "./counter";
import { utils } from "./utils";
import { Suspense } from "react";

const counter = Counter(utils());

function App() {
  console.log("Render App");
  return (
    <div>
      <button
        onClick={() => {
          counter.addItem();
        }}
      >
        Add
      </button>
      <h1>Count {counter.count}</h1>
      {counter.items.map((item, index) => (
        <div key={index}>
          {item.count}
          <button onClick={() => counter.updateItem(item.id, 0)}>Reset</button>
          <button onClick={() => item.increase()}>Increase</button>
          <button onClick={() => counter.deleteItem(item.id)}>Delete</button>
        </div>
      ))}
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
