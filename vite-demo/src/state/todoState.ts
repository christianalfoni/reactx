import { reactive, ConsoleObserver } from "reactx";
import { TodoState } from "./types";

// Create a ConsoleObserver for debugging
const consoleObserver = new ConsoleObserver({
  colors: true,
  verbose: false, // Set to true to see full event data
});

// Create and initialize the todo state
const todoState = new TodoState();
todoState.loadFromStorage();

// Make it reactive and export
export const state = reactive(todoState, { observer: consoleObserver });
