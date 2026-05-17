import "reflect-metadata";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./ui/App";

createRoot(document.getElementById("root")!).render(<App />);
