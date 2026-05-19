import { createContext, useContext } from "react";
import * as uuid from "uuid";

export class JSONStorageService {
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

export class AppState {
  private _todos: Record<string, TodoDTO> =
    this._jsonStorageService.get("todos") || {};
  get todos() {
    return Object.values(this._todos);
  }
  asyncCount = Promise.resolve(0);
  constructor(private _jsonStorageService: JSONStorageService) {}
  private syncStorage() {
    this._jsonStorageService.set("todos", this._todos);
  }
  addTodo(title: string) {
    const id = uuid.v4();
    this._todos[id] = {
      id,
      title,
      completed: false,
    };
    this.syncStorage();
  }
  toggleTodo(id: string) {
    this._todos[id].completed = !this._todos[id].completed;
    this.syncStorage();
  }
  async increaseCount() {
    const currentCount = await this.asyncCount;
    this.asyncCount = new Promise((resolve) =>
      setTimeout(() => resolve(currentCount + 1), 1000),
    );
  }
}

export const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const app = useContext(AppContext);

  if (!app) {
    throw new Error("No app provided to the component");
  }

  return app;
}
