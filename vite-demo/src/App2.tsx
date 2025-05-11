import { reactive } from "mobx-lite";

type TodoDTO = {
  title: string;
  completed: boolean;
};

class TodosState {
  todos: TodoDTO[] = [];
  get filteredTodos() {
    switch (this.filter) {
      case "COMPLETED":
        return this.todos.filter((todo) => todo.completed);
      case "ACTIVE":
        return this.todos.filter((todo) => !todo.completed);
      default:
        return this.todos;
    }
  }
  filter: "ALL" | "COMPLETED" | "ACTIVE" = "ALL";
  newTodoTitle = "";
  addTodo() {
    this.todos.unshift({ title: this.newTodoTitle, completed: false });
    this.newTodoTitle = "";
  }
  setNewTodoTitle(title: string) {
    this.newTodoTitle = title;
  }
  toggleCompleted(index: number) {
    this.todos[index].completed = !this.todos[index].completed;
  }
}

const state = reactive(new TodosState());

export default function App2() {
  return (
    <>
      <div>
        <input
          type="text"
          value={state.newTodoTitle}
          onChange={(e) => state.setNewTodoTitle(e.target.value)}
        />
        <button onClick={() => state.addTodo()}>Add</button>
      </div>
      <ul>
        {state.todos.length}
        {state.filteredTodos.map((todo, index) => (
          <li key={index}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => state.toggleCompleted(index)}
            />
            {todo.title}
          </li>
        ))}
      </ul>
    </>
  );
}
