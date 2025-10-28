import { query, reactive } from "reactx";

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

class State {
  private storage = new JSONStorage("todos");
  private todos = query<TodoDTO[]>(() =>
    Promise.resolve(this.storage.get("list") || [])
  );
  newTodoTitle = "";
  someArray = [{ mip: "mop" }];
  filter: "all" | "completed" | "active" = "all";

  constructor() {
    setTimeout(() => {
      this.someArray[0].mip = "mop2";
    }, 1000);
  }

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
    const todos = this.todos.value?.slice() ?? [];
    todos.unshift({ title: this.newTodoTitle, completed: false });
    this.storage.set("list", todos);
    this.newTodoTitle = "";
    this.todos.revalidate();
  }
  toggleCompleted(index: number) {
    const todos = this.todos.value?.slice() ?? [];
    todos[index].completed = !todos[index].completed;
    this.storage.set("list", todos);
    this.todos.revalidate();
  }
}

const state = reactive(new State(), {
  devtools: true,
});

export default function App2() {
  return (
    <>
      <h1>Test App</h1>

      <input
        value={state.newTodoTitle}
        onChange={(e) => state.setNewTodoTitle(e.target.value)}
      />
      <button onClick={() => state.addTodo()}>
        Add ({state.someArray[0].mip})
      </button>
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

/**
  Overmind 2.0
  
  function Namespace() {
    const state = reactive({
      count: 0,
      increase() {
        state.count++
      }
    })
      
    return state
  }

 */
