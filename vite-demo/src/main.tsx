import { reactive } from "reactx";
import { createRoot } from "react-dom/client";
import "./App.css";
import { App } from "./ui/App";
import { AppContext, AppState, JSONStorageService } from "./app";

const app = reactive(new AppState(new JSONStorageService()));

createRoot(document.getElementById("root")!).render(
  <AppContext.Provider value={app}>
    <App />
  </AppContext.Provider>,
);
