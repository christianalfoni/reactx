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

Mobx at its core is a performant and flexible reactive system. It was originaly introduced for classes, but as React has evolved it is time to rethink how **simple** Mobx can be. With a single `reactive` primitive, transparent observation in components and functional patterns for state management it has never been simpler to embrace external state management in React.

When we state **external state management** it means that you treat React as a pure view layer. That means your state management IS the application and React just derives the current state of your application to produce an interface. This is a different perspective of building apps which has the following benefits:

- Work with state management complexity outside the reconciler
- Work with mutable state using plain JavaScript
- A component tree with mostly local React state, making it more flexible to change
- Derive the state to other targets than the web, or other devices

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
