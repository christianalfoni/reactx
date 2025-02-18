# Context

Your state tree operates in the context of an environment. Maybe your app only runs in a browser, but it might also run native, in tests or even on the server. Passing in a `context` to your application allows you to ensure three things:

1. Any environment specific implementations is detached from the actual implementation of the state tree
2. The context acts as a domain specific interface with the outside world, removing any reference to lower level tools and abstractions in your state management code
3. You get a typed context, removing unncessary type casting in your state management code

## Creating a context

```ts
const createContext = (env) => ({});
```

Just like your state tree, your context might depend on certain environment variables or other configurations.

## Keeping it clean

When you implement the context, avoid any references to 3rd party tools. Use generic concepts, like `persistence` instead of `firebase`.

```ts
const createContext = (env) => {
  const app = initializeApp(env.FIREBASE_CONFIG);

  return {
    persistence: {
      getTodos(): Promise<Array<{ id: string }>> {
        return app.firestore.getCollection("items");
      },
    },
  };
};
```

## Passing the context

In your main file:

```tsx
const context = createContext({
  FIREBASE_CONFIG: process.env.NODE_ENV.FIREBASE_CONFIG,
});
const app = createApp(context);

render(<App app={app} />);
```
