# ReactX

> Transparent reactive state management for React

## What is ReactX?

ReactX provides truly transparent reactivity for React applications. There are no state management primitives like hooks, contexts, or stores. Just define your state in a class and expose it to React using the `reactive()` bridge.

Your React components automatically observe state changes and re-render when needed - no manual subscriptions, no hook rules, no provider trees.

## Get Started

```sh
npm install reactx@alpha
```

## Core Concept

Define your application state as a class:

```typescript
import { reactive } from 'reactx';

class AppState {
  count = 0;

  increment() {
    this.count++;
  }

  get doubled() {
    return this.count * 2;
  }
}

// Create a reactive instance
const state = reactive(new AppState());
```

Pass the reactive state to your components via props or context:

```tsx
// Using props
export default function App({ state }: { state: AppState }) {
  return (
    <div>
      <h1>Count: {state.count}</h1>
      <h2>Doubled: {state.doubled}</h2>
      <button onClick={() => state.increment()}>
        Increment
      </button>
    </div>
  );
}

// Or using React Context
import { createContext, useContext } from 'react';

const StateContext = createContext<AppState | null>(null);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const state = reactive(new AppState());
  return <StateContext.Provider value={state}>{children}</StateContext.Provider>;
}

export function useAppState() {
  const state = useContext(StateContext);
  if (!state) throw new Error('useAppState must be used within StateProvider');
  return state;
}

// Then in your component
function Counter() {
  const state = useAppState();
  return <button onClick={() => state.increment()}>{state.count}</button>;
}
```

That's it. No useState, useReducer, or other state management hooks. Your components automatically re-render when the state they access changes.

**Note**: Methods are automatically bound when accessed from React components, so you can safely pass them directly to event handlers without worrying about `this` context.

## Setup

ReactX requires a babel or swc plugin to automatically wrap your components with reactive observers:

### With Vite

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import plugin from 'reactx/babel-plugin';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [plugin()],
      },
    }),
  ],
});
```

### With Next.js (SWC)

```javascript
module.exports = {
  experimental: {
    swcPlugins: [
      ['reactx/swc-plugin', {}],
    ],
  },
};
```

## Features

- **No primitives**: No useState, useReducer, useContext, or other hooks needed for state management
- **Class-based state**: Define your state and methods in intuitive class structures
- **Automatic reactivity**: Components automatically track which state they access and re-render accordingly
- **Automatic method binding**: Methods are automatically bound when accessed from React, no need to worry about `this` context
- **Computed values**: Use getters for derived state that automatically updates
- **Developer tools**: Built-in devtools support for debugging state changes

Visit the documentation at: https://reactx-five.vercel.app/
