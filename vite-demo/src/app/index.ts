import { reactive } from "reactx";
import * as uuid from "uuid";

class JSONStorageService {
  get<T>(key: string) {
    const value = localStorage.getItem(key);

    return value ? (JSON.parse(value) as T) : null;
  }
  set<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

type TodoDTO = {
  id: string;
  title: string;
  completed: boolean;
};

class AppState {
  private _jsonStorageService = new JSONStorageService();
  private _todos: Record<string, TodoDTO> =
    this._jsonStorageService.get("todos") || {};
  get todos() {
    return Object.values(this._todos);
  }
  private withStorage(cb: () => void) {
    cb();
    this._jsonStorageService.set("todos", this._todos);
  }
  addTodo(title: string) {
    this.withStorage(() => {
      const id = uuid.v4();
      this._todos[id] = {
        id,
        title,
        completed: false,
      };
    });
  }
  toggleTodo(id: string) {
    this.withStorage(() => {
      this._todos[id].completed = !this._todos[id].completed;
    });
  }
}

export const app = reactive(new AppState());
