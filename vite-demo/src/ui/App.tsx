import { Todos } from "./Todos";
import { Posts } from "./Posts";
import { Settings } from "./Settings";
import "../App.css";

export function App() {
  return (
    <div className="app">
      <h1>ReactX</h1>
      <Todos />
      <Posts />
      <Settings />
    </div>
  );
}
