import { Suspense, use, useDeferredValue, useState } from "react";
import { useApp } from "../app";

function AsyncCounter() {
  const app = useApp();
  const deferredCount = useDeferredValue(app.asyncCount);
  const countIsPending = deferredCount !== app.asyncCount;
  const count = use(deferredCount);

  return (
    <div>
      <h4>Count: {countIsPending ? "(Loading...)" : count}</h4>
      <button onClick={() => app.increaseCount()}>Increase</button>
    </div>
  );
}

export function App() {
  const app = useApp();
  const [newTitle, setNewTitle] = useState("");

  return (
    <div className="app">
      <h1>Todos</h1>
      <Suspense fallback="Loading counter...">
        <AsyncCounter />
      </Suspense>
      <input
        value={newTitle}
        onChange={(event) => setNewTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            app.addTodo(newTitle);
            setNewTitle("");
          }
        }}
      />
      <ul>
        {app.todos.map((todo) => (
          <li key={todo.id} onClick={() => app.toggleTodo(todo.id)}>
            {todo.title} ({todo.completed ? "Completed" : "Active"})
          </li>
        ))}
      </ul>
    </div>
  );
}
