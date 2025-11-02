import { TodoState } from "../state";

type TodoInputProps = {
  state: TodoState;
};

export function TodoInput({ state }: TodoInputProps) {
  return (
    <div className="todo-input">
      <input
        type="text"
        placeholder="What needs to be done?"
        value={state.inputValue}
        onChange={(e) => state.setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && state.addTodo()}
      />
      <button onClick={() => state.addTodo()}>Add</button>
    </div>
  );
}
