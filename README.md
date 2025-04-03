# Mobx Reactive

> Single reactive primitive for complex and performant state management in React

## Get Started

```sh
npm install mobx-reactive
```

Automatic observation in components using [observing-components](https://github.com/christianalfoni/observing-components).

```ts
import babelPlugin from "mobx-reactive/babel-plugin";
import swcPlugin from "mobx-reactive/swc-plugin";
```

## Why Mobx Reactive?

Mobx at its core is a performant and flexible reactive system. It was originaly introduced for classes, but as React has evolved it is time to rethink how **simple** and **compatible** Mobx can be. With a single `reactive` primitive, transparent observation in components and functional patterns for state management it has never been simpler to embrace external state management with benefits such as:

- 🕸 Handle state management complexity without the overhead of the reconciler
- 🍎 Use plain JavaScript to mutate state
- 🌲 Gain flexibility in adjusting your UI as components or mostly local state, if any
- 📺 Derive the state to different targets like web, reactive native or just a mobile web version

## Mental Model

When doing state mangement in React you have a mental model of:

- **Local by default**: All state management is defined within components, you have to explicitly share that state management using props or context
- **Immutability**: To make changes to state you need to ensure changes to object and array references using an update function
- **Waterfall reconciliation**: When you make changes to state it needs to flow down to the components that use that state
- **Fused state with UI**: With server components you are encouraged to only define and fetch the exact state and data that is needed for the endpoint the user is initially hitting

When doing state management externally with Mobx Reactive you have a different mental model:

- **Shared by default**: All components can access all the state
- **Mutable**: Use plain JavaScript to change state
- **Observation**: Components knows exactly what state they use and will reconcile when that state changes
- **Separate state from UI**: You load up your whole app regardless of what url the user hits and

Explore the **patterns** that will help you build performant and complex state management in React applications.

- [Constructor](./docs/01_pattern_constructor.md)
- [Protected State](./docs/02_pattern_protected_state.md)
- [State Tree](./docs/03_pattern_state_tree.md)
- [Component State Contract](./docs/04_pattern_component_state_contract.md)
- [Explicit States](./docs/05_pattern_explicit_states.md)
- [Data Fetching](./docs/06_pattern_data_fetching.md)
- [Promises](./docs/07_pattern_promises.md)
- [Environment Dependencies](./docs/08_pattern_environment_dependencies.md)
- [Multiple UX](./docs/09_pattern_multiple_ux.md)
