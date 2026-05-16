import { reactive } from "reactx";

class RandomService {
  getNumber() {
    return Math.round(Math.random() * 100);
  }
}

class AppState {
  private randomService = new RandomService();
  count = 0;
  increment() {
    this.count++;
  }
  decrement() {
    this.count--;
  }
  random() {
    this.count = this.randomService.getNumber();
  }
}

export const app = reactive(new AppState());
