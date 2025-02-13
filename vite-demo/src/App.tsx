import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { createApp } from "./counter";
import { utils } from "./utils";
import { Suspense, use } from "react";

const app = createApp(utils());

type Item = {
  id: number;
  increase(): void;
  counter: Promise<{ count: number }>;
};

function ItemCounter({ item }: { item: Item }) {
  console.log("Render ItemCounter");
  const counter = use(item.counter);
  return <div onClick={() => item.increase()}>{counter.count}</div>;
}

function Item({ item }: { item: Item }) {
  console.log("Render Item");
  return (
    <div onClick={() => item.increase()}>
      {item.id}
      <Suspense fallback={<div>Loading...</div>}>
        <ItemCounter item={item} />
      </Suspense>
    </div>
  );
}

function App() {
  console.log("Render App");
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button
          onClick={() => {
            app.addItem();
          }}
        >
          count is
        </button>
        {app.items.map((item, index) => (
          <Item key={index} item={item} />
        ))}
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default function AppWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
  );
}
