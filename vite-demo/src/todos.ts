import { reactive } from "mobx-reactive";

const nextTodosData = ["Learn React", "Learn MobX", "Learn Vite"];

export function Todos() {
  const todos = reactive({
    query: reactive.query<string[]>(fetchTodos),
    add: reactive.mutation(add),
    remove,
  });

  return reactive.readonly(todos);

  async function add({ title }: { title: string }) {
    nextTodosData.unshift(title);

    await todos.query.revalidate();

    return title;
  }

  function remove(todo: string) {
    // todos.list = todos.list.filter((t) => t !== todo);
  }

  function fetchTodos() {
    return new Promise<string[]>((resolve) => {
      setTimeout(() => {
        resolve(nextTodosData.map((data) => data + " - " + Date.now()));
      }, 1000);
    });
  }
}
