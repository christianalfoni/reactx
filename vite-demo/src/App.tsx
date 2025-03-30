import "./App.css";
import { Counter } from "./counter";
import { Suspense } from "react";

const counter = Counter();

function App() {
  console.log("Render App");
  return (
    <div>
      <h1 onClick={counter.increment}>Count {counter.count}</h1>
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
