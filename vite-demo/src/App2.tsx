import { query, reactive } from "mobx-lite";

class JSONStorage {
  constructor(private prefix: string) {}
  set(key: string, value: unknown) {
    localStorage.setItem(`${this.prefix}:${key}`, JSON.stringify(value));
  }
  get(key: string) {
    const value = localStorage.getItem(`${this.prefix}:${key}`);
    return value ? JSON.parse(value) : null;
  }
}

type TodoDTO = {
  title: string;
  completed: boolean;
};

const todosData: TodoDTO[] = [];

class State {
  private storage = new JSONStorage("todos");
  private todos = query<TodoDTO[]>(() => Promise.resolve(todosData));
  newTodoTitle = "";
  filter: "all" | "completed" | "active" = "all";
  get filteredTodos() {
    return (
      this.todos.value?.filter((todo) => {
        if (this.filter === "all") {
          return true;
        }
        if (this.filter === "completed") {
          return todo.completed;
        }
        return !todo.completed;
      }) || []
    );
  }
  setNewTodoTitle(title: string) {
    this.newTodoTitle = title;
  }
  addTodo() {
    todosData.unshift({ title: this.newTodoTitle, completed: false });
    this.newTodoTitle = "";
    this.todos.revalidate();
  }
  toggleCompleted(index: number) {
    todosData[index].completed = !todosData[index].completed;
    this.todos.revalidate();
  }
}

const state = reactive(new State());

export default function App2() {
  return (
    <>
      <h1>Test App</h1>

      <input
        value={state.newTodoTitle}
        onChange={(e) => state.setNewTodoTitle(e.target.value)}
      />
      <button onClick={() => state.addTodo()}>Add</button>
      <ul>
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
