import { reactive } from "mobx-lite";
import "./App.css";

import { Suspense, useEffect, useState } from "react";
import { Todos } from "./todos";

const todos = reactive(new Todos());

function App() {
  const [newTodo, setNewTodo] = useState("");
  const { error, isFetching, value, revalidate, fetch, subscribe } =
    todos.query;
  const { mutate: addTodo, pendingParams: pendingTodo } = todos.add;
  const { mutate: removeTodo } = todos.remove;

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
            addTodo(newTodo);
            setNewTodo("");
          }
        }}
      />
      <ul>
        {pendingTodo && <li>Adding {pendingTodo[0]}...</li>}
        {value.map((todo) => (
          <li key={todo} onClick={() => removeTodo(todo)}>
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
