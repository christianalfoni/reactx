import { reactive } from "reactx";

class RandomService {
  getNumber() {
    return Math.round(Math.random() * 100);
  }
}

class NestedState {
  count = 0;
  increment() {
    this.count++;
  }
}

class AppState {
  private randomService = new RandomService();
  nested = new NestedState();
  count = 0;
  increment() {
    this.count++;
    this.nested.increment();
  }
  decrement() {
    this.count--;
  }
  random() {
    this.count = this.randomService.getNumber();
  }
}

export const app = reactive(new AppState());
