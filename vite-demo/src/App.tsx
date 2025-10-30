import { reactive } from "reactx";
import "./App.css";

// Todo type
type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

// Generic JSON storage class for localStorage
class JSONStorage<T> {
  constructor(private key: string, private defaultValue: T) {}

  load(): T {
    const stored = localStorage.getItem(this.key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error(`Failed to load data from local storage (${this.key}):`, error);
      }
    }
    return this.defaultValue;
  }

  save(value: T): void {
    localStorage.setItem(this.key, JSON.stringify(value));
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }
}

// Reactive state class
class TodosState {
  todos: Todo[] = [];
  filter: "all" | "active" | "completed" = "all";
  newTodoTitle = "";
  private storage = new JSONStorage<Todo[]>("reactx-todos", []);

  constructor() {
    this.todos = this.storage.load();
  }

  addTodo() {
    if (this.newTodoTitle.trim()) {
      this.todos.push({
        id: Date.now(),
        title: this.newTodoTitle.trim(),
        completed: false,
      });
      this.newTodoTitle = "";
      this.storage.save(this.todos);
    }
  }

  toggleTodo(id: number) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.storage.save(this.todos);
    }
  }

  deleteTodo(id: number) {
    this.todos = this.todos.filter((t) => t.id !== id);
    this.storage.save(this.todos);
  }

  setFilter(filter: "all" | "active" | "completed") {
    this.filter = filter;
  }

  setNewTodoTitle(title: string) {
    this.newTodoTitle = title;
  }

  // Computed values using getters
  get filteredTodos() {
    if (this.filter === "active") {
      return this.todos.filter((t) => !t.completed);
    }
    if (this.filter === "completed") {
      return this.todos.filter((t) => t.completed);
    }
    return this.todos;
  }

  get activeCount() {
    return this.todos.filter((t) => !t.completed).length;
  }

  get completedCount() {
    return this.todos.filter((t) => t.completed).length;
  }
}

// Create reactive instance
const todosState = reactive(new TodosState());

function App() {
  return (
    <div className="app">
      <h1>ReactX Todo App</h1>

      <div className="todo-input">
        <input
          type="text"
          value={todosState.newTodoTitle}
          onChange={(e) => todosState.setNewTodoTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && todosState.addTodo()}
          placeholder="What needs to be done?"
        />
        <button onClick={() => todosState.addTodo()}>Add</button>
      </div>

      <div className="filters">
        <button
          className={todosState.filter === "all" ? "active" : ""}
          onClick={() => todosState.setFilter("all")}
        >
          All ({todosState.todos.length})
        </button>
        <button
          className={todosState.filter === "active" ? "active" : ""}
          onClick={() => todosState.setFilter("active")}
        >
          Active ({todosState.activeCount})
        </button>
        <button
          className={todosState.filter === "completed" ? "active" : ""}
          onClick={() => todosState.setFilter("completed")}
        >
          Completed ({todosState.completedCount})
        </button>
      </div>

      <ul className="todo-list">
        {todosState.filteredTodos.map((todo) => (
          <li key={todo.id} className={todo.completed ? "completed" : ""}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => todosState.toggleTodo(todo.id)}
            />
            <span>{todo.title}</span>
            <button onClick={() => todosState.deleteTodo(todo.id)}>×</button>
          </li>
        ))}
      </ul>

      {todosState.filteredTodos.length === 0 && (
        <p className="empty-message">
          {todosState.filter === "all"
            ? "No todos yet. Add one above!"
            : `No ${todosState.filter} todos.`}
        </p>
      )}
    </div>
  );
}

export default App;
