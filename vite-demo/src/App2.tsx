import { reactive } from "mobx-lite";

class Test {
  todos: string[] = [];
}

class TodosState {
  private test: Test = new Test();
  addTodo(title: string) {
    this.test.todos = [...this.test.todos, title];
  }
  get count() {
    return this.test.todos.length;
  }
}

const todosState = reactive(new TodosState(), true);

export default function App2() {
  return (
    <h1 onClick={() => todosState.addTodo("test")}>App2 {todosState.count}</h1>
  );
}
