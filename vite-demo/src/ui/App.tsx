import { useState } from "react";
import { useApp } from "../app";

export function App() {
  const app = useApp();
  const [newTitle, setNewTitle] = useState("");

  return (
    <div className="app">
      <h1>Todos</h1>
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
