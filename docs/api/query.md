# reactive.query

```ts
const query = reactive.query(() => fetch("/todos").then((res) => res.json()));
```

Returns a `query` object that you can use to track the state of the query in a component or in your state management. The following properties are available:

```ts
const {
  // When initially fetching or when calling "fetch"
  isFetching,
  // The value of the query
  value,
  // If the query results in an error
  error,
  // When the query is revalidating in the background
  isRevalidating,
  // The promise representing the current value, supports suspense
  promise,
} = query;
```

## fetch

```ts
query.fetch();
```

Force a new fetch and return the promise.

## revalidate

```ts
query.revalidate();
```

Force a new background fetch.

## subscribe

```ts
function MyComponent({ query }) {
  useEffect(query.subscribe, []);
}
```

Subscribes to the query. When query has had subscribers and all of them unsubscribes it will invalidate itself, causing a full fetch on the next access to the query.
