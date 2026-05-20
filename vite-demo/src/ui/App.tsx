import {
  startTransition,
  Suspense,
  use,
  useDeferredValue,
  useOptimistic,
  useState,
} from "react";
import { useApp } from "../app";

function AsyncCounter() {
  const app = useApp();
  const deferredCount = useDeferredValue(app.count);
  const count = use(deferredCount);
  const [optimisticCount, setOptimisticCount] = useOptimistic(count);

  return (
    <div>
      <h4 style={{ opacity: count !== optimisticCount ? "0.5" : 1 }}>
        Count: {optimisticCount}
      </h4>
      <button
        onClick={() => {
          startTransition(async () => {
            setOptimisticCount(optimisticCount + 1);
            await app.increaseCount();
          });
        }}
      >
        Increase
      </button>
      <button
        onClick={() => {
          startTransition(async () => {
            setOptimisticCount(optimisticCount - 1);
            await app.decreaseCount();
          });
        }}
      >
        Increase
      </button>
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
