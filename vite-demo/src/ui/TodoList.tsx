import { TodoItem } from "./TodoItem";
import { TodoState } from "../state";

type TodoListProps = {
  state: TodoState;
};

export function TodoList({ state }: TodoListProps) {
  if (state.filteredTodos.length === 0) {
    return (
      <p className="empty-message">
        {state.filter === "all"
          ? "No todos yet. Add one above!"
          : `No ${state.filter} todos`}
      </p>
    );
  }

  return (
    <ul className="todo-list">
      {state.filteredTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} state={state} />
      ))}
    </ul>
  );
}
