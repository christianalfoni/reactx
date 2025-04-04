# Mobx Reactive

> Mobx reimagined

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

Mobx at its core is a performant and flexible reactive system. It was originaly introduced for classes and manually applying observation in components, but as React and the ecosystem has evolved it is time to rethink how **simple** and **in tune** with React Mobx can be. With a single `reactive` primitive, transparent observation in components and functional patterns for state management it has never been simpler to embrace external state management with benefits such as:

- 🕸 State management complexity without the overhead of the reconciler
- 🍎 Plain JavaScript to mutate state
- 🌲 Flexibility in iterating on your UI
- 📺 Targeting multiple devices and platforms

## Mental Model

When doing state mangement in React you have a mental model of:

- **Local by default**: All state management is defined within components, you have to explicitly share state using props or context
- **Immutability**: To make changes to state you need to ensure changes to object and array references using an update function
- **Waterfall reconciliation**: When you make changes to state it needs to flow down to the components that use that state
- **Fused state with UI**: Your component tree represents both the state of your application and the UI of your application

When doing state management externally with Mobx Reactive you have a different mental model:

- **Shared by default**: All components can access the state you expose to your components
- **Mutable**: Use plain JavaScript to change state
- **Observation**: Components knows exactly what state they use and will reconcile when that state changes
- **Separate state from UI**: You untangle your state from your components and rather have two representations of your app. The actual application represented as state management and a "dumb" UI which derives from that state

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
