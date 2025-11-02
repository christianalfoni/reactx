import { async } from "reactx";
import { JSONStorage } from "./JSONStorage";

export { FormState } from "./FormState";

export type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export type Filter = "all" | "active" | "completed";

type StoredTodoData = {
  todos: Todo[];
  nextId: number;
};

export class TodoState {
  asyncEaxmple = async(() => {
    return new Promise<{ name: string; email: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          name: "John Doe",
          email: "john@example.com",
        });
      }, 1000);
    });
  });
  todos: Todo[] = [];
  inputValue = "";
  filter: Filter = "all";
  nextId = 1;

  private storage = new JSONStorage<StoredTodoData>("todo-app-state");

  get filteredTodos() {
    switch (this.filter) {
      case "active":
        return this.todos.filter((todo) => !todo.completed);
      case "completed":
        return this.todos.filter((todo) => todo.completed);
      default:
        return this.todos;
    }
  }

  loadFromStorage() {
    const data = this.storage.load();
    if (data) {
      this.todos = data.todos || [];
      this.nextId = data.nextId || 1;
    }
  }

  saveToStorage() {
    this.storage.save({
      todos: this.todos,
      nextId: this.nextId,
    });
  }

  setInputValue(value: string) {
    this.inputValue = value;
  }

  setFilter(filter: Filter) {
    this.filter = filter;
  }

  addTodo() {
    if (this.inputValue.trim()) {
      this.todos.push({
        id: this.nextId++,
        text: this.inputValue.trim(),
        completed: false,
      });
      this.inputValue = "";
      this.saveToStorage();
    }
  }

  toggleTodo(id: number) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveToStorage();
    }
  }

  deleteTodo(id: number) {
    this.todos = this.todos.filter((t) => t.id !== id);
    this.saveToStorage();
  }
}
