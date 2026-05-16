import { useState } from "react";
import { app, type Filter } from "../app";

export function Todos() {
  const [input, setInput] = useState("");

  function handleAdd() {
    const text = input.trim();
    if (text) {
      app.addTodo(text);
      setInput("");
    }
  }

  return (
    <section className="section">
      <h2>Todos</h2>

      <div className="todo-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="What needs doing?"
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      <div className="filters">
        {(["all", "active", "completed"] as Filter[]).map((f) => (
          <button
            key={f}
            className={app.filter === f ? "active" : ""}
            onClick={() => app.setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {app.filteredTodos.length === 0 ? (
        <p className="empty">Nothing here.</p>
      ) : (
        <ul className="todo-list">
          {app.filteredTodos.map((todo) => (
            <li key={todo.id} className={todo.completed ? "completed" : ""}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => app.toggleTodo(todo.id)}
              />
              <span>{todo.text}</span>
              <button onClick={() => app.deleteTodo(todo.id)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
