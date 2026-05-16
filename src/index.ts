import { configure } from "mobx";

export { observer } from "mobx-react-lite";

configure({
  enforceActions: "never",
});

export { reactive } from "./reactive";
