import "./App.css";

import { Suspense, use, useState } from "react";
import { Todos } from "./todos";

const todos = Todos();

function App() {
  const [newTodo, setNewTodo] = useState("");
  const list = use(todos.query.promise);
  const addMutationState = todos.add.state;

  console.log(JSON.stringify(addMutationState));

  return (
    <div>
      <h1>Todos</h1>
      <button onClick={todos.query.revalidate}>Revalidate</button>
      <button onClick={todos.query.fetch}>Refetch</button>
      <input
        type="text"
        placeholder="Add todo"
        value={newTodo}
        onChange={(event) => setNewTodo(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            todos.add.mutate({ title: newTodo });
            setNewTodo("");
          }
        }}
      />
      <ul>
        {addMutationState.status === "PENDING" && (
          <li>Adding {addMutationState.params.title}...</li>
        )}
        {list.map((todo) => (
          <li key={todo}>{todo}</li>
        ))}
      </ul>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Suspense fallback={<div>Suspense Loading...</div>}>
      <App />
    </Suspense>
  );
}
