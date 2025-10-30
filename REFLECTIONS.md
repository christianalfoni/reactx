# Reflections on React, Solid, and ui-lib

## On React's Mental Model

**What React taught us:**

- UI as a pure function of state is conceptually elegant
- Reconciliation and diffing make rendering efficient
- Declarative thinking about UI is powerful

**Where React creates cognitive strain:**

- **Temporal complexity** — Components re-run constantly, but state persists. Understanding _when_ code executes becomes a puzzle.
- **Reference instability** — Every render creates new closures. Stale references are a constant threat.
- **Effect orchestration** — `useEffect` dependency arrays blur declarative and imperative logic. Cleanup timing is non-obvious.
- **Performance tax** — `useMemo`, `useCallback`, `React.memo` are necessary evils that leak into everyday reasoning.
  -- **Execution Order** - Hooks must be called in same order for every reconciliation and conflicts with early returns.

**The core insight:** React makes _rendering_ cheap but _reasoning_ expensive. The CPU doesn't pay the price — your brain does.

---

## On Solid's Mental Model

**What Solid solved:**

- Single-run components eliminate re-render complexity
- Fine-grained reactivity updates only what changes
- Stable references mean no stale closures
- No need for memoization or dependency arrays

**Where Solid creates dissonance:**

- **Hidden compilation** — Code is silently transformed into reactive computations. What you write isn't exactly what executes.
- **Dual semantics** — Signals require unwrapping (`count()`), stores don't (`state.count`). Two mental models for state.
- **Special control flow** — `<Show>`, `<For>`, `<Switch>` replace JavaScript's native constructs.
- **Implicit reactivity** — The compiler decides what's reactive. You must remember the rules.

**The core insight:** Solid makes you forget about re-renders — but forgetting comes at a cost. There's a subtle gap between how code looks and how it behaves.

---

## Summary UI

- In React state is just plain values. No value abstractions like signals and no compilation changing the runtime. For example extracting `count()`, but compiles to `count` to make it reactive.
- In React pass down state to props as plain values and destructure. No special compilation making props getters, breaking reactivity when you destructure in nested component
- React has consistent use of state primitives. No special signal `count()` vs proxy based `createStore()`

## Summary State

- In Solid the component function runs once, removing the mental burder of the function be called again and again (reconciliation)
- In Solid observation allows for pin pointed UI updates, not diffing full component trees
- In Solid you can instantiate at component creation and dispose un unmount. React has no unmount and an effect does not reliably run in concurrent mode, causing an instantiation during render phase to become memory leaks
- In Solid there is no reconciliation loop. There are no effect dependencies, closures trapping values and special band aids like `useEffectEvent`. Basically the whole concept of the component function having a timeline of executions, does not exist
- In Solid there is no need to compile to complex unrecognizable code for optimisations. Where as React Compiler compiled code is very difficult to read

I want reconciliation for my UI, but I do not want reconciliation for my state!

There is ONE way to combine them though:

```tsx
function MyComponent() {
  // Runs once
  const state = createState();

  onCleanup();
  onMount();

  return () => {
    // Observes, reconciliation on changes
    return <div>{state.foo}</div>;
  };
}
```
