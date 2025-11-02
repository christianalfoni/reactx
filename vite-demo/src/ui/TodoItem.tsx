import { Todo, TodoState } from "../state";

type TodoItemProps = {
  todo: Todo;
  state: TodoState;
};

export function TodoItem({ todo, state }: TodoItemProps) {
  return (
    <li className={todo.completed ? "completed" : ""}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => state.toggleTodo(todo.id)}
      />
      <span>{todo.text}</span>
      <button onClick={() => state.deleteTodo(todo.id)}>×</button>
    </li>
  );
}
