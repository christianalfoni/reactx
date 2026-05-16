import { app } from "../app";

export function App() {
  return (
    <div>
      <h1>
        Count: {app.count} {app.nested.count}
      </h1>
      <button onClick={app.increment}>increment</button>
      <button onClick={app.decrement}>decrement</button>
      <button onClick={app.random}>random</button>
    </div>
  );
}
