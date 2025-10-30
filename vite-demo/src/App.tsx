import { reactive } from "reactx";
import "./App.css";

// Todo type
type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

// Reactive state class
class TodosState {
  todos: Todo[] = [];
  filter: "all" | "active" | "completed" = "all";
  newTodoTitle = "";

  addTodo() {
    if (this.newTodoTitle.trim()) {
      this.todos.push({
        id: Date.now(),
        title: this.newTodoTitle.trim(),
        completed: false,
      });
      this.newTodoTitle = "";
    }
  }

  toggleTodo(id: number) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }

  deleteTodo(id: number) {
    this.todos = this.todos.filter((t) => t.id !== id);
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
