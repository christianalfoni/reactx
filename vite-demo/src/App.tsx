import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { createCounter } from "./counter";
import { utils } from "./utils";

const app = createCounter(utils);

function Item({
  item,
}: {
  item: { id: number; count: number; increase(): void };
}) {
  return (
    <div onClick={() => item.increase()}>
      {item.id} {item.count}
    </div>
  );
}

function App() {
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
            app.increase();
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

export default App;
