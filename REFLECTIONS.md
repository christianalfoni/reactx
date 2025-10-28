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
