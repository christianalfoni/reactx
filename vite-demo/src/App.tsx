import { reactive } from "reactx";
import "./App.css";

class AppState {
  message = "Hello World";
}

const state = reactive(new AppState());

function App() {
  return <h1>{state.message}</h1>;
}

export default App;
