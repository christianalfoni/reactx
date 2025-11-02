import "../App.css";

import { TodoInput } from "./TodoInput";
import { TodoFilters } from "./TodoFilters";
import { TodoList } from "./TodoList";
import { AsyncExample } from "./AsyncExample";
import { EnsureExample } from "./EnsureExample";
import { TodoState } from "../state";

function App({ state }: { state: TodoState }) {
  return (
    <div className="app">
      <h1>Todo App</h1>
      <TodoInput state={state} />
      <TodoFilters state={state} />
      <TodoList state={state} />

      <hr style={{ margin: "3rem 0" }} />

      <AsyncExample state={state} />

      <hr style={{ margin: "3rem 0" }} />

      <EnsureExample />
    </div>
  );
}

export default App;
