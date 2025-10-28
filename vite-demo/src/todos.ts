import { mutation, query } from "reactx";

let nextTodosData = ["Learn React", "Learn MobX", "Learn Vite"];

export class Todos {
  count = 0;
  increase() {
    this.count++;
  }
  query = query(
    () =>
      new Promise<string[]>((resolve) => {
        setTimeout(() => {
          resolve(nextTodosData.map((data) => data + " - " + Date.now()));
        }, 1000);
      })
  );
  add = mutation(async (title: string) => {
    nextTodosData.unshift(title);

    await this.query.revalidate();

    return title;
  });
  remove = mutation(async (title: string) => {
    nextTodosData = nextTodosData.filter((todo) => todo !== title);

    await this.query.revalidate();

    return title;
  });
}
