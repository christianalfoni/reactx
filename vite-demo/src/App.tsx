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
  return (
    <div
      onClick={() => {
        item.increase();
      }}
    >
      {counter.count}
    </div>
  );
}

function Item({ item }: { item: Item }) {
  console.log("Render Item");
  return (
    <div>
      id = {item.id}
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
      </div>
      <div className="card">
        <button
          onClick={() => {
            app.clearItemsBySettingLengthTo0();
          }}
        >
          Clear all items by setting length to 0
        </button>
      </div>
      <div className="card">
        <button
          onClick={() => {
            app.clearItemsBySettingArrayToEmpty();
          }}
        >
          Clear all items by setting array to empty
        </button>
      </div>
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
