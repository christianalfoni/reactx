import { reactive } from "reactx";

// ── Types ────────────────────────────────────────────────────────────────────

export type Filter = "all" | "active" | "completed";

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export interface Post {
  id: number;
  title: string;
  body: string;
}

// ── API ──────────────────────────────────────────────────────────────────────

function fetchPosts(): Promise<Post[]> {
  return fetch("https://jsonplaceholder.typicode.com/posts?_limit=5").then(
    (r) => r.json(),
  );
}

function submitPost(title: string): Promise<Post> {
  return fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    body: JSON.stringify({ title, body: "demo", userId: 1 }),
    headers: { "Content-Type": "application/json" },
  }).then((r) => r.json());
}

// ── Sub-state ─────────────────────────────────────────────────────────────────

class SettingsState {
  language = "English";
  notifications = true;

  setLanguage(lang: string) {
    this.language = lang;
  }

  toggleNotifications() {
    this.notifications = !this.notifications;
  }
}

// ── Root state ────────────────────────────────────────────────────────────────

let nextId = 1;

class App {
  // Todos — synchronous state
  todos: Todo[] = [];
  filter: Filter = "all";

  get filteredTodos() {
    if (this.filter === "active") return this.todos.filter((t) => !t.completed);
    if (this.filter === "completed")
      return this.todos.filter((t) => t.completed);
    return this.todos;
  }

  constructor() {
    this.refreshPosts();
  }

  addTodo(text: string) {
    this.todos = [...this.todos, { id: nextId++, text, completed: false }];
  }

  toggleTodo(id: number) {
    this.todos = this.todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t,
    );
  }

  deleteTodo(id: number) {
    this.todos = this.todos.filter((t) => t.id !== id);
  }

  setFilter(filter: Filter) {
    this.filter = filter;
  }

  // Posts — plain reactive array; updated asynchronously
  posts: Post[] = [];

  async loadPosts() {
    this.posts = await fetchPosts();
  }

  async refreshPosts() {
    this.posts = await fetchPosts();
  }

  // Create post — async action, appends to the local list optimistically
  async createPost(title: string): Promise<Post> {
    const post = await submitPost(title);
    this.posts = [...this.posts, post];
    return post;
  }

  // Settings — lazy sub-state via getter + private field
  #settings?: SettingsState;

  get settings() {
    return (this.#settings ??= new SettingsState());
  }
}

export const app = reactive(new App());
