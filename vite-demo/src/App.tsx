import "./App.css";

import { Suspense, use, useEffect, useState } from "react";
import { Todos } from "./todos";

const todos = Todos();

function App() {
  const [newTodo, setNewTodo] = useState("");
  const { error, isFetching, value, revalidate, fetch, subscribe } =
    todos.query;
  const { mutate: addTodo, pendingParams: pendingTodo } = todos.add;

  useEffect(subscribe, [subscribe]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isFetching) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Todos</h1>
      <button onClick={revalidate}>Revalidate</button>
      <button onClick={fetch}>Refetch</button>
      <input
        type="text"
        placeholder="Add todo"
        value={newTodo}
        onChange={(event) => setNewTodo(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            addTodo({ title: newTodo });
            setNewTodo("");
          }
        }}
      />
      <ul>
        {pendingTodo && <li>Adding {pendingTodo.title}...</li>}
        {value.map((todo) => (
          <li key={todo} onClick={() => todos.remove(todo)}>
            {todo}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AppWrapper() {
  const [active, setActive] = useState(true);

  function toggle() {
    setActive(!active);
  }

  return (
    <Suspense fallback={<div>Suspense Loading...</div>}>
      <button onClick={toggle}>Toggle</button>
      {active ? <App /> : null}
    </Suspense>
  );
}
