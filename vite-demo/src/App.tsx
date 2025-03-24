import "./App.css";
import { Counter } from "./counter";
import { utils } from "./utils";
import { Suspense, use } from "react";

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
        <div key={index} onClick={() => counter.deleteItem(item.id)}>
          {item.count}
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
